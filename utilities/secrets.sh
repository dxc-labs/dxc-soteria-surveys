ProjectName="--- Project Name Here ---" # E.g., soteria
TenantName="--- Tenant Name Here ---" # E.g., acme
EnvironmentName="--- Environment Name Here ---" # E.g., sbx
ComponentName="surveys"
AWS_REGION="--- AWS Region Here ---" # E.g., us-east-1
policyEngineAPIKey="--- Policy Engine API Key Here ---"
serviceNowKey="--- ServicNow Key Here ---"
serviceNowAPIURL="--- ServicNow Key API URL Here ---"
splitTokenKey="--- Paste a New Slug ID Here ---"
dataLifeTimeInDaysKey="20"
# Altenatively, create a channel in teams and use the e-mail ID of the channel for getting test e-mails
testUserList="--- Comma Separated List of Email IDs Here ---"   
testCaseEmailList="--- Comma Separated List of Email IDs Here for test cases ---"
badgesAPIKey="--- Badges API Key Here ---"
riskAPIKey=" ---apikey--- "
dashboardsAPIKey="--- Dashboards API Key Here ---"
apikey="--- x-api-key for test cases ---"
# set it to true for non-production env
enableTestMode=" --- true or false ---" 

if aws ssm put-parameter --region $AWS_REGION --name "${ProjectName}-${TenantName}-${EnvironmentName}-${ComponentName}-policyEngineAPIKey" --type "String" --value "${policyEngineAPIKey}" --tier Standard --overwrite; then
		echo "SSM policyEngineAPIKey created"
fi

if aws ssm put-parameter --region $AWS_REGION --name "${ProjectName}-${TenantName}-${EnvironmentName}-${ComponentName}-serviceNowKey" --type "String" --value "${serviceNowKey}" --tier Standard --overwrite; then
		echo "SSM serviceNowKey created"
fi

if aws ssm put-parameter --region $AWS_REGION --name "${ProjectName}-${TenantName}-${EnvironmentName}-${ComponentName}-serviceNowAPIURL" --type "String" --value "${serviceNowAPIURL}" --tier Standard --overwrite; then
		echo "Upload done"
fi

if aws ssm put-parameter --region $AWS_REGION --name "${ProjectName}-${TenantName}-${EnvironmentName}-${ComponentName}-splitTokenKey" --type "String" --value "${splitTokenKey}" --tier Standard --overwrite; then
		echo "SSM splitTokenKey created"
fi

if aws ssm put-parameter --region $AWS_REGION --name "${ProjectName}-${TenantName}-${EnvironmentName}-${ComponentName}-dataLifeTimeInDaysKey" --type "String" --value "${dataLifeTimeInDaysKey}" --tier Standard --overwrite; then
		echo "SSM dataLifeTimeInDaysKey created"
fi

if aws ssm put-parameter --region $AWS_REGION --name "${ProjectName}-${TenantName}-${EnvironmentName}-${ComponentName}-badgesAPIKey" --type "String" --value "${badgesAPIKey}" --tier Standard --overwrite; then
		echo "SSM badgesAPIKey created"
fi

if aws kms create-alias --region $AWS_REGION --alias-name alias/${ProjectName}-${TenantName}-${EnvironmentName}-${ComponentName}-kmsAlias --target-key-id $(aws kms create-key --query KeyMetadata.Arn --output text); then
		echo "KMS alias created"
fi

if aws ssm put-parameter --region $AWS_REGION --name "${ProjectName}-${TenantName}-${EnvironmentName}-${ComponentName}-testUserList" --type "StringList" --value "${testUserList}" --tier Standard --overwrite; then
 		echo "SSM testUserList created"
fi

if aws ssm put-parameter --region $AWS_REGION --name "${ProjectName}-${TenantName}-${EnvironmentName}-${ComponentName}-riskAPIKey" --type "String" --value "${riskAPIKey}" --tier Standard --overwrite; then
		echo "SSM riskAPIKey created"
fi

if aws ssm put-parameter --region $AWS_REGION --name "${ProjectName}-${TenantName}-${EnvironmentName}-${ComponentName}-enableTestMode" --type "String" --value "${enableTestMode}" --tier Standard --overwrite; then
		echo "SSM enableTestMode created"
fi

if aws ssm put-parameter --region $AWS_REGION --name "${ProjectName}-${TenantName}-${EnvironmentName}-${ComponentName}-testCaseEmailList" --type "StringList" --value "${testCaseEmailList}" --tier Standard --overwrite; then
 		echo "SSM testCaseEmailList created"

if aws ssm put-parameter --region $AWS_REGION --name "${ProjectName}-${TenantName}-${EnvironmentName}-${ComponentName}-dashboardsAPIKey" --type "SecureString" --value "${dashboardsAPIKey}" --tier Standard --overwrite; then
		echo "SSM dashboardsAPIKey created"
fi

if aws ssm put-parameter --region $AWS_REGION --name "${ProjectName}-${TenantName}-${EnvironmentName}-${ComponentName}-apikey" --type "SecureString" --value "${apikey}" --tier Standard --overwrite; then
		echo "SSM apikey created"
fi

for f in utilities/emailTemplates/*.json;
do 
	echo "Processing $f file.."
	sed "s/StackName/${ProjectName}-${TenantName}-${EnvironmentName}-${ComponentName}/g" $f | tee emailTemplateFile.json
	if aws ses create-template --cli-input-json file://emailTemplateFile.json; then
		echo "SES $(basename "$f" .json) Email Template created!!"
	fi
done

for f in utilities/motdFiles/*;
do 
	echo "Uploading $f file.."
	if aws s3 cp $f s3://${ProjectName}-${TenantName}-${EnvironmentName}-distribution-origin/runtime/surveys/standard/ ; then
		echo "$f Uploaded successfully!!"
	fi
done
