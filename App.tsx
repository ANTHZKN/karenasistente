
import React, { useState, useEffect, useCallback, useRef } from 'react';
import Sidebar from './components/Sidebar';
import ProjectsMap from './components/ProjectsMap';
import ChatInterface from './components/ChatInterface';
import ProjectWorkspace from './components/ProjectWorkspace';
import EstudioCanvas from './components/EstudioCanvas';
import { AppState, Project, Message, ViewType, StudySubject, StudyTopic } from './types';
import { karenAI } from './services/gemini';
import { speechService } from './services/speech';
import { VoiceProcessor } from './services/voiceProcessor';

const PROJECTS_STORAGE_KEY = 'KAREN_STATE_V1';
const STUDY_STORAGE_KEY = 'KAREN_STUDY_DATA';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(() => {
    const savedProjects = localStorage.getItem(PROJECTS_STORAGE_KEY);
    const savedStudy = localStorage.getItem(STUDY_STORAGE_KEY);
    
    const projectData = savedProjects ? JSON.parse(savedProjects) : {
      projects: [],
      activeProjectId: null,
      generalChat: [{ role: 'model', text: 'Bienvenido Anthony. Sistema de proyectos listo.', timestamp: Date.now() }],
    };

    const studyData = savedStudy ? JSON.parse(savedStudy) : {
      studySessionsCount: 0,
      studySubjects: [],
      activeSubjectId: null,
    };

    return {
      currentView: 'chat',
      isVoiceEnabled: true,
      ...projectData,
      ...studyData
    };
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isStudyTimerActive, setIsStudyTimerActive] = useState(false);
  const voiceProcessorRef = useRef<VoiceProcessor | null>(null);

  useEffect(() => {
    localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify({
      projects: state.projects,
      activeProjectId: state.activeProjectId,
      generalChat: state.generalChat
    }));
  }, [state.projects, state.activeProjectId, state.generalChat]);

  useEffect(() => {
    localStorage.setItem(STUDY_STORAGE_KEY, JSON.stringify({
      studySessionsCount: state.studySessionsCount,
      studySubjects: state.studySubjects,
      activeSubjectId: state.activeSubjectId
    }));
  }, [state.studySessionsCount, state.studySubjects, state.activeSubjectId]);

  const addProject = useCallback(async (name: string, description: string) => {
    const newProject: Project = {
      id: Math.random().toString(36).substr(2, 9),
      name, description, createdAt: Date.now(), status: 'en progreso',
      chatHistory: [{ role: 'model', text: `Entorno para "${name}" inicializado.`, timestamp: Date.now() }],
      ideaNodes: [], ideaLinks: [], images: []
    };
    setState(prev => ({ ...prev, projects: [...prev.projects, newProject] }));
    return Promise.resolve();
  }, []);

  const addSubject = useCallback(async (name: string) => {
    const newSub: StudySubject = {
      id: Math.random().toString(36).substr(2, 9),
      name, topics: [], lastAccessed: Date.now()
    };
    setState(prev => ({ ...prev, studySubjects: [...prev.studySubjects, newSub] }));
    return Promise.resolve();
  }, []);

  const addTopicToSubjectByName = useCallback(async (subjectName: string, topicData: any) => {
    setState(prev => {
      const subject = prev.studySubjects.find(s => s.name.toLowerCase() === subjectName.toLowerCase());
      if (!subject) return prev;
      const newTopic: StudyTopic = {
        id: Math.random().toString(36).substr(2, 9),
        name: topicData.name,
        quarter: topicData.quarter || 1,
        difficulty: topicData.difficulty || 'basico',
        status: 'pendiente',
        chatHistory: [{ role: 'model', text: `Entorno para tema "${topicData.name}" activado.`, timestamp: Date.now() }]
      };
      return { ...prev, studySubjects: prev.studySubjects.map(s => s.id === subject.id ? { ...s, topics: [...s.topics, newTopic] } : s) };
    });
    return Promise.resolve();
  }, []);

  const handleStartQuizByVoice = useCallback(async (subjectName: string) => {
    setState(prev => {
      const subject = prev.studySubjects.find(s => s.name.toLowerCase() === subjectName.toLowerCase());
      if (subject) {
        return { ...prev, currentView: 'study', activeSubjectId: subject.id };
      }
      return prev;
    });
    return Promise.resolve();
  }, []);

  const deleteProject = useCallback(async (identifier: string) => {
    setState(prev => ({ 
      ...prev, 
      projects: prev.projects.filter(p => p.id !== identifier && p.name !== identifier) 
    }));
    return Promise.resolve();
  }, []);

  const handleSendMessage = async (text: string, subjectId?: string, topicId?: string) => {
    // Implementación de Procesamiento en Cascada
    // Si viene del VoiceProcessor, podríamos recibir una frase compleja
    setIsLoading(true);
    
    const userMsg: Message = { role: 'user', text, timestamp: Date.now() };
    
    // Actualización local inmediata
    if (subjectId && topicId) {
      setState(prev => ({ ...prev, studySubjects: prev.studySubjects.map(s => s.id === subjectId ? { ...s, topics: s.topics.map(t => t.id === topicId ? { ...t, chatHistory: [...t.chatHistory, userMsg] } : t) } : s) }));
    } else {
      setState(prev => ({ ...prev, generalChat: [...prev.generalChat, userMsg] }));
    }
    
    const activeSubject = subjectId ? state.studySubjects.find(s => s.id === subjectId) : null;
    const activeTopic = topicId ? activeSubject?.topics.find(t => t.id === topicId) : null;
    const history = activeTopic ? activeTopic.chatHistory : state.generalChat;

    // KAREN procesa el comando a través de Gemini con manejo de herramientas múltiples
    const response = await karenAI.generateResponse(
      [...history, userMsg],
      { projects: state.projects, subjects: state.studySubjects, currentView: state.currentView, activeSubjectName: activeTopic?.name },
      {
        onProjectCreated: addProject,
        onSubjectCreated: addSubject,
        onTopicCreated: addTopicToSubjectByName,
        onStartQuiz: handleStartQuizByVoice,
        onProjectDeleted: deleteProject
      }
    );

    const karenMsg: Message = { role: 'model', text: response, timestamp: Date.now() };
    if (subjectId && topicId) {
      setState(prev => ({ ...prev, studySubjects: prev.studySubjects.map(s => s.id === subjectId ? { ...s, topics: s.topics.map(t => t.id === topicId ? { ...t, chatHistory: [...t.chatHistory, karenMsg] } : t) } : s) }));
    } else {
      setState(prev => ({ ...prev, generalChat: [...prev.generalChat, karenMsg] }));
    }

    if (state.isVoiceEnabled) speechService.speak(response);
    
    // Limpieza de buffer tras procesamiento exitoso
    if (voiceProcessorRef.current) voiceProcessorRef.current.clearBuffer();
    
    setIsLoading(false);
  };

  return (
    <div className={`flex h-screen w-screen bg-[#050505] text-[#e2e8f0] font-['Space_Grotesk'] overflow-hidden ${isStudyTimerActive ? 'border-2 border-[#ff8c0022]' : ''}`}>
      <Sidebar 
        currentView={state.currentView} 
        onViewChange={(view) => setState(prev => ({ ...prev, currentView: view }))}
        activeProjectName={state.projects.find(p => p.id === state.activeProjectId)?.name}
      />
      <main className="flex-1 relative overflow-hidden">
        {state.currentView === 'chat' && <div className="h-full max-w-5xl mx-auto p-6 flex flex-col"><ChatInterface messages={state.generalChat} onSendMessage={handleSendMessage} isVoiceEnabled={state.isVoiceEnabled} onToggleVoice={() => setState(prev => ({ ...prev, isVoiceEnabled: !prev.isVoiceEnabled }))} /></div>}
        {state.currentView === 'map' && <ProjectsMap projects={state.projects} onSelectProject={(id) => setState(prev => ({ ...prev, activeProjectId: id, currentView: 'workspace' }))} onDeleteProject={deleteProject} />}
        {state.currentView === 'study' && <EstudioCanvas subjects={state.studySubjects} onUpdateSubjects={(subjects) => setState(prev => ({ ...prev, studySubjects: subjects }))} onSessionComplete={() => setState(prev => ({ ...prev, studySessionsCount: prev.studySessionsCount + 1 }))} onTimerToggle={setIsStudyTimerActive} onSendMessage={handleSendMessage} isVoiceEnabled={state.isVoiceEnabled} onToggleVoice={() => setState(prev => ({ ...prev, isVoiceEnabled: !prev.isVoiceEnabled }))} />}
        {state.currentView === 'workspace' && state.activeProjectId && <ProjectWorkspace project={state.projects.find(p => p.id === state.activeProjectId)!} onUpdateProject={(u) => setState(prev => ({ ...prev, projects: prev.projects.map(p => p.id === u.id ? u : p) }))} isVoiceEnabled={state.isVoiceEnabled} onToggleVoice={() => setState(prev => ({ ...prev, isVoiceEnabled: !prev.isVoiceEnabled }))} />}
      </main>
    </div>
  );
};

export default App;
