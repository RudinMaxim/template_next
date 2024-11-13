import axios, { AxiosResponse, AxiosRequestConfig, AxiosError } from 'axios';

import { axiosConfig } from '@/shared/config';

type ApiResponse<T> = {
  data: T | null;
  error: string | null;
  response: AxiosResponse<T> | null;
};

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

const request = async <T>(
  method: HttpMethod,
  url: string,
  config: AxiosRequestConfig = {}
): Promise<ApiResponse<T>> => {
  try {
    const response: AxiosResponse<T> = await axiosConfig.request({ method, url, ...config });
    return { data: response.data as T, error: null, response };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      return {
        data: null,
        error: axiosError.message || 'Unknown error',
        response: axiosError.response as AxiosResponse<T> | null,
      };
    }
    return { data: null, error: 'Unknown error', response: null };
  }
};

export const httpGET = <T>(url: string, config?: AxiosRequestConfig) => request<T>('GET', url, config);

export const httpPOST = <T, D>(url: string, data?: D, config?: AxiosRequestConfig) =>
  request<T>('POST', url, { ...config, data });

export const httpPUT = <T, D>(url: string, data?: D, config?: AxiosRequestConfig) =>
  request<T>('PUT', url, { ...config, data });

export const httpDELETE = <T>(url: string, config?: AxiosRequestConfig) =>
  request<T>('DELETE', url, config);
