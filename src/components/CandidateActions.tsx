import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Mail, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface CandidateActionsProps {
  resumeId: string;
  candidateName: string;
  candidateEmail: string | null;
  status: string;
  onStatusChange: (status: string) => void;
}

export function CandidateActions({
  resumeId,
  candidateName,
  candidateEmail,
  status,
  onStatusChange,
}: CandidateActionsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [subject, setSubject] = useState(`Interview Invitation - ${candidateName}`);
  const [body, setBody] = useState(
    `Dear ${candidateName},\n\nWe are pleased to inform you that your resume has been shortlisted for the interview round.\n\nPlease let us know your availability for the upcoming week.\n\nBest regards,\n${user?.user_metadata?.full_name || user?.email}`
  );
  const [sendingEmail, setSendingEmail] = useState(false);
  const [updating, setUpdating] = useState(false);

  const updateStatus = async (newStatus: "approved" | "rejected") => {
    setUpdating(true);
    const { error } = await supabase
      .from("resumes")
      .update({ status: newStatus })
      .eq("id", resumeId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      onStatusChange(newStatus);
      toast({
        title: newStatus === "approved" ? "Candidate Approved!" : "Candidate Rejected",
        description: newStatus === "approved"
          ? "You can now send an interview invitation."
          : "The candidate has been marked as rejected.",
      });
      if (newStatus === "approved") setShowEmailForm(true);
    }
    setUpdating(false);
  };

  const sendEmail = async () => {
    if (!candidateEmail) {
      toast({ title: "No email", description: "Candidate email not found in resume.", variant: "destructive" });
      return;
    }
    setSendingEmail(true);
    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-candidate-email`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            to: candidateEmail,
            subject,
            body,
            recruiterEmail: user?.email,
          }),
        }
      );
      if (!resp.ok) throw new Error("Failed to send email");
      toast({ title: "Email sent!", description: `Interview invitation sent to ${candidateEmail}` });
      setShowEmailForm(false);
    } catch (error: any) {
      toast({ title: "Failed to send", description: error.message, variant: "destructive" });
    } finally {
      setSendingEmail(false);
    }
  };

  if (status === "pending") {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-card border border-border rounded-lg p-4 dark:card-glow dark:border-glow"
      >
        <p className="text-sm text-muted-foreground font-heading uppercase tracking-wider mb-3">
          Candidate Decision
        </p>
        <div className="flex gap-2">
          <Button
            onClick={() => updateStatus("approved")}
            disabled={updating}
            className="flex-1 gap-2 bg-success text-success-foreground hover:bg-success/90 font-heading"
          >
            {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
            Approve
          </Button>
          <Button
            onClick={() => updateStatus("rejected")}
            disabled={updating}
            variant="destructive"
            className="flex-1 gap-2 font-heading"
          >
            {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
            Reject
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-card border border-border rounded-lg p-4 dark:card-glow dark:border-glow"
    >
      <div className={`flex items-center gap-2 mb-3 ${status === "approved" ? "text-success" : "text-destructive"}`}>
        {status === "approved" ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
        <span className="font-heading font-bold text-sm uppercase tracking-wider">
          {status === "approved" ? "Approved" : "Rejected"}
        </span>
      </div>

      <AnimatePresence>
        {status === "approved" && !showEmailForm && (
          <Button
            onClick={() => setShowEmailForm(true)}
            variant="outline"
            className="w-full gap-2 font-heading"
          >
            <Mail className="h-4 w-4" />
            Send Interview Invitation
          </Button>
        )}

        {showEmailForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3"
          >
            <div className="space-y-1">
              <Label className="text-xs">To</Label>
              <Input value={candidateEmail || "No email found"} disabled className="bg-background text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Subject</Label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} className="bg-background text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Message</Label>
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={6}
                className="bg-background text-sm"
              />
            </div>
            <Button onClick={sendEmail} disabled={sendingEmail || !candidateEmail} className="w-full gap-2 font-heading">
              {sendingEmail ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
              {sendingEmail ? "Sending..." : "Send Email"}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
