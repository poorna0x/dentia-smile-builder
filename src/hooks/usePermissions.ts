import { useState, useEffect, useCallback } from 'react';
import { useClinic } from '@/contexts/ClinicContext';
import { staffPermissionsApi } from '@/lib/supabase';

export type UserRole = 'dentist' | 'staff';

export const usePermissions = () => {
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [staffPermissions, setStaffPermissions] = useState({
    canAccessSettings: false,
    canAccessPatientPortal: false,
    canAccessPaymentAnalytics: false
  });
  const [permissionsLoaded, setPermissionsLoaded] = useState(false);
  const [permissionsLoading, setPermissionsLoading] = useState(true);
  const { clinic } = useClinic();

  useEffect(() => {
    // Get role from sessionStorage
    const role = sessionStorage.getItem('userRole') as UserRole;
    setUserRole(role);
  }, []);

  // Load staff permissions from database when clinic is available
  useEffect(() => {
    const loadStaffPermissions = async () => {
      setPermissionsLoading(true);
      
      if (clinic?.id && userRole === 'staff') {
        console.log('🔄 Initial load of staff permissions for clinic:', clinic.id);
        try {
          const permissions = await staffPermissionsApi.getByClinic(clinic.id);
          console.log('📥 Initial permissions loaded from database:', permissions);
          if (permissions) {
            setStaffPermissions({
              canAccessSettings: permissions.can_access_settings,
              canAccessPatientPortal: permissions.can_access_patient_portal,
              canAccessPaymentAnalytics: permissions.can_access_payment_analytics ?? false
            });
            console.log('✅ Initial staff permissions state set:', {
              canAccessSettings: permissions.can_access_settings,
              canAccessPatientPortal: permissions.can_access_patient_portal,
              canAccessPaymentAnalytics: permissions.can_access_payment_analytics ?? false
            });
          }
        } catch (error) {
          console.error('❌ Error loading staff permissions:', error);
        } finally {
          setPermissionsLoaded(true);
          setPermissionsLoading(false);
        }
      } else if (userRole === 'dentist') {
        // Dentists don't need to load staff permissions, they have all permissions
        setPermissionsLoaded(true);
        setPermissionsLoading(false);
        console.log('🔍 Dentist detected - setting permissions loaded to true');
      } else {
        setPermissionsLoading(false);
      }
    };

    // Only load if we haven't loaded yet or if this is the initial load
    if (!permissionsLoaded) {
      loadStaffPermissions();
    }
  }, [clinic?.id, userRole, permissionsLoaded]);

  const isDentist = userRole === 'dentist';
  const isStaff = userRole === 'staff';

  const hasPermission = useCallback((permission: string): boolean => {
    // Dentists have all permissions - return true immediately
    if (isDentist) {
      console.log('🔍 Permission check (dentist):', {
        permission,
        isDentist,
        result: true
      });
      return true;
    }
    
    // Staff permissions from database
    if (isStaff && permissionsLoaded) {
      const result = (() => {
        switch (permission) {
          case 'view_appointments':
          case 'mark_complete':
          case 'view_patient_basic_info':
            return true;
          case 'access_patient_portal':
            return staffPermissions.canAccessPatientPortal;
          case 'change_settings':
            return staffPermissions.canAccessSettings;
          case 'access_payment_analytics':
            return staffPermissions.canAccessPaymentAnalytics;
          case 'canAccessAnalytics':
            return false; // Only dentists can access analytics
          default:
            return false;
        }
      })();
      
      console.log('🔍 Permission check:', {
        permission,
        isStaff,
        permissionsLoaded,
        staffPermissions,
        result
      });
      
      return result;
    }
    
    // If permissions are not loaded yet, but user is dentist, they should have access
    if (isDentist) {
      console.log('🔍 Permission check (dentist, not loaded):', {
        permission,
        isDentist,
        result: true
      });
      return true;
    }
    
    console.log('🔍 Permission check (not loaded):', {
      permission,
      isStaff,
      permissionsLoaded,
      staffPermissions
    });
    
    return false;
  }, [isDentist, isStaff, permissionsLoaded, staffPermissions.canAccessPatientPortal, staffPermissions.canAccessSettings]);

  const clearRole = () => {
    sessionStorage.removeItem('userRole');
    setUserRole(null);
  };

  const refreshPermissions = useCallback(async () => {
    if (clinic?.id && userRole === 'staff') {
      console.log('🔄 Refreshing staff permissions for clinic:', clinic.id);
      try {
        const permissions = await staffPermissionsApi.getByClinic(clinic.id);
        console.log('📥 Loaded permissions from database:', permissions);
        if (permissions) {
          setStaffPermissions({
            canAccessSettings: permissions.can_access_settings,
            canAccessPatientPortal: permissions.can_access_patient_portal,
            canAccessPaymentAnalytics: permissions.can_access_payment_analytics ?? false
          });
          console.log('✅ Updated staff permissions state:', {
            canAccessSettings: permissions.can_access_settings,
            canAccessPatientPortal: permissions.can_access_patient_portal,
            canAccessPaymentAnalytics: permissions.can_access_payment_analytics ?? false
          });
        }
      } catch (error) {
        console.error('❌ Error refreshing staff permissions:', error);
      }
    }
  }, [clinic?.id, userRole]);

  return {
    userRole,
    isDentist,
    isStaff,
    hasPermission,
    clearRole,
    refreshPermissions,
    permissionsLoading
  };
};
