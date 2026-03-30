import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ResumeUploader } from "@/components/ResumeUploader";
import { CandidateDetails } from "@/components/CandidateDetails";
import { AIChatBox } from "@/components/AIChatBox";
import { CandidateActions } from "@/components/CandidateActions";
import { motion } from "framer-motion";

interface ResumeData {
  id: string;
  candidate_name: string | null;
  candidate_email: string | null;
  candidate_phone: string | null;
  candidate_summary: string | null;
  candidate_skills: string[] | null;
  candidate_experience: string | null;
  candidate_education: string | null;
  resume_text: string | null;
  file_name: string | null;
  status: string;
}

export default function Scan() {
  const { user } = useAuth();
  const [resumeId, setResumeId] = useState<string | null>(null);
  const [resume, setResume] = useState<ResumeData | null>(null);

  useEffect(() => {
    if (!resumeId || !user) return;
    const fetchResume = async () => {
      const { data } = await supabase
        .from("resumes")
        .select("*")
        .eq("id", resumeId)
        .eq("user_id", user.id)
        .single();
      if (data) setResume(data as ResumeData);
    };
    fetchResume();
  }, [resumeId, user]);

  const handleReset = () => {
    setResumeId(null);
    setResume(null);
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6"
      >
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground dark:text-glow">
            Resume Scanner
          </h1>
          <p className="text-sm text-muted-foreground">Upload a resume and let AI analyze it</p>
        </div>
        {resume && (
          <button
            onClick={handleReset}
            className="text-sm text-muted-foreground hover:text-primary transition-colors font-heading"
          >
            ← Scan another
          </button>
        )}
      </motion.div>

      {!resume ? (
        <ResumeUploader onResumeProcessed={setResumeId} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[calc(100vh-180px)]">
          {/* Left: Candidate details */}
          <div className="flex flex-col gap-4 overflow-y-auto">
            <CandidateDetails resume={resume} />
            <CandidateActions
              resumeId={resume.id}
              candidateName={resume.candidate_name || "Unknown"}
              candidateEmail={resume.candidate_email}
              status={resume.status}
              onStatusChange={(status) => setResume(prev => prev ? { ...prev, status } : null)}
            />
          </div>

          {/* Right: AI Chat */}
          <div className="min-h-0">
            <AIChatBox
              resumeId={resume.id}
              resumeText={resume.resume_text || ""}
              candidateName={resume.candidate_name || "Unknown"}
            />
          </div>
        </div>
      )}
    </div>
  );
}
