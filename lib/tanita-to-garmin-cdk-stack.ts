import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

import * as sfn from 'aws-cdk-lib/aws-stepfunctions';
import { TriggerState } from './states/trigger';
import { TanitaToJsonState } from './states/tanitaToJson';
import { JsonToFitState } from './states/jsonToFit';
import { GarminUploadState } from './states/garminUpload';
import { TanitaToGarminTable } from './tables/tanitaToGarmin';

export class TanitaToGarminCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const tanitaToGarminTable = new TanitaToGarminTable(this, 'TanitaToGarminTable');

    const tanitaToJsonState = new TanitaToJsonState(this, 'TanitaToJsonState', {
      usersTable: tanitaToGarminTable.usersTable
    });
    const jsonToFitState = new JsonToFitState(this, 'JsonToFitState', { });
    const garminUploadState = new GarminUploadState(this, 'GarminUploadState', {
      usersTable: tanitaToGarminTable.usersTable
    });

    const chain: sfn.Chain = tanitaToJsonState.invocation
      .next(jsonToFitState.invocation)
      .next(garminUploadState.invocation);

    const stateMachine = new sfn.StateMachine(this, 'TanitaToGarminStateMachine', {
      definition: chain,
      timeout: cdk.Duration.minutes(5),
    });

    new TriggerState(this, 'TriggerState', {
      stateMachine: stateMachine,
      usersTable: tanitaToGarminTable.usersTable
    })

  }
}
