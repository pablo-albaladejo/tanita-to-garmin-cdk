export const fetchLogger = async (
  input: RequestInfo | URL,
  init?: RequestInit | undefined
): Promise<Response> => {
  try {
    console.log('fetchLogger::fetch', JSON.stringify({ input, init }, null, 2));
    const response = await fetch(input, init);

    console.log('fetchLogger::response', JSON.stringify({ response }, null, 2));
    return response;
  } catch (e) {
    console.log('fetchLogger::error', JSON.stringify({ e }, null, 2));
    throw e;
  }
};
