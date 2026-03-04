
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Send, Loader2, Sparkles, ChevronLeft, ChevronRight, Menu, X } from 'lucide-react';

interface Question {
  id: string;
  label: string;
  placeholder: string;
  type: 'textarea' | 'text';
}

interface SendMessageFormProps {
  recipient: {
    id: string;
    name: string;
  };
  userId: string;
  prevRecipientId: string | null;
  nextRecipientId: string | null;
  availableRecipients: Array<{ id: string; name: string }>;
  questions?: Question[];
}

export default function SendMessageForm({
  recipient,
  userId,
  prevRecipientId,
  nextRecipientId,
  availableRecipients,
  questions = [],
}: SendMessageFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Dynamic state for dynamic questions
  const [formData, setFormData] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    questions.forEach(q => {
      initial[q.id] = '';
    });
    return initial;
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      // Map dynamic fields back to expected API structure if possible, 
      // OR send everything as 'additional_data' if API supports it.
      // Current API expects: kesan, pesan, larangan, sifat, kesimpulan, halTerpendam, momenBerkesan
      // We need to ensure backward compatibility for old hardcoded questions.
      
      const payload: any = {
        recipientId: recipient.id,
        userId,
      };

      // Map known IDs to specific fields, others to a generic object if needed
      // Ideally, API should handle dynamic fields. 
      // For now, let's map what we can match by ID.
      
      const knownFields = ['kesan', 'pesan', 'larangan', 'sifat', 'kesimpulan', 'hal_terpendam', 'momen_berkesan'];
      const mappedData: any = {};
      
      questions.forEach(q => {
        // Handle snake_case to camelCase conversion if needed for legacy API
        let key = q.id;
        if (key === 'hal_terpendam') key = 'halTerpendam';
        if (key === 'momen_berkesan') key = 'momenBerkesan';
        
        mappedData[key] = formData[q.id];
      });

      const response = await fetch('/api/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...payload,
          ...mappedData
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message');
      }

      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden transition-colors duration-500">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="stars"></div>
        <div className="stars2"></div>
        <div className="stars3"></div>
      </div>

      <div className="relative z-10 min-h-screen flex">
        {/* Sidebar */}
        <div
          className={`fixed inset-y-0 left-0 z-50 w-64 bg-card/95 backdrop-blur-xl border-r border-border transform transition-transform duration-300 ease-in-out ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } md:translate-x-0 md:block md:w-64 flex-shrink-0 md:sticky md:top-0 md:h-screen overflow-hidden flex flex-col`}
        >
          <div className="p-4 h-full flex flex-col">
            <div className="flex items-center justify-between mb-6 shrink-0">
              <h2 className="text-foreground font-orbitron font-bold text-lg">Classmates</h2>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden text-foreground hover:bg-accent"
                onClick={() => setIsSidebarOpen(false)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
              {availableRecipients.map((user, index) => (
                <div
                  key={user.id}
                  onClick={() => {
                    if (user.id !== recipient.id) {
                      router.push(`/send/${user.id}`);
                    }
                    setIsSidebarOpen(false);
                  }}
                  className={`p-3 rounded-lg cursor-pointer transition-all flex items-center gap-3 ${
                    user.id === recipient.id
                      ? 'bg-primary/20 border border-primary/50 text-foreground'
                      : 'hover:bg-accent/50 text-muted-foreground hover:text-foreground border border-transparent'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                    user.id === recipient.id 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {index + 1}
                  </div>
                  <span className="text-sm font-medium truncate">{user.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0 p-4 md:p-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <div className="flex gap-2">
                <Button
                  onClick={() => setIsSidebarOpen(true)}
                  variant="outline"
                  className="md:hidden border-border text-foreground hover:bg-accent hover:text-accent-foreground rounded-xl"
                >
                  <Menu className="w-4 h-4" />
                </Button>
                <Button
                  onClick={() => router.back()}
                  variant="outline"
                  className="border-border text-foreground hover:bg-accent hover:text-accent-foreground rounded-xl"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </div>

              <div className="flex gap-2">
              {prevRecipientId && (
                <Button
                  onClick={() => router.push(`/send/${prevRecipientId}`)}
                  variant="outline"
                  className="border-border text-foreground hover:bg-accent hover:text-accent-foreground rounded-xl"
                  title="Previous Classmate"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Prev
                </Button>
              )}
              {nextRecipientId && (
                <Button
                  onClick={() => router.push(`/send/${nextRecipientId}`)}
                  variant="outline"
                  className="border-border text-foreground hover:bg-accent hover:text-accent-foreground rounded-xl"
                  title="Next Classmate"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </div>

          <div className="bg-card/80 backdrop-blur-xl border border-border shadow-lg rounded-2xl p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-primary/10 p-3 rounded-full">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground font-orbitron">
                  Send Message
                </h1>
                <p className="text-muted-foreground">To: {recipient.name}</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {questions.map((question) => (
                <div key={question.id}>
                  <Label className="text-foreground mb-2 block">
                    {question.label}
                  </Label>
                  <Textarea
                    value={formData[question.id] || ''}
                    onChange={(e) => handleChange(question.id, e.target.value)}
                    className="min-h-[100px] bg-background/50 border-input text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary"
                    placeholder={question.placeholder}
                    required
                    disabled={isSubmitting}
                  />
                </div>
              ))}

              {error && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-6 rounded-xl transition-all duration-300 hover:scale-105 shadow-md"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending to the stars...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Message
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>
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
