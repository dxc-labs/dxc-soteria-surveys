#!/bin/bash

echo '=================================== Cloudformation Deploy Started (./deploy.sh) ================================================'
echo '=================================== Cloudformation Deploy Started (./deploy.sh) ================================================='

#if target environment > sandbox, then download the pacakge from the artifactory
export ISFROMGIT='0'
#export USER="jenkins"
#export ENVIRONMENT="prod"
export CF_BUCKET_NAME=${ENVIRONMENT}-${USER}-surveys-cloudformation-artifacts-${AWS_REGION}

echo "Creating Temporary Bucket"
if aws s3 mb "s3://${CF_BUCKET_NAME}" --region $AWS_REGION >/dev/null ; then
    echo "Temporary Bucket Created: ${CF_BUCKET_NAME}"
fi

chmod 777 ./deploy-cf.sh
 . ./deploy-cf.sh --USER ${USER} --ENVIRONMENT ${ENVIRONMENT}
# chmod 777 ./cloudformation/data-schema/deploy.sh
# . ./cloudformation/data-schema/deploy.sh --user ${USER} --environment ${ENVIRONMENT}

# chmod 777 ./cloudformation/data-storage/deploy.sh
# . ./cloudformation/data-storage/deploy.sh --user ${USER} --environment ${ENVIRONMENT}

# chmod 777 ./cloudformation/api-gateway/deploy.sh
# . ./cloudformation/api-gateway/deploy.sh --user ${USER} --environment ${ENVIRONMENT}

# pwd 
# cd ../../
# pwd
# chmod 777 ./cloudformation/event-mapping/deploy.sh
# . ./cloudformation/event-mapping/deploy.sh --user ${USER} --environment ${ENVIRONMENT}

# pwd

# chmod 777 ./cloudformation/cdn/deploy.sh
# . ./cloudformation/cdn/deploy.sh --user ${USER} --environment ${ENVIRONMENT}

pwd

chmod 777 ./utilities/deploy-webapp.sh
. ./utilities/deploy-webapp.sh




rc=$?
if [[ $rc != 0 ]]; then exit $rc; else pwd; fi

echo '====================================== Cloudformation Deploy Completed (./deploy.sh) ============================================'