
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Key, Eye, EyeOff, Copy, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ClaimPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const token = params.token as string;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [credentials, setCredentials] = useState<{ username?: string; password?: string; name?: string } | null>(null);
  const [showPassword, setShowPassword] = useState(true);

  const handleClaim = async () => {
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to claim account');
      }

      setCredentials(data);
      toast({
        title: "Account Claimed!",
        description: "Please save your credentials immediately.",
        duration: 10000,
      });

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
  };

  if (credentials) {
    return (
      <Card className="w-full border-2 border-green-500/20 shadow-2xl bg-card/90 backdrop-blur">
        <CardHeader className="text-center">
          <div className="mx-auto bg-green-500/10 p-4 rounded-full mb-4 w-16 h-16 flex items-center justify-center">
            <ShieldCheck className="w-8 h-8 text-green-500" />
          </div>
          <CardTitle className="text-2xl font-bold text-green-600 dark:text-green-400">
            Account Secured
          </CardTitle>
          <CardDescription>
            Welcome, <span className="font-semibold text-foreground">{credentials.name}</span>!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert variant="destructive" className="bg-destructive/10 border-destructive/20">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Warning: Save this now!</AlertTitle>
            <AlertDescription>
              This information is shown <strong>ONLY ONCE</strong>. If you leave this page, you cannot view it again.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Username</Label>
              <div className="flex gap-2">
                <Input value={credentials.username} readOnly className="font-mono bg-muted/50" />
                <Button variant="outline" size="icon" onClick={() => copyToClipboard(credentials.username!, 'Username')}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>New Password</Label>
              <div className="flex gap-2">
                <Input 
                  type={showPassword ? "text" : "password"} 
                  value={credentials.password} 
                  readOnly 
                  className="font-mono bg-muted/50 font-bold text-lg" 
                />
                <Button variant="ghost" size="icon" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button variant="outline" size="icon" onClick={() => copyToClipboard(credentials.password!, 'Password')}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                This is a newly generated secure password. You can change it later in settings.
              </p>
            </div>
          </div>

          <Button 
            className="w-full bg-primary hover:bg-primary/90 text-lg py-6 mt-4"
            onClick={() => router.push('/login')}
          >
            Go to Login
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full shadow-xl bg-card/90 backdrop-blur border-primary/20">
      <CardHeader className="text-center">
        <div className="mx-auto bg-primary/10 p-4 rounded-full mb-4 w-16 h-16 flex items-center justify-center animate-pulse">
          <Key className="w-8 h-8 text-primary" />
        </div>
        <CardTitle className="text-2xl font-bold font-orbitron">Claim Account</CardTitle>
        <CardDescription>
          Click the button below to reveal your credentials.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <Alert className="bg-yellow-500/10 border-yellow-500/20 text-yellow-700 dark:text-yellow-400">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Important</AlertTitle>
            <AlertDescription>
              This link is valid for <strong>one-time use only</strong>. 
              Once you claim your account, this link will expire immediately.
            </AlertDescription>
          </Alert>

          <Button 
            className="w-full text-lg py-6 font-bold shadow-lg transition-all hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed" 
            onClick={handleClaim}
            isLoading={isLoading}
          >
            {isLoading ? 'Processing... Please wait' : 'Reveal My Credentials'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
