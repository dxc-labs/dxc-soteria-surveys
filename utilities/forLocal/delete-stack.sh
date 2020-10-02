echo "**************************************Delete Stack*******************************"

#Delete Stack Commands for Dev and Prod
#dev env
#./delete-stack.sh --AWS_REGION us-east-1 --AWS_ACCOUNT 123456789012 --ENVIRONMENT dev --USER soteria --APPLICATION_BUCKET xxx-dev-soteria-website --STACK_PREFIX xxx-dev-soteria
#prod env
#./delete-stack.sh --AWS_REGION us-west-2 --AWS_ACCOUNT 123456789012 --ENVIRONMENT prod --USER soteria --APPLICATION_BUCKET xxx-prod-website --STACK_PREFIX xxx-prod

AWS_REGION=${AWS_REGION:-}
AWS_ACCOUNT=${AWS_ACCOUNT:-}
ENVIRONMENT=${ENVIRONMENT:-}
USER=${USER:-}
CF_BUCKET_NAME=hwsr-${USER}-${ENVIRONMENT}-cloudformation-artifacts-${AWS_ACCOUNT}
APPLICATION_BUCKET=${APPLICATION_BUCKET:-}
STACK_PREFIX=${STACK_PREFIX:-}

# TODO: Fix error checking
while [ $# -gt 0 ]; do
    if [[ $1 == *"--"* ]]; then
        param="${1/--/}"
        declare $param="$2"
    fi
    shift
done

echo "$AWS_REGION , $AWS_ACCOUNT , $ENVIRONMENT , $USER , $CF_BUCKET_NAME , $APPLICATION_BUCKET , $STACK_PREFIX"

echo "Deleting Temporary Bucket"
if aws s3 rb "s3://${CF_BUCKETS_NAME}" --force ; then
    echo "Temporary Bucket Deleted"
fi


echo "Emptying Application Bucket"
if aws s3 rm "s3://${APPLICATION_BUCKET}" --recursive; then
    echo "Application Bucket Empty"
fi

echo "Deleting Cloudformation Stacks"
	if aws cloudformation delete-stack --stack-name ${STACK_PREFIX}-cdn --region $AWS_REGION; then
        echo "${STACK_PREFIX}-${STACK_NAME} deleted!"
    fi
    if aws cloudformation delete-stack --stack-name ${STACK_PREFIX}-storage --region $AWS_REGION; then
        echo "${STACK_PREFIX}-${STACK_NAME} deleted!"
    fi
    if aws cloudformation delete-stack --stack-name ${STACK_PREFIX}-event --region $AWS_REGION; then
        echo "${STACK_PREFIX}-${STACK_NAME} deleted!"
    fi
    if aws cloudformation delete-stack --stack-name ${STACK_PREFIX}-api --region $AWS_REGION; then
        echo "${STACK_PREFIX}-${STACK_NAME} deleted!"
    fi
    if aws cloudformation delete-stack --stack-name ${STACK_PREFIX}-database --region $AWS_REGION; then
        echo "${STACK_PREFIX}-${STACK_NAME} deleted!"
    fi

echo "**************************************Delete Stack Done*******************************"
