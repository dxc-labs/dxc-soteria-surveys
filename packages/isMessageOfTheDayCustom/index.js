
'use strict';

const config = require('/opt/nodejs/config');
const aws = require('/opt/nodejs/aws');
const restAPI = require('/opt/nodejs/restApi');
const httpStatus = require('http-status-codes');

aws.region = config.getDeployTime('region');
const originBucket = config.getDeployTime('originBucket');

const isMessageOfTheDayCustom = async function () {
    return await new Promise(async (resolve, reject) => {
        try {
            let params = {
                Bucket: `${originBucket}/runtime/surveys/custom`,
                Key: 'messageOfTheDay.md',
            };
            let result = await aws.getFile(params);
            if(result.Body) {
                console.log('File retrieved successfully');
                return resolve(restAPI.prepareResponse(httpStatus.OK, {isCustom: true}));
            }
            else if(result.statusCode == httpStatus.NOT_FOUND) {
                console.log('Key Does Not Exist');
                return resolve(restAPI.prepareResponse(httpStatus.OK, {isCustom: false}));
            }
        }
        catch(error) {
            console.error("Error: ", error);
            return resolve(restAPI.prepareResponse(httpStatus.INTERNAL_SERVER_ERROR));
        }
    })    
};

module.exports = {
    handler: isMessageOfTheDayCustom
};
