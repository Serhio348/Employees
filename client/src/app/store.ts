import { configureStore, ThunkAction, Action } from '@reduxjs/toolkit';

import auth from '../features/auth/authSlice'
import { api } from './services/api'
import { listenerMiddleware } from '../middleware/auth';
import type { RootState } from './types';

export const store = configureStore({
  reducer: {
    [api.reducerPath]: api.reducer,
    auth
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(api.middleware).prepend(listenerMiddleware.middleware),
});

// Очищаем кэш API при инициализации
store.dispatch(api.util.resetApiState());

// Export types
export type { RootState } from './types';
export type AppDispatch = typeof store.dispatch;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;
