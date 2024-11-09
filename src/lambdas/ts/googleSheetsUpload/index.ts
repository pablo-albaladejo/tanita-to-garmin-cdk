import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { S3, DynamoDB } from 'aws-sdk';

const s3 = new S3();
const dynamoDb = new DynamoDB.DocumentClient();

const bucketName = process.env.BUCKET_NAME;
const credentialsFilePath = process.env.CREDENTIALS_FILE_PATH;
const usersTable = process.env.USERS_TABLE;


const getGoogleSheetId = async (userId: string, tableName: string) => {
    const params = {
      TableName: tableName,
      Key: {
        PK: `USER#${userId}`,
        SK: 'CRED#GOOGLE',
      },
    };
  
    const result = await dynamoDb.get(params).promise();
    const credentials = result.Item;
  
    if (!credentials || !credentials.SheetId) {
      throw new Error('Missing Google credentials for the specified userId');
    }
  
    return credentials.SheetId;
  };
  

export const handler = async (event: {
    userId: string;
    body: string;
}, _context: Context): Promise<APIGatewayProxyResult> => {
    try {
        if (!bucketName || !credentialsFilePath || !usersTable) {
            throw new Error('Missing required environment variables');
        }

        const s3Object = await s3.getObject({ Bucket: bucketName, Key: credentialsFilePath }).promise();
        if (!s3Object.Body) {
            throw new Error('Failed to load credentials file from S3');
        }
        const credentials = JSON.parse(s3Object.Body.toString('utf-8'));
        const { client_email, private_key } = credentials;
        console.log('Credentials:', client_email, private_key);
        
        const sheetId = await getGoogleSheetId(event.userId, usersTable);
        console.log('Sheet ID:', sheetId);

        // Initialize JWT auth
        const serviceAccountAuth = new JWT({
            email: client_email,
            key: private_key,
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        // Initialize the Google Spreadsheet with JWT authentication
        const doc = new GoogleSpreadsheet(sheetId, serviceAccountAuth);

        // Load document info and worksheet
        await doc.loadInfo();

        // Access the first sheet by index (or by name if preferred)
        const sheet = doc.sheetsByIndex[0];

        // Parse the data from the event (assuming the Tanita JSON is in the event body)
        const data = JSON.parse(event.body || '{}');

        // Add a new row to the Google Sheets with the Tanita data
        await sheet.addRow(data);

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Data successfully uploaded to Google Sheets' }),
        };
    } catch (error) {
        console.error('Error uploading to Google Sheets:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Failed to upload data', error: (error as Error).message }),
        };
    }
};
