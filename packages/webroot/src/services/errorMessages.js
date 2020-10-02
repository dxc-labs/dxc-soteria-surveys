import * as HttpStatus from 'http-status-codes'

export function getErrorMessage(statuscode) {

    if(!statuscode){
        statuscode = HttpStatus.INTERNAL_SERVER_ERROR;
    }
        return statuscode + ' : ' + HttpStatus.getStatusText(statuscode) 
  }
