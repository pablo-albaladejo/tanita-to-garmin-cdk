import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as customResources from 'aws-cdk-lib/custom-resources';

import { Construct } from "constructs";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";

export class TanitaToGarminTable extends Construct {
    public readonly usersTable: dynamodb.Table;
    public readonly seedDataLambda: NodejsFunction;

    constructor(scope: Construct, id: string) {
        super(scope, id);

        this.usersTable = new dynamodb.Table(this, `${id}UsersTable`, {
            partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
        });
        this.usersTable.addGlobalSecondaryIndex({
            indexName: "UsernameIndex",
            partitionKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
            projectionType: dynamodb.ProjectionType.ALL,
        });


        this.seedDataLambda = new NodejsFunction(
            scope,
            `${id}SeedDataLambda`,
            {
                handler: 'handler',
                entry: 'src/lambdas/ts/seedData/index.ts',
                runtime: lambda.Runtime.NODEJS_20_X,
                environment: {
                    USERS_TABLE: this.usersTable.tableName,
                },
            }
        );
        this.usersTable.grantWriteData(this.seedDataLambda);

        const seedDataTrigger = new customResources.Provider(this, `${id}SeedDataTrigger`, {
            onEventHandler: this.seedDataLambda,
        });

        new cdk.CustomResource(this, `${id}SeedDataResource`, {
            serviceToken: seedDataTrigger.serviceToken,
        });
    }
}