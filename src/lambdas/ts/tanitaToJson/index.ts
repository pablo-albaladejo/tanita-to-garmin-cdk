import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from 'aws-lambda';
import { TanitaService } from './service';

export async function handler(
  event: APIGatewayProxyEvent,
  _context: Context
): Promise<APIGatewayProxyResult> {
  try {
    if (!event.queryStringParameters) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: 'Missing mandatory parameters in the request',
        }),
      };
    }
    const { tanita_email, tanita_password, tanita_user, start_date, end_date } =
      event.queryStringParameters;

    if (!tanita_email || !tanita_password || !tanita_user) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: 'Missing mandatory parameters in the request',
        }),
      };
    }
    const tanitaService = new TanitaService({
      email: tanita_email,
      password: tanita_password,
      user: tanita_user,
    });

    const measurements = await tanitaService.getMeasurementsByDateRage(
      start_date,
      end_date
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Success',
        data: measurements,
      }),
    };
  } catch (error) {
    if (error instanceof Error)
      return {
        statusCode: 500,
        body: JSON.stringify({
          message: error.message,
        }),
      };
    else
      return {
        statusCode: 500,
        body: JSON.stringify({ message: 'Internal Server error' }),
      };
  }
}
