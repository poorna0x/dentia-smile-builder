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
  const [roleInitialized, setRoleInitialized] = useState(false);
  const { clinic } = useClinic();

  // Initialize role from sessionStorage only once
  useEffect(() => {
    if (!roleInitialized) {
      const role = sessionStorage.getItem('userRole') as UserRole;
      setUserRole(role);
      setRoleInitialized(true);
    }
  }, [roleInitialized]);

  // Listen for role changes in sessionStorage (for cross-tab synchronization)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'userRole') {
        const newRole = e.newValue as UserRole;
        setUserRole(newRole);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Load staff permissions from database when clinic is available
  useEffect(() => {
    const loadStaffPermissions = async () => {
      setPermissionsLoading(true);
      
      if (clinic?.id && userRole === 'staff') {
        try {
          const permissions = await staffPermissionsApi.getByClinic(clinic.id);
          if (permissions) {
            setStaffPermissions({
              canAccessSettings: permissions.can_access_settings,
              canAccessPatientPortal: permissions.can_access_patient_portal,
              canAccessPaymentAnalytics: permissions.can_access_payment_analytics ?? false
            });
          } else {
            // Set default permissions if no record exists
            setStaffPermissions({
              canAccessSettings: false,
              canAccessPatientPortal: true,
              canAccessPaymentAnalytics: false
            });
          }
        } catch (error) {
          console.error('Error loading staff permissions:', error);
          // Set default permissions on error
          setStaffPermissions({
            canAccessSettings: false,
            canAccessPatientPortal: true,
            canAccessPaymentAnalytics: false
          });
        } finally {
          setPermissionsLoaded(true);
          setPermissionsLoading(false);
        }
      } else if (userRole === 'dentist') {
        // Dentists don't need to load staff permissions, they have all permissions
        setPermissionsLoaded(true);
        setPermissionsLoading(false);
      } else {
        setPermissionsLoading(false);
      }
    };

    // Only load if we haven't loaded yet or if this is the initial load
    if (!permissionsLoaded && roleInitialized) {
      loadStaffPermissions();
    }
  }, [clinic?.id, userRole, permissionsLoaded, roleInitialized]);

  const isDentist = userRole === 'dentist';
  const isStaff = userRole === 'staff';

  const hasPermission = useCallback((permission: string): boolean => {
    // Dentists have all permissions - return true immediately
    if (isDentist) {
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
      
      return result;
    }
    
    // If permissions are not loaded yet, but user is dentist, they should have access
    if (isDentist) {
      return true;
    }
    
    return false;
  }, [isDentist, isStaff, permissionsLoaded, staffPermissions.canAccessPatientPortal, staffPermissions.canAccessSettings]);

  const clearRole = useCallback(() => {
    sessionStorage.removeItem('userRole');
    setUserRole(null);
    setRoleInitialized(false);
  }, []);

  const setRole = useCallback((role: UserRole) => {
    sessionStorage.setItem('userRole', role);
    setUserRole(role);
  }, []);

  const refreshPermissions = useCallback(async () => {
    if (clinic?.id && userRole === 'staff') {
      try {
        const permissions = await staffPermissionsApi.getByClinic(clinic.id);
        if (permissions) {
          setStaffPermissions({
            canAccessSettings: permissions.can_access_settings,
            canAccessPatientPortal: permissions.can_access_patient_portal,
            canAccessPaymentAnalytics: permissions.can_access_payment_analytics ?? false
          });
        } else {
          // Set default permissions if no record exists
          setStaffPermissions({
            canAccessSettings: false,
            canAccessPatientPortal: true,
            canAccessPaymentAnalytics: false
          });
        }
      } catch (error) {
        console.error('Error refreshing staff permissions:', error);
        // Set default permissions on error
        setStaffPermissions({
          canAccessSettings: false,
          canAccessPatientPortal: true,
          canAccessPaymentAnalytics: false
        });
      }
    }
  }, [clinic?.id, userRole]);

  return {
    userRole,
    isDentist,
    isStaff,
    hasPermission,
    clearRole,
    setRole,
    refreshPermissions,
    permissionsLoading,
    roleInitialized
  };
};
