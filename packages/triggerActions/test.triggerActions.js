'use strict';


async function testLambda() {
    var requestTest = require('./index');
    var event = require('./testEvent_revoke.json');
    var response =  await requestTest.handler(event, null) 
    console.log("debug.entrollInsert successfully completed.", response );

}   




testLambda()
    .then(
        (value) => { console.log("Success", value)}
        , (error) => { console.log('ERROR: ', error)}
    )
; 