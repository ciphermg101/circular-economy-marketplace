import axios, {
  AxiosError,
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import { toast } from 'react-hot-toast';
import { getSession } from 'next-auth/react';
import { v4 as uuidv4 } from 'uuid';
import {
  ApiError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  TooManyRequestsError,
} from '@utils/api-error';

const createAxiosClient = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    timeout: 15000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // request interceptor typing and headers initialization
  instance.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      const session = await getSession();

      config.headers = config.headers || {};

      if (session?.accessToken) {
        config.headers.Authorization = `Bearer ${session.accessToken}`;
      }

      config.headers['X-Correlation-ID'] = uuidv4();

      return config;
    }
  );

  // response interceptor
  instance.interceptors.response.use(
    (response: AxiosResponse) => {
      return response;
    },
    async (error: AxiosError) => {
      const status = error.response?.status;
      const errorMessage =
        (error.response?.data as { message?: string })?.message || error.message;

      if (status === 401) {
        throw new AuthenticationError(errorMessage);
      }
      if (status === 403) {
        throw new AuthorizationError(errorMessage);
      }
      if (status === 404) {
        throw new NotFoundError(errorMessage);
      }
      if (status === 409) {
        throw new ConflictError(errorMessage);
      }
      if (status === 429) {
        throw new TooManyRequestsError(errorMessage);
      }

      toast.error(errorMessage || 'Something went wrong');

      return Promise.reject(
        new ApiError(errorMessage || 'An unexpected error occurred', status || 500)
      );
    }
  );

  return instance;
};

export const axiosClient = createAxiosClient();
