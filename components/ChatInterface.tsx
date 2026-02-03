
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
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  messages, 
  onSendMessage, 
  isVoiceEnabled, 
  onToggleVoice,
  placeholder = "Escribe algo, Anthony..."
}) => {
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const voiceProcessorRef = useRef<VoiceProcessor | null>(null);
  const animationFrameRef = useRef<number>(0);

  // Auto-scroll to bottom
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
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = (dataArray[i] / 255) * canvas.height;

        // KAREN Cyan/Blue HUD Color
        ctx.fillStyle = '#00d2ff';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#00d2ff88';
        
        // Draw bars from center
        const yPos = (canvas.height / 2) - (barHeight / 2);
        ctx.fillRect(x, yPos, barWidth - 1, Math.max(barHeight, 2));

        x += barWidth;
      }
    };

    draw();
  }, []);

  const handleStopListening = useCallback(() => {
    if (voiceProcessorRef.current) {
      voiceProcessorRef.current.stop();
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    setIsListening(false);
  }, []);

  const handleSendMessageInternal = useCallback((text: string) => {
    if (!text.trim()) return;
    onSendMessage(text);
    setInput('');
  }, [onSendMessage]);

  const toggleMic = async () => {
    if (isListening) {
      handleStopListening();
      return;
    }

    setErrorMsg(null);

    if (!voiceProcessorRef.current) {
      voiceProcessorRef.current = new VoiceProcessor(
        (text, isFinal) => {
          setInput(text);
        },
        () => {
          // Silence detected - auto send
          const currentText = inputRef.current; // Use a ref to get the absolute latest if possible, or just the state
          // Note: closure might capture old state, so we handle auto-send carefully
          const finalInput = document.getElementById('karen-input') as HTMLInputElement;
          if (finalInput && finalInput.value.trim()) {
            handleSendMessageInternal(finalInput.value);
            handleStopListening();
          } else {
            handleStopListening();
          }
        },
        (err) => {
          setIsListening(false);
          if (err === 'speech-recognition-not-supported') {
            setErrorMsg("Navegador no compatible con SpeechRecognition. Usa Chrome o Edge.");
          } else if (err === 'mic-access-denied') {
            setErrorMsg("Acceso al micrófono denegado por Anthony.");
          } else {
            setErrorMsg(`Error de sistema: ${err}`);
          }
        }
      );
    }

    try {
      const analyser = await voiceProcessorRef.current.start();
      if (analyser) {
        setIsListening(true);
        startVisualizer(analyser);
      }
    } catch (e) {
      setIsListening(false);
    }
  };

  // Sync state to ref for callbacks
  const inputRef = useRef(input);
  useEffect(() => { inputRef.current = input; }, [input]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    handleSendMessageInternal(input);
    if (isListening) handleStopListening();
  };

  return (
    <div className="flex flex-col h-full bg-transparent">
      <div className="flex justify-between items-center mb-4 px-2">
        <div className="flex flex-col">
          <h2 className="text-[10px] font-bold tracking-[0.4em] text-[#00d2ff] uppercase opacity-50">Transmisión_Neural</h2>
          {errorMsg && (
            <div className="flex items-center gap-1 text-red-500 text-[9px] font-mono mt-1">
              <AlertCircle size={10} />
              <span>{errorMsg.toUpperCase()}</span>
            </div>
          )}
        </div>
        <button 
          onClick={onToggleVoice}
          className={`p-2 rounded-full transition-all duration-300 ${isVoiceEnabled ? 'text-[#00d2ff] glow-blue' : 'text-slate-600'}`}
          title={isVoiceEnabled ? "Protocolo vocal activo" : "Protocolo vocal silenciado"}
        >
          {isVoiceEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-6 px-4 mb-4 scrollbar-hide">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
            {msg.role === 'model' && (
              <div className="w-8 h-8 rounded-lg bg-[#00d2ff11] border border-[#00d2ff33] flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(0,210,255,0.1)]">
                <Bot size={16} className="text-[#00d2ff]" />
              </div>
            )}
            <div className={`max-w-[85%] p-4 rounded-2xl border backdrop-blur-md ${
              msg.role === 'user' 
                ? 'bg-[#00d2ff08] border-[#00d2ff22] text-slate-100 rounded-tr-none' 
                : 'bg-white/5 border-white/10 text-slate-200 rounded-tl-none'
            }`}>
              <p className="text-sm leading-relaxed tracking-wide">{msg.text}</p>
              <div className="text-[8px] mt-2 opacity-30 font-mono text-right">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
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
        {/* Waveform Visualization Overlay */}
        <div className={`absolute bottom-full left-0 w-full transition-all duration-500 overflow-hidden pointer-events-none ${isListening ? 'h-16 opacity-100 mb-2' : 'h-0 opacity-0'}`}>
          <canvas ref={canvasRef} width={1000} height={64} className="w-full h-full" />
        </div>
        
        <form onSubmit={handleSubmit} className="relative flex items-center gap-3 bg-[#0a0a0f] p-1.5 rounded-2xl border border-[#00d2ff11] focus-within:border-[#00d2ff33] transition-all">
          <div className="relative flex-1">
            <input
              id="karen-input"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isListening ? "KAREN está procesando tu voz, Anthony..." : placeholder}
              className={`w-full bg-transparent p-3 pl-4 text-sm text-[#00d2ff] placeholder-[#00d2ff33] focus:outline-none transition-all ${
                isListening ? 'animate-pulse' : ''
              }`}
            />
          </div>
          
          <div className="flex items-center gap-2 pr-2">
            <button
              type="button"
              onClick={toggleMic}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 ${
                isListening 
                  ? 'bg-[#00d2ff] text-black shadow-[0_0_20px_rgba(0,210,255,0.6)] scale-110' 
                  : 'bg-white/5 text-[#00d2ff] hover:bg-[#00d2ff11] border border-[#00d2ff11]'
              }`}
            >
              {isListening ? <Mic size={20} /> : <MicOff size={20} />}
            </button>
            
            <button 
              type="submit"
              disabled={!input.trim()}
              className="w-10 h-10 flex items-center justify-center bg-[#00d2ff22] text-[#00d2ff] rounded-xl hover:bg-[#00d2ff] hover:text-black transition-all disabled:opacity-20 disabled:cursor-not-allowed"
            >
              <Send size={18} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;
