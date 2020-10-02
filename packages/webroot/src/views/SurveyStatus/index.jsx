import React from 'react';
import {
    Paper,
    Container,
    makeStyles,
    Typography
} from '@material-ui/core';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

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

export default function SurveyStatus(props) {
    const classes = useStyles();

    return (
    <div>
    <Header />
    <Container maxWidth="md">
        <Paper className={classes.paper}>
            <Typography variant="h6" color="inherit">
            Thanks for joining the survey. You will receive an email with the survey link.
            </Typography>
        </Paper>
    </Container>
    <Footer />
    </div>
    );
}
