import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import fitToolkit from './fitToolkit';
import tanitaToJson from './tanitaToJson';
import garminUpload from './garminUpload';


export class TanitaToGarminCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const tanitaToCsvFunction = tanitaToJson(this);

    const fitToolkitFunction = fitToolkit(this);

    const garminUploadFunction = garminUpload(this);
  }
};