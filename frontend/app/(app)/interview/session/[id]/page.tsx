'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { IconMicrophone, IconVolume, IconArrowRight, IconCheckCircle, IconLoader, IconClock, IconActivity } from '@/lib/icons';

interface Session {
  _id: string; role: string; mode: string; company: string;
  difficulty: string; inputMode: string; jobDescription?: string;
}
interface Message { role: 'ai' | 'user'; text: string; }
interface CollectedAnswer { questionText: string; answerText: string; timeTaken: number; }

const TOTAL_QUESTIONS = 5;

export default function InterviewSessionPage() {
  const { id } = useParams<{ id: string }>();
  const router  = useRouter();

  const [session,    setSession]    = useState<Session | null>(null);
  const [messages,   setMessages]   = useState<Message[]>([]);
  const [questions,  setQuestions]  = useState<string[]>([]);
  const [collected,  setCollected]  = useState<CollectedAnswer[]>([]);   // all answers stored locally
  const [qIndex,     setQIndex]     = useState(0);
  const [input,      setInput]      = useState('');
  const [loading,    setLoading]    = useState(true);
  const [submitting, setSubmitting] = useState(false);   // waiting for user to click Submit
  const [evaluating, setEvaluating] = useState(false);  // final bulk evaluation in progress
  const [timer,      setTimer]      = useState(0);
  const [done,       setDone]       = useState(false);
  const [listening,  setListening]  = useState(false);
  const [answerStartTime, setAnswerStartTime] = useState(Date.now());

  const chatEndRef    = useRef<HTMLDivElement>(null);
  const timerRef      = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<any>(null);
  const sessionRef    = useRef<Session | null>(null);

  // keep ref in sync for callbacks
  useEffect(() => { sessionRef.current = session; }, [session]);

  // ── Load session + generate questions ──────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get<{ success: boolean; data: Session }>(`/api/interview/session/${id}`);
        setSession(res.data);

        const qRes = await api.post<{ success: boolean; data: { text: string }[] }>('/api/questions/generate', {
          role: res.data.role, mode: res.data.mode,
          difficulty: res.data.difficulty, company: res.data.company,
          companyCategory: '', count: TOTAL_QUESTIONS,
          jobDescription: res.data.jobDescription,
        });

        const qs = qRes.data.map((q: any) => q.text || q);
        if (qs.length === 0) {
          setMessages([{ role: 'ai', text: 'Failed to generate questions. Please check your API configuration or start a new session.' }]);
        } else {
          setQuestions(qs);
          setMessages([{
            role: 'ai',
            text: `Welcome! I'm your AI interviewer for your **${res.data.mode} interview** at **${res.data.company}** for the **${res.data.role}** role.\n\nAnswer all ${TOTAL_QUESTIONS} questions — your responses will be evaluated together at the end for a comprehensive report.`,
          }]);
          setTimeout(() => {
            setMessages(m => [...m, { role: 'ai', text: `**Q1/${TOTAL_QUESTIONS}:** ${qs[0]}` }]);
            if (res.data.inputMode === 'voice') speakText(qs[0]);
            setAnswerStartTime(Date.now());
          }, 800);
        }
      } catch (err: any) {
        setMessages([{ role: 'ai', text: `Error loading session: ${err.message || 'Failed to start. Please try again.'}` }]);
      } finally { setLoading(false); }
    })();

    timerRef.current = setInterval(() => setTimer(t => t + 1), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [id]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // ── Voice helpers ────────────────────────────────────────────────────────────
  const speakText = (text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text.replace(/\*\*/g, ''));
    utt.rate = 0.95; utt.pitch = 1;
    window.speechSynthesis.speak(utt);
  };

  const transcriptRef    = useRef('');          // accumulated final transcript
  const isListeningRef   = useRef(false);       // true while user wants mic on
  const restartTimerRef  = useRef<NodeJS.Timeout | null>(null);

  const startListening = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { alert('Voice not supported in this browser. Use Chrome.'); return; }

    transcriptRef.current = input; // seed with any existing text
    isListeningRef.current = true;
    setListening(true);

    const launchRecognition = () => {
      if (!isListeningRef.current) return; // user stopped — don't restart

      const recognition = new SR();
      recognition.continuous      = true;   // ← keep running through pauses
      recognition.interimResults  = true;
      recognition.lang            = 'en-IN';
      recognition.maxAlternatives = 1;

      recognition.onresult = (e: any) => {
        let interim = '';
        let finalChunk = '';
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const t = e.results[i][0].transcript;
          if (e.results[i].isFinal) finalChunk += t + ' ';
          else interim += t;
        }
        if (finalChunk) transcriptRef.current += finalChunk;
        // Show committed text + live interim preview
        setInput((transcriptRef.current + interim).trim());
      };

      recognition.onerror = (e: any) => {
        // 'no-speech' is normal — just restart silently
        if (e.error === 'no-speech' || e.error === 'audio-capture') {
          if (isListeningRef.current) {
            restartTimerRef.current = setTimeout(launchRecognition, 150);
          }
        }
      };

      recognition.onend = () => {
        // Browser ended (timeout ~60s, or silence) — restart automatically
        if (isListeningRef.current) {
          restartTimerRef.current = setTimeout(launchRecognition, 150);
        } else {
          setListening(false);
        }
      };

      recognitionRef.current = recognition;
      try { recognition.start(); } catch (_) {
        // already started — ignore
      }
    };

    launchRecognition();
  };

  const stopListening = () => {
    isListeningRef.current = false;
    if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
    recognitionRef.current?.stop();
    setListening(false);
  };

  // ── Cleanup mic on unmount ───────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      isListeningRef.current = false;
      if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
      recognitionRef.current?.stop();
    };
  }, []);

  // ── Submit one answer (stored locally, no API call yet) ───────────────────
  const handleSubmit = useCallback(async () => {
    if (!input.trim() || submitting || done || questions.length === 0 || evaluating) return;

    // Stop any active voice recording before submitting
    if (isListeningRef.current) {
      isListeningRef.current = false;
      if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
      recognitionRef.current?.stop();
      setListening(false);
    }
    transcriptRef.current = ''; // reset for next question

    const userText  = input.trim();
    const timeTaken = Math.round((Date.now() - answerStartTime) / 1000);
    setInput('');
    setSubmitting(true);

    // Append user message
    setMessages(m => [...m, { role: 'user', text: userText }]);

    const newAnswer: CollectedAnswer = {
      questionText: questions[qIndex],
      answerText:   userText,
      timeTaken,
    };

    const updatedCollected = [...collected, newAnswer];
    setCollected(updatedCollected);

    const nextIdx = qIndex + 1;
    setQIndex(nextIdx);

    if (nextIdx >= TOTAL_QUESTIONS) {
      // ── All questions answered — now evaluate everything at once ───────────
      setDone(true);
      if (timerRef.current) clearInterval(timerRef.current);

      setMessages(m => [...m, {
        role: 'ai',
        text: `Great job completing all ${TOTAL_QUESTIONS} questions!\n\nNow evaluating all your answers together — this takes a moment. Your comprehensive report will be ready shortly.`,
      }]);

      setEvaluating(true);
      try {
        await api.post(`/api/interview/evaluate-all`, {
          sessionId: id,
          answers: updatedCollected,
          duration: timer,
        });
        router.push(`/interview/results/${id}`);
      } catch (err: any) {
        setMessages(m => [...m, { role: 'ai', text: `Error generating report: ${err.message}. Please try again.` }]);
        setEvaluating(false);
        setDone(false);
      }
    } else {
      // ── Ask next question ─────────────────────────────────────────────────
      const acknowledgements = [
        'Got it.',
        'Noted.',
        'Understood.',
        'Thank you.',
        'Alright.',
      ];
      const ack = acknowledgements[qIndex % acknowledgements.length];

      setTimeout(() => {
        setMessages(m => [...m, {
          role: 'ai',
          text: `${ack}\n\n**Q${nextIdx + 1}/${TOTAL_QUESTIONS}:** ${questions[nextIdx]}`,
        }]);
        if (sessionRef.current?.inputMode === 'voice') speakText(questions[nextIdx]);
        setAnswerStartTime(Date.now());
        setSubmitting(false);
      }, 400);
      return;
    }

    setSubmitting(false);
  }, [input, submitting, done, evaluating, questions, qIndex, collected, id, timer, router, answerStartTime]);

  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const renderMessage = (text: string) =>
    text.split('\n').map((line, i) => (
      <span key={i}>
        {line.split(/(\*\*.*?\*\*)/).map((part, j) =>
          part.startsWith('**') && part.endsWith('**')
            ? <strong key={j}>{part.slice(2, -2)}</strong>
            : part
        )}
        {i < text.split('\n').length - 1 && <br />}
      </span>
    ));

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="page-inner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
          <IconActivity size={48} color="var(--primary)" />
        </div>
        <p className="text-secondary">Setting up your interview...</p>
      </div>
    </div>
  );

  // ── Evaluating overlay ───────────────────────────────────────────────────────
  if (evaluating) return (
    <div style={{ height: 'calc(100vh - 4.5rem)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="glass animate-fade-in" style={{ padding: '3rem 4rem', textAlign: 'center', maxWidth: 520, background: 'linear-gradient(135deg, rgba(249,115,22,0.08), rgba(245,158,11,0.04))' }}>
        {/* Animated evaluating icon */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <div style={{ animation: 'spin 1.5s linear infinite', display: 'flex' }}>
            <IconLoader size={48} color="var(--primary)" />
          </div>
        </div>
        <h2 style={{ marginBottom: '0.75rem', fontSize: '1.5rem' }}>Evaluating your answers...</h2>
        <p className="text-secondary" style={{ marginBottom: '2rem', lineHeight: 1.6 }}>
          Your AI coach is reviewing all <strong style={{ color: 'var(--primary-light)' }}>{TOTAL_QUESTIONS} answers</strong> together to give you a comprehensive, holistic report with scores, ideal answers, and a personalized improvement plan.
        </p>

        {/* Progress dots for each question */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          {Array.from({ length: TOTAL_QUESTIONS }).map((_, i) => (
            <div
              key={i}
              style={{
                width: 10, height: 10,
                borderRadius: 2,
                background: 'var(--primary)',
                animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
              }}
            />
          ))}
        </div>

        <p className="text-xs text-muted">This may take 15–30 seconds. Please don't close this tab.</p>
      </div>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 0.3; transform: scaleY(0.6); } 50% { opacity: 1; transform: scaleY(1.4); } }
      `}</style>
    </div>
  );

  // ── Main session UI ──────────────────────────────────────────────────────────
  return (
    <div style={{ height: 'calc(100vh - 4.5rem)', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{ padding: '0.875rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--bg-secondary)', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: '0.5rem', flex: 1, flexWrap: 'wrap' }}>
          <span className="badge badge-primary" style={{ textTransform: 'capitalize' }}>{session?.mode}</span>
          <span className="badge badge-muted">{session?.role}</span>
          <span className="badge badge-muted">{session?.company}</span>
          <span className="badge badge-muted" style={{ textTransform: 'capitalize' }}>{session?.difficulty}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexShrink: 0 }}>
          {/* Timer */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontFamily: 'var(--font-mono)', fontSize: '0.9rem', fontWeight: 700, color: timer > 1800 ? 'var(--danger)' : 'var(--text-primary)' }}>
            <IconClock size={14} color="currentColor" />
            {formatTime(timer)}
          </div>
          {/* Question progress */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="text-sm text-muted" style={{ whiteSpace: 'nowrap' }}>Q {Math.min(qIndex + 1, TOTAL_QUESTIONS)}/{TOTAL_QUESTIONS}</span>
            <div style={{ width: 80, height: 6, background: 'var(--bg-tertiary)', borderRadius: 0, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(collected.length / TOTAL_QUESTIONS) * 100}%`, background: 'var(--grad-primary)', transition: 'width 0.4s ease' }} />
            </div>
          </div>
          {/* Answered count dots */}
          <div style={{ display: 'flex', gap: '4px' }}>
            {Array.from({ length: TOTAL_QUESTIONS }).map((_, i) => (
              <div key={i} style={{ width: 8, height: 8, borderRadius: 2, background: i < collected.length ? 'var(--primary)' : 'var(--bg-tertiary)', transition: 'background 0.3s' }} />
            ))}
          </div>
        </div>
      </div>

      {/* Chat messages */}
      <div className="chat-messages" style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {messages.map((m, i) => (
          <div key={i} className={`chat-bubble ${m.role === 'ai' ? 'chat-bubble-ai' : 'chat-bubble-user'}`}>
            {m.role === 'ai' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem', color: 'var(--primary-light)', fontWeight: 700, marginBottom: '0.375rem' }}>
                <IconActivity size={12} color="var(--primary-light)" />
                AI Interviewer
              </div>
            )}
            <div>{renderMessage(m.text)}</div>
          </div>
        ))}

        {submitting && (
          <div className="chat-bubble chat-bubble-ai">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem', color: 'var(--primary-light)', fontWeight: 700, marginBottom: '0.375rem' }}>
              <IconActivity size={12} color="var(--primary-light)" />
              AI Interviewer
            </div>
            <div className="chat-typing">
              <div className="typing-dot" /><div className="typing-dot" /><div className="typing-dot" />
              <span style={{ marginLeft: '0.5rem', fontSize: '0.875rem' }}>Preparing next question...</span>
            </div>
          </div>
        )}

        {/* Answers collected indicator */}
        {collected.length > 0 && !done && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.875rem', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 'var(--radius-sm)', alignSelf: 'flex-start' }}>
            <IconCheckCircle size={14} color="var(--success)" />
            <span style={{ fontSize: '0.8rem', color: 'var(--success)', fontWeight: 600 }}>
              {collected.length}/{TOTAL_QUESTIONS} answers collected
            </span>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input area */}
      {!done && (
        <div className="chat-input-area" style={{ flexShrink: 0 }}>
          <textarea
            id="interview-input"
            className="input"
            placeholder={session?.inputMode === 'voice' ? 'Click mic to speak, or type your answer...' : 'Type your answer here... (Enter to submit, Shift+Enter for new line)'}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
            disabled={submitting}
            style={{ flex: 1, minHeight: '60px', maxHeight: '140px', resize: 'vertical' }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flexShrink: 0 }}>
            {session?.inputMode === 'voice' && (
              <button
                id="voice-btn"
                className={`btn ${listening ? 'btn-danger' : 'btn-secondary'} btn-icon`}
                onClick={listening ? stopListening : startListening}
                title={listening ? 'Stop recording' : 'Start speaking'}
                style={{ width: '52px', height: '52px' }}
              >
                {listening
                  ? <IconVolume size={18} color="currentColor" />
                  : <IconMicrophone size={18} color="currentColor" />}
              </button>
            )}
            <button
              id="submit-answer-btn"
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={!input.trim() || submitting}
              style={{ height: '52px', flexShrink: 0, gap: '0.375rem', paddingLeft: '1.25rem', paddingRight: '1.25rem' }}
            >
              {submitting
                ? <><IconLoader size={16} color="currentColor" /> Saving...</>
                : qIndex >= TOTAL_QUESTIONS - 1
                  ? <><IconCheckCircle size={16} color="currentColor" /> Finish</>
                  : <>Submit <IconArrowRight size={16} color="currentColor" /></>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
