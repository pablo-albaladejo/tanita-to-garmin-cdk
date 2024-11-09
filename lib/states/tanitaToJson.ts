import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';
import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as tasks from 'aws-cdk-lib/aws-stepfunctions-tasks';

import { Construct } from 'constructs';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';

interface ITanitaToJsonStateProps {
  usersTable: dynamodb.Table;
}

export class TanitaToJsonState extends Construct {
  public readonly lambda: lambda.Function;
  public readonly invocation: tasks.LambdaInvoke;

  constructor(scope: Construct, id: string, props: ITanitaToJsonStateProps) {
    super(scope, id);

    this.lambda = new NodejsFunction(
      scope,
      `${id}TanitaToJsonNodejsFunction`,
      {
        handler: 'handler',
        entry: 'src/lambdas/ts/tanitaToJson/index.ts',
        runtime: lambda.Runtime.NODEJS_20_X,
        environment: {
          USERS_TABLE: props.usersTable.tableName,
        },
        timeout: cdk.Duration.seconds(300),
      }
    );
    props.usersTable.grantReadData(this.lambda);

    this.invocation = new tasks.LambdaInvoke(this, `${id}TanitaToJsonInvocation`, {
      lambdaFunction: this.lambda,
      payload: sfn.TaskInput.fromObject({
        userId: sfn.JsonPath.stringAt('$.userId'),
        start_date: sfn.JsonPath.stringAt('$.start_date'),
        end_date: sfn.JsonPath.stringAt('$.end_date'),
      }),
      resultSelector: {
        data: sfn.JsonPath.stringAt('$.Payload.body'),
      },
      resultPath: '$.measurements',
    });
  }
}