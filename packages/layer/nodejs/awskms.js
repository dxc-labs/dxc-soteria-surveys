var AWS = require('aws-sdk');
const utilities = require('./utility');
const kmsKeyAlias = process.env.kmsKeyAilas;
AWS.config.region = process.env.region;
const kms = new AWS.KMS();


exports.encryptData = async function (plainData) {
    console.log('In encryptData()');
    return await utilities.handle(kms.encrypt({
        KeyId: kmsKeyAlias,
        Plaintext: plainData,
    }).promise());

};

exports.decryptData = async function (cipherBlob) {
    console.log('In decryptData()');
    return await utilities.handle(kms.decrypt({
        CiphertextBlob: Buffer.from(cipherBlob, "base64"),
    }).promise());
}
