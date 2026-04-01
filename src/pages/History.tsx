import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, FileText, CheckCircle, XCircle, Clock, ChevronRight, Filter } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { Link } from "react-router-dom";

interface ResumeRow {
  id: string;
  candidate_name: string | null;
  candidate_email: string | null;
  candidate_skills: string[] | null;
  status: string;
  file_name: string | null;
  created_at: string;
}

const statusConfig: Record<string, { label: string; icon: typeof CheckCircle; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  approved: { label: "Approved", icon: CheckCircle, variant: "default" },
  rejected: { label: "Rejected", icon: XCircle, variant: "destructive" },
  pending: { label: "Pending", icon: Clock, variant: "secondary" },
};

export default function History() {
  const { user } = useAuth();
  const [resumes, setResumes] = useState<ResumeRow[]>([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("resumes")
        .select("id, candidate_name, candidate_email, candidate_skills, status, file_name, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (data) setResumes(data as ResumeRow[]);
      setLoading(false);
    };
    fetch();
  }, [user]);

  const filtered = resumes.filter(r => {
    const matchesSearch = !search || 
      (r.candidate_name?.toLowerCase().includes(search.toLowerCase())) ||
      (r.candidate_email?.toLowerCase().includes(search.toLowerCase())) ||
      (r.file_name?.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = filterStatus === "all" || r.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="font-heading text-3xl font-extrabold text-foreground tracking-tight mb-1">
          Scan History
        </h1>
        <p className="text-muted-foreground text-sm">
          View and search all your previously scanned resumes
        </p>
      </motion.div>

      {/* Search & Filter Bar */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or file..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-10"
          />
        </div>
        <div className="flex gap-1.5 bg-muted/50 rounded-lg p-1">
          {["all", "approved", "rejected", "pending"].map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all capitalize ${
                filterStatus === s
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {s === "all" ? "All" : s}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Results */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-card border border-border rounded-xl p-5 animate-pulse">
              <div className="h-4 bg-muted rounded w-1/3 mb-2" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="bg-card border border-border rounded-xl p-12 text-center card-elevated">
          <FileText className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground font-medium">
            {resumes.length === 0 ? "No resumes scanned yet" : "No results match your search"}
          </p>
          {resumes.length === 0 && (
            <Link to="/scan">
              <Button variant="outline" className="mt-4 gap-2">
                <FileText className="h-4 w-4" /> Scan Your First Resume
              </Button>
            </Link>
          )}
        </motion.div>
      ) : (
        <div className="space-y-2">
          {filtered.map((resume, i) => {
            const config = statusConfig[resume.status] || statusConfig.pending;
            const StatusIcon = config.icon;
            return (
              <motion.div
                key={resume.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="bg-card border border-border rounded-xl p-4 card-elevated hover:card-elevated-lg transition-all group"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-heading font-bold text-foreground text-sm truncate">
                        {resume.candidate_name || "Unknown Candidate"}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{resume.file_name || "—"}</span>
                        <span>•</span>
                        <span>{format(new Date(resume.created_at), "MMM d, yyyy 'at' h:mm a")}</span>
                      </div>
                      {resume.candidate_skills && resume.candidate_skills.length > 0 && (
                        <div className="flex gap-1 mt-1.5 flex-wrap">
                          {resume.candidate_skills.slice(0, 4).map(skill => (
                            <span key={skill} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium">
                              {skill}
                            </span>
                          ))}
                          {resume.candidate_skills.length > 4 && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                              +{resume.candidate_skills.length - 4}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <Badge variant={config.variant} className="gap-1 text-xs">
                      <StatusIcon className="h-3 w-3" />
                      {config.label}
                    </Badge>
                    <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
        className="text-xs text-muted-foreground text-center mt-6">
        Showing {filtered.length} of {resumes.length} resume{resumes.length !== 1 ? "s" : ""}
      </motion.p>
    </div>
  );
}
