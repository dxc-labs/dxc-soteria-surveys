'use strict';

const aws = require('./aws');
const hashToken = require('./hashToken');
const config = require('./config');
aws.region = config.getDeployTime('region');

exports.getEnrollment = async function (userId, authorization, enrollmentTable) {
    const params = {
        TableName: enrollmentTable,
        Key: {
            'userId': userId
        }
    };
    console.log('params: ', params);

    let getRes = await aws.dbGet(params);
    if (getRes.Item) {
        let profile = getRes.Item;
        let auth = await hashToken.authorizeToken(profile.hashedToken, authorization);
        let res = {"isUserExist": true , "isAuthValid": auth, "profile": profile}
        return res;
    }
    else {
        console.log('Given user does not exist in table');
        return {"isUserExist": false , "isAuthValid": false};
    }
}


exports.handle = (promise) => {
    return promise
        .then(data => ([undefined, data]))
        .catch(error => Promise.resolve([error, undefined]));
}; 



/* exports.sendMail = async function (toEmail, emailBody, emailSub, sourceEmailId) {
    const htmlBody = `
    <!DOCTYPE html>
    <html>
      <head></head>
      <body>Hi,</br> </br>  ${emailBody}</body>
    </html>
  `;

    var params = {
        Destination: {
            ToAddresses: [toEmail]
        },
        Message: {
            Body: {
                Html: {
                    Charset: "UTF-8",
                    Data: htmlBody
                }
            },
            Subject: {
                Charset: "UTF-8",
                Data: emailSub
            }
        },
        Source: sourceEmailId
    };
    console.log('ses params: ', params);

    let [mailErr, mailRes] = await this.handle(ses.sendEmail(params).promise());

    if (mailErr) {
        console.log('mailErr: ', mailErr);
        return prepareResponse(500, "Could not send email.");
    }

    console.log('mailRes: ', mailRes);
    return prepareResponse(200, "EMail sent successful");
}; */