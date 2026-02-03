import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Upload, 
  ImageIcon, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Loader2,
  FolderOpen,
  UserPlus
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useStaff, type StaffMember } from "@/hooks/useStaff";
import { toast } from "@/hooks/use-toast";

interface BulkAvatarImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface UploadResult {
  filename: string;
  matchedStaff: StaffMember | null;
  status: 'pending' | 'uploading' | 'success' | 'error' | 'no-match';
  error?: string;
  manuallyMapped?: boolean;
}

export function BulkAvatarImportDialog({ open, onOpenChange }: BulkAvatarImportDialogProps) {
  const { staff, refetch } = useStaff();
  const [files, setFiles] = useState<File[]>([]);
  const [uploadResults, setUploadResults] = useState<UploadResult[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get staff members that are not already matched to any file
  const getAvailableStaff = (currentIndex: number) => {
    const matchedStaffIds = uploadResults
      .filter((r, idx) => idx !== currentIndex && r.matchedStaff)
      .map(r => r.matchedStaff!.id);
    
    return staff.filter(s => !matchedStaffIds.includes(s.id));
  };

  const findMatchingStaff = (filename: string): StaffMember | null => {
    // Remove file extension
    const nameWithoutExt = filename.replace(/\.[^/.]+$/, "").toLowerCase();
    
    // Try to match by username first
    let match = staff.find(s => s.username.toLowerCase() === nameWithoutExt);
    if (match) return match;
    
    // Try to match by full name (with spaces replaced by underscores or dashes)
    const normalizedName = nameWithoutExt.replace(/[-_]/g, " ");
    match = staff.find(s => 
      s.full_name?.toLowerCase() === normalizedName ||
      s.full_name?.toLowerCase().replace(/\s+/g, "") === nameWithoutExt
    );
    if (match) return match;
    
    // Try partial match on username
    match = staff.find(s => 
      s.username.toLowerCase().includes(nameWithoutExt) ||
      nameWithoutExt.includes(s.username.toLowerCase())
    );
    
    return match || null;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const imageFiles = selectedFiles.filter(file => 
      file.type.startsWith('image/')
    );

    if (imageFiles.length === 0) {
      toast({
        title: "No images found",
        description: "Please select image files (JPG, PNG, etc.)",
        variant: "destructive"
      });
      return;
    }

    setFiles(imageFiles);
    
    // Pre-analyze files and match to staff
    const results: UploadResult[] = imageFiles.map(file => {
      const matchedStaff = findMatchingStaff(file.name);
      return {
        filename: file.name,
        matchedStaff,
        status: matchedStaff ? 'pending' : 'no-match',
        manuallyMapped: false
      };
    });
    
    setUploadResults(results);
    setProgress(0);
  };

  const handleManualMap = (index: number, staffId: string) => {
    if (staffId === 'none') {
      // Clear mapping
      setUploadResults(prev => prev.map((r, idx) => 
        idx === index ? { ...r, matchedStaff: null, status: 'no-match' as const, manuallyMapped: false } : r
      ));
      return;
    }

    const selectedStaff = staff.find(s => s.id === staffId);
    if (selectedStaff) {
      setUploadResults(prev => prev.map((r, idx) => 
        idx === index ? { ...r, matchedStaff: selectedStaff, status: 'pending' as const, manuallyMapped: true } : r
      ));
    }
  };

  const handleUpload = async () => {
    const filesToUpload = files.filter((_, i) => 
      uploadResults[i]?.matchedStaff && uploadResults[i]?.status === 'pending'
    );

    if (filesToUpload.length === 0) {
      toast({
        title: "No files to upload",
        description: "No files matched to staff members",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const result = uploadResults[i];
      
      if (!result.matchedStaff || result.status !== 'pending') {
        continue;
      }

      // Update status to uploading
      setUploadResults(prev => prev.map((r, idx) => 
        idx === i ? { ...r, status: 'uploading' as const } : r
      ));

      try {
        const staffId = result.matchedStaff.id;
        const fileExt = file.name.split('.').pop();
        const fileName = `${staffId}/avatar-${Date.now()}.${fileExt}`;

        // Upload to Supabase storage
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName);

        // Update profile
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ avatar_url: urlData.publicUrl })
          .eq('id', staffId);

        if (updateError) throw updateError;

        setUploadResults(prev => prev.map((r, idx) => 
          idx === i ? { ...r, status: 'success' as const } : r
        ));
        successCount++;
      } catch (error: any) {
        console.error('Upload error:', error);
        setUploadResults(prev => prev.map((r, idx) => 
          idx === i ? { ...r, status: 'error' as const, error: error.message } : r
        ));
        errorCount++;
      }

      // Update progress
      const processed = uploadResults.filter((_, idx) => idx <= i && uploadResults[idx]?.matchedStaff).length;
      const total = uploadResults.filter(r => r.matchedStaff).length;
      setProgress((processed / total) * 100);
    }

    setIsUploading(false);
    refetch();

    toast({
      title: "Bulk upload complete",
      description: `${successCount} avatars uploaded successfully${errorCount > 0 ? `, ${errorCount} failed` : ''}`,
      variant: successCount > 0 ? "default" : "destructive"
    });
  };

  const handleClose = () => {
    if (!isUploading) {
      setFiles([]);
      setUploadResults([]);
      setProgress(0);
      onOpenChange(false);
    }
  };

  const matchedCount = uploadResults.filter(r => r.matchedStaff).length;
  const pendingCount = uploadResults.filter(r => r.status === 'pending').length;
  const successCount = uploadResults.filter(r => r.status === 'success').length;
  const errorCount = uploadResults.filter(r => r.status === 'error').length;
  const unmatchedCount = uploadResults.filter(r => r.status === 'no-match').length;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Bulk Avatar Import</DialogTitle>
          <DialogDescription>
            Upload multiple images. Filenames should match staff usernames (e.g., john_doe.jpg for @john_doe). 
            You can manually assign unmatched images.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* File Selection */}
          <div className="border-2 border-dashed rounded-lg p-6 text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              disabled={isUploading}
            />
            
            <FolderOpen className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground mb-3">
              Select multiple image files
            </p>
            <Button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              variant="outline"
            >
              <Upload className="mr-2 h-4 w-4" />
              Choose Files
            </Button>
          </div>

          {/* Results Summary */}
          {uploadResults.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              <Badge variant="outline">
                <ImageIcon className="h-3 w-3 mr-1" />
                {files.length} files
              </Badge>
              <Badge variant={matchedCount > 0 ? "default" : "secondary"}>
                {matchedCount} matched
              </Badge>
              {unmatchedCount > 0 && (
                <Badge variant="secondary">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {unmatchedCount} unmatched
                </Badge>
              )}
              {successCount > 0 && (
                <Badge className="bg-green-500">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  {successCount} uploaded
                </Badge>
              )}
              {errorCount > 0 && (
                <Badge variant="destructive">
                  <XCircle className="h-3 w-3 mr-1" />
                  {errorCount} failed
                </Badge>
              )}
            </div>
          )}

          {/* Progress Bar */}
          {isUploading && (
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <p className="text-sm text-muted-foreground text-center">
                Uploading... {Math.round(progress)}%
              </p>
            </div>
          )}

          {/* File List */}
          {uploadResults.length > 0 && (
            <ScrollArea className="h-[280px] border rounded-md p-2">
              <div className="space-y-2">
                {uploadResults.map((result, idx) => (
                  <div 
                    key={idx}
                    className="flex items-center justify-between gap-2 p-2 rounded bg-muted/50"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <ImageIcon className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                      <span className="text-sm truncate">{result.filename}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {/* Show status for completed/in-progress uploads */}
                      {result.status === 'uploading' && (
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      )}
                      {result.status === 'success' && (
                        <div className="flex items-center gap-1">
                          <Badge variant="outline" className="text-xs">
                            @{result.matchedStaff?.username}
                          </Badge>
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        </div>
                      )}
                      {result.status === 'error' && (
                        <div className="flex items-center gap-1">
                          <Badge variant="outline" className="text-xs">
                            @{result.matchedStaff?.username}
                          </Badge>
                          <XCircle className="h-4 w-4 text-destructive" />
                        </div>
                      )}
                      
                      {/* Show matched staff or manual mapping select for pending/no-match */}
                      {(result.status === 'pending' || result.status === 'no-match') && (
                        <Select
                          value={result.matchedStaff?.id || 'none'}
                          onValueChange={(value) => handleManualMap(idx, value)}
                          disabled={isUploading}
                        >
                          <SelectTrigger className="w-[160px] h-8 text-xs">
                            <SelectValue placeholder="Select staff...">
                              {result.matchedStaff ? (
                                <span className="flex items-center gap-1">
                                  {result.manuallyMapped && <UserPlus className="h-3 w-3" />}
                                  @{result.matchedStaff.username}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">Select staff...</span>
                              )}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent className="bg-background z-50">
                            <SelectItem value="none" className="text-xs text-muted-foreground">
                              No assignment
                            </SelectItem>
                            {getAvailableStaff(idx).map((s) => (
                              <SelectItem key={s.id} value={s.id} className="text-xs">
                                @{s.username} {s.full_name && `(${s.full_name})`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose} disabled={isUploading}>
              {successCount > 0 ? 'Close' : 'Cancel'}
            </Button>
            {pendingCount > 0 && (
              <Button onClick={handleUpload} disabled={isUploading}>
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload {matchedCount} Avatars
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
