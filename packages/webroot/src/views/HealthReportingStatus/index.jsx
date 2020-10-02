import React, { useState, useEffect }  from 'react';
import {
    Paper,
    Container,
    makeStyles,
    Typography, Link
} from '@material-ui/core';
import { CardMedia } from '@material-ui/core';
// import CheckCircleOutlineIcon from '@material-ui/icons/CheckCircleOutline';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import axios from 'axios';
import ErrorMessage from '../ErrorMessage';
import * as HttpStatus from 'http-status-codes'


const useStyles = makeStyles((theme) => ({
    paper: {
        margin: theme.spacing(3),
        padding: theme.spacing(2),
    },
    button: {
        margin: theme.spacing(1),
        padding: theme.spacing(1),
    },
}));

export default function HealthReportingStatus(props) {
    const classes = useStyles();
    const [form, setForm] = useState(false);
    const [statusCode, setstatusCode] = useState(null);
    const [dataFetched, setdataFetched] = useState(false);
    const [messageOfTheDayUrl, setmessageOfTheDayUrl] = useState(`https://${process.env.REACT_APP_USER_DOMAIN}/runtime/surveys/standard/messageOfTheDay.html`);

    useEffect(() => {
        if(!form) {
          getForm();
        }
    })

    const getForm = async () => {
        //const baseURL = "https://api.hwsrdev.example.com";
        const baseURL = `https://${process.env.REACT_APP_API_USER_DOMAIN}/surveys`;
        const authToken = window.location.hash.replace('#', "");
        var headers = {
            'Authorization': authToken
        }
        let healthStatus;
        try {
            healthStatus = await axios.get(baseURL + "/healthstatus/"+ props.match.params.userId, {"headers" : headers})
            setForm(healthStatus.data);
            setstatusCode(healthStatus.status);
            let motdResponse = await axios.get(baseURL + "/isMessageOfTheDayCustom")
            if(motdResponse.data.isCustom === true) {
                setmessageOfTheDayUrl(`https://${process.env.REACT_APP_USER_DOMAIN}/runtime/surveys/custom/messageOfTheDay.html`);
            }    
        } catch (error) {
            if (error.response == null){
                setstatusCode(HttpStatus.INTERNAL_SERVER_ERROR);
            } else {
                setstatusCode(error.response.status);
            }
        }
        setdataFetched(true);  
    }

    //data loading
    //when invalid user, 404 , invalid authToken 403
    if(statusCode === HttpStatus.NOT_FOUND){
        let errMsg = `Error ${statusCode} : User not enrolled!`
        return (<ErrorMessage message={errMsg}/>)
    } else if(statusCode === HttpStatus.FORBIDDEN){
        let errMsg = `Error ${statusCode} : Access denied!`
        return (<ErrorMessage message={errMsg}/>)
    } else if(statusCode === HttpStatus.INTERNAL_SERVER_ERROR){
        let errMsg = `Error ${statusCode} : Oops, Something Went Wrong`
        return (<ErrorMessage message={errMsg}/>)
    } else if(!dataFetched) {
        return null;
    }

    return (
    <div>
    <Header />
    <Container maxWidth="md">
        <Paper className={classes.paper}>
            <Typography variant="h6" color="inherit">
            {(() => {
                if (form.badgeIssued === 'yes') {
                    return (
                        "Please continue to report daily. Your badge shall be revoked if you miss reporting even one day."
                    );
                }else{
                    let country = (form.country === 'default' ? 'Your Country' : form.country)
                    return (
                        `Thank you for submitting your health & wellness survey for ${form.daysSubmitted} days. ${country} requires ${form.nDaysOfReporting} consecutive days of positive health status. Only ${form.nDaysLeft} days left to get your Badge (excludes recent submission(s) as it may still be in process).`
                    );
                }
            })()}
            </Typography>
        </Paper>
        <Paper className={classes.paper}>
            <CardMedia
                component='iframe'
                width="830"
                height="550"
                style={{border: "0px", overflow: "hidden"}}
                src={messageOfTheDayUrl}
            />
        </Paper>
        <Paper className={classes.paper}>
            <Link href="https://www.who.int/emergencies/diseases/novel-coronavirus-2019/advice-for-public" target="_blank">Safety Tips by WHO</Link>
        </Paper>
    </Container>
    <Footer />
    </div>
    );
}
