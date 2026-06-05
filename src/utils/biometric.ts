import { NativeBiometric } from 'capacitor-native-biometric';
import { Capacitor } from '@capacitor/core';
import { getSetting, setSetting } from '../db/settings';

const BIOMETRIC_KEY = 'biometric_enabled';

export const isBiometricEnabled = async (): Promise<boolean> => {
  const val = await getSetting(BIOMETRIC_KEY);
  return val === 'true';
};

export const setBiometricEnabled = async (enabled: boolean): Promise<void> => {
  await setSetting(BIOMETRIC_KEY, String(enabled));
};

export const isBiometricAvailable = async (): Promise<boolean> => {
  if (!Capacitor.isNativePlatform()) return false;
  try {
    const result = await NativeBiometric.isAvailable();
    return result.isAvailable;
  } catch {
    return false;
  }
};

export const authenticateWithBiometric = async (): Promise<boolean> => {
  if (!Capacitor.isNativePlatform()) return true;
  try {
    await NativeBiometric.verifyIdentity({
      reason: 'Unlock SafeSpend',
      title: 'SafeSpend',
      subtitle: 'Verify your identity to continue',
      description: 'Use your fingerprint or device PIN',
      negativeButtonText: 'Cancel',
      useFallback: true,
      maxAttempts: 3,
    });
    return true;
  } catch {
    return false;
  }
};
