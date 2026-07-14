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
      // Fetch only the flag so credentials/tokens never reach the execution history
      projectionExpression: [new tasks.DynamoProjectionExpression().withAttribute('SyncEnabled')],
      resultPath: '$.garminSyncStatus',
    });

    // Check SyncEnabled for Google Sheets in DynamoDB
    const checkGoogleSync = new tasks.DynamoGetItem(this, 'CheckGoogleSync', {
      table: tanitaToGarminTable.usersTable,
      key: {
        PK: tasks.DynamoAttributeValue.fromString(sfn.JsonPath.format('USER#{}', sfn.JsonPath.stringAt('$.userId'))),
        SK: tasks.DynamoAttributeValue.fromString('CRED#GOOGLE')
      },
      projectionExpression: [new tasks.DynamoProjectionExpression().withAttribute('SyncEnabled')],
      resultPath: '$.googleSyncStatus',
    });

    // Define Garmin upload states
    const jsonToFitState = new JsonToFitState(this, 'JsonToFitState', {});
    const garminUploadState = new GarminUploadState(this, 'GarminUploadState', {
      usersTable: tanitaToGarminTable.usersTable
    });

    // Catch failures inside each branch so one service failing doesn't abort
    // the other; the failure is recorded and re-raised after the Parallel
    const garminSyncFailed = new sfn.Pass(this, 'Garmin Sync Failed', {
      parameters: {
        failedBranch: 'garmin',
        'error.$': '$.error',
      },
    });
    const googleSyncFailed = new sfn.Pass(this, 'Google Sync Failed', {
      parameters: {
        failedBranch: 'google',
        'error.$': '$.error',
      },
    });
    checkGarminSync.addCatch(garminSyncFailed, { resultPath: '$.error' });
    jsonToFitState.invocation.addCatch(garminSyncFailed, { resultPath: '$.error' });
    garminUploadState.invocation.addCatch(garminSyncFailed, { resultPath: '$.error' });

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
    checkGoogleSync.addCatch(googleSyncFailed, { resultPath: '$.error' });
    googleSheetsUploadState.invocation.addCatch(googleSyncFailed, { resultPath: '$.error' });

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

    // Fail the execution if any branch recorded a failure, so problems stay
    // visible even though the branches don't abort each other
    const anySyncFailed = new sfn.Choice(this, 'Any Sync Failed?')
      .when(
        sfn.Condition.or(
          sfn.Condition.isPresent('$[0].failedBranch'),
          sfn.Condition.isPresent('$[1].failedBranch')
        ),
        new sfn.Fail(this, 'Sync Failed', {
          error: 'SyncBranchFailed',
          cause: 'One or more sync branches failed; check the branch outputs in the execution history',
        })
      )
      .otherwise(new sfn.Succeed(this, 'All Syncs Done'));

    // Define the main chain of states
    const chain: sfn.Chain = tanitaToJsonState.invocation
      .next(parallelSyncs)
      .next(anySyncFailed);

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
