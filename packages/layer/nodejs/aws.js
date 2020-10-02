class aws {
    constructor() {
        this.AWS = require('aws-sdk');
    }

    /*
        Promisify this.AWS Lambda Invoke
    */
    set region(region) {
        this._region = region;
        this.AWS.config._region = region;
        return this;
    }

    get region() {
        return this._region;
    }
    
    async invoke(params) {
        return new Promise(async (resolve, reject) => {
            let lambda = new this.AWS.Lambda({ region: this.region });
            if (lambda.invoke(params, (err, data) => {
                if (err) return reject(err);
                resolve(data);
            }));
        });
    }

    async dbInsert(params) {
        try {
            console.log("DynamoDB.insert Params: ", params);
            var docClient = new this.AWS.DynamoDB.DocumentClient({
                apiVersion: '2012-08-10',
                region: this.region
            });
            let data = await docClient.put(params).promise();
            return (data);
        } catch (error) {
            console.error('DynamoDB.put error: ', error);
            throw (error);
        }
    }

    async dbGetMany(params) {
        try {
            console.log("DynamoDB.query Params: ", params);
            var docClient = new this.AWS.DynamoDB.DocumentClient({
                apiVersion: '2012-08-10',
                region: this.region
            });
            return await docClient.query(params).promise();
        } catch (error) {
            console.error('DynamoDB.query error: ', error);
            throw (error);
        }
    }

    async dbGet(params) {
        try {
            console.log("DynamoDB.get Params: ", params);
            var docClient = new this.AWS.DynamoDB.DocumentClient({
                apiVersion: '2012-08-10',
                region: this.region
            });
            let data = await docClient.get(params).promise();
            return data;
        } catch (error) {
            console.error('DynamoDB.get error: ', error);
            throw (error);
        }
    }

    async dbUpdate(params) {
        try {
            console.log("DynamoDB.update Params: ", params);
            var docClient = new this.AWS.DynamoDB.DocumentClient({
                apiVersion: '2012-08-10',
                region: this.region
            });
            let data = await docClient.update(params).promise();
            return data;
        } catch (error) {
            console.error('DynamoDB.update error: ', error);
            throw (error);
        }
    }

    async dbDelete(params) {
        try {
            console.log("DynamoDB.delete Params: ", params);

            var docClient = new this.AWS.DynamoDB.DocumentClient({
                apiVersion: '2012-08-10',
                region: this.region
            });
            return await docClient.delete(params).promise();
        } catch (error) {
            console.error('DynamoDB.delete error: ', error);
            throw (error);
        }
    }

    /*
       AWS S3 Get and Insert a file
    */

    async getFile(params) {
        try {
            console.log("s3.getObject Params: ", params);
            var s3 = new this.AWS.S3();
            let file = await s3.getObject(params).promise();
            return (file);
        } catch (error) {
            console.error('S3.getObject error: ', error);
            return (error);
        }
    }

    async addFile(params) {
        try {
            console.log("s3.upload Params: ", params);
            var s3 = new this.AWS.S3();
            let file = await s3.upload(params).promise();
            return (file);
        } catch (error) {
            console.error('S3.upload error: ', error);
            throw (error);
        }
    }

    /*
        Get Parameter Value from AWS System Parameter Store
    */
    async getSystemParameter(inputParamName, doDecrypt) {
        try {
            let ssm = new this.AWS.SSM({ apiVersion: '2014-11-06', region: this.region });
            let paramResult = await ssm.getParameter({
                Name: inputParamName,
                WithDecryption: doDecrypt
            }).promise();
            console.log(`SSM Param ${inputParamName}`);
            return (paramResult.Parameter.Value);
        } catch (error) {
            console.error(`Failed to get SSM Parameter ${inputParamName}`, error);
            throw error;
        }
    }

    unmarshallEvent(newImage){
        return this.AWS.DynamoDB.Converter.unmarshall(newImage);
    }
}

    module.exports = new aws();
