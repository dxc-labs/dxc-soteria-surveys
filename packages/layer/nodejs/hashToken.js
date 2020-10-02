const config = require('./config');

getHashOfToken = async (token) => {
    const splitToken = await config.getRunTime('splitTokenParamName');
    const crypto = require('crypto');
    var hash = crypto.createHmac('sha256', splitToken).update(token).digest('base64');
    return hash;
}

authorizeToken = async (hashOfToken, token) => {
    const hash = await getHashOfToken(token)
    return (hashOfToken === hash);
}

module.exports = {
    authorizeToken, getHashOfToken
}