import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { User, Mail, Building, Phone, Save, TrendingUp, CheckCircle, XCircle, Clock, CalendarDays } from "lucide-react";
import { motion } from "framer-motion";

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState({ full_name: "", company: "", phone: "" });
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState({ total: 0, approved: 0, rejected: 0, pending: 0, todayScanned: 0, todayApproved: 0 });

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("full_name, company, phone")
        .eq("user_id", user.id)
        .single();
      if (data) setProfile({ full_name: data.full_name || "", company: data.company || "", phone: data.phone || "" });

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data: resumes } = await supabase
        .from("resumes")
        .select("status, created_at")
        .eq("user_id", user.id);

      if (resumes) {
        const todayResumes = resumes.filter(r => new Date(r.created_at) >= today);
        setStats({
          total: resumes.length,
          approved: resumes.filter(r => r.status === "approved").length,
          rejected: resumes.filter(r => r.status === "rejected").length,
          pending: resumes.filter(r => r.status === "pending").length,
          todayScanned: todayResumes.length,
          todayApproved: todayResumes.filter(r => r.status === "approved").length,
        });
      }
    };
    load();
  }, [user]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update(profile)
      .eq("user_id", user.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Saved!", description: "Profile updated successfully." });
    }
    setSaving(false);
  };

  const statCards = [
    { label: "Total Scanned", value: stats.total, icon: TrendingUp },
    { label: "Approved", value: stats.approved, icon: CheckCircle },
    { label: "Rejected", value: stats.rejected, icon: XCircle },
    { label: "Pending", value: stats.pending, icon: Clock },
    { label: "Scanned Today", value: stats.todayScanned, icon: CalendarDays },
    { label: "Approved Today", value: stats.todayApproved, icon: CheckCircle },
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-heading text-3xl font-bold text-foreground dark:text-glow mb-2">Profile</h1>
        <p className="text-muted-foreground mb-8">Manage your recruiter profile and view your stats</p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
        {statCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-card border border-border rounded-lg p-4 dark:card-glow dark:border-glow"
          >
            <div className="flex items-center gap-2 mb-2">
              <card.icon className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground font-heading uppercase tracking-wider">{card.label}</span>
            </div>
            <p className="text-2xl font-heading font-bold text-foreground dark:text-glow-sm">{card.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Profile Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-card border border-border rounded-lg p-6 dark:card-glow dark:border-glow"
      >
        <h2 className="font-heading font-bold text-foreground dark:text-glow-sm mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
          <User className="h-4 w-4 text-primary" />
          Recruiter Details
        </h2>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-sm flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> Email</Label>
            <Input value={user?.email || ""} disabled className="bg-background" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm flex items-center gap-1.5"><User className="h-3.5 w-3.5" /> Full Name</Label>
            <Input value={profile.full_name} onChange={(e) => setProfile(p => ({ ...p, full_name: e.target.value }))} className="bg-background" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm flex items-center gap-1.5"><Building className="h-3.5 w-3.5" /> Company</Label>
            <Input value={profile.company} onChange={(e) => setProfile(p => ({ ...p, company: e.target.value }))} className="bg-background" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> Phone</Label>
            <Input value={profile.phone} onChange={(e) => setProfile(p => ({ ...p, phone: e.target.value }))} className="bg-background" />
          </div>
          <Button onClick={save} disabled={saving} className="gap-2 font-heading">
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : "Save Profile"}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
