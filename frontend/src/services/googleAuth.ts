import * as WebBrowser from 'expo-web-browser';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';

// Google OAuth Configuration
// Note: For production, you need to create a Google Cloud project and configure OAuth
const GOOGLE_WEB_CLIENT_ID = ''; // Will be configured in env later
const REDIRECT_URI = Platform.select({
  web: typeof window !== 'undefined' ? window.location.origin : '',
  default: 'https://auth.expo.io/@anonymous/adelphi-app',
});

// Google OAuth URLs
const GOOGLE_AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';

interface GoogleTokenResponse {
  access_token: string;
  id_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
}

// Generate random state for CSRF protection
export const generateState = async (): Promise<string> => {
  const randomBytes = await Crypto.getRandomBytesAsync(16);
  return Array.from(new Uint8Array(randomBytes))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

// Generate code verifier and challenge for PKCE
export const generatePKCE = async (): Promise<{ verifier: string; challenge: string }> => {
  const randomBytes = await Crypto.getRandomBytesAsync(32);
  const verifier = Array.from(new Uint8Array(randomBytes))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  const digest = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    verifier,
    { encoding: Crypto.CryptoEncoding.BASE64 }
  );
  
  // Convert to base64url
  const challenge = digest
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
  
  return { verifier, challenge };
};

// Build Google OAuth URL
export const buildGoogleAuthUrl = async (clientId: string): Promise<{ url: string; state: string; verifier: string }> => {
  const state = await generateState();
  const { verifier, challenge } = await generatePKCE();
  
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    code_challenge: challenge,
    code_challenge_method: 'S256',
    access_type: 'offline',
    prompt: 'consent',
  });
  
  return {
    url: `${GOOGLE_AUTH_ENDPOINT}?${params.toString()}`,
    state,
    verifier,
  };
};

// Exchange authorization code for tokens
export const exchangeCodeForTokens = async (
  code: string,
  verifier: string,
  clientId: string
): Promise<GoogleTokenResponse> => {
  const response = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: clientId,
      code,
      code_verifier: verifier,
      grant_type: 'authorization_code',
      redirect_uri: REDIRECT_URI,
    }).toString(),
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token exchange failed: ${error}`);
  }
  
  return response.json();
};

// For demo purposes - simulate Google sign in
// In production, you would use the actual Google OAuth flow
export const simulateGoogleSignIn = async (): Promise<{ idToken: string; email: string; name: string }> => {
  // This is a placeholder that simulates the Google sign-in process
  // In a real app, you would:
  // 1. Open the Google OAuth URL using WebBrowser.openAuthSessionAsync
  // 2. Handle the redirect with the authorization code
  // 3. Exchange the code for tokens
  // 4. Return the ID token
  
  // For demo purposes, we'll show an alert that Google Sign In requires configuration
  throw new Error('Google Sign-In requires configuration. Please set up a Google Cloud project and add your client ID.');
};

export default {
  generateState,
  generatePKCE,
  buildGoogleAuthUrl,
  exchangeCodeForTokens,
  simulateGoogleSignIn,
};
