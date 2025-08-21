// Security and CAPTCHA Management System

// Storage keys
const FAILED_LOGIN_ATTEMPTS_KEY = 'failed_login_attempts';
const SUSPICIOUS_ACTIVITY_KEY = 'suspicious_activity';
const IP_BLACKLIST_KEY = 'ip_blacklist';
const APPOINTMENT_ATTEMPTS_KEY = 'appointment_attempts';

// Configuration
const SECURITY_CONFIG = {
  MAX_FAILED_LOGINS: 5,           // Max failed login attempts before CAPTCHA
  MAX_APPOINTMENTS_PER_IP: 10,    // Max appointments per IP per day
  MAX_APPOINTMENTS_PER_EMAIL: 5,  // Max appointments per email per day
  MAX_APPOINTMENTS_PER_PHONE: 3,  // Max appointments per phone per day
  SUSPICIOUS_ACTIVITY_WINDOW: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  CAPTCHA_COOLDOWN: 30 * 60 * 1000, // 30 minutes CAPTCHA cooldown
  IP_BLACKLIST_DURATION: 24 * 60 * 60 * 1000, // 24 hours blacklist
};

// Types
export interface FailedLoginAttempt {
  timestamp: number;
  ip: string;
  userAgent: string;
}

export interface SuspiciousActivity {
  type: 'login_attempts' | 'appointment_spam' | 'ip_blacklist';
  timestamp: number;
  details: string;
  ip: string;
  userAgent: string;
}

export interface AppointmentAttempt {
  timestamp: number;
  ip: string;
  email: string;
  phone: string;
  userAgent: string;
}

export interface SecurityStatus {
  requiresCaptcha: boolean;
  reason: string;
  cooldownRemaining?: number;
  attemptsRemaining?: number;
}

// Utility functions
let cachedClientIP: string | null = null;

const getClientIP = (): string => {
  // Cache the IP for the session to ensure consistent tracking
  if (!cachedClientIP) {
    // In a real app, this would get the actual IP from headers
    // For now, we'll use a combination of user agent and a session-based identifier
    const sessionId = sessionStorage.getItem('security_session_id') || Math.random().toString(36).substring(2);
    sessionStorage.setItem('security_session_id', sessionId);
    cachedClientIP = `${navigator.userAgent.slice(0, 20)}_${sessionId}`;
  }
  return cachedClientIP;
};

const getCurrentTimestamp = (): number => Date.now();

const cleanOldEntries = <T extends { timestamp: number }>(entries: T[], maxAge: number): T[] => {
  const cutoff = getCurrentTimestamp() - maxAge;
  return entries.filter(entry => entry.timestamp > cutoff);
};

// Storage helpers
const getStorageData = <T>(key: string, defaultValue: T): T => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch (error) {
    console.error(`Error reading storage key ${key}:`, error);
    return defaultValue;
  }
};

