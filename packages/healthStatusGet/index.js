'use strict';

const axios = require('axios');
const isBase64 = require('is-base64');
const httpStatus = require('http-status-codes');

const utilities = require('/opt/nodejs/utility');
const awskms = require('/opt/nodejs/awskms');
const restApi = require('/opt/nodejs/restApi');
const config = require('/opt/nodejs/config');
const aws = require('/opt/nodejs/aws');
aws.region = config.getDeployTime('region');

const healthProfilesTable = config.getDeployTime('healthProfilesTable');
const rulesAPIBaseURL = config.getDeployTime('rulesAPIBaseURL');
const formsAPIBaseURL = config.getDeployTime('formsAPIBaseURL');
const enrollmentTable = config.getDeployTime('enrollmentTable');

let getHealthStatus = async function (event) {

    return await new Promise(async (resolve) => {
        try {
            console.log('Received Event: ', JSON.stringify(event));

            let userId = event.pathParameters.userId;
            let createdDate = Date.now();
            console.log('event: ', `${userId} , ${createdDate}`);

            let enrollments = await utilities.getEnrollment(userId, event.headers.Authorization, enrollmentTable);
            if (!enrollments.isAuthValid) {
                if (!enrollments.isUserExist) {
                    console.log('User not found');
                    return resolve(restApi.prepareResponse(httpStatus.NOT_FOUND));
                }
                console.log('Auth validation has failed');
                return resolve(restApi.prepareResponse(httpStatus.FORBIDDEN));
            }

            let enrollmentProfile = enrollments.profile;
            let bBadgeIssued = 'no';
            if (enrollmentProfile.badgeIssued) {
                bBadgeIssued = enrollmentProfile.badgeIssued;
            }

            if (bBadgeIssued === 'yes') {
                console.log('Badge is already issued: ', bBadgeIssued);
                return resolve(restApi.prepareResponse(httpStatus.OK, { "badgeIssued": bBadgeIssued }));
            }

            // call forms-engine
            let surveyId = enrollmentProfile.surveyId;
            let formsAPIURL = `${formsAPIBaseURL}/${surveyId}/form`;
            let formsConfig = {
                headers: {
                    "Accept": "application/json",
                    "Content-Type": "application/json"
                }
            };
            let formRes = await axios.get(formsAPIURL, formsConfig);

            let formData = formRes.data;
            if (!formData) {
                console.log('formData is not defined');
                return resolve(restApi.prepareResponse(httpStatus.NOT_FOUND));
            }
            let country = formData.country;
            let mandatedDays = formData.mandatedDays;
            console.log('country and mandatedDays', `${country} , ${mandatedDays}`);

            // get risk scores between dates
            let riskScoreArray = await aws.dbGetMany(getHealthRiskParams(getStartDate(Number(createdDate), mandatedDays), Number(createdDate), userId));
            console.log('riskScoreArray: ', riskScoreArray);

            // get policy engine result
            let rulesApiKey = await config.getRunTime('rulesAPIKeyParamName', true);
            let rulesBody = await getRulesBody(riskScoreArray.Items, country, mandatedDays, bBadgeIssued);
            if (rulesBody === null)
                return resolve(restApi.prepareResponse(httpStatus.INTERNAL_SERVER_ERROR));

            let rulesAPIURL = `${rulesAPIBaseURL}/daysLeftForBadge`;
            let rulesConfig = {
                headers: {
                    "x-api-key": rulesApiKey,
                    "Accept": "application/json",
                    "Content-Type": "application/json"
                }
            };
            let rulesResponse = await axios.post(rulesAPIURL, rulesBody, rulesConfig);
            console.log('Rules engine response: ', rulesResponse);

            let data = rulesResponse.data;
            const body = {
                "user": userId,
                "email": enrollmentProfile.email,
                "country": country,
                "nDaysOfReporting": data.mandatedDays,
                "nDaysLeft": data.remainingDays,
                "daysSubmitted": data.compliantDays,
                "badgeIssued": bBadgeIssued
            };
            return resolve(restApi.prepareResponse(httpStatus.OK, body));

        } catch (error) {
            console.error("Error: ", error);
            return resolve(restApi.prepareResponse(httpStatus.INTERNAL_SERVER_ERROR));
        }
    })
};

function getHealthRiskParams(from, to, user) {
    let params = {
        TableName: healthProfilesTable,
        ProjectionExpression: "riskScore, createdDate",
        KeyConditionExpression: "#userId = :userId and #createdDate BETWEEN :from AND :to",
        ExpressionAttributeNames: {
            "#userId": "userId",
            "#createdDate": "createdDate"
        },
        ExpressionAttributeValues: {
            ":userId": user,
            ":from": from,
            ":to": to
        }
    };
    console.log('getHealthRiskParams: ', params);
    return params;
}


let getRulesBody = async function (riskScoreArray, country, mandatedDays, bBadgeIssued) {
    let healthRiskIndex = [];
    let rsi;
    for (const items of riskScoreArray) {

        if (isBase64(items.riskScore)) {
            let [decErr, decData] = await awskms.decryptData(items.riskScore);
            if (decErr) {
                console.log('Error in decryption of data: ', decErr);
                return null;
            }
            rsi = decData.Plaintext.toString();
        } else {
            rsi = items.riskScore;
        }

        //console.log('Risk score is decrypted: ', decData);
        // console.log('decrypted: ', decData.Plaintext.toString());
        let item = {
            "date": getDateFromEpoch(items.createdDate),
            "rsi": rsi
        };
        healthRiskIndex.push(item);
    }

    let rulesBody = {
        "region": {
            "country": country,
            "consecutiveHealthReportDays": mandatedDays
        },
        "healthRiskIndex": healthRiskIndex,
        "badgeStatus": bBadgeIssued
    };

    console.log('rulesBody: ', JSON.stringify(rulesBody));
    return JSON.stringify(rulesBody);

};


// check get dates between duration
let getDateFromEpoch = function (toDate) {
    let fromDate = new Date(toDate);
    let dateFormated = fromDate.toISOString().split('T')[0];
    console.log('dateFormated: ', dateFormated);
    return dateFormated;
};

let getStartDate = function (date, mandatedDays) {
    console.log('date and mandatedDays: ', date + 'and' + mandatedDays);
    let startDate = new Date(date);
    startDate.setDate(startDate.getDate() - mandatedDays);
    console.log('startDate: ', startDate);
    let dateFormated = startDate.toISOString();
    console.log('dateFormated: ', dateFormated);
    let dateEpoch = new Date(dateFormated).valueOf();
    return dateEpoch;

};


module.exports = {
    handler: getHealthStatus
};
