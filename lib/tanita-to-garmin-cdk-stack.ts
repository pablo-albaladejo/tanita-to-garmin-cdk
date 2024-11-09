import * as cdk from 'aws-cdk-lib';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';
import * as tasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import { Construct } from 'constructs';

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
    const jsonToFitState = new JsonToFitState(this, 'JsonToFitState', {});
    const garminUploadState = new GarminUploadState(this, 'GarminUploadState', {
      usersTable: tanitaToGarminTable.usersTable
    });

    // Check SyncEnabled for Garmin
    const checkGarminSync = new tasks.DynamoGetItem(this, 'CheckGarminSync', {
      table: tanitaToGarminTable.usersTable,
      key: {
        PK: tasks.DynamoAttributeValue.fromString(sfn.JsonPath.format('USER#{}', sfn.JsonPath.stringAt('$.userId'))),
        SK: tasks.DynamoAttributeValue.fromString('CRED#GARMIN')
      },
      resultPath: '$.garminSyncStatus', // Store result to check SyncEnabled
    });
    
    // Choice states to determine the sync path
    const garminChoice = new sfn.Choice(this, 'Is Garmin Sync Enabled?')
    .when(
      sfn.Condition.booleanEquals('$.garminSyncStatus.Item.SyncEnabled.BOOL', true),
      jsonToFitState.invocation.next(garminUploadState.invocation)
    )
    .otherwise(new sfn.Pass(this, 'Skip Garmin Sync'));
  

    // Define the chain of states
    const chain: sfn.Chain = tanitaToJsonState.invocation
      .next(checkGarminSync)  // Check if Garmin sync is enabled
      .next(garminChoice);    // Add choice to decide the path

    const stateMachine = new sfn.StateMachine(this, 'TanitaToGarminStateMachine', {
      definition: chain,
      timeout: cdk.Duration.minutes(5),
    });

    new TriggerState(this, 'TriggerState', {
      stateMachine: stateMachine,
      usersTable: tanitaToGarminTable.usersTable
    });
  }
}
