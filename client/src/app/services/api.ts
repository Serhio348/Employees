import { createApi, fetchBaseQuery, retry } from "@reduxjs/toolkit/query/react";
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { RootState } from "../store";

// Определяем базовый URL для API
const getBaseUrl = () => {
    // Если мы в браузере и не на localhost, используем относительный путь
    if (typeof window !== 'undefined' && !window.location.hostname.includes('localhost')) {
        return "/api";
    }
    // Для localhost используем полный URL
    return "http://localhost:5000/api";
};

const baseQuery = fetchBaseQuery({
    baseUrl: getBaseUrl(),
    prepareHeaders: (headers, { getState }) => {
        const token =
            (getState() as RootState).auth.user?.token ||
            localStorage.getItem("token");

        if (token) {
            headers.set("authorization", `Bearer ${token}`);
        }
        return headers;
    },
});

const baseQueryWithAuthHandling: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
    args,
    api,
    extraOptions
) => {
    const result = await baseQuery(args, api, extraOptions);

    if (result.error?.status === 401) {
        localStorage.removeItem("token");
        window.dispatchEvent(new CustomEvent("auth:unauthorized"));
    }

    return result;
};

const baseQueryWithRetry = retry(baseQueryWithAuthHandling, { maxRetries: 1 });

export const api = createApi({
    reducerPath: "splitApi",
    baseQuery: baseQueryWithRetry,
    refetchOnMountOrArgChange: false,
    refetchOnFocus: false,
    refetchOnReconnect: false,
    tagTypes: ['Inventory', 'Employee', 'User'],
    endpoints: () => ({}),
});