const setStorageData = <T>(key: string, data: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error writing storage key ${key}:`, error);
  }
};

// Failed login tracking
export const recordFailedLogin = (username: string): void => {
  const attempts: FailedLoginAttempt[] = getStorageData(FAILED_LOGIN_ATTEMPTS_KEY, []);
  const currentIP = getClientIP();
  
  // Clean old attempts
  const cleanedAttempts = cleanOldEntries(attempts, SECURITY_CONFIG.SUSPICIOUS_ACTIVITY_WINDOW);
  
  // Add new attempt
  cleanedAttempts.push({
    timestamp: getCurrentTimestamp(),
    ip: currentIP,
    userAgent: navigator.userAgent
  });
  
  setStorageData(FAILED_LOGIN_ATTEMPTS_KEY, cleanedAttempts);
  
  // Record suspicious activity if threshold exceeded
  if (cleanedAttempts.length >= SECURITY_CONFIG.MAX_FAILED_LOGINS) {
    recordSuspiciousActivity('login_attempts', `Multiple failed login attempts for username: ${username}`);
  }
};

export const clearFailedLogins = (): void => {
  localStorage.removeItem(FAILED_LOGIN_ATTEMPTS_KEY);
};

export const getFailedLoginCount = (): number => {
  const attempts: FailedLoginAttempt[] = getStorageData(FAILED_LOGIN_ATTEMPTS_KEY, []);
  const currentIP = getClientIP();
  
  // Count attempts from current IP in the last 24 hours
  const cutoff = getCurrentTimestamp() - SECURITY_CONFIG.SUSPICIOUS_ACTIVITY_WINDOW;
  const count = attempts.filter(attempt => 
    attempt.ip === currentIP && attempt.timestamp > cutoff
  ).length;
  
  return count;
};

// Appointment spam detection
export const recordAppointmentAttempt = (email: string, phone: string): void => {
  const attempts: AppointmentAttempt[] = getStorageData(APPOINTMENT_ATTEMPTS_KEY, []);
  const currentIP = getClientIP();
  
  // Clean old attempts
  const cleanedAttempts = cleanOldEntries(attempts, SECURITY_CONFIG.SUSPICIOUS_ACTIVITY_WINDOW);
  
  // Add new attempt
  cleanedAttempts.push({
    timestamp: getCurrentTimestamp(),
    ip: currentIP,
    email: email.toLowerCase(),
    phone: phone.replace(/\D/g, ''), // Remove non-digits
    userAgent: navigator.userAgent
  });
  
  setStorageData(APPOINTMENT_ATTEMPTS_KEY, cleanedAttempts);
  
  // Check for spam patterns
  const ipAttempts = cleanedAttempts.filter(attempt => attempt.ip === currentIP);
  const emailAttempts = cleanedAttempts.filter(attempt => 
    attempt.email === email.toLowerCase()
  );
  const phoneAttempts = cleanedAttempts.filter(attempt => 
    attempt.phone === phone.replace(/\D/g, '')
  );
  
  if (ipAttempts.length > SECURITY_CONFIG.MAX_APPOINTMENTS_PER_IP) {
    recordSuspiciousActivity('appointment_spam', `Too many appointments from IP: ${ipAttempts.length} attempts`);
  }
  
  if (emailAttempts.length > SECURITY_CONFIG.MAX_APPOINTMENTS_PER_EMAIL) {
    recordSuspiciousActivity('appointment_spam', `Too many appointments with email: ${emailAttempts.length} attempts`);
  }
  
  if (phoneAttempts.length > SECURITY_CONFIG.MAX_APPOINTMENTS_PER_PHONE) {
    recordSuspiciousActivity('appointment_spam', `Too many appointments with phone: ${phoneAttempts.length} attempts`);
  }
};

export const getAppointmentAttemptCounts = () => {
  const attempts: AppointmentAttempt[] = getStorageData(APPOINTMENT_ATTEMPTS_KEY, []);
  const currentIP = getClientIP();
  const cutoff = getCurrentTimestamp() - SECURITY_CONFIG.SUSPICIOUS_ACTIVITY_WINDOW;
  
  const recentAttempts = attempts.filter(attempt => attempt.timestamp > cutoff);
  
  return {
    ipCount: recentAttempts.filter(attempt => attempt.ip === currentIP).length,
    emailCount: recentAttempts.filter(attempt => 
      attempt.email === attempts[attempts.length - 1]?.email
    ).length,
    phoneCount: recentAttempts.filter(attempt => 
      attempt.phone === attempts[attempts.length - 1]?.phone
    ).length
  };
};

// Suspicious activity tracking
export const recordSuspiciousActivity = (type: SuspiciousActivity['type'], details: string): void => {
  const activities: SuspiciousActivity[] = getStorageData(SUSPICIOUS_ACTIVITY_KEY, []);
  const currentIP = getClientIP();
  
  // Clean old activities
  const cleanedActivities = cleanOldEntries(activities, SECURITY_CONFIG.SUSPICIOUS_ACTIVITY_WINDOW);
  
  // Add new activity
  cleanedActivities.push({
    type,
    timestamp: getCurrentTimestamp(),
    details,
    ip: currentIP,
    userAgent: navigator.userAgent
  });
  
  setStorageData(SUSPICIOUS_ACTIVITY_KEY, cleanedActivities);
  
  // If multiple suspicious activities, consider blacklisting IP
  const ipActivities = cleanedActivities.filter(activity => activity.ip === currentIP);
  if (ipActivities.length >= 3) {
    blacklistIP(currentIP);
  }
};

// IP blacklisting
export const blacklistIP = (ip: string): void => {
  const blacklist: { ip: string; timestamp: number }[] = getStorageData(IP_BLACKLIST_KEY, []);
  
  // Clean old blacklist entries
  const cleanedBlacklist = cleanOldEntries(blacklist, SECURITY_CONFIG.IP_BLACKLIST_DURATION);
  
  // Add to blacklist
  cleanedBlacklist.push({
    ip,
    timestamp: getCurrentTimestamp()
  });
  
  setStorageData(IP_BLACKLIST_KEY, cleanedBlacklist);
};

export const isIPBlacklisted = (): boolean => {
  const blacklist: { ip: string; timestamp: number }[] = getStorageData(IP_BLACKLIST_KEY, []);
  const currentIP = getClientIP();
  
  return blacklist.some(entry => entry.ip === currentIP);
};

// Main security check function
export const checkSecurityStatus = (): SecurityStatus => {
  const currentIP = getClientIP();
  const now = getCurrentTimestamp();
  
  // Check if IP is blacklisted
  if (isIPBlacklisted()) {
    return {
      requiresCaptcha: true,
      reason: 'IP address has been temporarily blocked due to suspicious activity',
      cooldownRemaining: SECURITY_CONFIG.IP_BLACKLIST_DURATION
    };
  }
  
  // Check failed login attempts
  const failedLoginCount = getFailedLoginCount();
  if (failedLoginCount >= SECURITY_CONFIG.MAX_FAILED_LOGINS) {
    const lastAttempt = getStorageData(FAILED_LOGIN_ATTEMPTS_KEY, []).pop();
    const timeSinceLastAttempt = lastAttempt ? now - lastAttempt.timestamp : 0;
    
    if (timeSinceLastAttempt < SECURITY_CONFIG.CAPTCHA_COOLDOWN) {
      return {
        requiresCaptcha: true,
        reason: `Too many failed login attempts (${failedLoginCount}). Please complete CAPTCHA to proceed.`,
        attemptsRemaining: SECURITY_CONFIG.MAX_FAILED_LOGINS - failedLoginCount,
        cooldownRemaining: SECURITY_CONFIG.CAPTCHA_COOLDOWN - timeSinceLastAttempt
      };
    } else {
      // Reset after cooldown
      clearFailedLogins();
    }
  }
  
  // Only check appointment spam if we're on the appointment page
  // For admin login, we only care about failed login attempts
  const isOnAppointmentPage = window.location.pathname.includes('/appointment');
  if (isOnAppointmentPage) {
    const appointmentCounts = getAppointmentAttemptCounts();
    if (appointmentCounts.ipCount > SECURITY_CONFIG.MAX_APPOINTMENTS_PER_IP ||
        appointmentCounts.emailCount > SECURITY_CONFIG.MAX_APPOINTMENTS_PER_EMAIL ||
        appointmentCounts.phoneCount > SECURITY_CONFIG.MAX_APPOINTMENTS_PER_PHONE) {
      return {
        requiresCaptcha: true,
        reason: 'Suspicious appointment booking pattern detected. Please complete CAPTCHA.',
        attemptsRemaining: Math.max(
          SECURITY_CONFIG.MAX_APPOINTMENTS_PER_IP - appointmentCounts.ipCount,
          SECURITY_CONFIG.MAX_APPOINTMENTS_PER_EMAIL - appointmentCounts.emailCount,
          SECURITY_CONFIG.MAX_APPOINTMENTS_PER_PHONE - appointmentCounts.phoneCount
        )
      };
    }
  }
  
  return {
    requiresCaptcha: false,
    reason: ''
  };
};

// CAPTCHA validation
export const validateCaptcha = (userInput: string, correctAnswer: string): boolean => {
  return userInput.toLowerCase().trim() === correctAnswer.toLowerCase().trim();
};

// Generate simple CAPTCHA
export const generateCaptcha = (): { question: string; answer: string } => {
  const operations = [
    { op: '+', fn: (a: number, b: number) => a + b },
    { op: '-', fn: (a: number, b: number) => a - b },
    { op: '×', fn: (a: number, b: number) => a * b }
  ];
  
  const operation = operations[Math.floor(Math.random() * operations.length)];
  const num1 = Math.floor(Math.random() * 10) + 1;
  const num2 = Math.floor(Math.random() * 10) + 1;
  
  const question = `What is ${num1} ${operation.op} ${num2}?`;
  const answer = operation.fn(num1, num2).toString();
  
  return { question, answer };
};

// Reset security for successful actions
export const resetSecurityOnSuccess = (): void => {
  clearFailedLogins();
  // Note: We don't clear appointment attempts as they're legitimate tracking
};

// Reset cached IP (for testing)
export const resetCachedIP = (): void => {
  cachedClientIP = null;
};
