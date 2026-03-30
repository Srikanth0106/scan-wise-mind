import { useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

interface ResumeUploaderProps {
  onResumeProcessed: (resumeId: string) => void;
}

export function ResumeUploader({ onResumeProcessed }: ResumeUploaderProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const processFile = useCallback(async (file: File) => {
    if (!user) return;
    if (!file.name.match(/\.(pdf|doc|docx|txt)$/i)) {
      toast({ title: "Invalid file", description: "Please upload a PDF, DOC, DOCX, or TXT file.", variant: "destructive" });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max file size is 10MB.", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      // Upload to storage
      const filePath = `${user.id}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("resumes")
        .upload(filePath, file);
      if (uploadError) throw uploadError;

      // Read file text for AI processing
      const text = await file.text();

      // Call AI to parse resume
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/parse-resume`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ resumeText: text.substring(0, 15000) }),
        }
      );

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to parse resume");
      }

      const parsed = await response.json();

      // Save to database
      const { data: resume, error: dbError } = await supabase
        .from("resumes")
        .insert({
          user_id: user.id,
          file_path: filePath,
          file_name: file.name,
          resume_text: text.substring(0, 50000),
          candidate_name: parsed.name || "Unknown",
          candidate_email: parsed.email || null,
          candidate_phone: parsed.phone || null,
          candidate_summary: parsed.summary || null,
          candidate_skills: parsed.skills || [],
          candidate_experience: parsed.experience || null,
          candidate_education: parsed.education || null,
        })
        .select()
        .single();

      if (dbError) throw dbError;

      toast({ title: "Resume uploaded!", description: `${parsed.name || file.name} has been processed.` });
      onResumeProcessed(resume.id);
    } catch (error: any) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  }, [user, toast, onResumeProcessed]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }, [processFile]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300 ${
        dragOver
          ? "border-primary bg-primary/5 dark:border-glow"
          : "border-border hover:border-primary/50"
      }`}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      {uploading ? (
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 text-primary animate-spin" />
          <p className="text-foreground font-heading dark:text-glow-sm">Processing resume with AI...</p>
          <p className="text-xs text-muted-foreground">This may take a moment</p>
        </div>
      ) : (
        <>
          <div className="flex flex-col items-center gap-3">
            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
              <Upload className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-foreground font-heading font-medium dark:text-glow-sm">
                Drop your resume here
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                PDF, DOC, DOCX, or TXT — Max 10MB
              </p>
            </div>
          </div>
          <div className="mt-4">
            <label htmlFor="resume-upload">
              <Button variant="outline" className="font-heading gap-2 cursor-pointer" asChild>
                <span>
                  <FileText className="h-4 w-4" />
                  Browse Files
                </span>
              </Button>
            </label>
            <input
              id="resume-upload"
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              onChange={handleFileInput}
              className="hidden"
            />
          </div>
        </>
      )}
    </motion.div>
  );
}
