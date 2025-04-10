#!/bin/bash

export AWS_ACCESS_KEY_ID=AKIAZYY5G4GYP4FAV2QW
export AWS_SECRET_ACCESS_KEY=$1
export AWS_REGION=us-east-1

export NODE_ENV=migration
export S3_BUCKET_NAME=expertize-bucket-migration

echo "Using AWS credentials:"
echo "AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID"
echo "AWS_REGION=$AWS_REGION"
echo "NODE_ENV=$NODE_ENV"
echo "S3_BUCKET_NAME=$S3_BUCKET_NAME"

serverless deploy --stage migration --verbose 