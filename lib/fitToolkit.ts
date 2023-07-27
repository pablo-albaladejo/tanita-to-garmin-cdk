import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';

export default (scope: Construct): lambda.Function => {
  const fitToolkitFunction = new lambda.Function(scope, 'FitToolkitFunction', {
    runtime: lambda.Runtime.JAVA_11,
    handler: 'fit.toolkit.handler.WeightHandler::handleRequest',
    code: lambda.Code.fromAsset(
      'src/lambdas/java/fitToolkit/target/fit-toolkit-latest.jar'
    ),
    timeout: cdk.Duration.seconds(60),
  });
  const fitToolkitFunctionUrl = fitToolkitFunction.addFunctionUrl({
    authType: lambda.FunctionUrlAuthType.NONE,
  });
  new cdk.CfnOutput(scope, 'FitToolkitFunctionUrl', {
    value: fitToolkitFunctionUrl.url,
    description: 'Fit Toolkit Function URL',
  });

  return fitToolkitFunction;
};
