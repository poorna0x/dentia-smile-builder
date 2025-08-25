import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

interface UseSmartCaptchaReturn {
  isCaptchaVisible: boolean;
  failedAttempts: number;
  showCaptcha: () => void;
  hideCaptcha: () => void;
  incrementFailedAttempts: () => void;
  resetFailedAttempts: () => void;
  verifyCaptcha: (userAnswer: string, expectedAnswer: string) => Promise<boolean>;
}

const CAPTCHA_THRESHOLD = 5; // Show CAPTCHA after 5 failed attempts
const CAPTCHA_STORAGE_KEY = 'smart_captcha_attempts';

export const useSmartCaptcha = (): UseSmartCaptchaReturn => {
  const [isCaptchaVisible, setIsCaptchaVisible] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);

  // Load failed attempts from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(CAPTCHA_STORAGE_KEY);
    if (stored) {
      try {
        const data = JSON.parse(stored);
        const now = Date.now();
        const oneHourAgo = now - (60 * 60 * 1000); // 1 hour ago
        
        // Only use stored attempts if they're from the last hour
        if (data.timestamp > oneHourAgo) {
          setFailedAttempts(data.attempts);
          
          // Show CAPTCHA if threshold is met
          if (data.attempts >= CAPTCHA_THRESHOLD) {
            setIsCaptchaVisible(true);
          }
        } else {
          // Clear old attempts
          localStorage.removeItem(CAPTCHA_STORAGE_KEY);
        }
      } catch (error) {
        console.error('Error parsing stored CAPTCHA attempts:', error);
        localStorage.removeItem(CAPTCHA_STORAGE_KEY);
      }
    }
  }, []);

  // Save failed attempts to localStorage
  const saveFailedAttempts = useCallback((attempts: number) => {
    const data = {
      attempts,
      timestamp: Date.now()
    };
    localStorage.setItem(CAPTCHA_STORAGE_KEY, JSON.stringify(data));
  }, []);

  const showCaptcha = useCallback(() => {
    setIsCaptchaVisible(true);
  }, []);

  const hideCaptcha = useCallback(() => {
    setIsCaptchaVisible(false);
  }, []);

  const incrementFailedAttempts = useCallback(() => {
    const newAttempts = failedAttempts + 1;
    setFailedAttempts(newAttempts);
    saveFailedAttempts(newAttempts);

    // Show CAPTCHA when threshold is reached
    if (newAttempts >= CAPTCHA_THRESHOLD) {
      setIsCaptchaVisible(true);
    }
  }, [failedAttempts, saveFailedAttempts]);

  const resetFailedAttempts = useCallback(() => {
    setFailedAttempts(0);
    setIsCaptchaVisible(false);
    localStorage.removeItem(CAPTCHA_STORAGE_KEY);
  }, []);

  const verifyCaptcha = useCallback(async (userAnswer: string, expectedAnswer: string): Promise<boolean> => {
    // Simple math verification
    const isCorrect = userAnswer.trim() === expectedAnswer.trim();
    
    // Log the CAPTCHA attempt
    try {
      await supabase.rpc('log_captcha_attempt', {
        p_email: null, // We don't have email in this context
        p_attempt_type: isCorrect ? 'captcha_verification_success' : 'captcha_verification_failed',
        p_failed_attempts_count: failedAttempts,
        p_captcha_question: 'math_problem', // Generic description
        p_captcha_answer: expectedAnswer,
        p_user_answer: userAnswer,
        p_is_successful: isCorrect
      });
    } catch (error) {
      console.error('Error logging CAPTCHA attempt:', error);
    }
    
    if (isCorrect) {
      // Log successful CAPTCHA verification
      try {
        await supabase.from('security_audit_log').insert({
          event_type: 'captcha_verification_success',
          details: {
            failed_attempts: failedAttempts,
            user_ip: 'client_ip', // Will be set by database function
            timestamp: new Date().toISOString()
          }
        });
      } catch (error) {
        console.error('Error logging CAPTCHA success:', error);
      }
      
      // Reset failed attempts on successful verification
      resetFailedAttempts();
      return true;
    } else {
      // Log failed CAPTCHA verification
      try {
        await supabase.from('security_audit_log').insert({
          event_type: 'captcha_verification_failed',
          details: {
            failed_attempts: failedAttempts,
            user_ip: 'client_ip', // Will be set by database function
            timestamp: new Date().toISOString()
          }
        });
      } catch (error) {
        console.error('Error logging CAPTCHA failure:', error);
      }
      
      return false;
    }
  }, [failedAttempts, resetFailedAttempts]);

  return {
    isCaptchaVisible,
    failedAttempts,
    showCaptcha,
    hideCaptcha,
    incrementFailedAttempts,
    resetFailedAttempts,
    verifyCaptcha
  };
};
