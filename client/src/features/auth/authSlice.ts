import { User } from '@prisma/client';
import { createSlice } from '@reduxjs/toolkit';

import { authApi } from '../../app/services/auth';
import { RootState } from '../../app/types';

interface InitialState {
    user: User & { token: string } | null,
    isAuthenticated: boolean
}

const initialState: InitialState = {
    user: null,
    isAuthenticated: false
}

const slice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        logout: (state) => {
            state.user = null;
            state.isAuthenticated = false;
            localStorage.removeItem('token');
        },
        clearAuth: (state) => {
            state.user = null;
            state.isAuthenticated = false;
            localStorage.removeItem('token');
        },
    },
    extraReducers(builder) {
        builder
            .addMatcher(authApi.endpoints.login.matchFulfilled, (state, action) => {
                state.user = action.payload;
                state.isAuthenticated = true;
                localStorage.setItem('token', action.payload.token);
            })
            .addMatcher(authApi.endpoints.register.matchFulfilled, (state, action) => {
                state.user = action.payload;
                state.isAuthenticated = true;
                localStorage.setItem('token', action.payload.token);
            })
            .addMatcher(authApi.endpoints.current.matchFulfilled, (state, action) => {
                state.user = action.payload;
                state.isAuthenticated = true;
            })
            .addMatcher(authApi.endpoints.current.matchRejected, (state) => {
                state.user = null;
                state.isAuthenticated = false;
                localStorage.removeItem('token');
            })
            .addMatcher(authApi.endpoints.login.matchRejected, (state) => {
                state.user = null;
                state.isAuthenticated = false;
                localStorage.removeItem('token');
            })
            .addMatcher(authApi.endpoints.register.matchRejected, (state) => {
                state.user = null;
                state.isAuthenticated = false;
                localStorage.removeItem('token');
            })

    }
})

export const { logout, clearAuth } = slice.actions

export default slice.reducer

export const selectIsAuthenticated = (state: RootState) =>
    state.auth.isAuthenticated;

export const selectUser = (state: RootState) =>
    state.auth.user;