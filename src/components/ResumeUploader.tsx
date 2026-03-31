import { useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, Loader2, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { extractTextFromFile } from "@/lib/pdfExtract";

interface ResumeUploaderProps {
  onResumeProcessed: (resumeId: string) => void;
}

export function ResumeUploader({ onResumeProcessed }: ResumeUploaderProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [status, setStatus] = useState("");

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
      // Step 1: Upload to storage
      setStatus("Uploading file...");
      const filePath = `${user.id}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("resumes")
        .upload(filePath, file);
      if (uploadError) throw uploadError;

      // Step 2: Extract text from the file
      setStatus("Extracting text from resume...");
      let text: string;
      try {
        text = await extractTextFromFile(file);
      } catch (extractError) {
        console.error("Text extraction error:", extractError);
        // Fallback: try reading as raw text
        text = await file.text();
      }

      if (!text || text.trim().length < 20) {
        throw new Error("Could not extract readable text from the file. Please try a different file format (e.g., TXT or a text-based PDF).");
      }

      // Step 3: Call AI to parse resume
      setStatus("AI is analyzing the resume...");
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

      // Step 4: Save to database
      setStatus("Saving candidate data...");
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

      toast({ title: "Resume processed!", description: `${parsed.name || file.name} has been analyzed successfully.` });
      onResumeProcessed(resume.id);
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    } finally {
      setUploading(false);
      setStatus("");
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
      className={`border-2 border-dashed rounded-lg p-12 text-center transition-all duration-300 ${
        dragOver
          ? "border-primary bg-primary/5 dark:border-glow"
          : "border-border hover:border-primary/50"
      }`}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      {uploading ? (
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 text-primary animate-spin" />
          <div>
            <p className="text-foreground font-heading font-medium dark:text-glow-sm">
              Processing resume with AI...
            </p>
            <p className="text-xs text-muted-foreground mt-1">{status}</p>
          </div>
          <div className="w-48 h-1.5 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: "90%" }}
              transition={{ duration: 8, ease: "easeOut" }}
            />
          </div>
        </div>
      ) : (
        <>
          <div className="flex flex-col items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Upload className="h-7 w-7 text-primary" />
            </div>
            <div>
              <p className="text-foreground font-heading font-semibold text-lg dark:text-glow-sm">
                Drop your resume here
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Supports PDF, DOC, DOCX, and TXT files up to 10MB
              </p>
            </div>
          </div>
          <div className="mt-6">
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
          <div className="mt-4 flex items-center gap-2 justify-center text-xs text-muted-foreground">
            <AlertCircle className="h-3 w-3" />
            <span>For best results, use text-based PDFs (not scanned images)</span>
          </div>
        </>
      )}
    </motion.div>
  );
}
