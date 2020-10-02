
import HealthForm from '../views/HealthForm';
import HealthReportingStatus from '../views/HealthReportingStatus';
import JoinEmployeeSurvey from '../views/JoinEmployeeSurvey';
import JoinVisitorSurvey from '../views/JoinVisitorSurvey';
import SurveyStatus from '../views/SurveyStatus';

export const routes = {
 
  '/surveys/health': {
    path: '/surveys/health/:userId',
    component: HealthForm,
    name: 'HealthForm',
    description: '',
  },

  '/surveys/healthReportingStatus': {
    path: '/surveys/healthReportingStatus/:status/:userId',
    component: HealthReportingStatus,
    name: 'HealthReportingStatus',
    description: '',
  },

  '/surveys/employeeJoin': {
    path: '/surveys/employeeJoin/:surveyId',
    component: JoinEmployeeSurvey,
    name: 'JoinEmployeeSurvey',
    description: '',
  },

  '/surveys/visitorJoin': {
    path: '/surveys/visitorJoin/:passLocation/:surveyId',
    component: JoinVisitorSurvey,
    name: 'JoinVisitorSurvey',
    description: '',
  },

  '/surveys/SurveyStatus': {
    path: '/surveys/SurveyStatus/:status',
    component: SurveyStatus,
    name: 'SurveyStatus',
    description: '',
  },

  '/surveys': {
    path: '/surveys/:surveyId/:userId',
    component: HealthForm,
    name: 'HealthForm',
    description: '',
  }
};
