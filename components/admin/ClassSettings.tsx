
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Save, Plus, Trash2, Edit2, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface Question {
  id: string;
  label: string;
  placeholder: string;
  type: 'textarea' | 'text';
}

interface ClassSettingsProps {
  classId: string;
  initialQuestions: Question[];
  initialUnlockDate: string | null;
}

export default function ClassSettings({ classId, initialQuestions, initialUnlockDate }: ClassSettingsProps) {
  const [questions, setQuestions] = useState<Question[]>(initialQuestions || []);
  const [unlockDate, setUnlockDate] = useState<Date | undefined>(
    initialUnlockDate ? new Date(initialUnlockDate) : undefined
  );
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Question | null>(null);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/admin/class-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classId,
          questions,
          unlockDate: unlockDate?.toISOString(),
        }),
      });

      if (!response.ok) throw new Error('Failed to save settings');

      toast({
        title: 'Settings Saved',
        description: 'Class questions and unlock date have been updated.',
      });
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error',
        description: 'Failed to save settings.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const addQuestion = () => {
    const newId = `custom_${Date.now()}`;
    const newQuestion: Question = {
      id: newId,
      label: 'New Question',
      placeholder: 'Type your answer here...',
      type: 'textarea',
    };
    setQuestions([...questions, newQuestion]);
    setEditingId(newId);
    setEditForm(newQuestion);
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter((q) => q.id !== id));
  };

  const startEditing = (question: Question) => {
    setEditingId(question.id);
    setEditForm({ ...question });
  };

  const saveEdit = () => {
    if (editForm) {
      setQuestions(questions.map((q) => (q.id === editForm.id ? editForm : q)));
      setEditingId(null);
      setEditForm(null);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm(null);
  };

  return (
    <div className="space-y-6">
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-primary" />
            Message Unlock Date
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <Label>When should messages be revealed?</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={'outline'}
                  className={cn(
                    'w-[280px] justify-start text-left font-normal border-input',
                    !unlockDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {unlockDate ? format(unlockDate, 'PPP') : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-card border-border">
                <Calendar
                  mode="single"
                  selected={unlockDate}
                  onSelect={setUnlockDate}
                  initialFocus
                  className="bg-card text-foreground"
                />
              </PopoverContent>
            </Popover>
            <p className="text-sm text-muted-foreground">
              Students will be able to read their messages after this date.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Edit2 className="w-5 h-5 text-primary" />
            Custom Questions
          </CardTitle>
          <Button onClick={addQuestion} size="sm" variant="outline" className="border-border">
            <Plus className="w-4 h-4 mr-2" />
            Add Question
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {questions.map((question, index) => (
            <div
              key={question.id}
              className="group flex items-start justify-between gap-4 p-4 rounded-lg border border-border bg-background/50 hover:bg-accent/50 transition-colors"
            >
              {editingId === question.id && editForm ? (
                <div className="flex-1 space-y-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Label (Question)</Label>
                    <Input
                      value={editForm.label}
                      onChange={(e) => setEditForm({ ...editForm, label: e.target.value })}
                      className="bg-background border-input"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Placeholder (Hint)</Label>
                    <Input
                      value={editForm.placeholder}
                      onChange={(e) => setEditForm({ ...editForm, placeholder: e.target.value })}
                      className="bg-background border-input"
                    />
                  </div>
                  <div className="flex gap-2 justify-end mt-2">
                    <Button size="sm" variant="ghost" onClick={cancelEdit}>
                      <X className="w-4 h-4 mr-1" /> Cancel
                    </Button>
                    <Button size="sm" onClick={saveEdit}>
                      <Check className="w-4 h-4 mr-1" /> Save
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="bg-primary/20 text-primary text-xs px-2 py-0.5 rounded-full font-mono">
                        #{index + 1}
                      </span>
                      <h4 className="font-medium text-foreground">{question.label}</h4>
                    </div>
                    <p className="text-sm text-muted-foreground italic">{question.placeholder}</p>
                  </div>
                  <div className="flex gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="icon" variant="ghost" onClick={() => startEditing(question)}>
                      <Edit2 className="w-4 h-4 text-muted-foreground hover:text-primary" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => removeQuestion(question.id)}>
                      <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          ))}
          {questions.length === 0 && (
            <div className="text-center py-8 text-muted-foreground border border-dashed border-border rounded-lg">
              No questions configured. Add one to get started.
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end sticky bottom-6 z-10">
        <Button 
          onClick={handleSave} 
          isLoading={isSaving}
          className="bg-primary text-primary-foreground shadow-lg hover:scale-105 transition-transform"
        >
          {isSaving ? (
            'Saving...'
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Settings
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
