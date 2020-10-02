console.log("LoadFormData JS started... ");

console.log("FORMS_ENGINE_API_BASEURL", process.env.REACT_APP_FORMS_ENGINE_API);

const REACT_APP_FORMS_ENGINE_API = process.env.REACT_APP_FORMS_ENGINE_API;

console.log("FORM_API_URL is ", REACT_APP_FORMS_ENGINE_API);

//const HealthForm = require("./../src/views/HealthForm/data.json")
//const ProfileForm = require("./../src/views/ProfileForm/data.json")
const EmployeeHealthForm = require("./../src/views/HealthForm/EmployeeHealthProfile.json")
const VisitorHealthForm = require("./../src/views/HealthForm/VisitorHealthProfile.json")
const EmployeeSurveyForm = require("./../src/views/JoinEmployeeSurvey/data.json")
const VisitorSurveyForm = require("./../src/views/JoinVisitorSurvey/data.json")

var filesArray = [EmployeeHealthForm, VisitorHealthForm, EmployeeSurveyForm, VisitorSurveyForm];
console.log(filesArray.length);

for(i=0; i <= filesArray.length; i++){
    const axios = require('axios')
    var optionAxios = {
        headers: {
            tenant: 'forms'
        }
    }
    axios.post(REACT_APP_FORMS_ENGINE_API + '/forms',
    filesArray[i], optionAxios)
    .then((res) => {
        console.log(`statusCode: ${res.status}`)
        console.log(res)
    })
    .catch((error) => {
        console.error(error)
    })

}