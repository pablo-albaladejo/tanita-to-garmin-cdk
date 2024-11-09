import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as tasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';

import { Construct } from 'constructs';

interface IJsonToFitStateProps {

}

export class JsonToFitState extends Construct {
  public readonly invocation: tasks.LambdaInvoke;

  constructor(scope: Construct, id: string, props: IJsonToFitStateProps) {
    super(scope, id);
  
    const fitToolkitFunction = new lambda.Function(scope, `${id}FitToolkitFunction`, {
      runtime: lambda.Runtime.JAVA_11,
      handler: 'fit.toolkit.handler.WeightHandler::handleRequest',
      code: lambda.Code.fromAsset(
        'src/lambdas/java/fitToolkit/target/fit-toolkit-latest.jar'
      ),
      timeout: cdk.Duration.seconds(300),
      memorySize: 512,
    });

    this.invocation = new tasks.LambdaInvoke(this, `${id}FitToolkitInvocation`, {
      lambdaFunction: fitToolkitFunction,
      payload: sfn.TaskInput.fromObject({
        body: sfn.JsonPath.stringAt('$.measurements.data'),
      }),
      resultSelector: {
        base64: sfn.JsonPath.stringAt('$.Payload.body'),
      },
      resultPath: '$.file',
    });
  }
}