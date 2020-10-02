const aws = require('./aws');

class Paramters {
    async getRunTime(param, doDecrypt = false) {
        return aws.getSystemParameter(this.getDeployTime(param), doDecrypt);
    }
    getDeployTime(param) {
        return process.env[param];
    }
}

module.exports = new Paramters();
