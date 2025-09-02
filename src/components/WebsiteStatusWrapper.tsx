import React from 'react';
import { useFeatureToggles } from '../hooks/useFeatureToggles';
import WebsiteDisabled from './WebsiteDisabled';
import { useLocation } from 'react-router-dom';

interface WebsiteStatusWrapperProps {
  children: React.ReactNode;
}

const WebsiteStatusWrapper: React.FC<WebsiteStatusWrapperProps> = ({ children }) => {
  const { isFeatureEnabled, isLoading, features } = useFeatureToggles();
  const location = useLocation();

  // Debug logging

  // Show loading while checking feature toggles
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Check if website is enabled
  const websiteEnabled = isFeatureEnabled('websiteEnabled');

  // Always allow access to Super Admin page, even when website is disabled
  if (location.pathname === '/super-admin') {
    return <>{children}</>;
  }

  // If website is disabled, show the disabled page
  if (!websiteEnabled) {
    return (
      <WebsiteDisabled 
        message="The website has been temporarily disabled by the system administrator."
        onRetry={() => window.location.reload()}
      />
    );
  }
  // If website is enabled, show the normal content
  return <>{children}</>;
};

export default WebsiteStatusWrapper;
