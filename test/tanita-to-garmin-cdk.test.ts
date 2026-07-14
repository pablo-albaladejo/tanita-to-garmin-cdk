import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import * as fs from 'fs';
import * as path from 'path';
import * as TanitaToGarminCdk from '../lib/tanita-to-garmin-cdk-stack';

// The Java FIT lambda asset is built by cdk_hooks.sh (Maven); provide a
// placeholder so the stack can synthesize in environments without Maven.
const jarPath = path.join(
  __dirname,
  '../src/lambdas/java/fitToolkit/target/fit-toolkit-latest.jar'
);

describe('TanitaToGarminCdkStack', () => {
  let template: Template;

  beforeAll(() => {
    if (!fs.existsSync(jarPath)) {
      fs.mkdirSync(path.dirname(jarPath), { recursive: true });
      fs.writeFileSync(jarPath, '');
    }

    const app = new cdk.App();
    const stack = new TanitaToGarminCdk.TanitaToGarminCdkStack(
      app,
      'MyTestStack'
    );
    template = Template.fromStack(stack);
  }, 120_000);

  test('creates the FIT toolkit Java lambda', () => {
    template.hasResourceProperties('AWS::Lambda::Function', {
      Runtime: 'java11',
      Handler: 'fit.toolkit.handler.WeightHandler::handleRequest',
    });
  });

  test('creates the state machine', () => {
    template.resourceCountIs('AWS::StepFunctions::StateMachine', 1);
  });

  test('creates the users table and retains it on stack deletion', () => {
    template.hasResource('AWS::DynamoDB::Table', {
      Properties: {
        KeySchema: [
          { AttributeName: 'PK', KeyType: 'HASH' },
          { AttributeName: 'SK', KeyType: 'RANGE' },
        ],
      },
      DeletionPolicy: 'Retain',
    });
  });

  test('schedules the nightly trigger', () => {
    template.hasResourceProperties('AWS::Events::Rule', {
      ScheduleExpression: 'cron(0 0 * * ? *)',
    });
  });
});
