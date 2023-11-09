import { GarminConnect } from 'garmin-connect';
import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from 'aws-lambda';
import * as fs from 'fs';
import * as https from 'https';

const donwload = (fileUrl: string, filename: string) => {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filename);
    https.get(fileUrl, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve(file);
      });
      file.on('error', (err) => {
        reject(err);
      });
    });
  });
};

export async function handler(
  event: APIGatewayProxyEvent,
  _context: Context
): Promise<APIGatewayProxyResult> {
  if (!event.body) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: 'Missing body',
      }),
    };
  }

  //incomming event from step function is an object but from api gateway is a string
  const bodyJson =
    typeof event.body === 'string' ? JSON.parse(event.body) : event.body;

  const { fileUrl, username, password } = bodyJson;

  const filename = `/tmp/${new Date().getTime()}.fit`;
  await donwload(fileUrl, filename);

  const GCClient = new GarminConnect({
    username,
    password,
  });
  await GCClient.login();
  const upload = await GCClient.uploadActivity(filename, 'fit');

  return {
    statusCode: 200,
    body: JSON.stringify({
      upload,
    }),
  };
}
