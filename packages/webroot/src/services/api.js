import axios from 'axios';


const formApi = axios.create({
  baseURL:  `https://${process.env.REACT_APP_API_USER_DOMAIN}/forms`,
  //baseURL: 'https://apidev.example.com',
  headers: {tenant: 'forms'}
});

const generalApi = axios.create({
  baseURL: `https://${process.env.REACT_APP_API_USER_DOMAIN}/surveys`,
  //baseURL: 'https://api.hwsrdev.example.com',
  headers: {'Content-Type': 'application/x-www-form-urlencoded'}
});

export async function addUserProfile(profileData) {
  try {
    const res = await generalApi
      .post('/profiles', profileData);
      console.log('Service file in post response ', res.data);
      console.log('Form Submitted Successfully.');
    return res.data;
  }
  catch (err) {
    return err;
  }
}

export async function addHealthProfile(healthProfileData, authToken) {
  try {
    var headers = {
      'Authorization': authToken
    }
    const res = await generalApi
      .post('/healthprofiles', healthProfileData, {"headers" : headers});
      console.log('Service file in post response ', res.data);
      console.log('Form Submitted Successfully.');
    return res;
  }
  catch (err) {
    return err.response;
  }
}

/*
export async function getUserProfile(userId) {
  console.log('userId in api file ', userId);
  try {
    const res = await generalApi
      .get('/profiles/'+ userId)
      .then((res) => {
        console.log('Service file in get response ', res);
        return res;
      })
  }
  catch (err) {
    console.log('error block ',JSON.stringify(err)); 
    return err;
  }
}
*/
/*export function getForm(name, location) {
  return formApi
    .get(`/${name}/${location}`)
    .then((res) => res.data)
    .catch((err) => err);
}*/

export function addForm(payload) {
  return formApi
    .post(`/`, payload)
    .then((res) => res.data)
    .catch((err) => err);
}

/*
export async function getHealthStatus(userId) {
  console.log('userId in api file ', userId);
  try {
    const res = await generalApi
      .get('/healthStatus/'+ userId)
      .then((res) => {
        console.log('Service file in get response ', res);
        return res;
      })
  }
  catch (err) {
    console.log('error block ',JSON.stringify(err)); 
    return err;
  }
}*/
/** API starts for Join Survey */
export function getForm(surveyId,sk) {
  return formApi
    .get(`/${surveyId}/${sk}`)
    .then((res) => res)
    .catch((err) => err.response);
}

export async function addHealthSurvey(SurveyData) {
  try {
    const res = await generalApi
      .post('/profiles', SurveyData);
      console.log('Service file in post response ', res.data);
      console.log('Form Submitted Successfully.');
    return res;
  }
  catch (err) {
    return err.response;
  }
}
