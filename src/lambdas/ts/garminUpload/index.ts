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

// Garmin rate-limits password logins from cloud IPs (429), so this lambda only
// authenticates with OAuth tokens seeded by scripts/garminTokenLogin.ts.
const getGarminTokens = async (userId: string, tableName: string) => {
  const params = {
    TableName: tableName,
    Key: {
      PK: `USER#${userId}`,
      SK: 'CRED#GARMIN',
    },
  };

  const result = await dynamoDb.get(params).promise();
  const item = result.Item;

  if (!item || !item.OAuth1Token || !item.OAuth2Token) {
    throw new Error(
      'Missing Garmin OAuth tokens for the specified userId. ' +
        'Seed them with "npm run garmin:token -- <userId>" from a residential IP'
    );
  }

  return {
    oauth1: JSON.parse(item.OAuth1Token),
    oauth2: JSON.parse(item.OAuth2Token),
  };
};

const saveGarminTokens = async (
  userId: string,
  tableName: string,
  oauth1: object,
  oauth2: object
) => {
  await dynamoDb.update({
    TableName: tableName,
    Key: {
      PK: `USER#${userId}`,
      SK: 'CRED#GARMIN',
    },
    UpdateExpression: 'SET OAuth1Token = :oauth1, OAuth2Token = :oauth2',
    ExpressionAttributeValues: {
      ':oauth1': JSON.stringify(oauth1),
      ':oauth2': JSON.stringify(oauth2),
    },
  }).promise();
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

  const { oauth1, oauth2 } = await getGarminTokens(event.userId, usersTable);

  const GCClient = new GarminConnect({ username: '', password: '' });
  GCClient.loadToken(oauth1, oauth2);

  // Decode base64 file and save it temporarily
  const filePath = path.join('/tmp', `activity-${event.userId}.fit`);
  const fileBuffer = Buffer.from(event.base64, 'base64');
  fs.writeFileSync(filePath, fileBuffer);

  try {
    const upload = await GCClient.uploadActivity(filePath, 'fit');

    // The client refreshes the OAuth2 token when it expires; persist it for the next run
    const tokens = GCClient.exportToken();
    await saveGarminTokens(event.userId, usersTable, tokens.oauth1, tokens.oauth2);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'File uploaded successfully',
        upload,
      }),
    };
  } finally {
    // Clean up the temporary file
    fs.unlinkSync(filePath);
  }
}
