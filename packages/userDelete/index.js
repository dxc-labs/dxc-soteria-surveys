'use strict';

const config = require('/opt/nodejs/config');
const aws = require('/opt/nodejs/aws');
const restAPI = require('/opt/nodejs/restApi');

aws.region = config.getDeployTime('region');

const httpStatus = require('http-status-codes');
const healthTable = config.getDeployTime('healthProfilesTable');
const userTable = config.getDeployTime('enrollmentTable');
const emailIndex = config.getDeployTime('emailIndex');

let deleteUser = async function (event, context) {
    return await new Promise(async (resolve, reject) => {
        try {
            console.log("event:", JSON.stringify(event));
            console.log("context:", JSON.stringify(context));
        
            let email = event.queryStringParameters.userId;
        
            let userQueryRes = await aws.dbGetMany(getInputParamsByEmail(email));
            console.log('userQueryResult: ', userQueryRes);
        
            if ((userQueryRes.Count) == 0) {
                console.log(`No survey answers exist to delete for ${email}`);
                return resolve(restAPI.prepareResponse(httpStatus.NOT_FOUND));
            }
        
            for (let id = 0, leng = userQueryRes.Items.length; id < leng; ++id) {
                let healthQueryRes = await aws.dbGetMany(getInputParamsByUserId(Number(Date.now()), userQueryRes.Items[id].userId));
                console.log('healthQueryRes: ', healthQueryRes);
                if ((healthQueryRes.Count) != 0) {
                    for (let item = 0, len = healthQueryRes.Items.length; item < len; ++item) {
                        let healthParams = {
                            TableName: healthTable,
                            Key: {
                                'userId': healthQueryRes.Items[item].userId,
                                'createdDate': healthQueryRes.Items[item].createdDate
                            }   
                        };
                        console.log('healthParams:', healthParams);
                        let deleteHealthResult = await aws.dbDelete(healthParams);
                        if(!deleteHealthResult) {
                            console.log("No Survey answers found");
                            return resolve(restAPI.prepareResponse(httpStatus.NOT_FOUND));
                        }
                    }
                }
                const params = {
                    TableName: userTable,
                    Key: {
                        'userId': userQueryRes.Items[id].userId
                    }
                };
                let  deleteUserResult = await aws.dbDelete(params);
                if (!deleteUserResult) {
                    console.log("No user details found");
                    return resolve(restAPI.prepareResponse(httpStatus.NOT_FOUND));
                }
            }
            return resolve(restAPI.prepareResponse(httpStatus.OK));
    
        } catch(error) {
            console.error("Error: ", error);
            return resolve(restAPI.prepareResponse(httpStatus.INTERNAL_SERVER_ERROR));
        }
    })   
};

function getInputParamsByEmail(email) {
    let userParams = {
        TableName: userTable,
        ProjectionExpression: "userId",
        KeyConditionExpression: "email = :email",
        ExpressionAttributeValues: {
            ":email": email
        },
        IndexName: emailIndex
    };
    return userParams;
}

function getInputParamsByUserId(date, user) {
    let healthparams = {
        TableName: healthTable,
        ProjectionExpression: "userId, createdDate",
        KeyConditionExpression: "#userId = :userId and #createdDate <= :date",
        ExpressionAttributeNames: {
            "#userId": "userId",
            "#createdDate": "createdDate"
        },
        ExpressionAttributeValues: {
            ":userId": user,
            ":date": date
        }
    };
    return healthparams;
}

module.exports = {
    handler: deleteUser
};
