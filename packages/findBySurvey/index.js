
'use strict';

const config = require('/opt/nodejs/config');
const aws = require('/opt/nodejs/aws');
const restAPI = require('/opt/nodejs/restApi');
const httpStatus = require('http-status-codes');

const enrollmentTable = config.getDeployTime('enrollmentTable');
const emailIndex = config.getDeployTime('emailIndex');

aws.region = config.getDeployTime('region');

let findBySurvey = async (event, context) => {
    return await new Promise(async (resolve, reject) => {
        try {
            console.log("event:", JSON.stringify(event));
            console.log("context:", JSON.stringify(context));

            let email = event.pathParameters.email;
            let surveyId = event.pathParameters.surveyId;

            const result = await aws.dbGetMany(getQueryParams(email, surveyId));
            console.log('query result:', result);
            if ((result.Count) == 0) {
                resolve(restAPI.prepareResponse(httpStatus.NOT_FOUND));
            }
            const { hashedToken, ...userProfile } = result.Items[0];
            console.log('user profile"', userProfile );
            resolve(restAPI.prepareResponse(httpStatus.OK, userProfile));
        }
        catch(error) {
            console.error("Error: ", error);
            resolve(restAPI.prepareResponse(httpStatus.INTERNAL_SERVER_ERROR));
        }
    });    
};

function getQueryParams(email, surveyId) {
    let queryParams = {
        TableName: enrollmentTable,
        KeyConditionExpression: "email = :email",
        FilterExpression: "surveyId = :surveyId",
        ExpressionAttributeValues: {
            ":surveyId": surveyId,
            ":email": email
        },
        IndexName: emailIndex
    };
    return queryParams;
}

module.exports = {
    handler: findBySurvey
};
