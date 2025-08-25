import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { RefreshCw, Shield, AlertTriangle } from 'lucide-react';

interface SmartCaptchaProps {
  onVerify: (userAnswer: string, expectedAnswer: string) => Promise<boolean>;
  isVisible: boolean;
  failedAttempts: number;
  onReset: () => void;
}

const SmartCaptcha: React.FC<SmartCaptchaProps> = ({
  onVerify,
  isVisible,
  failedAttempts,
  onReset
}) => {
  const [captchaValue, setCaptchaValue] = useState('');
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isCorrect, setIsCorrect] = useState(false);

  // Generate a simple math CAPTCHA
  const generateCaptcha = () => {
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    const operators = ['+', '-', '×'];
    const operator = operators[Math.floor(Math.random() * operators.length)];
    
    let result;
    switch (operator) {
      case '+':
        result = num1 + num2;
        break;
      case '-':
        result = num1 - num2;
        break;
      case '×':
        result = num1 * num2;
        break;
      default:
        result = num1 + num2;
    }
    
    setCaptchaValue(result.toString());
    return `${num1} ${operator} ${num2} = ?`;
  };

  const [captchaQuestion, setCaptchaQuestion] = useState('');

  useEffect(() => {
    if (isVisible) {
      setCaptchaQuestion(generateCaptcha());
      setUserInput('');
      setError('');
      setIsCorrect(false);
    }
  }, [isVisible]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!userInput.trim()) {
      setError('Please enter the answer');
      setIsLoading(false);
      return;
    }

    try {
      const isValid = await onVerify(userInput.trim(), captchaValue);
      if (isValid) {
        setIsCorrect(true);
        // Reset after successful verification
        setTimeout(() => {
          onReset();
        }, 1000);
      } else {
        setError('Incorrect answer. Please try again.');
        setCaptchaQuestion(generateCaptcha());
        setUserInput('');
      }
    } catch (error) {
      setError('Verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    setCaptchaQuestion(generateCaptcha());
    setUserInput('');
    setError('');
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white border border-red-200 rounded-lg shadow-lg">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="w-5 h-5 text-red-600" />
        <h3 className="text-lg font-semibold text-gray-900">
          Security Verification Required
        </h3>
      </div>
      
      <div className="mb-4">
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Multiple failed login attempts detected. Please complete this security check to continue.
          </AlertDescription>
        </Alert>
        
        <p className="text-sm text-gray-600 mb-4">
          Failed attempts: <span className="font-semibold text-red-600">{failedAttempts}</span>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="captcha" className="text-sm font-medium text-gray-700">
            Solve this math problem:
          </Label>
          <div className="flex items-center gap-3">
            <div className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-md text-center">
              <span className="text-lg font-mono font-semibold text-gray-800">
                {captchaQuestion}
              </span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="flex-shrink-0"
              title="Generate new problem"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="answer" className="text-sm font-medium text-gray-700">
            Your Answer:
          </Label>
          <Input
            id="answer"
            type="number"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Enter the answer"
            className="text-center text-lg font-semibold"
            disabled={isLoading || isCorrect}
            autoFocus
          />
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isCorrect && (
          <Alert className="border-green-200 bg-green-50">
            <AlertDescription className="text-green-800">
              ✅ Verification successful! Redirecting...
            </AlertDescription>
          </Alert>
        )}

        <Button
          type="submit"
          className="w-full bg-red-600 hover:bg-red-700 text-white"
          disabled={isLoading || isCorrect}
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Verifying...
            </div>
          ) : isCorrect ? (
            'Verified!'
          ) : (
            'Verify & Continue'
          )}
        </Button>
      </form>
    </div>
  );
};

export default SmartCaptcha;
