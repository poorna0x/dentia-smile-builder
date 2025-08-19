import { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useNavigate, useLocation } from 'react-router-dom';
import { isAdminLoggedIn, createAdminSession, getExpectedAdminPassword } from '@/lib/auth';

const AdminLogin = () => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (isAdminLoggedIn()) {
      navigate('/admin', { replace: true });
    }
  }, [navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const expected = getExpectedAdminPassword();
    if (password !== expected) {
      setError('Invalid credentials');
      return;
    }
    createAdminSession(8);
    const from = (location.state as any)?.from || '/admin';
    navigate(from, { replace: true });
  };

  return (
    <div className="min-h-screen">
      <Navigation />
      <main className="py-10 lg:py-16">
        <div className="container mx-auto px-4 max-w-md">
          <Card>
            <CardHeader>
              <CardTitle>Admin Login</CardTitle>
              <CardDescription>Enter the admin password to continue.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={onSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                {error && <div className="text-sm text-destructive">{error}</div>}
                <Button type="submit" className="btn-appointment w-full">Login</Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AdminLogin;


