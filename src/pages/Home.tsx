import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FileSearch, CheckCircle, XCircle, Clock, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ total: 0, approved: 0, rejected: 0, pending: 0 });

  useEffect(() => {
    if (!user) return;
    const fetchStats = async () => {
      const { data } = await supabase
        .from("resumes")
        .select("status")
        .eq("user_id", user.id);
      if (data) {
        setStats({
          total: data.length,
          approved: data.filter(r => r.status === "approved").length,
          rejected: data.filter(r => r.status === "rejected").length,
          pending: data.filter(r => r.status === "pending").length,
        });
      }
    };
    fetchStats();
  }, [user]);

  const cards = [
    { label: "Total Scanned", value: stats.total, icon: TrendingUp, color: "text-primary" },
    { label: "Approved", value: stats.approved, icon: CheckCircle, color: "text-success" },
    { label: "Rejected", value: stats.rejected, icon: XCircle, color: "text-destructive" },
    { label: "Pending", value: stats.pending, icon: Clock, color: "text-warning" },
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="font-heading text-3xl font-bold text-foreground dark:text-glow mb-2">
          Dashboard
        </h1>
        <p className="text-muted-foreground">
          Welcome back, {user?.user_metadata?.full_name || user?.email}
        </p>
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {cards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-card border border-border rounded-lg p-5 dark:card-glow dark:border-glow"
          >
            <div className="flex items-center gap-3 mb-3">
              <card.icon className={`h-5 w-5 ${card.color}`} />
              <span className="text-xs text-muted-foreground font-heading uppercase tracking-wider">
                {card.label}
              </span>
            </div>
            <p className={`text-3xl font-heading font-bold ${card.color} dark:text-glow-sm`}>
              {card.value}
            </p>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-card border border-border rounded-lg p-8 text-center dark:card-glow dark:border-glow"
      >
        <FileSearch className="h-12 w-12 text-primary mx-auto mb-4 dark:text-glow" />
        <h2 className="font-heading text-xl font-bold text-foreground dark:text-glow-sm mb-2">
          Ready to scan a resume?
        </h2>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto text-sm">
          Upload a resume and let AI extract candidate details, answer your questions, and help you make hiring decisions faster.
        </p>
        <Link to="/scan">
          <Button size="lg" className="font-heading gap-2">
            <FileSearch className="h-4 w-4" />
            Start Scanning
          </Button>
        </Link>
      </motion.div>
    </div>
  );
}
