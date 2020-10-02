'use strict';

const restApi = require('/opt/nodejs/restApi');
const aws = require('/opt/nodejs/aws');
const httpStatus = require('http-status-codes');
const config = require('/opt/nodejs/config');
const utilities = require('/opt/nodejs/utility');
aws.region = config.getDeployTime('region');
const enrollmentTable = config.getDeployTime('enrollmentTable');


let getProfileData = async function (event, context) {

    return await new Promise(async (resolve) => {
        try {
            console.log("event:", JSON.stringify(event));
            console.log("context:", JSON.stringify(context));

            let enrollments = await utilities.getEnrollment(event.pathParameters.userId,
                event.headers.Authorization, enrollmentTable);
            if (!enrollments.isAuthValid) {
                if (!enrollments.isUserExist) {
                    console.log('User not found');
                    return resolve(restApi.prepareResponse(httpStatus.NOT_FOUND));
                }
                console.log('Auth validation has failed');
                return resolve(restApi.prepareResponse(httpStatus.FORBIDDEN));

            }
            console.log('Auth validation has passed: ', enrollments.profile);
            return resolve(restApi.prepareResponse(httpStatus.OK, enrollments.profile));
        } catch (error) {
            console.error("Error: ", error);
            return resolve(restApi.prepareResponse(httpStatus.INTERNAL_SERVER_ERROR));
        }
    });

};

module.exports = {
    handler: getProfileData
};
