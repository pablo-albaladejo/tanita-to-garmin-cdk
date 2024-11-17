import { Context, APIGatewayProxyResult } from 'aws-lambda';
import * as AWS from 'aws-sdk';
import { fetchAndTransformMeasurements } from './tanita';

const dynamoDb = new AWS.DynamoDB.DocumentClient();
const usersTable = process.env.USERS_TABLE;


const getTimestamps = (start_date: string, end_date: string) => {
  const startDate = new Date(start_date);
  const endDate = new Date(end_date);

  const startOfDay = new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate(), 0, 0, 0));
  const endOfDay = new Date(Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth(), endDate.getUTCDate(), 23, 59, 59));

  return {
    timestamp: Math.floor(startOfDay.getTime() / 1000),
    timestampUpTo: Math.floor(endOfDay.getTime() / 1000),
  };
};


export async function handler(
  event: {
    userId: string,
    start_date: string,
    end_date: string,
  },
  _context: Context
): Promise<APIGatewayProxyResult> {
  const { userId, start_date, end_date } = event;
  console.log('Input:', { userId, start_date, end_date });

  if (!usersTable) {
    throw new Error('Environment variable USERS_TABLE is not defined');
  }

  if (!userId) {
    throw new Error('Missing userId in the event input');
  }

  try {
    // Query DynamoDB for the Tanita credentials
    const result = await dynamoDb.get({
      TableName: usersTable,
      Key: {
        PK: `USER#${userId}`,
        SK: 'CRED#TANITA',
      },
    }).promise();

    // Extract Tanita credentials
    const credentials = result.Item;
    if (!credentials || !credentials.User || !credentials.Pass || !credentials.Profile) {
      throw new Error('Missing Tanita credentials for the specified userId');
    }
    const { User: email, Pass: password, Profile: tanita_user } = credentials;
    console.log('Tanita credentials:', { email, password, tanita_user });

    const { timestamp, timestampUpTo } = getTimestamps(start_date, end_date);
    console.log('Timestamps:', { timestamp, timestampUpTo });

    const measurements = await fetchAndTransformMeasurements(email, password, parseInt(tanita_user), timestamp, timestampUpTo);
    console.log('Measurements:', measurements);

    return {
      statusCode: 200,
      body: JSON.stringify(measurements),
    };
  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : 'Internal Server error';
    console.error('Error:', errorMessage);

    throw new Error(`Failed to process request due to an unexpected error: ${errorMessage}`);
  }
}