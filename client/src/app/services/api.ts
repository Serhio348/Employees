import { createApi, fetchBaseQuery, retry } from '@reduxjs/toolkit/query/react';
import { RootState } from '../store';

const baseQuery = fetchBaseQuery({
    baseUrl: 'http://localhost:8000/api',
    prepareHeaders: (headers, { getState }) => {

    }
})

const baseQueryWithRetry = retry(baseQuery, { maxRetries: 1 })      ///Повтор запроса вслучае неуспешного первого запроса

export const api = createApi({
    reducerPath: 'splitApi',             ///// уникальный ключ для подключения в store
    baseQuery: baseQueryWithRetry,
    refetchOnMountOrArgChange: true,
    endpoints: () => ({})
})