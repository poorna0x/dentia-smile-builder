import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Shield, Clock, RefreshCw } from 'lucide-react';

interface WebsiteDisabledProps {
  message?: string;
  onRetry?: () => void;
}

const WebsiteDisabled: React.FC<WebsiteDisabledProps> = ({ 
  message = "The website is temporarily unavailable due to maintenance or emergency shutdown.",
  onRetry 
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4 p-3 bg-red-100 rounded-full w-fit">
            <Shield className="h-8 w-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-red-800">
            🚨 Website Temporarily Unavailable
          </CardTitle>
          <CardDescription className="text-red-600">
            {message}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
            <Clock className="h-4 w-4" />
            <span>Please try again later</span>
          </div>
          
          {onRetry && (
            <Button 
              onClick={onRetry} 
              variant="outline" 
              className="w-full"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          )}
          
          <div className="text-xs text-gray-500 mt-4">
            <p>If this issue persists, please contact the system administrator.</p>
            <p className="mt-1">Error Code: WEBSITE_DISABLED</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WebsiteDisabled;
