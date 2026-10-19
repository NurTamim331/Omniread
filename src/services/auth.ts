import type { GoogleUserProfile } from '../types';

const STORAGE_KEYS = {
  GOOGLE_USER: 'minimal_pdf_reader_google_user',
  GOOGLE_TOKEN: 'minimal_pdf_reader_google_token',
};

export function getStoredProfile(): GoogleUserProfile | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(STORAGE_KEYS.GOOGLE_USER);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as GoogleUserProfile;
  } catch {
    return null;
  }
}

export function setStoredProfile(profile: GoogleUserProfile | null): void {
  if (typeof window === 'undefined') return;
  if (!profile) {
    localStorage.removeItem(STORAGE_KEYS.GOOGLE_USER);
  } else {
    localStorage.setItem(STORAGE_KEYS.GOOGLE_USER, JSON.stringify(profile));
  }
}

export function getStoredGoogleToken(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(STORAGE_KEYS.GOOGLE_TOKEN) || '';
}

export function setStoredGoogleToken(token: string): void {
  if (typeof window === 'undefined') return;
  if (!token) {
    localStorage.removeItem(STORAGE_KEYS.GOOGLE_TOKEN);
  } else {
    localStorage.setItem(STORAGE_KEYS.GOOGLE_TOKEN, token.trim());
  }
}

/**
 * Decodes Google Identity Services JWT credential securely
 */
export function parseGoogleJwt(token: string): GoogleUserProfile | null {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const payload = JSON.parse(jsonPayload);
    return {
      email: payload.email || '',
      name: payload.name || payload.given_name || 'Google User',
      picture: payload.picture,
      sub: payload.sub,
    };
  } catch (err) {
    console.error('Failed to parse Google JWT', err);
    return null;
  }
}

export function clearGoogleAuth(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEYS.GOOGLE_USER);
  localStorage.removeItem(STORAGE_KEYS.GOOGLE_TOKEN);
}
