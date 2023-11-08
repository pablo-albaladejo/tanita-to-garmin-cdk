import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import fitToolkit from './fitToolkit';
import tanitaToJson from './tanitaToJson';
import garminUpload from './garminUpload';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';
import * as tasks from 'aws-cdk-lib/aws-stepfunctions-tasks';

export class TanitaToGarminCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const tanitaToCsvFunction = tanitaToJson(this);
    const tanitaToCsvInvocation = new tasks.LambdaInvoke(
      this,
      'TanitaToCsvInvocation',
      {
        lambdaFunction: tanitaToCsvFunction,
        inputPath: '$',
        outputPath: '$',
      }
    );

    const fitToolkitFunction = fitToolkit(this);
    const fitToolkitInvocation = new tasks.LambdaInvoke(
      this,
      'FitToolkitInvocation',
      {
        lambdaFunction: fitToolkitFunction,
        inputPath: '$',
        outputPath: '$',
      }
    );

    const garminUploadFunction = garminUpload(this);
    const garminUploadInvocation = new tasks.LambdaInvoke(
      this,
      'GarminUploadInvocation',
      {
        lambdaFunction: garminUploadFunction,
        inputPath: '$',
        outputPath: '$',
      }
    );

    const definition = tanitaToCsvInvocation
      .next(fitToolkitInvocation)
      .next(garminUploadInvocation);

    new sfn.StateMachine(
      this,
      'TanitaToGarminStateMachine',
      {
        definition,
        timeout: cdk.Duration.minutes(5),
      }
    );
  }
}
