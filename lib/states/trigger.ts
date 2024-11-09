import * as sfn from 'aws-cdk-lib/aws-stepfunctions';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';

interface ITriggerStateProps {
    stateMachine: sfn.StateMachine;
    usersTable: dynamodb.Table;
}

export class TriggerState extends Construct {
    public readonly lambda: lambda.Function;

    constructor(scope: Construct, id: string, props: ITriggerStateProps) {
        super(scope, id);
    
        this.lambda = new NodejsFunction(this, `${id}Lambda`, {
            runtime: lambda.Runtime.NODEJS_20_X,
            handler: 'handler',
            entry: 'src/lambdas/ts/trigger/index.ts',
            environment: {
              STATE_MACHINE_ARN: props.stateMachine.stateMachineArn,
              USERS_TABLE: props.usersTable.tableName,
            },
          });
        
        props.usersTable.grantReadData(this.lambda);
        props.stateMachine.grantStartExecution(this.lambda);

        const everyMidNightRule = new events.Rule(this, 'EveryMidNightRule', {
          schedule: events.Schedule.cron({
            minute: '0',
            hour: '0',
            day: '*',
            month: '*',
            year: '*',
          }),
        });
        everyMidNightRule.addTarget(new targets.LambdaFunction(this.lambda));
    }
}
