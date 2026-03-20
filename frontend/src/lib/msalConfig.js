// Microsoft Authentication Library (MSAL) configuration
// Using REDIRECT flow for better reliability with Azure AD SPAs

import { PublicClientApplication, LogLevel } from '@azure/msal-browser';

// Configuration
const msalConfig = {
  auth: {
    clientId: '139cfba4-dc08-4f1d-9545-dedd25f60409',
    authority: 'https://login.microsoftonline.com/764b1c94-2700-4575-97a9-f880a2356b1f',
    redirectUri: window.location.origin,
    postLogoutRedirectUri: window.location.origin,
    navigateToLoginRequestUrl: false,
  },
  cache: {
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false,
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) return;
        if (level === LogLevel.Error) console.error('[MSAL]', message);
        else if (level === LogLevel.Warning) console.warn('[MSAL]', message);
      },
      logLevel: LogLevel.Warning,
    },
  },
};

// Login request scopes
export const loginRequest = {
  scopes: ['openid', 'profile', 'email', 'User.Read'],
};

// Create MSAL instance (singleton)
export const msalInstance = new PublicClientApplication(msalConfig);

// Track initialization
let initialized = false;

// Initialize MSAL
export const initializeMsal = async () => {
  if (initialized) return;
  
  try {
    await msalInstance.initialize();
    initialized = true;
    console.log('[MSAL] Initialized');
  } catch (error) {
    console.error('[MSAL] Init error:', error);
    throw error;
  }
};

// Handle redirect response (call this on app startup)
export const handleMsalRedirect = async () => {
  if (!initialized) {
    await initializeMsal();
  }
  
  try {
    const response = await msalInstance.handleRedirectPromise();
    if (response) {
      console.log('[MSAL] Redirect response received for:', response.account?.username);
    }
    return response;
  } catch (error) {
    console.error('[MSAL] Redirect handling error:', error);
    return null;
  }
};

// Login with redirect (most reliable for SPAs)
export const loginWithRedirect = async () => {
  if (!initialized) {
    await initializeMsal();
  }
  
  try {
    await msalInstance.loginRedirect({
      ...loginRequest,
      prompt: 'select_account',
    });
  } catch (error) {
    console.error('[MSAL] Redirect login error:', error);
    throw error;
  }
};

// Get current account
export const getAccount = () => {
  const accounts = msalInstance.getAllAccounts();
  return accounts.length > 0 ? accounts[0] : null;
};

// Clear MSAL data
export const clearMsalData = () => {
  // Clear session storage MSAL keys
  const keys = Object.keys(sessionStorage);
  keys.forEach(key => {
    if (key.startsWith('msal.') || key.includes('login.microsoftonline')) {
      sessionStorage.removeItem(key);
    }
  });
  console.log('[MSAL] Data cleared');
};

export default msalInstance;
