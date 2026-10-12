import { createContext, useContext, type ReactNode } from 'react';
import type { BookCatalog } from '../core/catalog/openLibraryCatalog';
import type { Storage } from '../core/storage/storage';

export type AppServices = { storage: Storage; catalog: BookCatalog };

const AppServicesContext = createContext<AppServices | null>(null);

export function AppServicesProvider({ services, children }: { services: AppServices; children: ReactNode }) {
  return <AppServicesContext.Provider value={services}>{children}</AppServicesContext.Provider>;
}

export function useAppServices(): AppServices {
  const services = useContext(AppServicesContext);
  if (!services) {
    throw new Error('useAppServices must be used inside an AppServicesProvider.');
  }
  return services;
}
