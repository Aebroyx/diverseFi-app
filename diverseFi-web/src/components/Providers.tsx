'use client';

import { Provider } from 'react-redux';
import { store } from '../store/store';
import { AuthProvider } from '../providers/AuthProvider';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <AuthProvider>
        {children}
      </AuthProvider>
    </Provider>
  );
}