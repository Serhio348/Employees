import { createApi, fetchBaseQuery, retry } from "@reduxjs/toolkit/query/react";
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

const baseQueryWithRetry = retry(baseQuery, { maxRetries: 1 });

export const api = createApi({
    reducerPath: "splitApi",
    baseQuery: baseQueryWithRetry,
    refetchOnMountOrArgChange: false,
    refetchOnFocus: false,
    refetchOnReconnect: false,
    tagTypes: ['Inventory', 'Employee', 'User'],
    endpoints: () => ({}),
});