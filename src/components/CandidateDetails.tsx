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
      className="bg-card border border-border rounded-lg p-5 dark:card-glow dark:border-glow space-y-4"
    >
      <h3 className="font-heading font-bold text-foreground dark:text-glow-sm flex items-center gap-2 text-sm uppercase tracking-wider">
        <User className="h-4 w-4 text-primary" />
        Candidate Overview
      </h3>

      <div className="space-y-3">
        <div>
          <p className="text-lg font-heading font-bold text-foreground dark:text-glow-sm">
            {resume.candidate_name || "Unknown"}
          </p>
          <p className="text-xs text-muted-foreground">{resume.file_name}</p>
        </div>

        {resume.candidate_email && (
          <div className="flex items-center gap-2 text-sm">
            <Mail className="h-3.5 w-3.5 text-primary" />
            <span className="text-foreground">{resume.candidate_email}</span>
          </div>
        )}

        {resume.candidate_phone && (
          <div className="flex items-center gap-2 text-sm">
            <Phone className="h-3.5 w-3.5 text-primary" />
            <span className="text-foreground">{resume.candidate_phone}</span>
          </div>
        )}

        {resume.candidate_summary && (
          <div>
            <p className="text-xs text-muted-foreground font-heading uppercase tracking-wider mb-1">Summary</p>
            <p className="text-sm text-foreground leading-relaxed">{resume.candidate_summary}</p>
          </div>
        )}

        {resume.candidate_skills && resume.candidate_skills.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground font-heading uppercase tracking-wider mb-2 flex items-center gap-1">
              <Code className="h-3 w-3" /> Skills
            </p>
            <div className="flex flex-wrap gap-1.5">
              {resume.candidate_skills.map((skill, i) => (
                <span
                  key={i}
                  className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium border border-primary/20"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {resume.candidate_experience && (
          <div>
            <p className="text-xs text-muted-foreground font-heading uppercase tracking-wider mb-1 flex items-center gap-1">
              <Briefcase className="h-3 w-3" /> Experience
            </p>
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
              {resume.candidate_experience}
            </p>
          </div>
        )}

        {resume.candidate_education && (
          <div>
            <p className="text-xs text-muted-foreground font-heading uppercase tracking-wider mb-1 flex items-center gap-1">
              <GraduationCap className="h-3 w-3" /> Education
            </p>
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
              {resume.candidate_education}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
