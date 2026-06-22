import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Role {
  id: number;
  name: string;
  display_name: string;
  description?: string;
  is_active?: boolean;
}

export interface User {
  id: number;
  username: string;
  email: string;
  name: string;
  role: Role;
}

interface AuthState {
  user: User | null;
}

const initialState: AuthState = {
  user: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{
        user: User | null;
      }>
    ) => {
      const { user } = action.payload;
      state.user = user;
    },
    logout: (state) => {
      state.user = null;
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;

// Selectors
export const selectCurrentUser = (state: { auth: AuthState }) => state.auth.user;
export const selectIsAuthenticated = (state: { auth: AuthState }) => !!state.auth.user; 