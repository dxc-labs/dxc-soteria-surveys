'use strict';


async function testLambda() {
    var requestTest = require('./index');
    var event = require('./testEvent.json');
    var response =  await requestTest.handler(event, null) 
    console.log("debug.updateMessageOfTheDay successfully completed.", response );

} 

testLambda()
    .then(
        (value) => { console.log("Success", value)}
        , (error) => { console.log('ERROR: ', error)}
    )
; 
