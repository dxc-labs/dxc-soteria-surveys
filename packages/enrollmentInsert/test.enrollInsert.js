'use strict';

async function testLambda() {
    var requestTest = require('./index');
     var event = require('./testEvent_visitor.json');
    //var event = require('./testEvent_emp.json');
    var response = await requestTest.handler(event, null) 
    console.log("debug.entrollInsert successfully completed.", response );

}   

testLambda()
    .then(
        () => { console.log("Success")}
        , (error) => { console.log('ERROR: ', error)}
    )
    //.catch(error) { console.log(error.message) };

