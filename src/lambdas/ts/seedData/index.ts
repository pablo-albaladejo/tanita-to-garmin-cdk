import { DynamoDB } from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

const dynamoDb = new DynamoDB.DocumentClient();
const tableName = process.env.USERS_TABLE;

export const handler = async (event: { RequestType?: string } = {}) => {
    // Only seed on stack creation; Update/Delete events must not re-insert example users
    if (event.RequestType !== 'Create') {
        console.log(`Skipping seed data for event type: ${event.RequestType}`);
        return;
    }

    if (!tableName) {
        console.error('Table name not set');
        return;
    }

    const userId = uuidv4();

    const exampleData = [
        {
            PK: `USER#${userId}`,
            SK: '#INFO',
            Username: 'johndoe',
        },
        {
            PK: `USER#${userId}`,
            SK: 'CRED#TANITA',
            User: 'tanitaUser',
            Pass: 'tanitaPass',
            Profile: 'tanitaProfile',
            SyncEnabled: true  // SyncEnabled explicitly set for TANITA
        },
        {
            PK: `USER#${userId}`,
            SK: 'CRED#GARMIN',
            User: 'garminUser',
            Pass: 'garminPass',
            SyncEnabled: false  // SyncEnabled explicitly set for GARMIN
        },
        {
            PK: `USER#${userId}`,
            SK: 'CRED#GOOGLE',
            SheetId: 'sheetId',
            SheetIndex: '0',
            SyncEnabled: true  // SyncEnabled explicitly set for GOOGLE
        }
    ];

    try {
        const putRequests = exampleData.map((item) => ({
            PutRequest: { Item: item },
        }));

        await dynamoDb.batchWrite({
            RequestItems: {
                [tableName]: putRequests,
            },
        }).promise();

        console.log('Example data seeded successfully');
    } catch (error) {
        console.error('Error seeding example data:', error);
    }
};
