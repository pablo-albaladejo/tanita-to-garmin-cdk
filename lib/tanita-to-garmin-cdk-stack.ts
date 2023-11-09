import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import fitToolkit from './functions/fitToolkit';
import tanitaToJson from './functions/tanitaToJson';
import garminUpload from './functions/garminUpload';
import initialParamsState from './functions/initialParamsState';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';
import * as tasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';

export class TanitaToGarminCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const initialParamsStateFunction = initialParamsState(this);
    const initialParamsStateInvocation = new tasks.LambdaInvoke(
      this,
      'InitialParamsStateInvocation',
      {
        lambdaFunction: initialParamsStateFunction,
        resultSelector: {
          initialParams: sfn.JsonPath.stringToJson(
            sfn.JsonPath.stringAt('$.Payload.body')
          ),
        },
      }
    );

    const tanitaToCsvFunction = tanitaToJson(this);
    const tanitaToCsvInvocation = new tasks.LambdaInvoke(
      this,
      'TanitaToCsvInvocation',
      {
        lambdaFunction: tanitaToCsvFunction,
        payload: sfn.TaskInput.fromObject({
          queryStringParameters: {
            start_date: sfn.JsonPath.stringAt('$.initialParams.startDate'),
            end_date: sfn.JsonPath.stringAt('$.initialParams.endDate'),
            tanita_email: sfn.JsonPath.stringAt('$.initialParams.tanitaEmail'),
            tanita_password: sfn.JsonPath.stringAt(
              '$.initialParams.tanitaPassword'
            ),
            tanita_user: sfn.JsonPath.stringAt('$.initialParams.tanitaUser'),
          },
        }),
        resultSelector: {
          data: sfn.JsonPath.stringAt('$.Payload.body'),
        },
        resultPath: '$.measurements',
      }
    );

    const fitToolkitFunction = fitToolkit(this);
    const fitToolkitInvocation = new tasks.LambdaInvoke(
      this,
      'FitToolkitInvocation',
      {
        lambdaFunction: fitToolkitFunction,
        payload: sfn.TaskInput.fromObject({
          body: sfn.JsonPath.stringAt('$.measurements.data'),
        }),
        resultSelector: {
          url: sfn.JsonPath.stringAt('$.Payload.body'),
        },
        resultPath: '$.file',
      }
    );

    const garminUploadFunction = garminUpload(this);
    const garminUploadInvocation = new tasks.LambdaInvoke(
      this,
      'GarminUploadInvocation',
      {
        lambdaFunction: garminUploadFunction,
        payload: sfn.TaskInput.fromObject({
          body: {
            username: sfn.JsonPath.stringAt('$.initialParams.garminUser'),
            password: sfn.JsonPath.stringAt('$.initialParams.garminPassword'),
            fileUrl: sfn.JsonPath.stringAt('$.file.url'),
          },
        }),
      }
    );

    const definition = initialParamsStateInvocation
      .next(tanitaToCsvInvocation)
      .next(fitToolkitInvocation)
      .next(garminUploadInvocation);

    const stateMachine = new sfn.StateMachine(
      this,
      'TanitaToGarminStateMachine',
      {
        definition,
        timeout: cdk.Duration.minutes(5),
      }
    );

    const everyMidNightRule = new events.Rule(this, 'EveryMidNightRule', {
      schedule: events.Schedule.cron({
        minute: '0',
        hour: '0',
        day: '*',
        month: '*',
        year: '*',
      }),
    });
    everyMidNightRule.addTarget(new targets.SfnStateMachine(stateMachine));
  }
}
