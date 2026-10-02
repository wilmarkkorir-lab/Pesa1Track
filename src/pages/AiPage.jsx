import { useState, useRef, useEffect } from "react";
import { api, getRows } from "../api/endpoints";
import { useAuth } from "../context/AuthContext";

const GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY;
const MODEL = "openai/gpt-oss-120b";

async function askGroq(messages) {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${GROQ_KEY}` },
    body: JSON.stringify({ model: MODEL, messages, temperature: 0.7, max_tokens: 1024 }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Groq error ${res.status}`);
  }
  const data = await res.json();
  return data.choices[0].message.content;
}

async function transcribeAudio(blob) {
  const fd = new FormData();
  fd.append("file", blob, "audio.webm");
  fd.append("model", "whisper-large-v3-turbo");
  fd.append("response_format", "json");
  const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${GROQ_KEY}` },
    body: fd,
  });
  if (!res.ok) throw new Error(`Whisper error ${res.status}`);
  const data = await res.json();
  return data.text?.trim() || "";
}

function buildSystemPrompt(user, summary, transactions, budgets, goals, bills, debts) {
  const currency = user?.currency || "KES";
  const fmt = n => `${currency} ${Number(n || 0).toLocaleString()}`;
  const txLines = transactions.slice(0, 20).map(t =>
    `- ${t.transaction_date} | ${t.transaction_type} | ${t.description || "no desc"} | ${fmt(t.amount)}`
  ).join("\n");
  const budgetLines = budgets.map(b => `- ${b.month} | limit: ${fmt(b.total_limit)}`).join("\n");
  const goalLines = goals.map(g =>
    `- ${g.name} | target: ${fmt(g.target_amount)} | saved: ${fmt(g.current_amount)} | status: ${g.status}`
  ).join("\n");
  const billLines = bills.map(b =>
    `- ${b.name} | ${fmt(b.amount)} | due: ${b.due_date} | ${b.status}`
  ).join("\n");
  const debtLines = debts.map(d =>
    `- ${d.person_name} | ${d.debt_type} | outstanding: ${fmt(d.outstanding_amount)} | status: ${d.status}`
  ).join("\n");

  return `You are PesaTrack AI, a smart personal finance assistant built into the PesaTrack app.
You are talking to ${user?.full_name || "the user"}. Currency: ${currency}.

PesaTrack features the user can use:
- Dashboard: overview of income, expenses, balance
- Transactions: log income/expense entries
- Categories: organise transactions by custom categories
- Budgets: set monthly spending limits per category
- Goals: track savings goals with contributions
- Recurring: automate repeating income/expenses
- Bills: track upcoming bills and due dates
- Debts: manage money lent or borrowed
- Businesses: manage business profiles
- Settings: update profile, currency, timezone

Current financial snapshot:
- Total Income: ${fmt(summary?.income)}
- Total Expenses: ${fmt(summary?.expenses)}
- Balance: ${fmt(summary?.balance)}

Recent transactions (up to 20):
${txLines || "None yet"}

Budgets:
${budgetLines || "None set"}

Savings Goals:
${goalLines || "None set"}

Bills:
${billLines || "None set"}

Debts:
${debtLines || "None set"}

Instructions:
- Talk like a helpful friend, not a formal assistant. Use simple everyday language.
- Keep answers short and to the point. No long essays.
- Never use markdown headers (###), tables, or bold (**text**). Just plain sentences.
- If listing steps, write them as: "First do this, then do that" — not numbered lists with headers.
- Reference the user's actual numbers when relevant.
- If asked about a feature, explain it simply like you're telling a friend how to use their phone.
- Never make up numbers not in the data above.`;
}

const INITIAL_MSG = { role: "assistant", content: "Hi! I'm your PesaTrack AI assistant. Ask me anything about your finances — spending, budgets, savings goals, or debts. You can also tap the mic to speak." };

export default function AiPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([INITIAL_MSG]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [speaking, setSpeaking] = useState(null);
  const [context, setContext] = useState(null);
  const bottomRef = useRef(null);
  const mediaRef = useRef(null);
  const chunksRef = useRef([]);

  useEffect(() => {
    Promise.all([
      api.summary().catch(() => ({ data: {} })),
      api.transactions.list().catch(() => ({ data: [] })),
      api.budgets.list().catch(() => ({ data: [] })),
      api.goals.list().catch(() => ({ data: [] })),
      api.bills.list().catch(() => ({ data: [] })),
      api.debts.list().catch(() => ({ data: [] })),
    ]).then(([s, t, b, g, bl, d]) => {
      const ctx = {
        summary: s.data,
        transactions: getRows(t),
        budgets: getRows(b),
        goals: getRows(g),
        bills: getRows(bl),
        debts: getRows(d),
      };
      setContext(ctx);
      // Auto-generate a personalised welcome based on real data
      const name = user?.full_name?.split(" ")[0] || "there";
      const currency = user?.currency || "KES";
      const fmt = n => `${currency} ${Number(n || 0).toLocaleString()}`;
      const bal = s.data?.balance;
      const overdueBills = getRows(bl).filter(b => b.status === "unpaid").length;
      const openDebts = getRows(d).filter(d => d.status === "open").length;
      const activeGoals = getRows(g).filter(g => g.status === "active").length;
      let welcome = `👋 Welcome back, **${name}**!\n\nHere's a quick snapshot of your finances:\n`;
      welcome += `• Balance: **${fmt(s.data?.balance ?? 0)}**\n`;
      welcome += `• Income: ${fmt(s.data?.income ?? 0)} · Expenses: ${fmt(s.data?.expenses ?? 0)}\n`;
      if (overdueBills > 0) welcome += `• ⚠️ You have **${overdueBills}** unpaid bill${overdueBills > 1 ? "s" : ""} — check the Bills page.\n`;
      if (openDebts > 0) welcome += `• 💸 **${openDebts}** open debt${openDebts > 1 ? "s" : ""} tracked — see the Debts page.\n`;
      if (activeGoals > 0) welcome += `• 🎯 **${activeGoals}** active savings goal${activeGoals > 1 ? "s" : ""} in progress.\n`;
      welcome += `\nAsk me anything — I know your full financial picture!`;
      setMessages([INITIAL_MSG, { role: "assistant", content: welcome }]);
    });
    return () => window.speechSynthesis.cancel();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send(text) {
    const txt = (text ?? input).trim();
    if (!txt || loading) return;
    const userMsg = { role: "user", content: txt };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const systemMsg = {
        role: "system",
        content: buildSystemPrompt(user, context?.summary, context?.transactions || [], context?.budgets || [], context?.goals || [], context?.bills || [], context?.debts || []),
      };
      const history = [...messages, userMsg]
        .filter(m => m.role !== "system")
        .map(m => ({ role: m.role, content: m.content }));
      const reply = await askGroq([systemMsg, ...history]);
      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: "assistant", content: `⚠️ ${e.message}` }]);
    } finally {
      setLoading(false);
    }
  }

  async function toggleRecording() {
    if (recording) { mediaRef.current?.stop(); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = e => chunksRef.current.push(e.data);
      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        setRecording(false); setTranscribing(true);
        try {
          const blob = new Blob(chunksRef.current, { type: "audio/webm" });
          const text = await transcribeAudio(blob);
          if (text) setInput(text);
        } catch (e) {
          setMessages(prev => [...prev, { role: "assistant", content: `⚠️ Transcription error: ${e.message}` }]);
        } finally { setTranscribing(false); }
      };
      mr.start(); mediaRef.current = mr; setRecording(true);
    } catch { alert("Microphone access denied."); }
  }

  function toggleSpeak(idx, text) {
    if (speaking === idx) { window.speechSynthesis.cancel(); setSpeaking(null); return; }
    setSpeaking(idx);
    const utt = new SpeechSynthesisUtterance(text);
    utt.onend = () => setSpeaking(null);
    utt.onerror = () => setSpeaking(null);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utt);
  }

  return (
    <div className="flex flex-col h-[calc(100vh-130px)]">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-slate-800">AI Financial Assistant</h1>
        <p className="text-sm text-slate-500">Powered by Groq · GPT OSS 120B</p>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            {m.role === "assistant" && (
              <div className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xs mr-2 mt-1 shrink-0">
                <i className="bi bi-robot" />
              </div>
            )}
            <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap leading-relaxed ${
              m.role === "user"
                ? "bg-emerald-600 text-white rounded-br-sm"
                : "bg-white border border-slate-200 text-slate-800 rounded-bl-sm"
            }`}>
              {m.content}
              {m.role === "assistant" && (
                <button
                  onClick={() => toggleSpeak(i, m.content)}
                  className={`ml-2 text-xs opacity-50 hover:opacity-100 ${speaking === i ? "text-emerald-600 opacity-100" : ""}`}
                  title={speaking === i ? "Stop" : "Read aloud"}
                >
                  <i className={`bi ${speaking === i ? "bi-stop-circle" : "bi-volume-up"}`} />
                </button>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xs mr-2 shrink-0">
              <i className="bi bi-robot" />
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1 items-center">
              <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="mt-3 flex gap-2 items-center">
        <button
          onClick={toggleRecording}
          disabled={transcribing || loading}
          className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 ${
            recording ? "bg-red-500 animate-pulse" : transcribing ? "bg-slate-400 cursor-wait" : "bg-slate-600 hover:bg-slate-700"
          }`}
        >
          <i className={`bi ${transcribing ? "bi-hourglass-split" : recording ? "bi-stop-fill" : "bi-mic-fill"}`} />
        </button>
        <input
          className="flex-1 border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          placeholder={transcribing ? "Transcribing…" : recording ? "Listening…" : "Ask about your finances…"}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
          disabled={loading || recording || transcribing}
        />
        <button
          onClick={() => send()}
          disabled={loading || !input.trim()}
          className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl text-sm font-medium"
        >
          <i className="bi bi-send" />
        </button>
      </div>
      {recording && <p className="text-center text-xs text-red-500 mt-1 animate-pulse">🔴 Recording… tap mic to stop</p>}
    </div>
  );
}
