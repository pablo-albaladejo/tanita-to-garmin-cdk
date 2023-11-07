import { fetchLogger } from '../../helpers/api';
import SessionParams from '../interfaces/sessionParams';
import TanitaOptions from '../interfaces/tanitaOptions';

export class TanitaRepository {
  private baseUrl: string = 'http://tanitaservices-production.uhp-software.com';
  private cookie: string | null = null;

  init = async (options: TanitaOptions) => {
    const params = await this.getSessionParams();
    if (!params) throw new Error('Cloud not get Tanita Session');
    this.cookie = params.cookie;

    await this.login(options, params.token);
  };

  private getSessionParams = async (): Promise<SessionParams | null> => {
    const url = `${this.baseUrl}/en/user/login`;
    const response = await fetchLogger(url);

    if (response.status !== 200) {
      return null;
    }
    const body = await response.text();

    const cookie = response.headers.get('set-cookie');
    if (!cookie) return null;

    const tokenRegex = /name="token" value="(.*?)"/g;
    const tokenMatch = tokenRegex.exec(body);
    if (!tokenMatch) return null;
    const token = tokenMatch[1];

    return {
      cookie,
      token,
    };
  };

  private login = async (options: TanitaOptions, token: string) => {
    await this.processLogin(options, token);
    await this.setUser(options);
  };

  private logout = async () => {
    if (this.cookie == null) throw new Error('Cloud not get Tanita Session');
    const url = `${this.baseUrl}/en/user/logout`;

    const headers: HeadersInit = {
      Cookie: this.cookie,
    };

    const options: RequestInit = {
      method: 'GET',
      headers,
    };

    return await fetchLogger(url, options);
  };

  private processLogin = async (
    options: TanitaOptions,
    token: string
  ): Promise<Response> => {
    if (this.cookie == null) throw new Error('Cloud not get Tanita Session');
    const input = `${this.baseUrl}/en/user/processlogin`;

    const headers: HeadersInit = {
      'Content-Type': 'application/x-www-form-urlencoded',
      Cookie: this.cookie,
    };

    const body = new URLSearchParams();
    body.append('mail', options.email);
    body.append('password', options.password);
    body.append('token', token);
    body.append('login', 'Login');

    const init: RequestInit = {
      method: 'POST',
      headers,
      body,
    };
    return await fetchLogger(input, init);
  };

  private setUser = async (options: TanitaOptions): Promise<Response> => {
    if (this.cookie == null) throw new Error('Cloud not get Tanita Session');
    const input = `${this.baseUrl}/en/user/change-user-profile/${options.user}`;

    const headers: HeadersInit = {
      Cookie: this.cookie,
    };

    const init: RequestInit = {
      method: 'GET',
      headers,
    };

    return await fetchLogger(input, init);
  };

  exportCSV = async (): Promise<string> => {
    if (this.cookie == null) throw new Error('Cloud not get Tanita Session');
    const url = `${this.baseUrl}/en/user/export-csv`;

    const headers: HeadersInit = {
      Cookie: this.cookie,
      'Accept-Encoding': 'gzip',
    };

    const options: RequestInit = {
      method: 'GET',
      headers,
    };

    return (await fetchLogger(url, options)).text();
  };

  dispose = async () => {
    await this.logout();
    this.cookie = null;
  };
}
