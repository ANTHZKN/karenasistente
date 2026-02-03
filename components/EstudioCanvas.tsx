
import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Plus, Trash2, ArrowLeft, Brain, TrendingUp, Sparkles, LayoutList, GraduationCap } from 'lucide-react';
import { speechService } from '../services/speech';
import { StudySubject, StudyTopic, Quiz } from '../types';
import ChatInterface from './ChatInterface';
import PlanificadorTemas from './PlanificadorTemas';
import QuizOverlay from './QuizOverlay';
import { karenAI } from '../services/gemini';

interface EstudioCanvasProps {
  subjects: StudySubject[];
  onUpdateSubjects: (subjects: StudySubject[]) => void;
  onSessionComplete: () => void;
  onTimerToggle: (isActive: boolean) => void;
  onSendMessage: (text: string, subjectId: string, topicId?: string) => void;
  isVoiceEnabled: boolean;
  onToggleVoice: () => void;
}

const EstudioCanvas: React.FC<EstudioCanvasProps> = ({ 
  subjects, onUpdateSubjects, onSessionComplete, onTimerToggle, 
  onSendMessage, isVoiceEnabled, onToggleVoice 
}) => {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [activeSubjectId, setActiveSubjectId] = useState<string | null>(null);
  const [activeTopicId, setActiveTopicId] = useState<string | null>(null);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (activeSubjectId) {
      const subject = subjects.find(s => s.id === activeSubjectId);
      if (!subject) return;
      if (!activeTopicId && !activeQuiz) {
        const greeting = `Entendido Anthony, hemos entrado al planificador de ${subject.name}.`;
        if (isVoiceEnabled) speechService.speak(greeting);
      }
    }
  }, [activeSubjectId, activeTopicId, activeQuiz, isVoiceEnabled]);

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = window.setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0) {
      handleTimerComplete();
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isActive, timeLeft]);

  useEffect(() => { onTimerToggle(isActive); }, [isActive, onTimerToggle]);

  const handleTimerComplete = () => {
    setIsActive(false);
    speechService.speak("Anthony, sesión completada.");
    onSessionComplete();
  };

  const addSubject = () => {
    const name = prompt("Nombre de la materia:");
    if (!name) return;
    onUpdateSubjects([...subjects, { id: Math.random().toString(36).substr(2, 9), name, topics: [], lastAccessed: Date.now() }]);
  };

  const startEvaluation = async (subjectId: string) => {
    const subject = subjects.find(s => s.id === subjectId);
    if (!subject || subject.topics.length === 0) {
      speechService.speak("Anthony, no puedo evaluarte si no hay temas registrados en esta materia.");
      return;
    }

    setIsGeneratingQuiz(true);
    speechService.speak(`Iniciando protocolo de evaluación de ${subject.name}. Analizando tus temas registrados...`);
    
    const quizData = await karenAI.generateQuiz(subject.name, subject.topics.map(t => t.name));
    
    if (quizData && quizData.questions) {
      setActiveQuiz({
        subjectId,
        subjectName: subject.name,
        questions: quizData.questions
      });
    } else {
      speechService.speak("Hubo un error al generar el examen, Anthony.");
    }
    setIsGeneratingQuiz(false);
  };

  const handleQuizFinish = (score: number) => {
    const subject = subjects.find(s => s.id === activeQuiz?.subjectId);
    if (!subject) return;

    if (score >= 80) {
      speechService.speak(`Protocolo exitoso Anthony. Tu puntuación del ${score.toFixed(0)}% indica dominio. Actualizando estado de tus temas.`);
      const updatedTopics = subject.topics.map(t => ({ ...t, status: 'dominado' as const }));
      onUpdateSubjects(subjects.map(s => s.id === subject.id ? { ...s, topics: updatedTopics } : s));
    } else {
      speechService.speak(`Evaluación finalizada con ${score.toFixed(0)}%. Sugiero reforzar los temas pendientes antes del próximo examen.`);
    }
    setActiveQuiz(null);
  };

  const activeSubject = subjects.find(s => s.id === activeSubjectId);
  const activeTopic = activeSubject?.topics.find(t => t.id === activeTopicId);

  return (
    <div className="w-full h-full relative overflow-hidden bg-[#050505] flex flex-col">
      {activeQuiz && (
        <QuizOverlay 
          quiz={activeQuiz} 
          onClose={() => setActiveQuiz(null)} 
          onFinish={handleQuizFinish} 
        />
      )}

      {/* HUD Timer */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
        <div className="glass px-6 py-2 rounded-2xl border-[#ff8c0033] glow-orange flex flex-col items-center pointer-events-auto shadow-[0_0_20px_rgba(255,140,0,0.15)]">
          <h2 className="text-3xl font-mono text-[#ff8c00] font-bold tracking-tighter">
            {Math.floor(timeLeft / 60).toString().padStart(2, '0')}:{(timeLeft % 60).toString().padStart(2, '0')}
          </h2>
          <div className="flex gap-4 mt-1">
            <button onClick={() => setIsActive(!isActive)} className="text-[#ff8c00] hover:scale-110 transition-transform">
              {isActive ? <Pause size={16} /> : <Play size={16} />}
            </button>
            <button onClick={() => { setIsActive(false); setTimeLeft(25 * 60); }} className="text-slate-400 hover:text-white">
              <RotateCcw size={16} />
            </button>
          </div>
        </div>
      </div>

      {!activeSubjectId ? (
        <div className="flex-1 p-10 relative">
          <div className="mb-10 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-[#ff8c00] glow-orange-text uppercase tracking-widest">ESPACIO_ESTUDIO</h1>
            <button onClick={addSubject} className="glass p-3 rounded-full border-[#ff8c0044] text-[#ff8c00] hover:bg-[#ff8c0022] transition-all"><Plus size={24} /></button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
            {subjects.map(s => (
              <div key={s.id} onDoubleClick={() => setActiveSubjectId(s.id)} className="group cursor-pointer">
                <div className="w-full aspect-square glass rounded-3xl border-[#ff8c0033] flex flex-col items-center justify-center gap-2 transition-all hover:border-[#ff8c00aa] hover:scale-105 group-hover:glow-orange">
                  <Brain size={32} className="text-[#ff8c00] mb-2" />
                  <span className="text-[10px] font-bold text-[#ff8c00] uppercase tracking-widest text-center px-2">{s.name}</span>
                  <span className="text-[8px] text-slate-500">{s.topics.length} TEMAS</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : !activeTopicId ? (
        <div className="flex-1 p-10 flex flex-col animate-in slide-in-from-right-4 duration-500">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <button onClick={() => setActiveSubjectId(null)} className="p-2 text-slate-500 hover:text-white transition-all"><ArrowLeft size={20} /></button>
              <span className="text-[10px] text-slate-500 font-mono">MATERIA: {activeSubject?.name}</span>
            </div>
            <button 
              disabled={isGeneratingQuiz}
              onClick={() => startEvaluation(activeSubjectId!)} 
              className="glass px-4 py-2 rounded-xl border-[#ff8c0044] text-[#ff8c00] text-xs font-bold flex items-center gap-2 hover:bg-[#ff8c0011] disabled:opacity-50"
            >
              <GraduationCap size={18} /> {isGeneratingQuiz ? 'ANALIZANDO...' : 'INICIAR EVALUACIÓN'}
            </button>
          </div>
          <PlanificadorTemas 
            subjectName={activeSubject?.name || ''} 
            topics={activeSubject?.topics || []} 
            onAddTopic={(d) => onUpdateSubjects(subjects.map(s => s.id === activeSubjectId ? { ...s, topics: [...s.topics, { ...d, id: Math.random().toString(36).substr(2, 9), chatHistory: [] }] } : s))}
            onDeleteTopic={(id) => onUpdateSubjects(subjects.map(s => s.id === activeSubjectId ? { ...s, topics: s.topics.filter(t => t.id !== id) } : s))}
            onSelectTopic={setActiveTopicId}
            onUpdateTopicStatus={(id, status) => onUpdateSubjects(subjects.map(s => s.id === activeSubjectId ? { ...s, topics: s.topics.map(t => t.id === id ? { ...t, status } : t) } : s))}
          />
        </div>
      ) : (
        <div className="flex-1 flex flex-col">
          <div className="flex items-center justify-between p-6 border-b border-[#ff8c0022] glass">
            <div className="flex items-center gap-4">
              <button onClick={() => setActiveTopicId(null)} className="p-2 text-slate-500 hover:text-white transition-all"><ArrowLeft size={20} /></button>
              <div><h1 className="text-xl font-bold text-[#ff8c00] uppercase tracking-widest">{activeTopic?.name}</h1></div>
            </div>
          </div>
          <div className="flex-1 max-w-4xl mx-auto w-full p-4 overflow-hidden">
             <ChatInterface 
                messages={activeTopic?.chatHistory || []} 
                onSendMessage={(text) => onSendMessage(text, activeSubjectId!, activeTopicId!)}
                isVoiceEnabled={isVoiceEnabled}
                onToggleVoice={onToggleVoice}
                placeholder={`Estudiando ${activeTopic?.name}...`}
                accentColor="#ff8c00"
             />
          </div>
        </div>
      )}
    </div>
  );
};

export default EstudioCanvas;
