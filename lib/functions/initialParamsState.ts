import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';

import { Construct } from 'constructs';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';

export default (scope: Construct) => {
  const initialParamsStateFunction = new NodejsFunction(
    scope,
    'InitialParamsStateNodejsFunction',
    {
      handler: 'handler',
      entry: 'src/lambdas/ts/initialParamsState/index.ts',
      runtime: lambda.Runtime.NODEJS_18_X,
      bundling: {
        minify: true,
      },
      timeout: cdk.Duration.seconds(300),
      logRetention: cdk.aws_logs.RetentionDays.ONE_MONTH,
    }
  );
  
  //https://github.com/aws/aws-cdk/issues/1754#issuecomment-834800160
  const { accountId, region } = new cdk.ScopedAws(scope);

  initialParamsStateFunction.addToRolePolicy(
    new iam.PolicyStatement({
      sid: 'InitialParamsStateAllowSsmGetParameter',
      effect: iam.Effect.ALLOW,
      resources: [
        `arn:aws:ssm:${region}:${accountId}:parameter/tanitatogarming/*`,
      ],
      actions: ['ssm:GetParameter'],
    })
  );

  return initialParamsStateFunction;
};
