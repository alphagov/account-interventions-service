#!/bin/bash

set -u

# Input parameters
AWS_ACCOUNT=di-account-interventions-integration-admin
PIPELINE_VERSION=v2.67.1

export AWS_ACCOUNT=$AWS_ACCOUNT

./provisioner.sh $AWS_ACCOUNT ais-core-pipeline sam-deploy-pipeline $PIPELINE_VERSION || exit 1

./provisioner.sh $AWS_ACCOUNT ais-main-pipeline sam-deploy-pipeline $PIPELINE_VERSION || exit 1

./provisioner.sh $AWS_ACCOUNT ais-alarm-pipeline sam-deploy-pipeline $PIPELINE_VERSION || exit 1
