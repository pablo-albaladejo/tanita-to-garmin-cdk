import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import * as TanitaToGarminCdk from '../lib/tanita-to-garmin-cdk-stack';

test('Toolkit Lambda Fucntion Created', () => {
  const app = new cdk.App();

  const stack = new TanitaToGarminCdk.TanitaToGarminCdkStack(
    app,
    'MyTestStack'
  );

  const template = Template.fromStack(stack);
  template.hasResourceProperties('AWS::Lambda::Function', {
    Runtime: 'java11',
  });
  template.hasResourceProperties('AWS::Lambda::Url', {
    AuthType: 'NONE',
  });
});
