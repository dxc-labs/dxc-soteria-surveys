#!/bin/bash

echo '==== Load data started ==='

usage() {
    echo 2>&1 "Usage: $0 -a API Prefix (Examples: api-acme. , api-jdoe.) -d User Domain Name E.g., example.com";
    exit 1;
}

while getopts 'a:d:' arg; do
    case "$arg" in
        a)
            export Api="$OPTARG"
            ;;
        d)
            export UserDomainName="$OPTARG"
            ;;
        [?])
            usage
            ;;
	esac
done
shift $((OPTIND-1))

if [ -z "${Api}" ];then
    export Api="api."
fi

if [ -z "${UserDomainName}" ];then
export UserDomainName="example.com"
fi

error_flag=0

echo "UserDomainName="${UserDomainName}
echo "Api="${Api}

if newman run 'LoadForm.postman_collection.json' --insecure --global-var "UserDomainName=${UserDomainName}" --global-var "Api=${Api}"
    then
        echo Load data succeeded.
    else
        echo Load data failed.
        error_flag=1
fi

if [ $error_flag -ne 0 ]; then exit 1; else echo "Load data passed successfully"; fi
echo '==== Load data done ==='
