import React, { useState }  from 'react';
import {
    Paper,
    Container,
    makeStyles,
    createMuiTheme,
    ThemeProvider,
} from '@material-ui/core';

import FormGenerator from '../../components/FormGenerator';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import {addHealthProfile} from '../../services/api';
import { Redirect } from 'react-router-dom';
import ErrorMessage from '../ErrorMessage';
import * as HttpStatus from 'http-status-codes'

const useStyles = makeStyles((theme) => ({
    paper: {
        margin: theme.spacing(3),
        padding: theme.spacing(2),
    },
}));
const colorTheme = createMuiTheme({
    palette: {
        primary: {
            light: "#00000",
            main: "#000000",
            dark: "#00000",
            contrastText: "#ffed00"
        },
        secondary: {
            light: '#d9d9d9',
            main: '#000000',
            contrastText: '#ffed00',
        }
    }
});

export default function HealthForm(props) {
    const classes = useStyles();
    const [statusCode, setstatusCode] = useState(null);

    async function functionFormSubmit(formData){
        formData["userId"] =  props.match.params.userId;
        formData["surveyId"] =  props.match.params.surveyId;
        const authToken = window.location.hash.replace('#', "");
        try {
            let response = await addHealthProfile(formData, authToken);
            setstatusCode(response.status);
        } catch (error) {
            if (error.response === null){
                setstatusCode(HttpStatus.INTERNAL_SERVER_ERROR);
            } else {
                setstatusCode(error.response.status);
            }
        }
    }

    if(statusCode === HttpStatus.OK){
        const healthProfileSuccess = "/surveys/healthReportingStatus/success/"+props.match.params.userId+window.location.hash;
        return <Redirect to={healthProfileSuccess}/>
    } else if(statusCode === HttpStatus.FORBIDDEN){
        let errMsg = `Error ${statusCode} : Access denied!`
        return (<ErrorMessage message={errMsg}/>)
    } else if ((statusCode === HttpStatus.NOT_FOUND) || ( props.match.params.userId === 'undefined' ) || ( window.location.hash === 'undefined' )){
        let errMsg = `Error ${statusCode} : User not enrolled!`
        return (<ErrorMessage message={errMsg}/>)
    } else if(statusCode === HttpStatus.INTERNAL_SERVER_ERROR){
        let errMsg = `Error ${statusCode} : Oops, Something Went Wrong`
        return (<ErrorMessage message={errMsg}/>)
    } else if(statusCode != null){
        let errMsg = `Error ${statusCode} : Something went wrong!`
        return (<ErrorMessage message={errMsg}/>)
    }
    
    return (
        <div>
        <Header />
        <Container maxWidth="md">
            <Paper className={classes.paper}>
                <ThemeProvider theme={colorTheme}>
                    <FormGenerator
                        id={props.match.params.surveyId}
                        formGroup="form"
                        formSubmit = {functionFormSubmit}
                    />
                </ThemeProvider>
            </Paper>
        </Container>
        <Footer />
        </div>
    );
}
