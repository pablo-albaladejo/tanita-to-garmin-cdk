import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import fitToolkit from './fitToolkit';

export class TanitaToGarminCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const fitToolkitFunction = fitToolkit(this);
  }
}
