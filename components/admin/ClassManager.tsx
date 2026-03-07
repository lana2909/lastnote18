'use client';

import { useState } from 'react';
import { Major, Class } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import * as XLSX from 'xlsx';
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';
import { Loader2, Upload, FileUp, Users, Download, HelpCircle, AlertCircle, Key, FileDown, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Props {
  initialMajors: any[];
  adminName: string;
}

interface StudentRow {
  name: string;
  absentNo: number;
}

export default function ClassManager({ initialMajors, adminName }: Props) {
  const [majors, setMajors] = useState(initialMajors);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<StudentRow[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [lastUpdates, setLastUpdates] = useState<Record<string, number>>({});
  const [confirmUpdateClassId, setConfirmUpdateClassId] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  const handleDownloadTemplate = () => {
    const data = [
      { No: 1, Name: "John Doe" },
      { No: 2, Name: "Jane Smith" },
      { No: 26, Name: "Rahma Krisanda (Insert Example)" },
    ];
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "Student_Import_Template.xlsx");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      parseFile(file);
    }
  };

  const parseFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        // Assuming format: No, Name (skip header if present)
        // Let's try to detect header or assume row 2 starts data
        const students: StudentRow[] = [];
        
        // Skip header row if first row looks like header
        let startIndex = 0;
        if (jsonData.length > 0 && (jsonData[0] as any[])[0]?.toString().toLowerCase().includes('no')) {
          startIndex = 1;
        }

        for (let i = startIndex; i < jsonData.length; i++) {
          const row = jsonData[i] as any[];
          if (row && row.length >= 2) {
            const no = parseInt(row[0]);
            const name = row[1]?.toString().trim();
            if (!isNaN(no) && name) {
              students.push({ absentNo: no, name });
            }
          }
        }

        setPreviewData(students);
        
        if (students.length === 0) {
          toast({
            title: 'Invalid File',
            description: 'No valid student data found. Ensure columns "No" and "Name" exist.',
            variant: 'destructive',
          });
          setSelectedFile(null);
        }
      } catch (error) {
        console.error('Error parsing file:', error);
        toast({
          title: 'Error',
          description: 'Failed to parse file. Please ensure it is a valid Excel or CSV file.',
          variant: 'destructive',
        });
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleImport = async () => {
    if (!selectedClassId || previewData.length === 0) return;

    setUploading(true);
    try {
      const response = await fetch('/api/admin/import-students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classId: selectedClassId,
          students: previewData,
        }),
      });

      const result = await response.json();

      if (!response.ok) throw new Error(result.message || 'Import failed');

      toast({
        title: 'Import Successful',
        description: `${result.message}. New students added.`,
        action: (
          <ToastAction altText="Update Credentials" onClick={() => handleUpdateClick(selectedClassId)}>
            Update Creds
          </ToastAction>
        ),
      });

      setSelectedFile(null);
      setPreviewData([]);
      // Keep dialog open or close? Maybe keep open to allow other actions.
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateClick = (classId: string) => {
    const lastTime = lastUpdates[classId] || 0;
    const now = Date.now();
    const cooldown = 60000; // 60 seconds
    
    if (now - lastTime < cooldown) {
      const remaining = Math.ceil((cooldown - (now - lastTime)) / 1000);
      toast({
        title: 'Please wait',
        description: `You can update credentials again in ${remaining} seconds.`,
        variant: 'destructive',
      });
      return;
    }
    
    setConfirmUpdateClassId(classId);
  };

  const handleUpdateCredentials = async () => {
    if (!confirmUpdateClassId) return;
    const classId = confirmUpdateClassId;
    setConfirmUpdateClassId(null); // Close dialog

    try {
      toast({ title: 'Updating...', description: 'Generating credentials for new users...' });
      
      const response = await fetch('/api/admin/update-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classId, force: false }), // Only missing tokens
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message);

      // Update timestamp
      setLastUpdates(prev => ({ ...prev, [classId]: Date.now() }));

      toast({
        title: 'Credentials Updated',
        description: data.message,
      });
    } catch (error: any) {
      toast({
        title: 'Update Failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleExportCredentials = async (classId: string) => {
    try {
      toast({ title: 'Exporting...', description: 'Preparing Excel file...' });

      const response = await fetch('/api/admin/export-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classId }),
      });

      if (!response.ok) throw new Error('Export failed');

      // Download Blob
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Credentials_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();

      toast({ title: 'Export Complete', description: 'File downloaded.' });
    } catch (error: any) {
      toast({
        title: 'Export Failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold font-orbitron tracking-wider text-primary">
              Class Management
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage classes and import student data for {adminName}
            </p>
          </div>
          <Button variant="outline" onClick={() => router.push('/admin')}>
            Back to Dashboard
          </Button>
        </div>

        <div className="grid gap-6">
          {majors.map((major: any) => (
            <Card key={major.id} className="border-primary/20 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl text-primary flex items-center gap-2">
                  <span className="bg-primary/10 px-2 py-1 rounded text-sm">{major.short_name}</span>
                  {major.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {major.classes?.map((cls: any) => (
                    <div 
                      key={cls.id} 
                      className="p-4 rounded-lg border border-border bg-background/50 hover:bg-background/80 transition-colors flex justify-between items-center group"
                    >
                      <div>
                        <h3 className="font-semibold text-foreground">{cls.display_name || cls.name}</h3>
                      </div>
                      
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="secondary" 
                            size="sm"
                            onClick={() => setSelectedClassId(cls.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <FileUp className="w-4 h-4 mr-2" />
                            Import
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl">
                          <DialogHeader>
                            <DialogTitle>Manage {cls.display_name}</DialogTitle>
                            <DialogDescription>
                              Import students, update credentials, or export data.
                            </DialogDescription>
                          </DialogHeader>
                          
                          <div className="space-y-6 py-4">
                            
                            {/* Action Buttons */}
                            <div className="grid grid-cols-2 gap-4">
                              <Button 
                                variant="outline" 
                                className="h-auto py-4 flex flex-col gap-2"
                                onClick={() => handleUpdateClick(cls.id)}
                              >
                                <RefreshCw className="w-6 h-6" />
                                <div className="text-left">
                                  <div className="font-semibold">Update Credentials</div>
                                  <div className="text-xs text-muted-foreground font-normal">Generate tokens for new users</div>
                                </div>
                              </Button>

                              <Button 
                                variant="outline" 
                                className="h-auto py-4 flex flex-col gap-2"
                                onClick={() => handleExportCredentials(cls.id)}
                              >
                                <FileDown className="w-6 h-6" />
                                <div className="text-left">
                                  <div className="font-semibold">Export Credentials</div>
                                  <div className="text-xs text-muted-foreground font-normal">Download Excel list</div>
                                </div>
                              </Button>
                            </div>

                            <div className="border-t border-border my-4" />

                            <h3 className="font-semibold text-lg flex items-center gap-2">
                              <Upload className="w-5 h-5" /> Import Data
                            </h3>
                            
                            <Accordion type="single" collapsible className="w-full">
                              <AccordionItem value="item-1">
                                <AccordionTrigger className="text-sm font-medium">
                                  <div className="flex items-center gap-2">
                                    <HelpCircle className="w-4 h-4" />
                                    How to Import & Rules
                                  </div>
                                </AccordionTrigger>
                                <AccordionContent className="text-sm text-muted-foreground space-y-2">
                                  <p>1. <strong>Download Template</strong>: Use the button below to get the correct format.</p>
                                  <p>2. <strong>Columns</strong>: The file must have <strong>No</strong> (Absent Number) and <strong>Name</strong> columns.</p>
                                  <p>3. <strong>Insertion Logic</strong>: </p>
                                  <ul className="list-disc pl-5 space-y-1">
                                    <li>New students are inserted.</li>
                                    <li>If you provide a specific <strong>No</strong> (e.g. 26), and it's already taken, the system will automatically <strong>SHIFT</strong> existing students down (26 &rarr; 27, 27 &rarr; 28) to make room.</li>
                                    <li>Ensure your numbering is correct in the file.</li>
                                  </ul>
                                  <p>4. <strong>Validation</strong>: The system will reject files with missing required columns.</p>
                                </AccordionContent>
                              </AccordionItem>
                            </Accordion>

                            <div className="flex items-center justify-between gap-4 p-4 bg-muted/50 rounded-lg border border-border">
                              <div>
                                <Label className="text-sm font-semibold">1. Get Template</Label>
                                <p className="text-xs text-muted-foreground">Start with a clean file</p>
                              </div>
                              <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
                                <Download className="w-4 h-4 mr-2" />
                                Download Template
                              </Button>
                            </div>

                            <div className="space-y-2">
                              <Label className="text-sm font-semibold">2. Upload File</Label>
                              <div className="flex items-center gap-4">
                                <Input 
                                  type="file" 
                                  accept=".xlsx, .xls, .csv"
                                  onChange={handleFileChange}
                                />
                              </div>
                            </div>

                            {previewData.length > 0 && (
                              <div className="border rounded-md max-h-[400px] overflow-auto">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead className="w-[100px]">No</TableHead>
                                      <TableHead>Name</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {previewData.map((student, idx) => (
                                      <TableRow key={idx}>
                                        <TableCell>{student.absentNo}</TableCell>
                                        <TableCell>{student.name}</TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            )}

                            <div className="flex justify-end gap-2 mt-4">
                              <Button 
                                onClick={handleImport} 
                                disabled={uploading || previewData.length === 0}
                              >
                                {uploading ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Importing...
                                  </>
                                ) : (
                                  <>
                                    <Upload className="mr-2 h-4 w-4" />
                                    Import {previewData.length} Students
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  ))}
                  {(!major.classes || major.classes.length === 0) && (
                    <div className="text-sm text-muted-foreground italic col-span-full">No classes found</div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      <AlertDialog open={!!confirmUpdateClassId} onOpenChange={(open) => !open && setConfirmUpdateClassId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Update Credentials?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will generate <strong>Claim Tokens</strong> for any students in this class who do not have one yet.
              <br/><br/>
              Existing tokens will <strong>NOT</strong> be changed unless you force it (currently disabled).
              <br/><br/>
              <span className="text-destructive font-semibold">Note:</span> Please do not spam this button. Wait at least 60 seconds between updates.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleUpdateCredentials}>Confirm Update</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
