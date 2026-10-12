import { createNavigationContainerRef } from '@react-navigation/native';
import type { RootStackParamList } from './types';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export function navigateToExternalPayment(intent: RootStackParamList['ExternalPayment']['intent']) {
  if (navigationRef.isReady()) {
    navigationRef.navigate('ExternalPayment', { intent });
  }
}
