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
  public readonly tanitaToJsonLambda: lambda.Function;
  public readonly invocation: tasks.LambdaInvoke;

  constructor(scope: Construct, id: string, props: ITanitaToJsonStateProps) {
    super(scope, id);

    // Lambda for the main TanitaToJson logic
    this.tanitaToJsonLambda = new NodejsFunction(
      scope,
      `${id}TanitaToJsonNodejsFunction`,
      {
        handler: 'handler',
        entry: 'src/lambdas/ts/tanitaToJson/index.ts',
        runtime: lambda.Runtime.NODEJS_20_X,
        environment: {
          USERS_TABLE: props.usersTable.tableName,
        },
        timeout: cdk.Duration.seconds(300), // Ensure the Lambda has sufficient time to process
      }
    );
    props.usersTable.grantReadData(this.tanitaToJsonLambda);


    this.invocation = new tasks.LambdaInvoke(this, `${id}TanitaToJsonInvocation`, {
      lambdaFunction: this.tanitaToJsonLambda,
      payload: sfn.TaskInput.fromObject({
        userId: sfn.JsonPath.stringAt('$.userId'), // Pass userId as input
        start_date: sfn.JsonPath.stringAt('$.start_date'), // Pass start date
        end_date: sfn.JsonPath.stringAt('$.end_date'), // Pass end date
      }),
      resultSelector: {
        data: sfn.JsonPath.stringAt('$.Payload.body'), // Extract data from Lambda result
      },
      resultPath: '$.measurements', // Store result in $.measurements
    });

  }
}
