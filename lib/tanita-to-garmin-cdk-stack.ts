import * as cdk from 'aws-cdk-lib';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';
import * as tasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import { Construct } from 'constructs';

import { TriggerState } from './states/trigger';
import { TanitaToJsonState } from './states/tanitaToJson';
import { JsonToFitState } from './states/jsonToFit';
import { GarminUploadState } from './states/garminUpload';
import { TanitaToGarminTable } from './tables/tanitaToGarmin';
import { GoogleSheetsUploadState } from './states/googleSheetsUpload';

export class TanitaToGarminCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const tanitaToGarminTable = new TanitaToGarminTable(this, 'TanitaToGarminTable');

    // Convert Tanita data to JSON
    const tanitaToJsonState = new TanitaToJsonState(this, 'TanitaToJsonState', {
      usersTable: tanitaToGarminTable.usersTable
    });

    // Check SyncEnabled for Garmin in DynamoDB
    const checkGarminSync = new tasks.DynamoGetItem(this, 'CheckGarminSync', {
      table: tanitaToGarminTable.usersTable,
      key: {
        PK: tasks.DynamoAttributeValue.fromString(sfn.JsonPath.format('USER#{}', sfn.JsonPath.stringAt('$.userId'))),
        SK: tasks.DynamoAttributeValue.fromString('CRED#GARMIN')
      },
      resultPath: '$.garminSyncStatus',
    });

    // Check SyncEnabled for Google Sheets in DynamoDB
    const checkGoogleSync = new tasks.DynamoGetItem(this, 'CheckGoogleSync', {
      table: tanitaToGarminTable.usersTable,
      key: {
        PK: tasks.DynamoAttributeValue.fromString(sfn.JsonPath.format('USER#{}', sfn.JsonPath.stringAt('$.userId'))),
        SK: tasks.DynamoAttributeValue.fromString('CRED#GOOGLE')
      },
      resultPath: '$.googleSyncStatus',
    });

    // Define Garmin upload states
    const jsonToFitState = new JsonToFitState(this, 'JsonToFitState', {});
    const garminUploadState = new GarminUploadState(this, 'GarminUploadState', {
      usersTable: tanitaToGarminTable.usersTable
    });
    // Path for Garmin sync based on SyncEnabled status
    const garminSyncPath = checkGarminSync.next(
      new sfn.Choice(this, 'Is Garmin Sync Enabled?')
        .when(
          sfn.Condition.and(
            sfn.Condition.isPresent('$.garminSyncStatus.Item.SyncEnabled'),
            sfn.Condition.booleanEquals('$.garminSyncStatus.Item.SyncEnabled.BOOL', true)
          ),
          jsonToFitState.invocation.next(garminUploadState.invocation)
        )    
        .otherwise(new sfn.Pass(this, 'Skip Garmin Sync')) // Define a fallback path if SyncEnabled is false

    );

    // Path for Google Sheets sync based on SyncEnabled status
    const googleSheetsUploadState =  new GoogleSheetsUploadState(this, 'GoogleSheetsUploadState', {
      usersTable: tanitaToGarminTable.usersTable
    });
    const googleSyncPath = checkGoogleSync.next(
      new sfn.Choice(this, 'Is Google Sheets Sync Enabled?')
        .when(
          sfn.Condition.and(
            sfn.Condition.isPresent('$.googleSyncStatus.Item.SyncEnabled'),
            sfn.Condition.booleanEquals('$.googleSyncStatus.Item.SyncEnabled.BOOL', true)
          ),
          googleSheetsUploadState.invocation
        )    
        .otherwise(new sfn.Pass(this, 'Skip Google Sync')) // Define a fallback path if SyncEnabled is false
    );

    // Parallel state to execute both Garmin and Google Sheets syncs independently
    const parallelSyncs = new sfn.Parallel(this, 'Parallel Syncs')
      .branch(garminSyncPath)
      .branch(googleSyncPath);

    // Define the main chain of states
    const chain: sfn.Chain = tanitaToJsonState.invocation.next(parallelSyncs);

    // Create the state machine
    const stateMachine = new sfn.StateMachine(this, 'TanitaToGarminStateMachine', {
      definition: chain,
    });

    // Trigger state to start the state machine
    new TriggerState(this, 'TriggerState', {
      stateMachine: stateMachine,
      usersTable: tanitaToGarminTable.usersTable
    });
  }
}
