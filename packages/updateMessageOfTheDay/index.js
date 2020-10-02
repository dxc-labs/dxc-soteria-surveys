'use strict';

const config = require('/opt/nodejs/config');
const aws = require('/opt/nodejs/aws');
const restAPI = require('/opt/nodejs/restApi');

aws.region = config.getDeployTime('region');
const originBucket = config.getDeployTime('originBucket');

const httpStatus = require('http-status-codes');
const marked = require('marked');

let updateMessageOfTheDay = async function (event, context) {
    return await new Promise(async (resolve, reject) => {
        try {
            console.log("event:", JSON.stringify(event));
            console.log("context:", JSON.stringify(context));
            
            let body = JSON.parse(event.body);
            
            let mdFileData = body.data;
            console.log('mdFileData: ', mdFileData);
    
            let mdSuccess = await aws.addFile(getS3Params('messageOfTheDay.md', mdFileData));
            if(mdSuccess) {
                console.log("MD file uploaded successfully: ", mdSuccess);
            }
    
            let htmlFileData = marked(String(mdFileData));
            console.log('htmlFileData:', htmlFileData);
    
            var head = `<html>
            <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1, minimal-ui">
                <link rel="stylesheet" type="text/css" href="../standard/messageOfTheDay.css" charset="utf-8"/>
            </head> 
            <body>`;
            
            var tail = `</body> 
            </html>`;
            
            let html = head + htmlFileData + tail;
    
            let htmlSuccess = await aws.addFile(getS3Params('messageOfTheDay.html', html));
            if (htmlSuccess) {
                console.log("HTML file uploaded successfully: ", htmlSuccess);
                return resolve(restAPI.prepareResponse(httpStatus.OK));
            }
        } catch(error) {
            console.error("Error: ", error);
            return resolve(restAPI.prepareResponse(httpStatus.INTERNAL_SERVER_ERROR));
        }   
    })
};

function getS3Params(fileName, fileContent) {
    let params = {
        ACL: 'public-read',
        Bucket: `${originBucket}/runtime/surveys/custom`,
        Key: fileName,
        Body: fileContent,
        ContentType: 'text/html'
    };
    return params; 
};

module.exports = {
    handler: updateMessageOfTheDay
};
