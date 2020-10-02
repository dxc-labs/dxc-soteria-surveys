'use strict';

const isBase64 = require('is-base64');
const axios = require('axios');
const httpStatus = require('http-status-codes');

const awskms = require('/opt/nodejs/awskms.js');
const restApi = require('/opt/nodejs/restApi');
const config = require('/opt/nodejs/config');
const aws = require('/opt/nodejs/aws');
aws.region = config.getDeployTime('region');

const healthProfilesTable = config.getDeployTime('healthProfilesTable');
const enrollmentTable = config.getDeployTime('enrollmentTable');
const rulesAPIEnable = config.getDeployTime('rulesAPIEnable');
const rulesAPIBaseURL = config.getDeployTime('rulesAPIBaseURL');
const riskAPIURL = config.getDeployTime('riskAPIURL');
const badgesRequestsURL = config.getDeployTime('badgesRequestsURL');
const badgesRevokeURL = config.getDeployTime('badgesRevokeURL');
const formsAPIBaseURL = config.getDeployTime('formsAPIBaseURL');
const isEncryptRiskScore = config.getDeployTime('isEncryptRiskScore');


let badgeIssueFunction = async function (event) {

    return await new Promise(async (resolve) => {
        try {
            console.log('Received Event: ', event);

            for (const record of event.Records) {
                console.log('Stream event: ', JSON.stringify(record, null, 2));
                if (record.eventName !== 'INSERT') {
                    return;
                }
                let newImage = aws.unmarshallEvent(record.dynamodb.NewImage);
                let userId = newImage.userId;
                let healthProfileId = newImage.healthProfileId;
                let createdDate = newImage.createdDate;
                let riskScore;
                console.log('newImage: ', userId + ' ' + healthProfileId + ' ' + createdDate);

                // get user profile
                let enrollments = await aws.dbGet(getUserProfileParams(userId));
                enrollments = enrollments.Item;
                console.log('enrollments: ', enrollments);

                if (!(newImage.hasOwnProperty('riskScore'))) {
                    let riskBody = prepareRiskBody(newImage);
                    let riskAPIKey = await config.getRunTime('riskAPIKeyParamName', true);
                    // call risk api
                    let riskConfig = {
                        headers: {
                            "x-api-key": riskAPIKey,
                            "Accept": "application/json",
                            "Content-Type": "application/json"
                        }
                    };
                    let riskResponse = await axios.post(riskAPIURL, riskBody, riskConfig);
                    console.log('Risk api response: ', riskResponse);

                    let data = riskResponse.data;
                    console.log('riskResponse.data: ', data);
                    riskScore = data.body[0];
                    //Incident log in ServiceNow
                    if (riskScore === 'red') {
                        console.log("Raise a Incident to ServiceNow when Health Status is Red");
                        let serviceNowURL = await config.getRunTime('serviceNowAPIURLParamName');
                        let serviceNowKey = await config.getRunTime('serviceNowAPIKeyParamName');
                        let incidentBody = getIncidentBody(enrollments.email);
                        postApiCallServiceNow(serviceNowURL, serviceNowKey, incidentBody);
                    }

                    if (isEncryptRiskScore === 'true') {
                        let [encErr, encData] = await awskms.encryptData(riskScore);
                        if (encErr) {
                            console.log("Error in encrypting risk score: ", encErr);
                            return resolve(restApi.prepareResponse(httpStatus.INTERNAL_SERVER_ERROR));
                        }
                        console.log('Risk score is encrypted');
                        riskScore = new Buffer.from(encData.CiphertextBlob).toString('base64');
                    }

                    //update health profile table with risk score
                    let updateHealth = await aws.dbUpdate(updateHealthParams(userId, createdDate, riskScore));
                    console.log('Risk score update Res: ', updateHealth);

                }
                else {
                    riskScore = newImage.riskScore;
                }
                //console.log('riskScore: ', riskScore);

                let bBadgeIssued = 'no';
                if (enrollments.badgeIssued) {
                    bBadgeIssued = enrollments.badgeIssued;
                }

                let requestId = null;
                if (enrollments.requestId) {
                    requestId = enrollments.requestId;
                }

                // call forms-engine
                let surveyId = enrollments.surveyId;
                let formsAPIURL = `${formsAPIBaseURL}/${surveyId}/form`;
                let formsConfig = {
                    headers: {
                        "Accept": "application/json",
                        "Content-Type": "application/json"
                    }
                };
                let formRes = await axios.get(formsAPIURL, formsConfig);
                console.log('formRes: ', formRes);

                let formData = formRes.data;
                if (!formData) {
                    console.log('formData is not defined');
                    return resolve(restApi.prepareResponse(httpStatus.NOT_FOUND));
                }
                let country = formData.country;
                let mandatedDays = formData.mandatedDays;

                // get risk scores between dates
                let riskScoreArray = await aws.dbGetMany(getHealthRiskParams(getStartDate(Number(createdDate), mandatedDays), Number(createdDate), userId));
                console.log('riskScoreArray: ', riskScoreArray);

                let bIssueDecision = "noAction";
                let actionMessage = null;
                if (rulesAPIEnable) {
                    // check if elibile to issue badge
                    let rulesApiKey = await config.getRunTime('rulesAPIKeyParamName', true);
                    let rulesBody = await getRulesBody(riskScoreArray.Items, country, mandatedDays, bBadgeIssued);
                    if (!rulesBody)
                        return resolve(restApi.prepareResponse(httpStatus.INTERNAL_SERVER_ERROR));

                    let rulesAPIURL = `${rulesAPIBaseURL}/checkForBadgeIssuance`;
                    let rulesConfig = {
                        headers: {
                            "x-api-key": rulesApiKey,
                            "Accept": "application/json",
                            "Content-Type": "application/json"
                        }
                    };
                    let rulesResponse = await axios.post(rulesAPIURL, rulesBody, rulesConfig);
                    console.log('Rules engine response: ', rulesResponse);

                    let responseData = rulesResponse.data;
                    bIssueDecision = (responseData.body).trim();
                    actionMessage = responseData.actionMessage;
                }
                else {
                    if (bBadgeIssued === "no" && riskScore === "green") {
                        bIssueDecision = "issueBadge";
                    }
                    else if (bBadgeIssued === "yes" && riskScore !== "green") {
                        bIssueDecision = "revokeBadge";
                        actionMessage = 'risk score is ' + riskScore;
                    }
                }

                if (bIssueDecision === 'issueBadge') {
                    console.log('bIssueDecision.bIssueBadge:', bBadgeIssued);
                    let badgesApiKey = await config.getRunTime("badgesAPIKeyParamName", true);
                    let badgesRequestBody = getBadgeRequestBody(enrollments);
                    let badgesConfig = {
                        headers: {
                            "x-api-key": badgesApiKey,
                            "Accept": "application/json",
                            "Content-Type": "application/json"
                        }
                    };
                    let badgesResponse = await axios.post(badgesRequestsURL, badgesRequestBody, badgesConfig);
                    console.log('badgesResponse: ', badgesResponse);

                    let responseData = badgesResponse.data;
                    requestId = responseData.requestId;
                    console.log('requestId: ', requestId);
                    bBadgeIssued = 'yes';
                    console.log('Badge Issued');

                }
                else if (bIssueDecision === 'revokeBadge') {
                    let badgesApiKey = await config.getRunTime("badgesAPIKeyParamName", true);
                    let badgesRevokeBody = getBadgesRevokeBody(requestId, actionMessage);
                    let badgesconfig = {
                        headers: {
                            "x-api-key": badgesApiKey,
                            "Accept": "application/json",
                            "Content-Type": "application/json"
                        }
                    };
                    let revokeRes = await axios.post(badgesRevokeURL, badgesRevokeBody, badgesconfig);
                    console.log('bRevokeBadge.response: ', revokeRes);
                    bBadgeIssued = 'no';
                    requestId = null;
                    console.log('Badge revoked');
                }
                else {
                    console.log('no action');
                    return resolve(restApi.prepareResponse(httpStatus.OK, bIssueDecision));
                }

                //update User profiles table            
                let updateUser = await aws.dbUpdate(updateProfileParams(userId, bBadgeIssued, requestId));
                console.log('update userProfile Res: ', updateUser);
                return resolve(restApi.prepareResponse(httpStatus.OK, bIssueDecision));
            }
        } catch (error) {
            console.error("Error: ", error);
            return resolve(restApi.prepareResponse(httpStatus.INTERNAL_SERVER_ERROR));
        }
    })
};


