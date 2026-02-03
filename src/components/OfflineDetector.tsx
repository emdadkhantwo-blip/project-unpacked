import { ReactNode } from 'react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import Offline from '@/pages/Offline';

interface OfflineDetectorProps {
  children: ReactNode;
}

export const OfflineDetector = ({ children }: OfflineDetectorProps) => {
  const isOnline = useNetworkStatus();

  if (!isOnline) {
    return <Offline />;
  }

  return <>{children}</>;
};
