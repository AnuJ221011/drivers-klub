import type { ReactNode } from 'react';
import { AuthProvider } from './AuthContext';
import { FleetProvider } from './FleetContext';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <FleetProvider>{children}</FleetProvider>
    </AuthProvider>
  );
}

