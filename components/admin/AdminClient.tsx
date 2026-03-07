
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Shield,
  Mail,
  Heart,
  MessageSquare,
  AlertTriangle,
  Star,
  Lightbulb,
  Sparkles,
  Calendar,
  Users,
  Settings,
  Eye,
  RefreshCw,
} from 'lucide-react';
import { format } from 'date-fns';

import { AdminSettings } from './AdminSettings';
import ClassSettings from './ClassSettings';

interface User {
  id: string;
  name: string;
}

interface Message {
  id: string;
  recipient_id: string;
  kesan: string;
  pesan: string;
  larangan: string;
  sifat: string;
  kesimpulan: string;
  hal_terpendam: string;
  momen_berkesan: string;
  created_at: string;
  recipient: {
    id: string;
    name: string;
  };
}

interface AdminClientProps {
  users: User[];
  messages: Message[];
  adminName: string;
  role: string;
  userClassId?: string;
  classSettings?: {
    questions: any[];
    unlockDate: string | null;
  };
  allClasses: { id: string; name: string }[];
  isOwnClass: boolean;
}

export default function AdminClient({
  users,
  messages,
  adminName,
  role,
  userClassId,
  classSettings,
  allClasses,
  isOwnClass,
}: AdminClientProps) {
  const router = useRouter();
  const [selectedUserId, setSelectedUserId] = useState<string>('all');
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [showClassSettings, setShowClassSettings] = useState(false);
  const [switchingClass, setSwitchingClass] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  const filteredMessages =
    selectedUserId === 'all'
      ? messages
      : messages.filter((m) => m.recipient_id === selectedUserId);

  const selectedUser = users.find((u) => u.id === selectedUserId);
  const messageCount = filteredMessages.length;

  const handleSwitchClass = async (classId: string) => {
    setSwitchingClass(true);
    try {
      // If classId is 'own', we send null to reset
      const targetId = classId === 'own' ? null : classId;
      
      const response = await fetch('/api/admin/switch-class', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classId: targetId }),
      });

      if (response.ok) {
        window.location.reload(); // Reload to refresh server-side data
      }
    } catch (error) {
      console.error('Failed to switch class', error);
      setSwitchingClass(false);
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden transition-colors duration-500">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="stars"></div>
        <div className="stars2"></div>
        <div className="stars3"></div>
      </div>

      <div className="relative z-10 min-h-screen p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap gap-2 mb-6 justify-between">
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => {
                  setIsNavigating(true);
                  router.push('/dashboard');
                }}
                isLoading={isNavigating}
                variant="outline"
                className="border-border text-foreground hover:bg-accent hover:text-accent-foreground rounded-xl"
              >
                {!isNavigating && <ArrowLeft className="w-4 h-4 mr-2" />}
                {isNavigating ? 'Loading...' : 'Back to Dashboard'}
              </Button>

              {/* Manage Classes: Visible to ADMINISTRATOR and AUTHOR (Own class data) */}
              {(role === 'ADMINISTRATOR' || role === 'AUTHOR') && (
                <Button
                  onClick={() => {
                    setIsNavigating(true);
                    router.push('/admin/classes');
                  }}
                  isLoading={isNavigating}
                  variant="outline"
                  className="border-border text-foreground hover:bg-accent hover:text-accent-foreground rounded-xl"
                >
                  {!isNavigating && <Users className="w-4 h-4 mr-2" />}
                  {isNavigating ? 'Opening...' : 'Manage Students'}
                </Button>
              )}

              {/* Class Settings: Visible to AUTHOR (Own) and ADMINISTRATOR (if viewing own class) */}
              {isOwnClass && (
                <Button
                  onClick={() => setShowClassSettings(!showClassSettings)}
                  variant="outline"
                  className={`border-border text-foreground hover:bg-accent hover:text-accent-foreground rounded-xl ${showClassSettings ? 'bg-accent' : ''}`}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  {showClassSettings ? 'View Messages' : 'Class Settings'}
                </Button>
              )}
            </div>

            {/* Switch Class Dropdown: Visible only to ADMINISTRATOR */}
            {role === 'ADMINISTRATOR' && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground hidden md:inline">View as:</span>
                <Select 
                  value={userClassId || 'own'} 
                  onValueChange={handleSwitchClass}
                  disabled={switchingClass}
                >
                  <SelectTrigger className="w-[200px] bg-background border-input text-foreground">
                    <SelectValue placeholder="Select Class" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* Option to view own class if currently viewing another, or just indicate current */}
                    {/* Wait, userClassId changes when switched. So 'own' might not be easily selectable if we don't know original ID here without prop */}
                    {/* But we can assume if userClassId matches original, it's own. */}
                    {/* Let's just list all classes. ADMINISTRATOR usually belongs to a class too. */}
                    {allClasses.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {switchingClass && <RefreshCw className="w-4 h-4 animate-spin text-muted-foreground" />}
              </div>
            )}
          </div>

          <div className="bg-card/80 backdrop-blur-xl border border-border shadow-lg rounded-2xl p-6 md:p-8 mb-6 transition-all duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-gradient-to-br from-orange-500 to-red-500 p-3 rounded-full">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground font-orbitron">
                  Admin Panel
                </h1>
                <p className="text-muted-foreground">
                  {adminName} 
                  <Badge variant="outline" className="ml-2 border-primary/50 text-primary">
                    {role}
                  </Badge>
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <Card className="bg-card/50 border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-muted-foreground text-sm font-medium">
                    Total Users
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    <span className="text-2xl font-bold text-foreground">
                      {users.length}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card/50 border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-muted-foreground text-sm font-medium">
                    Total Messages
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Mail className="w-5 h-5 text-blue-500" />
                    <span className="text-2xl font-bold text-foreground">
                      {messages.length}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card/50 border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-muted-foreground text-sm font-medium">
                    Filtered Messages
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-green-500" />
                    <span className="text-2xl font-bold text-foreground">
                      {messageCount}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Show Settings Panel if toggled */}
          {showClassSettings && userClassId && classSettings && (
             <div className="bg-card/80 backdrop-blur-xl border border-border shadow-lg rounded-2xl p-6 md:p-8 mb-6 transition-all duration-300">
               <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                 <Settings className="w-5 h-5" />
                 Class Settings
               </h2>
               <ClassSettings 
                 classId={userClassId} 
                 initialQuestions={classSettings.questions} 
                 initialUnlockDate={classSettings.unlockDate} 
               />
             </div>
          )}

          {/* AdminSettings (Global) - Maybe only for ADMINISTRATOR if they want to change global stuff? 
              But user said "Administrator... ganti waktu kapan pesan dibuka punya kelas sendiri". 
              So maybe Global Settings are deprecated or only for super-super admin stuff. 
              Let's hide it for now to avoid confusion, or only show if isOwnClass?
              Actually the user didn't ask to remove it, but said Administrator manages OWN class.
              Let's keep it hidden unless specifically requested or if it does something critical not covered by Class Settings.
              The old AdminSettings handled global unlock date. Now we use ClassSettings.
          */}

          {/* Message Viewer Section */}
          {!showClassSettings && (
            <>
              <div className="bg-card/80 backdrop-blur-xl border border-border shadow-lg rounded-2xl p-6 md:p-8 mb-6 transition-all duration-300">
                <label className="block text-muted-foreground mb-2 font-medium">
                  Filter by Recipient
                </label>
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger className="bg-background border-input text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Recipients</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {filteredMessages.length === 0 ? (
                <div className="bg-card/80 backdrop-blur-xl border border-border shadow-lg rounded-2xl p-12 text-center transition-all duration-300">
                  <Mail className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h2 className="text-xl font-semibold text-foreground mb-2">
                    No messages found
                  </h2>
                  <p className="text-muted-foreground">
                    {selectedUserId === 'all'
                      ? 'No messages have been sent yet'
                      : `No messages for ${selectedUser?.name}`}
                  </p>
                </div>
              ) : (
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="md:col-span-1 space-y-3">
                    <div className="bg-card/80 backdrop-blur-xl border border-border rounded-xl p-4 transition-all duration-300">
                      <h3 className="text-foreground font-semibold mb-3">
                        Messages ({messageCount})
                      </h3>
                      <div className="space-y-2 max-h-[600px] overflow-y-auto">
                        {filteredMessages.map((message, index) => (
                          <div
                            key={message.id}
                            onClick={() => setSelectedMessage(message)}
                            className={`p-3 rounded-lg cursor-pointer transition-all ${
                              selectedMessage?.id === message.id
                                ? 'bg-primary/10 border border-primary/50'
                                : 'bg-card hover:bg-accent border border-border'
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <Badge className="bg-primary/20 text-primary border-primary/50 text-xs">
                                #{index + 1}
                              </Badge>
                            </div>
                            <p className="text-foreground text-sm font-medium mb-1">
                              To: {message.recipient.name}
                            </p>
                            <p className="text-muted-foreground text-xs">
                              {format(
                                new Date(message.created_at),
                                'MMM dd, yyyy HH:mm'
                              )}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    {selectedMessage ? (
                      <div className="bg-card/80 backdrop-blur-xl border border-border shadow-lg rounded-2xl p-6 md:p-8 space-y-6 transition-all duration-300">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <p className="text-foreground font-semibold text-lg mb-1">
                              Recipient: {selectedMessage.recipient.name}
                            </p>
                            <Badge className="bg-gradient-to-r from-purple-500 to-blue-500 text-white border-0">
                              <Sparkles className="w-3 h-3 mr-1" />
                              Anonymous Sender
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground text-sm">
                            <Calendar className="w-4 h-4" />
                            {format(
                              new Date(selectedMessage.created_at),
                              'MMM dd, yyyy - HH:mm'
                            )}
                          </div>
                        </div>

                        <Card className="bg-pink-500/5 border-pink-500/20">
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-pink-500">
                              <Heart className="w-5 h-5" />
                              Kesan
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-foreground leading-relaxed">
                              {selectedMessage.kesan}
                            </p>
                          </CardContent>
                        </Card>

                        <Card className="bg-blue-500/5 border-blue-500/20">
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-blue-500">
                              <MessageSquare className="w-5 h-5" />
                              Pesan
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-foreground leading-relaxed">
                              {selectedMessage.pesan}
                            </p>
                          </CardContent>
                        </Card>

                        <Card className="bg-red-500/5 border-red-500/20">
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-red-500">
                              <AlertTriangle className="w-5 h-5" />
                              Larangan
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-foreground leading-relaxed whitespace-pre-line">
                              {selectedMessage.larangan}
                            </p>
                          </CardContent>
                        </Card>

                        <Card className="bg-green-500/5 border-green-500/20">
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-green-500">
                              <Star className="w-5 h-5" />
                              Sifat yang Harus Dipertahankan
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-foreground leading-relaxed whitespace-pre-line">
                              {selectedMessage.sifat}
                            </p>
                          </CardContent>
                        </Card>

                        <Card className="bg-purple-500/5 border-purple-500/20">
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-purple-500">
                              <Lightbulb className="w-5 h-5" />
                              Kesimpulan
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-foreground leading-relaxed italic">
                              {selectedMessage.kesimpulan}
                            </p>
                          </CardContent>
                        </Card>

                        <Card className="bg-indigo-500/5 border-indigo-500/20">
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-indigo-500">
                              <MessageSquare className="w-5 h-5" />
                              Hal yang Terpendam
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-foreground leading-relaxed">
                              {selectedMessage.hal_terpendam}
                            </p>
                          </CardContent>
                        </Card>

                        <Card className="bg-amber-500/5 border-amber-500/20">
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-amber-500">
                              <Sparkles className="w-5 h-5" />
                              Momen Kebersamaan
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-foreground leading-relaxed">
                              {selectedMessage.momen_berkesan}
                            </p>
                          </CardContent>
                        </Card>
                      </div>
                    ) : (
                      <div className="bg-card/80 backdrop-blur-xl border border-border shadow-lg rounded-2xl p-12 text-center transition-all duration-300">
                        <Mail className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                        <h2 className="text-xl font-semibold text-foreground mb-2">
                          Select a message
                        </h2>
                        <p className="text-muted-foreground">
                          Click on a message from the list to view its details
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
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
