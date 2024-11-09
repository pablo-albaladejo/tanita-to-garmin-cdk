import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as tasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';

import { Construct } from 'constructs';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';

interface IGarminUploadStateProps {
  usersTable: dynamodb.Table;
}

export class GarminUploadState extends Construct {
  public readonly lambda: lambda.Function;
  public readonly invocation: tasks.LambdaInvoke;

  constructor(scope: Construct, id: string, props: IGarminUploadStateProps) {
    super(scope, id);

    this.lambda = new NodejsFunction(
      scope,
      `${id}GarminUploadNodejsFunction`,
      {
        handler: 'handler',
        entry: 'src/lambdas/ts/garminUpload/index.ts',
        runtime: lambda.Runtime.NODEJS_20_X,
        environment: {
          USERS_TABLE: props.usersTable.tableName,
        },
        timeout: cdk.Duration.seconds(300),
      }
    );
    props.usersTable.grantReadData(this.lambda);

    this.invocation = new tasks.LambdaInvoke(this, `${id}GarminUploadInvocation`, {
      lambdaFunction: this.lambda,
      payload: sfn.TaskInput.fromObject({
        userId: sfn.JsonPath.stringAt('$.userId'),
        base64: sfn.JsonPath.stringAt('$.file.base64'),
      }),
    });
  }
};
