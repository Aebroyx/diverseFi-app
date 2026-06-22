import { configureStore } from '@reduxjs/toolkit';
import counterReducer from './features/counterSlice';
import authReducer from './features/authSlice';

export const store = configureStore({
  reducer: {
    counter: counterReducer,
    auth: authReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 