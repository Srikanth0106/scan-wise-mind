import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileSearch, CheckCircle, XCircle, Clock, TrendingUp, ArrowRight, FileText, History } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";

interface RecentResume {
  id: string;
  candidate_name: string | null;
  status: string;
  created_at: string;
  file_name: string | null;
}

export default function Home() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ total: 0, approved: 0, rejected: 0, pending: 0 });
  const [recent, setRecent] = useState<RecentResume[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const { data } = await supabase.from("resumes").select("id, candidate_name, status, created_at, file_name").eq("user_id", user.id).order("created_at", { ascending: false });
      if (data) {
        setStats({
          total: data.length,
          approved: data.filter(r => r.status === "approved").length,
          rejected: data.filter(r => r.status === "rejected").length,
          pending: data.filter(r => r.status === "pending").length,
        });
        setRecent(data.slice(0, 5) as RecentResume[]);
      }
    };
    fetchData();
  }, [user]);

  const cards = [
    { label: "Total Scanned", value: stats.total, icon: TrendingUp, color: "text-primary", bg: "bg-primary/10" },
    { label: "Approved", value: stats.approved, icon: CheckCircle, color: "text-success", bg: "bg-success/10" },
    { label: "Rejected", value: stats.rejected, icon: XCircle, color: "text-destructive", bg: "bg-destructive/10" },
    { label: "Pending Review", value: stats.pending, icon: Clock, color: "text-warning", bg: "bg-warning/10" },
  ];

  const statusBadge = (status: string) => {
    const map: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
      approved: { label: "Approved", variant: "default" },
      rejected: { label: "Rejected", variant: "destructive" },
      pending: { label: "Pending", variant: "secondary" },
    };
    const config = map[status] || map.pending;
    return <Badge variant={config.variant} className="text-[10px]">{config.label}</Badge>;
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="font-heading text-3xl font-extrabold text-foreground tracking-tight mb-1">
          Dashboard
        </h1>
        <p className="text-muted-foreground text-sm">
          Welcome back, <span className="text-foreground font-medium">{user?.user_metadata?.full_name || user?.email}</span>
        </p>
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {cards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="bg-card border border-border rounded-xl p-5 card-elevated hover:card-elevated-lg transition-shadow"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className={`h-9 w-9 rounded-lg ${card.bg} flex items-center justify-center`}>
                <card.icon className={`h-4.5 w-4.5 ${card.color}`} />
              </div>
            </div>
            <p className="text-3xl font-heading font-extrabold text-foreground tracking-tight">
              {card.value}
            </p>
            <p className="text-xs text-muted-foreground mt-1 font-medium">{card.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-card border border-border rounded-xl p-6 card-elevated"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-primary" />
              <h2 className="font-heading text-sm font-bold text-foreground tracking-tight">Recent Activity</h2>
            </div>
            <Link to="/history" className="text-xs text-muted-foreground hover:text-primary transition-colors font-medium">
              View all →
            </Link>
          </div>
          {recent.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No scans yet. Start by scanning a resume!</p>
          ) : (
            <div className="space-y-2">
              {recent.map(r => (
                <div key={r.id} className="flex items-center justify-between gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{r.candidate_name || "Unknown"}</p>
                      <p className="text-[11px] text-muted-foreground">{format(new Date(r.created_at), "MMM d, h:mm a")}</p>
                    </div>
                  </div>
                  {statusBadge(r.status)}
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card border border-border rounded-xl p-10 text-center card-elevated-lg relative overflow-hidden flex flex-col justify-center"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
          <div className="relative z-10">
            <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
              <FileSearch className="h-7 w-7 text-primary" />
            </div>
            <h2 className="font-heading text-xl font-bold text-foreground tracking-tight mb-2">
              Ready to scan a resume?
            </h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto text-sm leading-relaxed">
              Upload a PDF and let AI extract candidate details, skills, and help you make hiring decisions.
            </p>
            <Link to="/scan">
              <Button size="lg" className="font-semibold gap-2 h-11 px-6">
                Start Scanning
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
