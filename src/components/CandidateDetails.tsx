import { User, Mail, Phone, Briefcase, GraduationCap, Code } from "lucide-react";
import { motion } from "framer-motion";

interface CandidateDetailsProps {
  resume: {
    candidate_name: string | null;
    candidate_email: string | null;
    candidate_phone: string | null;
    candidate_summary: string | null;
    candidate_skills: string[] | null;
    candidate_experience: string | null;
    candidate_education: string | null;
    file_name: string | null;
  };
}

export function CandidateDetails({ resume }: CandidateDetailsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-card border border-border rounded-xl p-6 card-elevated space-y-5"
    >
      <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-widest">
        <User className="h-3.5 w-3.5 text-primary" />
        Candidate Overview
      </div>

      <div className="space-y-4">
        <div>
          <p className="text-xl font-heading font-bold text-foreground tracking-tight">
            {resume.candidate_name || "Unknown"}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">{resume.file_name}</p>
        </div>

        <div className="flex flex-wrap gap-x-5 gap-y-2">
          {resume.candidate_email && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-3.5 w-3.5 text-primary" />
              <span className="text-foreground">{resume.candidate_email}</span>
            </div>
          )}
          {resume.candidate_phone && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="h-3.5 w-3.5 text-primary" />
              <span className="text-foreground">{resume.candidate_phone}</span>
            </div>
          )}
        </div>

        {resume.candidate_summary && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1.5">Summary</p>
            <p className="text-sm text-foreground leading-relaxed">{resume.candidate_summary}</p>
          </div>
        )}

        {resume.candidate_skills && resume.candidate_skills.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <Code className="h-3 w-3" /> Skills
            </p>
            <div className="flex flex-wrap gap-1.5">
              {resume.candidate_skills.map((skill, i) => (
                <span key={i}
                  className="text-xs px-2.5 py-1 rounded-md bg-accent text-accent-foreground font-medium">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {resume.candidate_experience && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
              <Briefcase className="h-3 w-3" /> Experience
            </p>
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">{resume.candidate_experience}</p>
          </div>
        )}

        {resume.candidate_education && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
              <GraduationCap className="h-3 w-3" /> Education
            </p>
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">{resume.candidate_education}</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
