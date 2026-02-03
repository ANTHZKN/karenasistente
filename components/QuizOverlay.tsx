
import React, { useState, useEffect, useRef } from 'react';
import { Quiz, QuizQuestion } from '../types';
import { speechService } from '../services/speech';
import { X, CheckCircle2, AlertTriangle, Timer as TimerIcon } from 'lucide-react';

interface QuizOverlayProps {
  quiz: Quiz;
  onClose: () => void;
  onFinish: (score: number) => void;
}

const QuizOverlay: React.FC<QuizOverlayProps> = ({ quiz, onClose, onFinish }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [timeLeft, setTimeLeft] = useState(20);
  const [score, setScore] = useState(0);
  const timerRef = useRef<number | null>(null);

  const currentQuestion = quiz.questions[currentIndex];

  useEffect(() => {
    if (!isAnswered && timeLeft > 0) {
      timerRef.current = window.setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0 && !isAnswered) {
      handleOptionSelect(-1); // Timeout
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [timeLeft, isAnswered]);

  const handleOptionSelect = (index: number) => {
    if (isAnswered) return;
    if (timerRef.current) clearInterval(timerRef.current);
    
    setSelectedOption(index);
    setIsAnswered(true);

    const isCorrect = index === currentQuestion.correctAnswerIndex;
    if (isCorrect) {
      setScore(prev => prev + 1);
      speechService.speak("Correcto Anthony. Excelente razonamiento.");
    } else {
      speechService.speak(`Incorrecto. ${currentQuestion.explanation}`);
    }
  };

  const nextQuestion = () => {
    if (currentIndex < quiz.questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
      setTimeLeft(20);
    } else {
      const finalScore = (score / quiz.questions.length) * 100;
      onFinish(finalScore);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl animate-in fade-in duration-500">
      <div className="w-full max-w-2xl glass border-[#ff8c0066] rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(255,140,0,0.1)] flex flex-col relative">
        {/* Header HUD */}
        <div className="p-6 border-b border-[#ff8c0022] flex justify-between items-center bg-[#ff8c0005]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full border border-[#ff8c0044] flex items-center justify-center text-[#ff8c00]">
              <TimerIcon size={20} className={timeLeft < 5 ? 'animate-pulse text-red-500' : ''} />
            </div>
            <div>
              <p className="text-[10px] font-mono text-[#ff8c00]/50 tracking-[0.2em]">PROTOCOL_EVAL_ACTIVE</p>
              <h2 className="text-lg font-bold text-white uppercase tracking-wider">{quiz.subjectName}</h2>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-2xl font-mono font-bold text-[#ff8c00]">{currentIndex + 1}/{quiz.questions.length}</span>
            <div className="w-24 h-1 bg-white/5 rounded-full overflow-hidden mt-1">
              <div 
                className="h-full bg-[#ff8c00] transition-all duration-1000" 
                style={{ width: `${(timeLeft / 20) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Question Area */}
        <div className="flex-1 p-8 space-y-8 overflow-y-auto">
          <h3 className="text-xl font-medium text-slate-100 leading-relaxed">
            {currentQuestion.question}
          </h3>

          <div className="grid gap-4">
            {currentQuestion.options.map((option, idx) => {
              let btnClass = "glass border-white/5 text-slate-300";
              if (isAnswered) {
                if (idx === currentQuestion.correctAnswerIndex) btnClass = "border-green-500/50 bg-green-500/10 text-green-400";
                else if (idx === selectedOption) btnClass = "border-red-500/50 bg-red-500/10 text-red-400";
                else btnClass = "opacity-30 border-white/5";
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleOptionSelect(idx)}
                  disabled={isAnswered}
                  className={`w-full text-left p-5 rounded-2xl border transition-all duration-300 flex items-center justify-between group ${btnClass} ${!isAnswered ? 'hover:border-[#ff8c0044] hover:bg-[#ff8c0005]' : ''}`}
                >
                  <span className="text-sm">{option}</span>
                  {isAnswered && idx === currentQuestion.correctAnswerIndex && <CheckCircle2 size={18} />}
                  {isAnswered && idx === selectedOption && idx !== currentQuestion.correctAnswerIndex && <AlertTriangle size={18} />}
                </button>
              );
            })}
          </div>

          {isAnswered && (
            <div className="p-4 rounded-xl bg-white/5 border border-white/5 animate-in slide-in-from-bottom-2">
              <p className="text-[10px] text-slate-500 font-mono uppercase mb-1">Retroalimentación de KAREN:</p>
              <p className="text-xs text-slate-300 italic">"{currentQuestion.explanation}"</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/5 bg-black/20 flex justify-between items-center">
          <button onClick={onClose} className="text-xs text-slate-500 hover:text-white flex items-center gap-2">
            <X size={14} /> CANCELAR_PROTOCOL
          </button>
          {isAnswered && (
            <button 
              onClick={nextQuestion}
              className="bg-[#ff8c00] text-black px-8 py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,140,0,0.3)]"
            >
              {currentIndex === quiz.questions.length - 1 ? 'FINALIZAR' : 'SIGUIENTE PREGUNTA'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizOverlay;