let prepareRiskBody = function (newImage) {
    let features = [];
    console.log(' newImage: ', newImage);
    let feature = newImage.surveyAnswers;
    features.push(feature);
    let body = {
        "instances": [{ features }]
    };
    console.log('prepareRiskBody: ', JSON.stringify(body));
    return JSON.stringify(body);
};

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

let getBadgeRequestBody = function (enrollments) {
    let items = {
        "name": 'Project Soteria',
        "email": enrollments.email,
        "employeeNumber": '-',
        "passLocation": enrollments.passLocation,
        "passType": enrollments.userType
    };
    return JSON.stringify(items);
};

let getBadgesRevokeBody = function (requestId, actionMessage) {
    let body = { "passId": requestId, "revokeReason": actionMessage };
    return JSON.stringify(body);
};

// check get dates between duration and check contain unique dates of array
let getDateFromEpoch = function (toDate) {
    let fromDate = new Date(toDate);
    let dateFormated = fromDate.toISOString().split('T')[0];
    console.log('dateFormated: ', dateFormated);
    return dateFormated;
};

let getStartDate = function (date, mandatedDays) {
    let startDate = new Date(date);
    startDate.setDate(startDate.getDate() - mandatedDays);
    let dateFormated = startDate.toISOString();
    console.log('dateFormated: ', dateFormated);
    let dateEpoch = new Date(dateFormated).valueOf();
    return dateEpoch;

};

