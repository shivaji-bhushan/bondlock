// WebAuthn / Passkeys Engine for Real Hardware Biometrics
// Triggers native Apple Face ID, Touch ID, Android Biometrics, and Windows Hello

export interface BiometricAuthResult {
  success: boolean;
  type: 'faceid' | 'touchid' | 'platform' | 'simulated';
  error?: string;
}

const PASSKEY_STORAGE_PREFIX = 'bondlock_passkey_credential_';

/**
 * Checks if the browser supports the WebAuthn API
 */
export function isWebAuthnSupported(): boolean {
  return typeof window !== 'undefined' && Boolean(window.PublicKeyCredential);
}

/**
 * Checks if a platform authenticator (Face ID, Touch ID, Windows Hello, Android Biometric) is available
 */
export async function isPlatformAuthenticatorAvailable(): Promise<boolean> {
  if (!isWebAuthnSupported()) return false;
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

/**
 * Helper to convert ArrayBuffer to Base64URL string
 */
function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/**
 * Helper to convert Base64URL string to ArrayBuffer
 */
function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64.replace(/-/g, '+').replace(/_/g, '/'));
  const buffer = new ArrayBuffer(binary.length);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < binary.length; i++) {
    view[i] = binary.charCodeAt(i);
  }
  return buffer;
}

/**
 * Registers / Enrolls a new Passkey using the device's native Face ID / Touch ID sensor
 */
export async function enrollPasskey(
  partnerId: 'partner1' | 'partner2',
  partnerName: string
): Promise<{ success: boolean; credentialId?: string; error?: string }> {
  if (!isWebAuthnSupported()) {
    return { success: false, error: 'WebAuthn is not supported in this browser' };
  }

  try {
    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);

    const userIdBytes = new TextEncoder().encode(`bondlock-${partnerId}-${Date.now()}`);

    const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
      challenge: challenge.buffer as ArrayBuffer,
      rp: {
        name: 'BondLock Private Locker',
        id: window.location.hostname === 'localhost' ? 'localhost' : window.location.hostname,
      },
      user: {
        id: userIdBytes.buffer as ArrayBuffer,
        name: `${partnerId}@bondlock.local`,
        displayName: partnerName,
      },
      pubKeyCredParams: [
        { alg: -7, type: 'public-key' },  // ES256
        { alg: -257, type: 'public-key' }, // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform', // Enforce built-in biometric sensor (Face ID / Touch ID)
        userVerification: 'required',
        requireResidentKey: false,
      },
      timeout: 60000,
      attestation: 'none',
    };

    const credential = (await navigator.credentials.create({
      publicKey: publicKeyCredentialCreationOptions,
    })) as PublicKeyCredential;

    if (!credential) {
      return { success: false, error: 'Failed to create biometric credential' };
    }

    const credIdString = bufferToBase64(credential.rawId);
    localStorage.setItem(`${PASSKEY_STORAGE_PREFIX}${partnerId}`, credIdString);

    return {
      success: true,
      credentialId: credIdString,
    };
  } catch (err: any) {
    console.warn('WebAuthn enrollment error:', err);
    return {
      success: false,
      error: err.message || 'Passkey enrollment was cancelled or failed',
    };
  }
}

/**
 * Prompts the user with native Apple Face ID / Touch ID / Android Biometrics to verify identity
 */
export async function verifyPasskey(
  partnerId: 'partner1' | 'partner2'
): Promise<BiometricAuthResult> {
  const isAvailable = await isPlatformAuthenticatorAvailable();
  if (!isAvailable) {
    return {
      success: false,
      type: 'simulated',
      error: 'Platform authenticator not available',
    };
  }

  const storedCredId = localStorage.getItem(`${PASSKEY_STORAGE_PREFIX}${partnerId}`);

  try {
    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);

    const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
      challenge: challenge.buffer as ArrayBuffer,
      rpId: window.location.hostname === 'localhost' ? 'localhost' : window.location.hostname,
      userVerification: 'required',
      timeout: 60000,
      ...(storedCredId
        ? {
            allowCredentials: [
              {
                id: base64ToBuffer(storedCredId),
                type: 'public-key',
                transports: ['internal'],
              },
            ],
          }
        : {}),
    };

    const assertion = await navigator.credentials.get({
      publicKey: publicKeyCredentialRequestOptions,
    });

    if (assertion) {
      return {
        success: true,
        type: 'faceid',
      };
    } else {
      return {
        success: false,
        type: 'platform',
        error: 'Biometric assertion rejected',
      };
    }
  } catch (err: any) {
    return {
      success: false,
      type: 'platform',
      error: err.name === 'NotAllowedError' ? 'Scan cancelled by user' : err.message,
    };
  }
}

/**
 * Checks if a passkey has already been enrolled for this partner on this device
 */
export function hasEnrolledPasskey(partnerId: 'partner1' | 'partner2'): boolean {
  return typeof localStorage !== 'undefined' && Boolean(localStorage.getItem(`${PASSKEY_STORAGE_PREFIX}${partnerId}`));
}

/**
 * Removes the stored passkey for this partner
 */
export function removePasskey(partnerId: 'partner1' | 'partner2'): void {
  localStorage.removeItem(`${PASSKEY_STORAGE_PREFIX}${partnerId}`);
}
