'use strict';

var slugid = require('slugid');
const httpStatus = require('http-status-codes');

const utilities = require('/opt/nodejs/utility');
const restApi = require('/opt/nodejs/restApi');
const config = require('/opt/nodejs/config');
const aws = require('/opt/nodejs/aws');
aws.region = config.getDeployTime('region');

const healthProfilesTable = config.getDeployTime('healthProfilesTable');
const enrollmentTable = config.getDeployTime('enrollmentTable');

var insertHealthProfile = async function (event, context) {

    return await new Promise(async (resolve) => {
        try {
            console.log("event: ", JSON.stringify(event));
            console.log("context: ", JSON.stringify(context));

            let enrollments = await utilities.getEnrollment(JSON.parse(event.body).userId, event.headers.Authorization, enrollmentTable);
            if (!enrollments.isAuthValid) {
                if (!enrollments.isUserExist) {
                    console.log('User not found');
                    return resolve(restApi.prepareResponse(httpStatus.NOT_FOUND));
                }
                console.log('Auth validation has failed');
                return resolve(restApi.prepareResponse(httpStatus.FORBIDDEN));
            }
            console.log('enrollment profile: ', enrollments);

            var surveyAnswer = JSON.parse(event.body);
            console.log('surveyAnswer: ', surveyAnswer);

            var dataLifeTimeInDays = await config.getRunTime('dataLifeTimeInDaysParamName');
            var items = getParams(surveyAnswer, dataLifeTimeInDays);
            var params = {
                Item: items,
                TableName: healthProfilesTable
            };
            console.log('surveyAnswer params: ', params);
            let putRes = await aws.dbInsert(params);
            console.log("Record has been inserted successfully: ", putRes);
            return resolve(restApi.prepareResponse(httpStatus.OK, items));
        } catch (error) {
            console.error("Error: ", error);
            return resolve(restApi.prepareResponse(httpStatus.INTERNAL_SERVER_ERROR));
        }
    })
};


var getParams = function (hwsrProfile, dataLifeTimeInDays) {
    var hId = slugid.nice();
    var items = {};
    items["userId"] = hwsrProfile.userId;
    items["surveyId"] = hwsrProfile.surveyId;
    var surveyAnswers = hwsrProfile;
    delete surveyAnswers["surveyId"];
    delete surveyAnswers["userId"];
    items["surveyAnswers"] = surveyAnswers;
    items["healthProfileId"] = hId;
    var expiryDate = getExpirityDate(Date.now(), Number(dataLifeTimeInDays));
    items["createdDate"] = Date.now();
    items["updatedDate"] = Date.now();
    items["ttl"] = expiryDate;
    return items;
};

var getExpirityDate = function (date, dataLifeTimeInDays) {
    var startDate = new Date(date);
    startDate.setDate(startDate.getDate() + dataLifeTimeInDays);
    var dateFormated = startDate.toISOString();
    console.log('dateFormated: ', dateFormated);
    var dateEpoch = new Date(dateFormated).valueOf();
    return dateEpoch;

};

module.exports = {
    handler: insertHealthProfile,

};
