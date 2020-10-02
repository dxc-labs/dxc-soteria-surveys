'use strict';
const getProfile = require('./index.js');

async function testLambda() {
    var requestTest = require('./index');
    var event = require('./testEvent.json');
    var response = await requestTest.handler(event, null) 
    console.log("debug.profileGet successfully completed.", response );

}   


testLambda()
    .then(
        (value) => { console.log("Success", value)}
        , (error) => { console.log('ERROR: ', error)}
    )
//.catch(error) { console.log(error.message) }; 