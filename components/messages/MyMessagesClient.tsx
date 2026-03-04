
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Mail,
  Heart,
  MessageSquare,
  AlertTriangle,
  Star,
  Lightbulb,
  Sparkles,
  Calendar,
} from 'lucide-react';
import { format } from 'date-fns';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Message {
  id: string;
  kesan: string;
  pesan: string;
  larangan: string;
  sifat: string;
  kesimpulan: string;
  hal_terpendam: string;
  momen_berkesan: string;
  created_at: string;
}

interface MyMessagesClientProps {
  messages: Message[];
  userName: string;
}

export default function MyMessagesClient({
  messages,
  userName,
}: MyMessagesClientProps) {
  const router = useRouter();
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(
    messages[0] || null
  );
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [unlockDate, setUnlockDate] = useState<Date | null>(null);
  const [isLocked, setIsLocked] = useState(true);
  const [loadingLock, setLoadingLock] = useState(true);

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.unlockDate) {
          const unlock = new Date(data.unlockDate);
          setUnlockDate(unlock);
          const now = new Date();
          // If user is Super Admin, they bypass the lock
          if (data.isSuperAdmin) {
            setIsLocked(false);
          } else {
            setIsLocked(now < unlock);
          }
        } else {
          setIsLocked(!data.isSuperAdmin); 
        }
      })
      .finally(() => setLoadingLock(false));
  }, []);

  const categories = [
    { id: 'all', label: 'All Categories', icon: Sparkles },
    { id: 'kesan', label: 'Kesan', icon: Heart },
    { id: 'pesan', label: 'Pesan', icon: MessageSquare },
    { id: 'larangan', label: 'Larangan', icon: AlertTriangle },
    { id: 'sifat', label: 'Sifat', icon: Star },
    { id: 'kesimpulan', label: 'Kesimpulan', icon: Lightbulb },
    { id: 'hal_terpendam', label: 'Hal Terpendam', icon: MessageSquare },
    { id: 'momen_berkesan', label: 'Momen Kebersamaan', icon: Sparkles },
  ];

  // Word Frequency Analysis
  const getWordStats = (category: string) => {
    const text = messages
      .map((m) => {
        if (category === 'all') {
          return `${m.kesan} ${m.pesan} ${m.larangan} ${m.sifat} ${m.kesimpulan} ${m.hal_terpendam} ${m.momen_berkesan}`;
        }
        return (m as any)[category] || '';
      })
      .join(' ')
      .toLowerCase();

    const words = text.match(/\b\w+\b/g) || [];
    const stopwords = new Set([
      'yang', 'di', 'dan', 'itu', 'dengan', 'untuk', 'tidak', 'ini', 'dari',
      'dalam', 'akan', 'pada', 'juga', 'saya', 'ke', 'karena', 'tersebut',
      'bisa', 'ada', 'mereka', 'lebih', 'sudah', 'atau', 'saat', 'oleh',
      'sebagai', 'menjadi', 'tapi', 'aku', 'kamu', 'dia', 'kita', 'yg', 'gak',
      'ya', 'aja', 'sih', 'nya', 'kalo', 'kalau', 'sama', 'adalah', 'seperti',
      'banyak', 'sangat', 'buat', 'tetap', 'terus', 'selalu', 'jangan', 'semoga',
      'sukses', 'sehat', 'bahagia', 'terus', 'makin', 'lagi', 'nanti', 'kapan',
      'apa', 'kenapa', 'gimana', 'siapa', 'mana', 'masih', 'pernah', 'memang',
      'cuma', 'hanya', 'paling', 'banget', 'kurang', 'lebih', 'mungkin', 'harus'
    ]);

    const frequency: Record<string, number> = {};
    words.forEach((word) => {
      if (!stopwords.has(word) && word.length > 3) {
        frequency[word] = (frequency[word] || 0) + 1;
      }
    });

    return Object.entries(frequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5); // Top 5 words
  };

  const topWords = getWordStats(selectedCategory);

  if (loadingLock) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground text-xl animate-pulse">Checking time lock...</div>
      </div>
    );
  }

  if (isLocked) {
    return (
      <div className="min-h-screen bg-background relative overflow-hidden flex flex-col items-center justify-center p-4 transition-colors duration-500">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="stars"></div>
          <div className="stars2"></div>
          <div className="stars3"></div>
        </div>
        
        <div className="bg-card/80 backdrop-blur-xl border border-border shadow-lg rounded-2xl p-8 max-w-md w-full text-center relative z-10">
          <div className="bg-primary/10 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
            <Calendar className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground font-orbitron mb-4">
            Messages Locked
          </h1>
          <p className="text-muted-foreground mb-6">
            The messages are currently locked. They will be revealed on:
          </p>
          <div className="bg-background border border-border rounded-xl p-4 mb-6">
            <p className="text-xl font-mono text-primary">
              {unlockDate ? format(unlockDate, 'PPP p') : 'Date not set'}
            </p>
          </div>
          <Button
            onClick={() => router.push('/dashboard')}
            variant="outline"
            className="border-border text-foreground hover:bg-accent w-full"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
        
        <style jsx>{`
          .stars, .stars2, .stars3 {
            position: absolute;
            width: 1px;
            height: 1px;
            background: transparent;
            animation: animStar 50s linear infinite;
          }
          .stars { box-shadow: 779px 1331px var(--foreground), 324px 42px var(--foreground), 303px 586px var(--foreground); opacity: 0.1; }
          .stars2 { box-shadow: 779px 1331px var(--foreground), 324px 42px var(--foreground), 303px 586px var(--foreground); animation-delay: 1s; opacity: 0.1; }
          .stars3 { box-shadow: 779px 1331px var(--foreground), 324px 42px var(--foreground), 303px 586px var(--foreground); animation-delay: 2s; opacity: 0.1; }
          @keyframes animStar {
            from { transform: translateY(0px); }
            to { transform: translateY(-2000px); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden transition-colors duration-500">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="stars"></div>
        <div className="stars2"></div>
        <div className="stars3"></div>
      </div>

      <div className="relative z-10 min-h-screen p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <Button
            onClick={() => router.push('/dashboard')}
            variant="outline"
            className="mb-6 border-border text-foreground hover:bg-accent hover:text-accent-foreground rounded-xl"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>

          <div className="bg-card/80 backdrop-blur-xl border border-border shadow-lg rounded-2xl p-6 md:p-8 mb-6 transition-all duration-300">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-3 rounded-full">
                  <Mail className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-foreground font-orbitron">
                    Your Messages
                  </h1>
                  <p className="text-muted-foreground">
                    {userName} - {messages.length} messages received
                  </p>
                </div>
              </div>

              <div className="w-full md:w-64">
                <Select
                  value={selectedCategory}
                  onValueChange={setSelectedCategory}
                >
                  <SelectTrigger className="bg-background border-input text-foreground">
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        <div className="flex items-center gap-2">
                          <category.icon className="w-4 h-4" />
                          {category.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {topWords.length > 0 && (
              <div className="bg-background/50 border border-border rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="text-foreground font-medium text-sm">
                    Most Frequent Words in{' '}
                    {categories.find((c) => c.id === selectedCategory)?.label}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {topWords.map(([word, count], index) => (
                    <Badge
                      key={word}
                      className={`
                        ${
                          index === 0
                            ? 'bg-primary/20 text-primary border-primary/50'
                            : 'bg-secondary text-secondary-foreground border-secondary'
                        }
                        px-3 py-1 text-sm capitalize
                      `}
                    >
                      {word} ({count})
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {messages.length === 0 ? (
            <div className="bg-card/80 backdrop-blur-xl border border-border shadow-lg rounded-2xl p-12 text-center transition-all duration-300">
              <Mail className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">
                No messages yet
              </h2>
              <p className="text-muted-foreground">
                Your classmates will send their messages soon
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-6">
              <div className="md:col-span-1 space-y-3">
                <div className="bg-card/80 backdrop-blur-xl border border-border rounded-xl p-4 transition-all duration-300">
                  <h3 className="text-foreground font-semibold mb-3">
                    All Messages ({messages.length})
                  </h3>
                  <div className="space-y-2 max-h-[600px] overflow-y-auto">
                    {messages.map((message, index) => (
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
                          <Badge className="bg-primary/20 text-primary border-primary/50">
                            Message {index + 1}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground text-xs">
                          {format(
                            new Date(message.created_at),
                            'MMM dd, yyyy'
                          )}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="md:col-span-2">
                {selectedMessage && (
                  <div className="bg-card/80 backdrop-blur-xl border border-border shadow-lg rounded-2xl p-6 md:p-8 space-y-6 transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                      <Badge className="bg-gradient-to-r from-purple-500 to-blue-500 text-white border-0">
                        <Sparkles className="w-3 h-3 mr-1" />
                        Anonymous
                      </Badge>
                      <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <Calendar className="w-4 h-4" />
                        {format(
                          new Date(selectedMessage.created_at),
                          'MMMM dd, yyyy - HH:mm'
                        )}
                      </div>
                    </div>

                    {(selectedCategory === 'all' ||
                      selectedCategory === 'kesan') && (
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
                    )}

                    {(selectedCategory === 'all' ||
                      selectedCategory === 'pesan') && (
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
                    )}

                    {(selectedCategory === 'all' ||
                      selectedCategory === 'larangan') && (
                      <Card className="bg-red-500/5 border-red-500/20">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-red-500">
                            <AlertTriangle className="w-5 h-5" />
                            Larangan
                          </CardTitle>
                          <CardDescription className="text-muted-foreground">
                            Hal-hal yang sebaiknya dihindari
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="text-foreground leading-relaxed whitespace-pre-line">
                            {selectedMessage.larangan}
                          </p>
                        </CardContent>
                      </Card>
                    )}

                    {(selectedCategory === 'all' ||
                      selectedCategory === 'sifat') && (
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
                    )}

                    {(selectedCategory === 'all' ||
                      selectedCategory === 'kesimpulan') && (
                      <Card className="bg-purple-500/5 border-purple-500/20">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-purple-500">
                            <Lightbulb className="w-5 h-5" />
                            Kesimpulan
                          </CardTitle>
                          <CardDescription className="text-muted-foreground">
                            Dalam satu kalimat
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="text-foreground leading-relaxed italic">
                            {selectedMessage.kesimpulan}
                          </p>
                        </CardContent>
                      </Card>
                    )}

                    {(selectedCategory === 'all' ||
                      selectedCategory === 'hal_terpendam') && (
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
                    )}

                    {(selectedCategory === 'all' ||
                      selectedCategory === 'momen_berkesan') && (
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
                    )}
                  </div>
                )}
              </div>
            </div>
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
