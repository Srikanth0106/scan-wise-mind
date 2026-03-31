import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Send, Bot, User, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";

interface Message { role: "user" | "assistant"; content: string; }
interface AIChatBoxProps { resumeId: string; resumeText: string; candidateName: string; }

export function AIChatBox({ resumeId, resumeText, candidateName }: AIChatBoxProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!user || !resumeId) return;
    const load = async () => {
      const { data } = await supabase.from("chat_messages").select("role, content")
        .eq("resume_id", resumeId).eq("user_id", user.id).order("created_at", { ascending: true });
      if (data && data.length > 0) setMessages(data as Message[]);
    };
    load();
  }, [user, resumeId]);

  const sendMessage = async () => {
    if (!input.trim() || !user || isLoading) return;
    const userMsg: Message = { role: "user", content: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    await supabase.from("chat_messages").insert({ user_id: user.id, resume_id: resumeId, role: "user", content: userMsg.content });

    let assistantContent = "";
    try {
      const allMessages = [...messages, userMsg];
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-resume`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({ messages: allMessages, resumeText: resumeText.substring(0, 15000), candidateName }),
      });

      if (!resp.ok) {
        if (resp.status === 429) { toast({ title: "Rate limited", description: "Please wait a moment.", variant: "destructive" }); setIsLoading(false); return; }
        if (resp.status === 402) { toast({ title: "Credits needed", description: "Please add AI credits.", variant: "destructive" }); setIsLoading(false); return; }
        throw new Error("Failed to get AI response");
      }
      if (!resp.body) throw new Error("No response body");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";

      const updateAssistant = (content: string) => {
        assistantContent = content;
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant") return prev.map((m, i) => i === prev.length - 1 ? { ...m, content } : m);
          return [...prev, { role: "assistant", content }];
        });
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });
        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) { assistantContent += content; updateAssistant(assistantContent); }
          } catch { textBuffer = line + "\n" + textBuffer; break; }
        }
      }

      if (assistantContent) {
        await supabase.from("chat_messages").insert({ user_id: user.id, resume_id: resumeId, role: "assistant", content: assistantContent });
      }
    } catch (error: any) {
      toast({ title: "AI Error", description: error.message, variant: "destructive" });
    } finally { setIsLoading(false); }
  };

  return (
    <div className="flex flex-col h-full bg-card border border-border rounded-xl card-elevated overflow-hidden">
      <div className="px-5 py-3.5 border-b border-border flex items-center gap-2">
        <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
          <Bot className="h-4 w-4 text-primary" />
        </div>
        <h3 className="font-heading font-semibold text-sm text-foreground">AI Assistant</h3>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
        {messages.length === 0 && (
          <div className="text-center text-muted-foreground py-10">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Bot className="h-6 w-6 text-primary" />
            </div>
            <p className="text-sm font-medium text-foreground mb-1">Ask about {candidateName}</p>
            <p className="text-xs text-muted-foreground mb-4">Get instant AI insights from the resume</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {["Summarize skills", "Years of experience?", "Key strengths?"].map(q => (
                <button key={q} onClick={() => setInput(q)}
                  className="text-xs px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-muted/50 transition-all font-medium">
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        <AnimatePresence>
          {messages.map((msg, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "assistant" && (
                <div className="h-6 w-6 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                  <Bot className="h-3.5 w-3.5 text-primary" />
                </div>
              )}
              <div className={`max-w-[80%] rounded-xl px-3.5 py-2.5 text-sm ${
                msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
              }`}>
                {msg.role === "assistant" ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none [&_p]:my-1 [&_ul]:my-1 [&_li]:my-0">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : <p>{msg.content}</p>}
              </div>
              {msg.role === "user" && (
                <div className="h-6 w-6 rounded-md bg-primary flex items-center justify-center flex-shrink-0 mt-1">
                  <User className="h-3.5 w-3.5 text-primary-foreground" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span className="text-xs font-medium">Thinking...</span>
          </div>
        )}
      </div>

      <div className="p-3 border-t border-border">
        <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex gap-2">
          <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about the candidate..."
            className="text-sm h-10" disabled={isLoading} />
          <Button type="submit" size="icon" disabled={isLoading || !input.trim()} className="h-10 w-10">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
