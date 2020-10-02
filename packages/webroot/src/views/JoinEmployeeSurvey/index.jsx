import React, { useState }  from 'react';
import {
    Paper,
    Container,
    makeStyles,
    createMuiTheme,
    ThemeProvider,
} from '@material-ui/core';
import { useForm } from 'react-hook-form'
import FormGenerator from '../../components/FormGenerator';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import {addHealthSurvey} from '../../services/api';
import { Redirect } from 'react-router-dom';
import ErrorMessage from '../ErrorMessage';
import ErrorBoundary from '../ErrorBoundary';
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

export default function JoinEmployeeSurvey(props) {
    const classes = useStyles();
    const { register } = useForm();
    const [statusCode, setstatusCode] = useState(null);

    async function functionFormSubmit(data) {
        data['surveyId'] = props.match.params.surveyId;
        try {
            let response = await addHealthSurvey(data);
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
        const SurveyStatus = "/surveys/SurveyStatus/success";
        return <Redirect to={SurveyStatus}/>
    }else if(statusCode === HttpStatus.INTERNAL_SERVER_ERROR){
        const errMsg = `Error ${statusCode} : Oops, Something Went Wrong`;
        return (<ErrorMessage message={errMsg}/>)
    }else if(statusCode != null){
        const errMsg = `Error ${statusCode} : Something went wrong!`;
        return (<ErrorMessage message={errMsg}/>)
    }

        return (
            <div>
            <Header />
            <Container maxWidth="md">
                <Paper className={classes.paper}>
                    <ThemeProvider theme={colorTheme}>
                        <ErrorBoundary>
                            <FormGenerator
                                id="JoinSurvey"
                                formGroup="named-form"
                                register={register}
                                formSubmit = {functionFormSubmit}
                            />
                        </ErrorBoundary>
                    </ThemeProvider>
                </Paper>
            </Container>
            <Footer />
            </div>
        );
}
