import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle, RefreshCw, Shield } from 'lucide-react';
import { generateCaptcha, validateCaptcha } from '@/lib/security';

interface CaptchaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  reason: string;
  cooldownRemaining?: number;
}

const CaptchaModal = ({ isOpen, onClose, onSuccess, reason, cooldownRemaining }: CaptchaModalProps) => {
  const [captcha, setCaptcha] = useState<{ question: string; answer: string } | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [cooldown, setCooldown] = useState(cooldownRemaining || 0);

  // Generate new CAPTCHA when modal opens
  useEffect(() => {
    if (isOpen) {
      setCaptcha(generateCaptcha());
      setUserAnswer('');
      setError('');
      setAttempts(0);
    }
  }, [isOpen]);

  // Handle cooldown countdown
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setInterval(() => {
        setCooldown(prev => {
          if (prev <= 1000) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1000;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [cooldown]);

  const handleRefreshCaptcha = () => {
    setCaptcha(generateCaptcha());
    setUserAnswer('');
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!captcha || !userAnswer.trim()) {
      setError('Please enter your answer');
      return;
    }

    setIsValidating(true);
    setError('');

    // Simulate validation delay
    await new Promise(resolve => setTimeout(resolve, 500));

    if (validateCaptcha(userAnswer, captcha.answer)) {
      // Success
      setIsValidating(false);
      onSuccess();
    } else {
      // Failed
      setAttempts(prev => prev + 1);
      setError('Incorrect answer. Please try again.');
      setUserAnswer('');
      
      // Generate new CAPTCHA after 3 failed attempts
      if (attempts >= 2) {
        handleRefreshCaptcha();
      }
      
      setIsValidating(false);
    }
  };

  const formatCooldown = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (cooldown > 0) {
    return (
      <Dialog open={isOpen} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <div className="flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mx-auto mb-4">
              <AlertTriangle className="h-8 w-8 text-orange-600" />
            </div>
            <DialogTitle className="text-xl font-bold text-center text-gray-900">
              Security Cooldown
            </DialogTitle>
            <DialogDescription className="text-center text-gray-600">
              Please wait before trying again
            </DialogDescription>
          </DialogHeader>
          
          <div className="text-center py-6">
            <div className="text-3xl font-bold text-orange-600 mb-2">
              {formatCooldown(cooldown)}
            </div>
            <p className="text-gray-600">
              Time remaining before you can try again
            </p>
          </div>
          
          <DialogFooter>
            <Button 
              onClick={onClose} 
              variant="outline" 
              className="w-full"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader>
          <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mx-auto mb-4">
            <Shield className="h-8 w-8 text-blue-600" />
          </div>
          <DialogTitle className="text-xl font-bold text-center text-gray-900">
            Security Verification Required
          </DialogTitle>
          <DialogDescription className="text-center text-gray-600">
            {reason}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          {/* CAPTCHA Question */}
          <div className="bg-gray-50 rounded-lg p-6 text-center">
            <Label className="text-sm font-medium text-gray-700 mb-2 block">
              Security Question
            </Label>
            <div className="text-2xl font-bold text-gray-900 mb-4">
              {captcha?.question}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRefreshCaptcha}
              className="text-xs"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              New Question
            </Button>
          </div>

          {/* Answer Input */}
          <div className="space-y-2">
            <Label htmlFor="captcha-answer" className="text-sm font-medium text-gray-700">
              Your Answer
            </Label>
            <Input
              id="captcha-answer"
              type="text"
              placeholder="Enter your answer"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              className="h-12 text-center text-lg font-semibold"
              disabled={isValidating}
              autoFocus
            />
            {error && (
              <p className="text-sm text-red-600 mt-1">{error}</p>
            )}
          </div>

          {/* Attempts Counter */}
          {attempts > 0 && (
            <div className="text-center">
              <p className="text-sm text-gray-500">
                Attempts: {attempts}/5
              </p>
            </div>
          )}
        </form>
        
        <DialogFooter className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={isValidating}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={isValidating || !userAnswer.trim()}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            {isValidating ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                <span>Verifying...</span>
              </div>
            ) : (
              'Verify'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CaptchaModal;
