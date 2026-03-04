
'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Eye, Loader2, Heart, MessageSquare, AlertTriangle, Star, Lightbulb, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface SentMessageDialogProps {
  recipientId: string;
  recipientName: string;
}

interface Message {
  kesan: string;
  pesan: string;
  larangan: string;
  sifat: string;
  kesimpulan: string;
  hal_terpendam: string;
  momen_berkesan: string;
}

export function SentMessageDialog({ recipientId, recipientName }: SentMessageDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && !message) {
      setLoading(true);
      fetch(`/api/messages/sent?recipientId=${recipientId}`)
        .then(async (res) => {
          if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || 'Failed to fetch message');
          }
          return res.json();
        })
        .then((data) => {
          setMessage(data.message);
          setError('');
        })
        .catch((err) => {
          setError(err.message);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [open, recipientId, message]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="bg-blue-500/20 text-blue-300 border-blue-500/50 hover:bg-blue-500/30"
        >
          <Eye className="w-3 h-3 mr-1" />
          View Message
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-[#1a1443] border-white/20 text-white">
        <DialogHeader>
          <DialogTitle>Message to {recipientName}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
          </div>
        ) : error ? (
          <div className="text-red-400 bg-red-500/10 p-4 rounded-lg border border-red-500/20 text-center">
            {error}
          </div>
        ) : message ? (
          <div className="space-y-4">
            <Card className="bg-white/5 border-white/10">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-pink-200 text-lg">
                  <Heart className="w-4 h-4" /> Kesan
                </CardTitle>
              </CardHeader>
              <CardContent className="text-white text-sm">
                {message.kesan}
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-blue-200 text-lg">
                  <MessageSquare className="w-4 h-4" /> Pesan
                </CardTitle>
              </CardHeader>
              <CardContent className="text-white text-sm">
                {message.pesan}
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-white/5 border-white/10">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-red-200 text-lg">
                    <AlertTriangle className="w-4 h-4" /> Larangan
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-white text-sm whitespace-pre-line">
                  {message.larangan}
                </CardContent>
              </Card>

              <Card className="bg-white/5 border-white/10">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-green-200 text-lg">
                    <Star className="w-4 h-4" /> Sifat
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-white text-sm whitespace-pre-line">
                  {message.sifat}
                </CardContent>
              </Card>
            </div>

            <Card className="bg-white/5 border-white/10">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-purple-200 text-lg">
                  <Lightbulb className="w-4 h-4" /> Kesimpulan
                </CardTitle>
              </CardHeader>
              <CardContent className="text-white text-sm italic">
                {message.kesimpulan}
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-white/5 border-white/10">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-indigo-200 text-lg">
                    <MessageSquare className="w-4 h-4" /> Hal Terpendam
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-white text-sm">
                  {message.hal_terpendam}
                </CardContent>
              </Card>

              <Card className="bg-white/5 border-white/10">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-amber-200 text-lg">
                    <Sparkles className="w-4 h-4" /> Momen TKJ 2
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-white text-sm">
                  {message.momen_berkesan}
                </CardContent>
              </Card>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
