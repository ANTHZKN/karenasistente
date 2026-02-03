
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, User, Bot, Volume2, VolumeX, Mic, MicOff, AlertCircle } from 'lucide-react';
import { Message } from '../types';
import { VoiceProcessor } from '../services/voiceProcessor';

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
  isVoiceEnabled: boolean;
  onToggleVoice: () => void;
  placeholder?: string;
  accentColor?: string; // Nuevo: Para cambiar el color cyan por naranja en estudio
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  messages, 
  onSendMessage, 
  isVoiceEnabled, 
  onToggleVoice,
  placeholder = "Escribe algo, Anthony...",
  accentColor = "#00d2ff"
}) => {
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const voiceProcessorRef = useRef<VoiceProcessor | null>(null);
  const animationFrameRef = useRef<number>(0);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const startVisualizer = useCallback((analyser: AnalyserNode) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationFrameRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const barWidth = (canvas.width / bufferLength) * 2.5;
      let x = 0;
      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height;
        ctx.fillStyle = accentColor;
        ctx.shadowBlur = 10;
        ctx.shadowColor = `${accentColor}88`;
        const yPos = (canvas.height / 2) - (barHeight / 2);
        ctx.fillRect(x, yPos, barWidth - 1, Math.max(barHeight, 2));
        x += barWidth;
      }
    };
    draw();
  }, [accentColor]);

  const handleStopListening = useCallback(() => {
    voiceProcessorRef.current?.stop();
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    setIsListening(false);
  }, []);

  const handleSendMessageInternal = useCallback((text: string) => {
    if (!text.trim()) return;
    onSendMessage(text);
    setInput('');
  }, [onSendMessage]);

  const toggleMic = async () => {
    if (isListening) { handleStopListening(); return; }
    setErrorMsg(null);
    if (!voiceProcessorRef.current) {
      voiceProcessorRef.current = new VoiceProcessor(
        (text) => setInput(text),
        () => {
          const inputEl = document.getElementById('karen-input') as HTMLInputElement;
          if (inputEl && inputEl.value.trim()) {
            handleSendMessageInternal(inputEl.value);
            handleStopListening();
          } else { handleStopListening(); }
        },
        (err) => {
          setIsListening(false);
          setErrorMsg(err);
        }
      );
    }
    try {
      const analyser = await voiceProcessorRef.current.start();
      if (analyser) { setIsListening(true); startVisualizer(analyser); }
    } catch (e) { setIsListening(false); }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    handleSendMessageInternal(input);
    if (isListening) handleStopListening();
  };

  const glowStyle = { color: accentColor, textShadow: `0 0 8px ${accentColor}88` };
  const borderStyle = { borderColor: `${accentColor}22` };

  return (
    <div className="flex flex-col h-full bg-transparent">
      <div className="flex justify-between items-center mb-4 px-2">
        <div className="flex flex-col">
          <h2 className="text-[10px] font-bold tracking-[0.4em] uppercase opacity-50" style={glowStyle}>Transmisión_Neural</h2>
          {errorMsg && <div className="text-red-500 text-[9px] font-mono mt-1 flex items-center gap-1"><AlertCircle size={10} /> {errorMsg}</div>}
        </div>
        <button onClick={onToggleVoice} className={`p-2 transition-all ${isVoiceEnabled ? 'opacity-100' : 'opacity-30'}`} style={isVoiceEnabled ? glowStyle : {}}>
          {isVoiceEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-6 px-4 mb-4 scrollbar-hide">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}>
            {msg.role === 'model' && (
              <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0" style={borderStyle}>
                <Bot size={16} style={{ color: accentColor }} />
              </div>
            )}
            <div className={`max-w-[85%] p-4 rounded-2xl border backdrop-blur-md ${msg.role === 'user' ? 'bg-white/5 text-slate-100 rounded-tr-none' : 'bg-white/5 text-slate-200 rounded-tl-none'}`} style={borderStyle}>
              <p className="text-sm leading-relaxed tracking-wide">{msg.text}</p>
              <div className="text-[8px] mt-2 opacity-30 font-mono text-right">{new Date(msg.timestamp).toLocaleTimeString()}</div>
            </div>
            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                <User size={16} className="text-slate-400" />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="relative p-2">
        <div className={`absolute bottom-full left-0 w-full transition-all duration-500 overflow-hidden ${isListening ? 'h-16 opacity-100' : 'h-0 opacity-0'}`}>
          <canvas ref={canvasRef} width={1000} height={64} className="w-full h-full" />
        </div>
        <form onSubmit={handleSubmit} className="flex items-center gap-3 bg-[#0a0a0f] p-1.5 rounded-2xl border" style={borderStyle}>
          <input
            id="karen-input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isListening ? "KAREN procesando..." : placeholder}
            className="flex-1 bg-transparent p-3 text-sm focus:outline-none"
            style={{ color: accentColor }}
          />
          <div className="flex items-center gap-2 pr-2">
            <button type="button" onClick={toggleMic} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isListening ? 'bg-white/10' : ''}`} style={{ color: accentColor }}>
              {isListening ? <Mic size={20} /> : <MicOff size={20} />}
            </button>
            <button type="submit" disabled={!input.trim()} className="w-10 h-10 flex items-center justify-center rounded-xl transition-all disabled:opacity-20" style={{ backgroundColor: `${accentColor}22`, color: accentColor }}>
              <Send size={18} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;
