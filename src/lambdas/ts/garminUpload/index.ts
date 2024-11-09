import { GarminConnect } from 'garmin-connect';
import {
  APIGatewayProxyResult,
  Context,
} from 'aws-lambda';
import * as AWS from 'aws-sdk';
import path = require('path');
import * as fs from 'fs';

const dynamoDb = new AWS.DynamoDB.DocumentClient();
const usersTable = process.env.USERS_TABLE;

const getGarminCredentials = async (userId: string, tableName: string) => {
  const params = {
    TableName: tableName,
    Key: {
      PK: `USER#${userId}`,
      SK: 'CRED#GARMIN',
    },
  };

  const result = await dynamoDb.get(params).promise();
  const credentials = result.Item;

  if (!credentials || !credentials.User || !credentials.Pass) {
    throw new Error('Missing Garmin credentials for the specified userId');
  }

  return {
    username: credentials.User,
    password: credentials.Pass,
  };
};

export async function handler(
  event: {
    userId: string;
    base64: string;
  },
  _context: Context
): Promise<APIGatewayProxyResult> {
  if (!usersTable) {
    throw new Error('Environment variable USERS_TABLE is not defined');
  }

  const { username, password } = await getGarminCredentials(event.userId, usersTable);

  const GCClient = new GarminConnect({
    username,
    password,
  });
  await GCClient.login();

  // Decode base64 file and save it temporarily
  const filePath = path.join('/tmp', `activity-${event.userId}.fit`);
  const fileBuffer = Buffer.from(event.base64, 'base64');
  fs.writeFileSync(filePath, fileBuffer);

  // Upload the file to Garmin Connect
  try {
    const upload = await GCClient.uploadActivity(filePath, 'fit');
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'File uploaded successfully',
        upload,
      }),
    };
  } catch (error) {
    console.error('Error uploading to Garmin:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Failed to upload file to Garmin',
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  } finally {
    // Clean up the temporary file
    fs.unlinkSync(filePath);
  }
}
