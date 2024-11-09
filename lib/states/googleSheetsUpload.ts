import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as tasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as s3 from 'aws-cdk-lib/aws-s3';

import { Construct } from 'constructs';

interface IGoogleSheetsUploadStateProps {
    usersTable: dynamodb.Table;
}

export class GoogleSheetsUploadState extends Construct {
    public readonly lambda: lambda.Function;
    public readonly invocation: tasks.LambdaInvoke;

    constructor(scope: Construct, id: string, props: IGoogleSheetsUploadStateProps) {
        super(scope, id);

        const credentialsBucket = new s3.Bucket(this, `${id}GoogleCredentialsBucket`, {
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
            encryption: s3.BucketEncryption.S3_MANAGED,
        });

        this.lambda = new NodejsFunction(
            scope,
            `${id}GoogleSheetsUploadNodejsFunction`,
            {
                handler: 'handler',
                entry: 'src/lambdas/ts/googleSheetsUpload/index.ts',
                runtime: lambda.Runtime.NODEJS_20_X,
                timeout: cdk.Duration.seconds(300),
                environment: {
                    USERS_TABLE: props.usersTable.tableName,
                    BUCKET_NAME: credentialsBucket.bucketName,
                    CREDENTIALS_FILE_PATH: 'credentials/tanita.json',
                },
            }
        );
        credentialsBucket.grantRead(this.lambda);
        props.usersTable.grantReadData(this.lambda);

        this.invocation = new tasks.LambdaInvoke(this, `${id}GoogleSheetsUploadInvocation`, {
            lambdaFunction: this.lambda,
            payload: sfn.TaskInput.fromObject({
                "tanitaData.$": "$.measurements.data"
            }),
            resultPath: '$.googleUploadResult',
        });

    }
}