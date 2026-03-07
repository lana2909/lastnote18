
'use client';

import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Sparkles,
  Mail,
  CheckCircle2,
  XCircle,
  LogOut,
  MessageSquare,
  Shield,
  Search,
  Quote,
  Lock,
  Loader2,
} from 'lucide-react';
import { ChangePasswordDialog } from './ChangePasswordDialog';
import { SentMessageDialog } from './SentMessageDialog';
import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface Classmate {
  id: string;
  name: string;
  hasSent: boolean;
  absentNumber: number;
}

interface DashboardClientProps {
  user: {
    name: string;
    role: string;
    isUnlocked: boolean;
  };
  classmates: Classmate[];
  totalSubmitted: number;
  totalRequired: number;
}

export default function DashboardClient({
  user,
  classmates,
  totalSubmitted,
  totalRequired,
}: DashboardClientProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [publicMemories, setPublicMemories] = useState<Array<{ id: string; momen_berkesan: string }>>([]);
  const [unlockDate, setUnlockDate] = useState<Date | null>(null);
  const [isLocked, setIsLocked] = useState(true);
  const [isShake, setIsShake] = useState(false);
  const [navigatingId, setNavigatingId] = useState<string | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Fetch public memories
    fetch('/api/messages/public-memories')
      .then((res) => res.json())
      .then((data) => {
        if (data.memories) {
          setPublicMemories(data.memories);
        }
      })
      .catch((err) => console.error('Failed to fetch public memories:', err));

    // Fetch lock settings
    fetch('/api/admin/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.unlockDate) {
          const unlock = new Date(data.unlockDate);
          setUnlockDate(unlock);
          const now = new Date();
          if (data.isSuperAdmin) {
            setIsLocked(false);
          } else {
            setIsLocked(now < unlock);
          }
        } else {
           // Default locked if not set, or follow default migration
           setIsLocked(!data.isSuperAdmin);
        }
      })
      .catch((err) => console.error('Failed to fetch settings:', err));
  }, []);

  const handleLockClick = () => {
    setIsShake(true);
    setTimeout(() => setIsShake(false), 500);
    toast({
      title: "It's a surprise! 🤫",
      description: `This wall is locked until ${unlockDate ? format(unlockDate, 'PPP p') : 'the special day'}.`,
      variant: "default", // You might want to use a custom variant if available, or just default
    });
  };

  const progressPercentage = (totalSubmitted / totalRequired) * 100;

  const filteredClassmates = classmates.filter((classmate) =>
    classmate.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden transition-colors duration-500">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="stars"></div>
        <div className="stars2"></div>
        <div className="stars3"></div>
      </div>

      <div className="relative z-10 min-h-screen p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-card/80 backdrop-blur-xl border border-border shadow-lg rounded-2xl p-6 md:p-8 mb-6 transition-all duration-300">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Sparkles className="w-8 h-8 text-primary animate-pulse" />
                  <h1 className="text-3xl md:text-4xl font-bold text-foreground font-orbitron">
                    One Last Note
                  </h1>
                </div>
                <p className="text-muted-foreground">Welcome back, {user.name}</p>
                {user.role !== 'SUBSCRIBER' && (
                  <Badge className="mt-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0">
                    <Shield className="w-3 h-3 mr-1" />
                    {user.role === 'ADMINISTRATOR' ? 'Super Admin' : user.role}
                  </Badge>
                )}
              </div>

              <div className="flex gap-2">
                {user.isUnlocked && (
                  <Button
                    onClick={() => {
                      setIsNavigating(true);
                      router.push('/my-messages');
                    }}
                    isLoading={isNavigating}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl transition-all hover:scale-105 shadow-md"
                  >
                    {!isNavigating && <MessageSquare className="w-4 h-4 mr-2" />}
                    {isNavigating ? 'Opening...' : 'My Messages'}
                  </Button>
                )}
                {user.role !== 'SUBSCRIBER' && (
                  <Button
                    onClick={() => {
                      setIsNavigating(true);
                      router.push('/admin');
                    }}
                    isLoading={isNavigating}
                    className="bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-xl transition-all hover:scale-105 shadow-md"
                  >
                    {!isNavigating && <Shield className="w-4 h-4 mr-2" />}
                    {isNavigating ? 'Opening...' : 'Admin Panel'}
                  </Button>
                )}
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  className="border-border text-foreground hover:bg-accent hover:text-accent-foreground rounded-xl"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
                <ChangePasswordDialog />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-muted-foreground text-sm">
                    Your Progress
                  </span>
                  <span className="text-foreground font-semibold">
                    {totalSubmitted} / {totalRequired}
                  </span>
                </div>
                <Progress
                  value={progressPercentage}
                  className="h-3 bg-secondary"
                />
              </div>

              {user.isUnlocked ? (
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0" />
                  <div>
                    <p className="text-green-600 dark:text-green-400 font-semibold">
                      Account Unlocked!
                    </p>
                    <p className="text-green-600/80 dark:text-green-400/80 text-sm">
                      You can now view all messages sent to you
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-center gap-3">
                  <Mail className="w-6 h-6 text-blue-500 flex-shrink-0" />
                  <div>
                    <p className="text-blue-600 dark:text-blue-400 font-semibold">
                      {totalRequired - totalSubmitted} messages remaining
                    </p>
                    <p className="text-blue-600/80 dark:text-blue-400/80 text-sm">
                      Send messages to all your classmates to unlock your inbox
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-card/80 backdrop-blur-xl border border-border shadow-lg rounded-2xl p-6 md:p-8 transition-all duration-300">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-foreground mb-4 font-orbitron">
                Your Classmates
              </h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Search classmates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-background border-input text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="grid gap-3">
              {filteredClassmates.map((classmate, index) => (
                <div
                  key={classmate.id}
                  className="bg-card hover:bg-accent/50 border border-border rounded-xl p-4 transition-all hover:shadow-md hover:scale-[1.01] cursor-pointer group relative overflow-hidden"
                  onClick={() => {
                    if (!classmate.hasSent && !navigatingId) {
                      setNavigatingId(classmate.id);
                      router.push(`/send/${classmate.id}`);
                    }
                  }}
                >
                  {navigatingId === classmate.id && (
                    <div className="absolute inset-0 bg-background/60 backdrop-blur-[1px] flex items-center justify-center z-10 transition-opacity duration-300">
                      <div className="bg-primary text-primary-foreground px-4 py-2 rounded-full flex items-center gap-2 shadow-lg animate-in fade-in zoom-in">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm font-medium">Opening...</span>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="bg-primary text-primary-foreground w-12 h-12 rounded-full flex items-center justify-center font-semibold group-hover:scale-110 transition-transform shadow-sm">
                        {classmate.absentNumber}
                      </div>
                      <div>
                        <h3 className="text-foreground font-semibold group-hover:text-primary transition-colors">
                          {classmate.name}
                        </h3>
                        <p className="text-muted-foreground text-sm">
                          {classmate.hasSent
                            ? 'Message sent'
                            : 'Click to send message'}
                        </p>
                      </div>
                    </div>
                    <div>
                      {classmate.hasSent ? (
                        <div className="flex items-center gap-2">
                          <Badge className="bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Sent
                          </Badge>
                          <SentMessageDialog
                            recipientId={classmate.id}
                            recipientName={classmate.name}
                          />
                        </div>
                      ) : (
                        <Badge className="bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-500/30">
                          <XCircle className="w-3 h-3 mr-1" />
                          Not Sent
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Public Class Memories Section */}
          <div className="bg-card/80 backdrop-blur-xl border border-border shadow-lg rounded-2xl p-6 md:p-8 mt-6 transition-all duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-accent p-3 rounded-full">
                <Quote className="w-6 h-6 text-accent-foreground" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground font-orbitron">
                  Class Memories
                </h2>
                <p className="text-muted-foreground">
                  A collection of our best moments together
                </p>
              </div>
            </div>

            {isLocked ? (
              <div 
                onClick={handleLockClick}
                className={`
                  bg-background/50 border border-border rounded-xl p-8 
                  flex flex-col items-center justify-center text-center 
                  cursor-pointer hover:bg-background/80 transition-all
                  ${isShake ? 'animate-shake' : ''}
                `}
              >
                <div className="bg-muted p-4 rounded-full mb-4">
                  <Lock className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">Locked for Surprise! 🔒</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  This wall contains everyone's best memories. It will be revealed on <span className="text-primary font-semibold">{unlockDate ? format(unlockDate, 'MMMM do, yyyy') : 'the special day'}</span>.
                </p>
                <p className="text-xs text-muted-foreground/60 mt-4">(Click the lock to check status)</p>
              </div>
            ) : publicMemories.length > 0 ? (
              <ScrollArea className="h-[300px] pr-4">
                <div className="grid md:grid-cols-2 gap-4">
                  {publicMemories.map((memory) => (
                    <Card key={memory.id} className="bg-background/50 border-border hover:bg-background/80 transition-colors">
                      <CardContent className="p-4">
                        <Quote className="w-4 h-4 text-primary mb-2 opacity-50" />
                        <p className="text-foreground italic text-sm leading-relaxed">
                          "{memory.momen_berkesan}"
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p>No public memories have been shared yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
        }
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
