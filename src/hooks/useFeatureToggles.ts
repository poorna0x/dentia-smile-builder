import { useState, useEffect } from 'react';
import { featureToggleEvents } from '@/lib/feature-toggle-events';

interface FeatureToggles {
  websiteEnabled: boolean;
  patientManagementEnabled: boolean;
  appointmentBookingEnabled: boolean;
  adminPanelEnabled: boolean;
  realtimeUpdatesEnabled: boolean;
  emailNotificationsEnabled: boolean;
  paymentSystemEnabled: boolean;
}

interface UseFeatureTogglesReturn {
  features: FeatureToggles;
  isLoading: boolean;
  error: string | null;
  isFeatureEnabled: (feature: keyof FeatureToggles) => boolean;
  refreshToggles: () => Promise<void>;
  updateFeatureToggle: (feature: keyof FeatureToggles, enabled: boolean) => void;
}

const defaultFeatures: FeatureToggles = {
  websiteEnabled: true,
  patientManagementEnabled: true,
  appointmentBookingEnabled: true,
  adminPanelEnabled: true,
  realtimeUpdatesEnabled: true,
  emailNotificationsEnabled: true,
  paymentSystemEnabled: true,
};

// Load feature toggles from environment variables or local storage
const loadFeatureTogglesFromStorage = (): FeatureToggles => {
  try {
    // Try to load from localStorage first
    const stored = localStorage.getItem('feature_toggles');
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...defaultFeatures, ...parsed };
    }
  } catch (error) {
    console.warn('Failed to load feature toggles from localStorage:', error);
  }

  // Fallback to environment variables
  const envFeatures: Partial<FeatureToggles> = {};
  
  // Check for environment variables (for build-time configuration)
  if (typeof window !== 'undefined') {
    // Client-side environment variables
    const env = (window as any).__ENV__ || {};
    
    if (env.VITE_WEBSITE_ENABLED !== undefined) {
      envFeatures.websiteEnabled = env.VITE_WEBSITE_ENABLED === 'true';
    }
    if (env.VITE_PATIENT_MANAGEMENT_ENABLED !== undefined) {
      envFeatures.patientManagementEnabled = env.VITE_PATIENT_MANAGEMENT_ENABLED === 'true';
    }
    if (env.VITE_APPOINTMENT_BOOKING_ENABLED !== undefined) {
      envFeatures.appointmentBookingEnabled = env.VITE_APPOINTMENT_BOOKING_ENABLED === 'true';
    }
    if (env.VITE_ADMIN_PANEL_ENABLED !== undefined) {
      envFeatures.adminPanelEnabled = env.VITE_ADMIN_PANEL_ENABLED === 'true';
    }
    if (env.VITE_REALTIME_UPDATES_ENABLED !== undefined) {
      envFeatures.realtimeUpdatesEnabled = env.VITE_REALTIME_UPDATES_ENABLED === 'true';
    }
    if (env.VITE_EMAIL_NOTIFICATIONS_ENABLED !== undefined) {
      envFeatures.emailNotificationsEnabled = env.VITE_EMAIL_NOTIFICATIONS_ENABLED === 'true';
    }
    if (env.VITE_PAYMENT_SYSTEM_ENABLED !== undefined) {
      envFeatures.paymentSystemEnabled = env.VITE_PAYMENT_SYSTEM_ENABLED === 'true';
    }
  }

  return { ...defaultFeatures, ...envFeatures };
};

// Save feature toggles to localStorage
const saveFeatureTogglesToStorage = (features: FeatureToggles) => {
  try {
    localStorage.setItem('feature_toggles', JSON.stringify(features));
    console.log('🔍 Saved feature toggles to localStorage:', features);
  } catch (error) {
    console.warn('Failed to save feature toggles to localStorage:', error);
  }
};

export const useFeatureToggles = (): UseFeatureTogglesReturn => {
  const [features, setFeatures] = useState<FeatureToggles>(defaultFeatures);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFeatureToggles = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('🔍 Loading feature toggles from storage...');

      const loadedFeatures = loadFeatureTogglesFromStorage();
      
      console.log('🔍 Loaded feature toggles:', loadedFeatures);
      setFeatures(loadedFeatures);
    } catch (err) {
      console.error('Error loading feature toggles:', err);
      setError('Failed to load feature toggles');
      // Use default features on error
      setFeatures(defaultFeatures);
    } finally {
      setIsLoading(false);
    }
  };

  const isFeatureEnabled = (feature: keyof FeatureToggles): boolean => {
    return features[feature] ?? true; // Default to true if not found
  };

  const refreshToggles = async () => {
    console.log('🔄 Manually refreshing feature toggles...');
    await loadFeatureToggles();
  };

  const updateFeatureToggle = (feature: keyof FeatureToggles, enabled: boolean) => {
    const updatedFeatures = { ...features, [feature]: enabled };
    setFeatures(updatedFeatures);
    saveFeatureTogglesToStorage(updatedFeatures);
    console.log(`🔍 Updated feature toggle ${feature}: ${enabled}`);
  };

  useEffect(() => {
    loadFeatureToggles();
    
    // Subscribe to feature toggle change events
    const unsubscribe = featureToggleEvents.subscribe(() => {
      console.log('🔄 Received feature toggle change event, refreshing...');
      loadFeatureToggles();
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return {
    features,
    isLoading,
    error,
    isFeatureEnabled,
    refreshToggles,
    updateFeatureToggle,
  };
};

// Convenience hooks for specific features
export const useWebsiteEnabled = () => {
  const { isFeatureEnabled } = useFeatureToggles();
  return isFeatureEnabled('websiteEnabled');
};

export const usePatientManagementEnabled = () => {
  const { isFeatureEnabled } = useFeatureToggles();
  return isFeatureEnabled('patientManagementEnabled');
};

export const useAppointmentBookingEnabled = () => {
  const { isFeatureEnabled } = useFeatureToggles();
  return isFeatureEnabled('appointmentBookingEnabled');
};

export const useAdminPanelEnabled = () => {
  const { isFeatureEnabled } = useFeatureToggles();
  return isFeatureEnabled('adminPanelEnabled');
};

export const useRealtimeUpdatesEnabled = () => {
  const { isFeatureEnabled } = useFeatureToggles();
  return isFeatureEnabled('realtimeUpdatesEnabled');
};

export const useEmailNotificationsEnabled = () => {
  const { isFeatureEnabled } = useFeatureToggles();
  return isFeatureEnabled('emailNotificationsEnabled');
};

export const usePaymentSystemEnabled = () => {
  const { isFeatureEnabled } = useFeatureToggles();
  return isFeatureEnabled('paymentSystemEnabled');
};
