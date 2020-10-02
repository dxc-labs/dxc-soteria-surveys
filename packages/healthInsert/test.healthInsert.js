'use strict';

async function testLambda() {
    var requestTest = require('./index');
    var event = require('./testEvent.json');
    var response = await requestTest.handler(event, null) 
    console.log("debug.healthInsert successfully completed.", response );

}   

testLambda()
    .then(
        () => { console.log("Success")}
        , (error) => { console.log('ERROR: ', error)}
    )
    //.catch(error) { console.log(error.message) };

