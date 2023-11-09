import {
  SSMClient,
  GetParameterCommand,
  GetParameterRequest,
} from '@aws-sdk/client-ssm';

const client = new SSMClient();

export async function getParameter(
  parameterName: string,
  withDecryption: boolean = false
): Promise<string | undefined> {
  const input: GetParameterRequest = {
    Name: parameterName,
    WithDecryption: withDecryption,
  };
  const command = new GetParameterCommand(input);
  const response = await client.send(command);

  return response.Parameter?.Value;
}
