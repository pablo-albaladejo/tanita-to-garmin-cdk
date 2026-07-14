/**
 * Seeds Garmin OAuth tokens into the users table so the GarminUpload lambda
 * can authenticate without password logins (Garmin rate-limits those from
 * cloud IPs with 429). Run it from a residential connection whenever the
 * OAuth1 token expires (roughly once a year).
 *
 * Usage:
 *   AWS_PROFILE=<profile> USERS_TABLE=<UsersTableName> npm run garmin:token -- <userId>
 */
import { execFileSync } from 'child_process';
import { GarminConnect } from 'garmin-connect';
import * as AWS from 'aws-sdk';

const usersTable = process.env.USERS_TABLE;
const region = process.env.AWS_REGION ?? 'eu-west-1';
const userId = process.argv[2];

// aws-sdk v2 cannot resolve the newer credential types (SSO, aws login), so
// let the AWS CLI resolve the active profile and hand us plain keys.
const resolveCredentials = (): AWS.Credentials => {
  const output = execFileSync('aws', ['configure', 'export-credentials'], {
    encoding: 'utf-8',
  });
  const credentials = JSON.parse(output);
  return new AWS.Credentials({
    accessKeyId: credentials.AccessKeyId,
    secretAccessKey: credentials.SecretAccessKey,
    sessionToken: credentials.SessionToken,
  });
};

const main = async () => {
  if (!usersTable) {
    throw new Error('The USERS_TABLE environment variable is required');
  }
  if (!userId) {
    throw new Error('Usage: npm run garmin:token -- <userId>');
  }

  const dynamoDb = new AWS.DynamoDB.DocumentClient({
    region,
    credentials: resolveCredentials(),
  });
  const key = { PK: `USER#${userId}`, SK: 'CRED#GARMIN' };

  const { Item: credentials } = await dynamoDb
    .get({ TableName: usersTable, Key: key })
    .promise();
  if (!credentials || !credentials.User || !credentials.Pass) {
    throw new Error('Missing Garmin credentials for the specified userId');
  }

  const client = new GarminConnect({
    username: credentials.User,
    password: credentials.Pass,
  });
  await client.login();
  const { oauth1, oauth2 } = client.exportToken();

  await dynamoDb
    .update({
      TableName: usersTable,
      Key: key,
      UpdateExpression: 'SET OAuth1Token = :oauth1, OAuth2Token = :oauth2',
      ExpressionAttributeValues: {
        ':oauth1': JSON.stringify(oauth1),
        ':oauth2': JSON.stringify(oauth2),
      },
    })
    .promise();

  console.log(`Garmin OAuth tokens stored for user ${userId}`);
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
