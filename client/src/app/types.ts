import { User } from '@prisma/client';

// Define the auth state interface
export interface AuthState {
  user: (User & { token: string }) | null;
  isAuthenticated: boolean;
}

// Define the root state interface
export type RootState = {
  auth: AuthState;
  splitApi: any; // RTK Query state
};
