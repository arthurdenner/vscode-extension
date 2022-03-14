import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { DEFAULT_API_HEADERS } from '../../common/api/headers';
import { IConfiguration } from '../../common/configuration/configuration';
import { AdvisorRegistry } from '../advisorTypes';

export interface IAdvisorApiClient {
  post<T = unknown, R = AxiosResponse<T>>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<R>;
  apiPath: string;
  getAdvisorUrl(registry: AdvisorRegistry): string;
}

export class AdvisorApiClient implements IAdvisorApiClient {
  private instance: AxiosInstance | null = null;
  private readonly advisorBaseUrl = 'https://snyk.io/advisor';
  apiPath = `/unstable/advisor/scores/npm-package`;

  constructor(private readonly configuration: IConfiguration) {}

  getAdvisorUrl(registry: AdvisorRegistry): string {
    return `${this.advisorBaseUrl}/${registry}`;
  }

  private get http(): AxiosInstance {
    return this.instance != null ? this.instance : this.initHttp();
  }

  initHttp(): AxiosInstance {
    const http = axios.create({
      headers: DEFAULT_API_HEADERS,
      responseType: 'json',
    });

    http.interceptors.response.use(
      response => response,
      error => {
        console.error('Call to Advisor API failed: ', error);
        return Promise.reject(error);
      },
    );

    this.instance = http;
    return http;
  }

  post<T = unknown, R = AxiosResponse<T>>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<R> {
    this.http.interceptors.request.use(req => {
      req.baseURL = this.configuration.baseApiUrl;
      req.headers = {
        ...req.headers,
        Authorization: `token ${this.configuration.token}`,
      } as { [header: string]: string };

      return req;
    });
    return this.http.post<T, R>(url, data, config);
  }
}
