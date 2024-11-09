import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import * as AWS from 'aws-sdk';

const dynamoDb = new AWS.DynamoDB.DocumentClient();
const stepFunctions = new AWS.StepFunctions();

const usersTable = process.env.USERS_TABLE;
const stateMachineArn = process.env.STATE_MACHINE_ARN;

export async function handler(
    _event: APIGatewayProxyEvent,
    _context: Context
): Promise<APIGatewayProxyResult> {

    if (!usersTable) {
        return {
            statusCode: 400,
            body: JSON.stringify({
                message: 'Missing table name',
            }),
        };
    }

    if (!stateMachineArn) {
        return {
            statusCode: 400,
            body: JSON.stringify({
                message: 'Missing state machine ARN',
            }),
        };
    }

    try {
        // Query to get users with SK = #INFO
        const users = await dynamoDb.query({
            TableName: usersTable,
            IndexName: "UsernameIndex",
            KeyConditionExpression: 'SK = :info',
            ExpressionAttributeValues: { ':info': '#INFO' },
        }).promise();

        // Extract UUIDs from PK
        const userIds = users.Items?.map(item => {
            const uuid = item.PK.split('#')[1];
            return uuid;
        }) || [];


        // Get start and end dates
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        // Start state machine execution for each user
        const promises = userIds.map(async (userId) => {
            const params = {
                stateMachineArn,
                input: JSON.stringify({ userId, start_date: yesterday, end_date: today }),
            };
            return stepFunctions.startExecution(params).promise();
        });

        await Promise.all(promises);

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'State machine execution started for all users',
            }),
        };
    } catch (error) {
        console.error("Error starting state machine executions:", error);
        // Check if the error is of type Error
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: 'An error occurred while starting state machine executions',
                error: errorMessage,
            }),
        };
    }
}
