'use strict';

const axios = require('axios');
const slugid = require('slugid');
const httpStatus = require('http-status-codes');

const restApi = require('/opt/nodejs/restApi');
const tokenHash = require('/opt/nodejs/hashToken');
const config = require('/opt/nodejs/config');
const aws = require('/opt/nodejs/aws');
aws.region = config.getDeployTime('region');

const sourceEmailId = config.getDeployTime('sourceEmailId');
const enrollmentTable = config.getDeployTime('enrollmentTable');
const surveyBaseURL = config.getDeployTime('surveyBaseURL');
const formsAPIBaseURL = config.getDeployTime('formsAPIBaseURL');
const dashboardEmailAPIBaseURL = config.getDeployTime('dashboardEmailAPIBaseURL');
const emailIndex = config.getDeployTime('emailIndex');
const emailTemplateNotifyEnrolledToEmployeeSurvey = config.getDeployTime('emailTemplateNotifyEnrolledToEmployeeSurvey');
const emailTemplateNotifyEnrolledToVisitorSurvey = config.getDeployTime('emailTemplateNotifyEnrolledToVisitorSurvey');
const emailTemplateSendSurveyLinkToEmployee = config.getDeployTime('emailTemplateSendSurveyLinkToEmployee');
const emailTemplateSendSurveyLinkToVisitor = config.getDeployTime('emailTemplateSendSurveyLinkToVisitor');


var enrollUser = async function (event, context) {

    return await new Promise(async (resolve) => {
        try {
            console.log("event:", JSON.stringify(event));
            console.log("context:", JSON.stringify(context));

            let userEnrollment = JSON.parse(event.body);
            console.log('User: ', userEnrollment);

            const { email, surveyId, passLocation } = userEnrollment;

            console.log('email, surveyId, passLocation: ', `${email} ,${surveyId}, ${passLocation}`);

            // Set Token
            let enableTestMode = await config.getRunTime('enableTestModeParamName');
            let token;
            if (enableTestMode === 'true' && await isTestUser(email, 'testCaseEmailListParamName'))
                token = event.headers.passToken4Test
            else
                token = slugid.nice();

            // Get Hash Token
            const hashedToken = await tokenHash.getHashOfToken(token);

            // Get Survey
            let surveyResponse = await axios.get(`${formsAPIBaseURL}/${surveyId}/form`);
            let survey = surveyResponse.data;
            console.log('Survey: ', survey);

            // Get User Type
            const userType = survey.category1;
            if (!userType) {
                console.log('user type is not found')
                return resolve(restApi.prepareResponse(httpStatus.NOT_FOUND));
            }

            // Get Surey Answer
            let surveyAnswer = await getSurveyAnswer(email, surveyId, passLocation);
            console.log('queryRes: ', surveyAnswer);

            let surveyLink;
            let userId;
            let notificationMessage;

            if (surveyAnswer.Count > 0) { // If user already enrolled for the survey, notify user
                userId = surveyAnswer.Items[0].userId;
                notificationMessage = notifyUserAlreadyExists(userType, email, passLocation);
            } else { // add user enrollment
                userId = slugid.nice();

                surveyLink = `${surveyBaseURL}/${surveyId}/${userId}#${token}`;
                console.log('surveyLink: ', surveyLink);

                const surveyLinkInTable = (enableTestMode === 'true' &&
                    await isTestUser(email, 'testUserListParamName')) ? surveyLink : null;
                surveyAnswer = await insertToEnrollmentTable(userEnrollment, userId, userType, hashedToken, surveyLinkInTable);

                console.log("Survey Answer inserted. UserId = ", userId);
                notificationMessage = notifySurveyLink(userType, surveyLink, email, passLocation);
            }
            // Notify User
            let dashboardsAPIKey = await config.getRunTime('dashboardsAPIKeyParamName', true);
            let axiosConfig = {
                headers: {
                    "x-api-key": dashboardsAPIKey,
                    "Accept": "application/json",
                    "Content-Type": "application/json"
                }
            };
            await axios.post(dashboardEmailAPIBaseURL, JSON.stringify(notificationMessage), axiosConfig);
            console.log("E-Mail sent successfully");

            // Return successful completion of the request
            return resolve(restApi.prepareResponse(httpStatus.OK, { "userId": userId }));
        } catch (error) {
            console.error("Error: ", error);
            return resolve(restApi.prepareResponse(httpStatus.INTERNAL_SERVER_ERROR));
        }
    })
};

function notifyUserAlreadyExists(userType, email, passLocation) {
    let sendEmailAPIBody;
    if (userType === 'employee') {
        sendEmailAPIBody = {
            "template_name": emailTemplateNotifyEnrolledToEmployeeSurvey,
            "sentfrom": sourceEmailId,
            "sendto": [email]
        };
    }
    else {
        sendEmailAPIBody = {
            "template_name": emailTemplateNotifyEnrolledToVisitorSurvey,
            "sentfrom": sourceEmailId,
            "data": {
                "passLocation": passLocation
            },
            "sendto": [email]
        };
    }
    return sendEmailAPIBody;
}

function notifySurveyLink(userType, surveyLink, email, passLocation) {
    let sendEmailAPIBody;
    if (userType === 'employee') {
        sendEmailAPIBody = {
            "template_name": emailTemplateSendSurveyLinkToEmployee,
            "sentfrom": sourceEmailId,
            "data": {
                "surveyLink": surveyLink
            },
            "sendto": [email]
        };
    }
    else {
        sendEmailAPIBody = {
            "template_name": emailTemplateSendSurveyLinkToVisitor,
            "sentfrom": sourceEmailId,
            "data": {
                "surveyLink": surveyLink,
                "passLocation": passLocation
            },
            "sendto": [email]
        };
    }
    console.log("Calling Dashboard API to send E-Mail");

    return sendEmailAPIBody;
}

async function isTestUser(email, paramName) {
    const emailList = await config.getRunTime(paramName);
    const emailArray = emailList.split(',');
    return emailArray.includes(email);
}

async function getSurveyAnswer(email, surveyId, userType, passLocation) {
    let params = {
        TableName: enrollmentTable,
        ProjectionExpression: "userId",
        KeyConditionExpression: "email = :email",
        FilterExpression: "surveyId = :surveyId",
        ExpressionAttributeValues: {
            ":surveyId": surveyId,
            ":email": email
        },
        IndexName: emailIndex
    };
    if (userType === 'visitor') {
        params.ExpressionAttributeValues[':passLocation'] = passLocation;
        params.FilterExpression = params.FilterExpression + " and passLocation = :passLocation";
    }

    console.log('getSurveyAnswer - Input Parameters: ', params);
    return await aws.dbGetMany(params);
}

let insertToEnrollmentTable = async function (userEnrollment, userId, userType, hashedToken, surveyLink) {
    let items = userEnrollment;
    items["userId"] = userId;
    items["userType"] = userType;
    items["createdDate"] = Date.now();
    items["updatedDate"] = Date.now();
    items["hashedToken"] = hashedToken;

    if (surveyLink)
        items["surveyLink"] = surveyLink;
    let params = {
        Item: items,
        TableName: enrollmentTable
    };

    console.log('insertToEnrollmenTable items: ', params);

    return await aws.dbInsert(params);
};

module.exports = {
    handler: enrollUser
};
