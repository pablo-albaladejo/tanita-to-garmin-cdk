import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import { APIGatewayProxyResult, Context } from 'aws-lambda';
import { S3, DynamoDB } from 'aws-sdk';

const s3 = new S3();
const dynamoDb = new DynamoDB.DocumentClient();

const bucketName = process.env.BUCKET_NAME;
const credentialsFilePath = process.env.CREDENTIALS_FILE_PATH;
const usersTable = process.env.USERS_TABLE;


const getGoogleSheetUserInfo = async (userId: string, tableName: string) => {
    const params = {
        TableName: tableName,
        Key: {
            PK: `USER#${userId}`,
            SK: 'CRED#GOOGLE',
        },
    };

    const result = await dynamoDb.get(params).promise();
    const credentials = result.Item;

    console.log('Google credentials:', credentials);

    if (!credentials || !credentials.SheetId || credentials.SheetIndex == null) {
        throw new Error('Missing Google Info for the specified userId');
    }

    return {
        sheetId: credentials.SheetId,
        sheetIndex: credentials.SheetIndex
    };
};

// Function to format date to MM/DD/YYYY HH:mm:ss
function formatDateToSheetDate(isoDateString: string): string {
    const date = new Date(isoDateString);
    const formattedDate = `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}/${date.getFullYear()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
    console.log('Formatted date:', formattedDate);
    return formattedDate;
}

export const handler = async (event: {
    userId: string;
    tanitaData: string;
}, _context: Context): Promise<APIGatewayProxyResult> => {
    console.log('Received event:', event);
    try {
        if (!bucketName || !credentialsFilePath || !usersTable) {
            throw new Error('Missing required environment variables');
        }

        const s3Object = await s3.getObject({ Bucket: bucketName, Key: credentialsFilePath }).promise();
        if (!s3Object.Body) {
            throw new Error('Failed to load credentials file from S3');
        }
        const { client_email, private_key } = JSON.parse(s3Object.Body.toString('utf-8'));

        const {
            sheetId,
            sheetIndex
        } = await getGoogleSheetUserInfo(event.userId, usersTable);
        console.log('Sheet ID:', sheetId);
        console.log('Sheet Index:', sheetIndex);

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
        const sheet = doc.sheetsByIndex[sheetIndex];

        // Parse the data from the event (assuming the Tanita JSON is in the event body)
        const dataArray = JSON.parse(event.tanitaData || '[]');

        // Add new rows to the Google Sheets with the Tanita data
        for (const data of dataArray) {
            // Format the date to MM/DD/YYYY HH:mm:ss
            data.date = formatDateToSheetDate(data.date);
            console.log('Adding row:', data);
            await sheet.addRow(data);
        }

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
