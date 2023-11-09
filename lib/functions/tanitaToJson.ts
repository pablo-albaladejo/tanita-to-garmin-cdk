import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';

export default (scope: Construct) => {
  const tanitaToCsvFunction = new NodejsFunction(
    scope,
    'TanitaToJsonNodejsFunction',
    {
      handler: 'handler',
      entry: 'src/lambdas/ts/tanitaToJson/index.ts',
      runtime: lambda.Runtime.NODEJS_18_X,
      bundling: {
        minify: true,
      },
      timeout: cdk.Duration.seconds(300),
      logRetention: cdk.aws_logs.RetentionDays.ONE_MONTH,
    }
  );

  const tanitaToCsvFunctionUrl = tanitaToCsvFunction.addFunctionUrl({
    authType: lambda.FunctionUrlAuthType.NONE,
  });
  new cdk.CfnOutput(scope, 'TanitaToJsonFunctionUrl', {
    value: tanitaToCsvFunctionUrl.url,
    description: 'Tanita To Json Function URL',
  });

  return tanitaToCsvFunction;
};
