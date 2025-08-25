import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
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

export const useFeatureToggles = (): UseFeatureTogglesReturn => {
  const [features, setFeatures] = useState<FeatureToggles>(defaultFeatures);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFeatureToggles = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('🔍 Loading feature toggles from database...');

      // Try to get feature toggles from database
      const { data, error: dbError } = await supabase
        .from('system_settings')
        .select('settings')
        .eq('setting_type', 'feature_toggle')
        .single();

      console.log('🔍 Database response:', { data, error: dbError });

      if (dbError) {
        console.warn('Failed to load feature toggles from database, using defaults:', dbError);
        // Use default features if database is not available
        setFeatures(defaultFeatures);
      } else if (data?.settings) {
        const mergedFeatures = {
          ...defaultFeatures,
          ...data.settings
        };
        console.log('🔍 Setting features from database:', mergedFeatures);
        setFeatures(mergedFeatures);
      } else {
        console.log('🔍 No data from database, using defaults:', defaultFeatures);
        setFeatures(defaultFeatures);
      }
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
