// PKCE (Proof Key for Code Exchange) utility functions for Microsoft OAuth

// Generate a random string for the code verifier
function generateRandomString(length) {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  let text = '';
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);
  for (let i = 0; i < length; i++) {
    text += possible.charAt(randomValues[i] % possible.length);
  }
  return text;
}

// Generate code verifier (43-128 characters)
export function generateCodeVerifier() {
  return generateRandomString(64);
}

// Generate code challenge from code verifier using SHA256
export async function generateCodeChallenge(codeVerifier) {
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  
  // Convert to base64url encoding
  const base64 = btoa(String.fromCharCode(...new Uint8Array(digest)));
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// Store code verifier in sessionStorage
export function storeCodeVerifier(codeVerifier) {
  sessionStorage.setItem('pkce_code_verifier', codeVerifier);
}

// Retrieve code verifier from sessionStorage
export function getCodeVerifier() {
  return sessionStorage.getItem('pkce_code_verifier');
}

// Clear code verifier from sessionStorage
export function clearCodeVerifier() {
  sessionStorage.removeItem('pkce_code_verifier');
}
