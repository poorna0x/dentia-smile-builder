// Secure Admin Authentication System

// Admin credentials from environment variables
const ADMIN_USERNAME = import.meta.env.VITE_ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'admin123';

// Session storage keys
const ADMIN_SESSION_KEY = 'admin_session';
const ADMIN_SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours

export interface AdminCredentials {
  username: string;
  password: string;
}

export interface AdminSession {
  username: string;
  loginTime: number;
  expiresAt: number;
}

// Check if admin is logged in
export const isAdminLoggedIn = (): boolean => {
  try {
    const sessionData = sessionStorage.getItem(ADMIN_SESSION_KEY);
    if (!sessionData) return false;

    const session: AdminSession = JSON.parse(sessionData);
    const now = Date.now();

    // Check if session has expired
    if (now > session.expiresAt) {
      clearAdminSession();
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error checking admin session:', error);
    clearAdminSession();
    return false;
  }
};

// Authenticate admin
export const authenticateAdmin = (credentials: AdminCredentials): boolean => {
  try {
    // Validate credentials against environment variables
    if (credentials.username === ADMIN_USERNAME && credentials.password === ADMIN_PASSWORD) {
      // Create session
      const session: AdminSession = {
        username: credentials.username,
        loginTime: Date.now(),
        expiresAt: Date.now() + ADMIN_SESSION_TIMEOUT
      };

      // Store session
      sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
      return true;
    }

    return false;
  } catch (error) {
    console.error('Authentication error:', error);
    return false;
  }
};

// Clear admin session
export const clearAdminSession = (): void => {
  try {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
  } catch (error) {
    console.error('Error clearing admin session:', error);
  }
};

// Get current admin session
export const getAdminSession = (): AdminSession | null => {
  try {
    const sessionData = sessionStorage.getItem(ADMIN_SESSION_KEY);
    if (!sessionData) return null;

    const session: AdminSession = JSON.parse(sessionData);
    const now = Date.now();

    if (now > session.expiresAt) {
      clearAdminSession();
      return null;
    }

    return session;
  } catch (error) {
    console.error('Error getting admin session:', error);
    return null;
  }
};

// Extend session (keep admin logged in)
export const extendAdminSession = (): boolean => {
  try {
    const session = getAdminSession();
    if (!session) return false;

    // Extend session by 24 hours
    session.expiresAt = Date.now() + ADMIN_SESSION_TIMEOUT;
    sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
    return true;
  } catch (error) {
    console.error('Error extending admin session:', error);
    return false;
  }
};


