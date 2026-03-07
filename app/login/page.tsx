
'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ClassOption {
  id: string;
  name: string;
  display_name: string;
  theme_id: string;
}

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    // Fetch classes for dropdown
    fetch('/api/classes')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setClasses(data);
        }
      })
      .catch((err) => console.error('Failed to fetch classes:', err));
  }, []);

  // Update theme when class is selected
  useEffect(() => {
    const selectedClass = classes.find((c) => c.id === selectedClassId);
    if (selectedClass) {
      document.body.setAttribute('data-theme', selectedClass.theme_id);
    } else {
      document.body.removeAttribute('data-theme');
    }
  }, [selectedClassId, classes]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!selectedClassId) {
       setError('Please select your class first.');
       setIsLoading(false);
       return;
    }

    try {
      const result = await signIn('credentials', {
        username,
        password,
        classId: selectedClassId, // Send selected class ID to backend
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid username, password, or class selection.');
        setIsLoading(false);
        return;
      }

      router.push('/dashboard');
    } catch (error) {
      setError('An error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center p-4 transition-colors duration-500">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="stars"></div>
        <div className="stars2"></div>
        <div className="stars3"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="bg-card/80 backdrop-blur-xl border border-border shadow-lg rounded-2xl p-8 transform transition-all duration-500 hover:scale-[1.02]">
          <div className="flex flex-col items-center mb-8">
            <div className="bg-primary/10 p-4 rounded-full mb-4 shadow-lg animate-pulse">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold text-foreground mb-2 text-center font-['Orbitron']">
              One Last Note
            </h1>
            <p className="text-muted-foreground text-center text-sm">
              A space for our final words
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Select Class
              </label>
              <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                <SelectTrigger className="bg-background border-input text-foreground">
                  <SelectValue placeholder="Select your class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.display_name || cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Username
              </label>
              <Input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-background border-input text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary"
                placeholder="your.username"
                required
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Password
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-background border-input text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary"
                placeholder="••••••••"
                required
                disabled={isLoading}
              />
            </div>

            {error && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <Button
              type="submit"
              isLoading={isLoading}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-6 rounded-xl transition-all duration-300 hover:scale-105 shadow-md"
            >
              {isLoading ? 'Entering...' : 'Enter the Galaxy'}
            </Button>
          </form>
        </div>

        <p className="text-center text-muted-foreground/70 text-xs mt-6">
          Share your memories before they fade into the cosmos
        </p>
      </div>

      <style jsx>{`
        .stars,
        .stars2,
        .stars3 {
          position: absolute;
          width: 1px;
          height: 1px;
          background: transparent;
          animation: animStar 50s linear infinite;
        }

        .stars {
          box-shadow: 779px 1331px var(--foreground), 324px 42px var(--foreground), 303px 586px var(--foreground),
            1312px 276px var(--foreground), 451px 625px var(--foreground), 521px 1931px var(--foreground),
            1087px 1871px var(--foreground), 36px 1546px var(--foreground), 132px 934px var(--foreground),
            1698px 901px var(--foreground);
            opacity: 0.1;
        }

        .stars2 {
          box-shadow: 779px 1331px var(--foreground), 324px 42px var(--foreground), 303px 586px var(--foreground),
            1312px 276px var(--foreground), 451px 625px var(--foreground), 521px 1931px var(--foreground),
            1087px 1871px var(--foreground), 36px 1546px var(--foreground), 132px 934px var(--foreground),
            1698px 901px var(--foreground);
          animation-delay: 1s;
          opacity: 0.1;
        }

        .stars3 {
          box-shadow: 779px 1331px var(--foreground), 324px 42px var(--foreground), 303px 586px var(--foreground),
            1312px 276px var(--foreground), 451px 625px var(--foreground), 521px 1931px var(--foreground),
            1087px 1871px var(--foreground), 36px 1546px var(--foreground), 132px 934px var(--foreground),
            1698px 901px var(--foreground);
          animation-delay: 2s;
          opacity: 0.1;
        }

        @keyframes animStar {
          from {
            transform: translateY(0px);
          }
          to {
            transform: translateY(-2000px);
          }
        }
      `}</style>
    </div>
  );
}
