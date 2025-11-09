import React from 'react';
import { AuthProvider } from './AuthContext';
import { DataProvider } from './DataContext';
import { NavigationProvider } from './NavigationContext';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AuthProvider>
    <DataProvider>
      <NavigationProvider>
        {children}
      </NavigationProvider>
    </DataProvider>
  </AuthProvider>
);