let getIncidentBody = function (email) {
    let body = {
        "u_email": email,
        "u_requested_for": "Safety Suite",
        "u_incident_impact": "3",
        "u_incident_state": "New",
        "u_incident_urgency": "3",
        "u_short_description": "Health Status is Red for " + email + "."
    };
    return JSON.stringify(body);
};

let postApiCallServiceNow = async function (url, key, body) {
    try {
        const snowConfig = {
            headers: {
                'Authorization': 'Basic ' + key,
                "Accept": "application/json",
                "Content-Type": "application/json"
            }
        };
        const snowResponse = await axios.post(url, body, snowConfig);
        if (snowResponse.status == 200 || snowResponse.status == 201) {
            console.log('serviceNowResponseCode :' + snowResponse.status + ', message: Incident Recorded');
        }
        else {
            console.log('serviceNowResponseCode :' + snowResponse.status + ', message :' + snowResponse.statusText);
        }
    }
    catch (error) {
        console.log('serviceNow caught err', error);
    }

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

let getUserProfileParams = function (key) {
    const params = {
        TableName: enrollmentTable,
        Key: {
            'userId': key
        }
    };

    return params;
};


function updateHealthParams(key, createdDate, riskScore) {

    let exprAttr = {
        ":riskScore": riskScore,
        ":surveyAnswers": null,
        ":updatedDate": Date.now()
    };
    let updateExpr = "SET riskScore = :riskScore, surveyAnswers = :surveyAnswers, updatedDate = :updatedDate";

    let params = {
        TableName: healthProfilesTable,
        Key: {
            userId: key,
            createdDate: createdDate
        },
        UpdateExpression: updateExpr,
        ExpressionAttributeValues: exprAttr,
        ReturnValues: "UPDATED_NEW"
    };

    console.log('params: ', params);
    return params;
}

function updateProfileParams(key, badgeIssued, requestId) {

    let exprAttr = {
        ":badgeIssued": badgeIssued,
        ":requestId": requestId,
        ":updatedDate": Date.now()
    };
    let updateExpr = " SET badgeIssued = :badgeIssued, requestId = :requestId, updatedDate = :updatedDate";

    let params = {
        TableName: enrollmentTable,
        Key: {
            userId: key
        },
        UpdateExpression: updateExpr,
        ExpressionAttributeValues: exprAttr,
        ReturnValues: "UPDATED_NEW"
    };

    console.log('params: ', params);
    return params;
}


module.exports = {
    handler: badgeIssueFunction
};
