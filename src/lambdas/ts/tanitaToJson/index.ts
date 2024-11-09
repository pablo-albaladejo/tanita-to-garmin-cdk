import { Context, APIGatewayProxyResult } from 'aws-lambda';
import * as AWS from 'aws-sdk';
import { TanitaService } from './service';

const dynamoDb = new AWS.DynamoDB.DocumentClient();
const usersTable = process.env.USERS_TABLE;

export async function handler(
  event: { 
    userId: string,
    start_date: string,
    end_date: string,
  },
  _context: Context
): Promise<APIGatewayProxyResult> {
  if (!usersTable) {
    throw new Error('Environment variable USERS_TABLE is not defined');
  }
  
  if (!event.userId) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: 'Missing userId in the event input',
      }),
    };
  }

  try {
    // Query DynamoDB for the Tanita credentials
    const result = await dynamoDb.get({
      TableName: usersTable,
      Key: {
        PK: `USER#${event.userId}`,
        SK: 'CRED#TANITA',
      },
    }).promise();

    // Extract Tanita credentials
    const credentials = result.Item;
    if (!credentials || !credentials.User || !credentials.Pass || !credentials.Profile) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: 'Missing Tanita credentials for the specified userId',
        }),
      };
    }
    const { User: tanita_email, Pass: tanita_password, Profile: tanita_user } = credentials;

    // Create TanitaService instance with the retrieved credentials
    const tanitaService = new TanitaService({
      email: tanita_email,
      password: tanita_password,
      user: tanita_user,
    });

    // Retrieve measurements using the TanitaService
    const measurements = await tanitaService.getMeasurementsByDateRage(
      event.start_date,
      event.end_date
    );

    return {
      statusCode: 200,
      body: JSON.stringify(measurements),
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal Server error';
    console.error('Error:', errorMessage);

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: errorMessage,
      }),
    };
  }
}