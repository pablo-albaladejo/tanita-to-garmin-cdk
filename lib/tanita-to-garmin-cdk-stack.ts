import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import fitToolkit from './fitToolkit';
import tanitaToCsv from './tanitaToJson';

export class TanitaToGarminCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const tanitaToCsvFunction = tanitaToCsv(this);

    const fitToolkitFunction = fitToolkit(this);

  }
};