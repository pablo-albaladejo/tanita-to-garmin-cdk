import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from 'aws-lambda';
import { getParameter } from '../helpers/ssm';
import { endOfDay, startOfDay, yesterdayDate } from '../helpers/date';

export async function handler(
  event: APIGatewayProxyEvent,
  _context: Context
): Promise<APIGatewayProxyResult> {
  const tanitaEmail = await getParameter('/tanitatogarming/tanitaemail');
  const tanitaPassword = await getParameter('/tanitatogarming/tanitapassword');
  const tanitaUser = await getParameter('/tanitatogarming/tanitauser');

  const garminUser = await getParameter('/tanitatogarming/garminuser');
  const garminPassword = await getParameter('/tanitatogarming/garminpassword');

  const yesterday = yesterdayDate();
  const startDate = startOfDay(yesterday);
  const endDate = endOfDay(yesterday);

  return {
    statusCode: 200,
    body: JSON.stringify({
      tanitaEmail,
      tanitaPassword,
      tanitaUser,
      garminUser,
      garminPassword,
      startDate,
      endDate,
    }),
  };
}
