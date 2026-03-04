
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon, Loader2, Save } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export function AdminSettings() {
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.unlockDate) {
          setDate(new Date(data.unlockDate));
        }
      })
      .finally(() => setFetching(false));
  }, []);

  const handleSave = async () => {
    if (!date) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unlockDate: date.toISOString() }),
      });

      if (!res.ok) throw new Error('Failed to update');

      toast({
        title: 'Settings Updated',
        description: 'Message unlock date has been updated.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update settings.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="text-white/50 text-sm">Loading settings...</div>;

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6 mt-6">
      <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <CalendarIcon className="w-5 h-5 text-purple-400" />
        Message Unlock Settings
      </h3>
      <p className="text-purple-200 text-sm mb-4">
        Set the date when messages will be unlocked for all users. Until this date,
        only Super Admins can read messages.
      </p>

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-[240px] justify-start text-left font-normal bg-white/5 border-white/20 text-white hover:bg-white/10 hover:text-white",
                !date && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, "PPP") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-[#1a1443] border-white/20 text-white">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              initialFocus
              className="bg-[#1a1443] text-white"
            />
          </PopoverContent>
        </Popover>

        <Button 
          onClick={handleSave} 
          disabled={loading || !date}
          className="bg-purple-600 hover:bg-purple-700 text-white"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          Save Changes
        </Button>
      </div>
    </div>
  );
}
