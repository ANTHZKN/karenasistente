
import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import ProjectsMap from './components/ProjectsMap';
import ChatInterface from './components/ChatInterface';
import ProjectWorkspace from './components/ProjectWorkspace';
import { AppState, Project, Message, ViewType } from './types';
import { karenAI } from './services/gemini';
import { speechService } from './services/speech';

const STORAGE_KEY = 'KAREN_STATE_V1';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
    return {
      projects: [],
      activeProjectId: null,
      currentView: 'chat',
      generalChat: [
        { role: 'model', text: 'Bienvenido Anthony. Estoy lista para asistirte.', timestamp: Date.now() }
      ],
      isVoiceEnabled: true,
    };
  });

  const [isLoading, setIsLoading] = useState(false);

  // Persist state
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const addProject = useCallback((name: string, description: string) => {
    const newProject: Project = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      description,
      createdAt: Date.now(),
      status: 'en progreso',
      chatHistory: [
        { role: 'model', text: `Anthony, he inicializado el entorno de trabajo para "${name}". ¿Cómo deseas proceder?`, timestamp: Date.now() }
      ],
      ideaNodes: [],
      ideaLinks: [],
      images: []
    };
    setState(prev => ({
      ...prev,
      projects: [...prev.projects, newProject]
    }));
  }, []);

  const deleteProject = useCallback((identifier: string) => {
    setState(prev => {
      const filtered = prev.projects.filter(p => 
        p.id !== identifier && p.name.toLowerCase() !== identifier.toLowerCase()
      );
      return {
        ...prev,
        projects: filtered,
        activeProjectId: prev.activeProjectId === identifier ? null : prev.activeProjectId,
        currentView: (prev.activeProjectId === identifier && prev.currentView === 'workspace') ? 'chat' : prev.currentView
      };
    });
  }, []);

  const updateProjectStatus = useCallback((identifier: string, status: 'en progreso' | 'completado') => {
    setState(prev => ({
      ...prev,
      projects: prev.projects.map(p => 
        (p.id === identifier || p.name.toLowerCase() === identifier.toLowerCase()) 
        ? { ...p, status } 
        : p
      )
    }));
  }, []);

  const handleSendMessage = async (text: string) => {
    const userMsg: Message = { role: 'user', text, timestamp: Date.now() };
    
    // Update UI first
    setState(prev => ({
      ...prev,
      generalChat: [...prev.generalChat, userMsg]
    }));
    
    setIsLoading(true);

    const response = await karenAI.generateResponse(
      [...state.generalChat, userMsg],
      state.projects,
      {
        onProjectCreated: addProject,
        onProjectDeleted: deleteProject,
        onStatusUpdated: updateProjectStatus
      }
    );

    const karenMsg: Message = { role: 'model', text: response, timestamp: Date.now() };

    setState(prev => ({
      ...prev,
      generalChat: [...prev.generalChat, karenMsg]
    }));

    if (state.isVoiceEnabled) {
      speechService.speak(response);
    }
    
    setIsLoading(false);
  };

  const handleUpdateProject = (updated: Project) => {
    setState(prev => ({
      ...prev,
      projects: prev.projects.map(p => p.id === updated.id ? updated : p)
    }));
  };

  const selectProject = (id: string) => {
    setState(prev => ({
      ...prev,
      activeProjectId: id,
      currentView: 'workspace'
    }));
  };

  const activeProject = state.projects.find(p => p.id === state.activeProjectId);

  return (
    <div className="flex h-screen w-screen bg-[#050505] text-[#e2e8f0] font-['Space_Grotesk'] overflow-hidden">
      <Sidebar 
        currentView={state.currentView} 
        onViewChange={(view) => setState(prev => ({ ...prev, currentView: view }))}
        activeProjectName={activeProject?.name}
      />
      
      <main className="flex-1 relative overflow-hidden">
        {state.currentView === 'chat' && (
          <div className="h-full max-w-5xl mx-auto p-6 flex flex-col">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tighter text-[#00d2ff] glow-text uppercase">Consola KAREN</h1>
                <p className="text-xs text-slate-500 tracking-widest font-mono">STATUS: AWAITING INPUT_</p>
              </div>
              {isLoading && (
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-[#00d2ff] rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-1.5 h-1.5 bg-[#00d2ff] rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-1.5 h-1.5 bg-[#00d2ff] rounded-full animate-bounce"></span>
                </div>
              )}
            </div>
            <ChatInterface 
              messages={state.generalChat} 
              onSendMessage={handleSendMessage}
              isVoiceEnabled={state.isVoiceEnabled}
              onToggleVoice={() => setState(prev => ({ ...prev, isVoiceEnabled: !prev.isVoiceEnabled }))}
            />
          </div>
        )}

        {state.currentView === 'map' && (
          <ProjectsMap 
            projects={state.projects} 
            onSelectProject={selectProject}
            onDeleteProject={deleteProject} 
          />
        )}

        {state.currentView === 'workspace' && activeProject && (
          <ProjectWorkspace 
            project={activeProject} 
            onUpdateProject={handleUpdateProject}
            isVoiceEnabled={state.isVoiceEnabled}
            onToggleVoice={() => setState(prev => ({ ...prev, isVoiceEnabled: !prev.isVoiceEnabled }))}
          />
        )}

        {state.currentView === 'settings' && (
          <div className="h-full p-10 max-w-2xl">
            <h1 className="text-3xl font-bold text-[#00d2ff] glow-text mb-8">NÚCLEO DE CONFIGURACIÓN</h1>
            <div className="space-y-6">
              <div className="glass p-6 rounded-2xl flex items-center justify-between">
                <div>
                  <h3 className="font-bold">Síntesis de Voz</h3>
                  <p className="text-xs text-slate-500">Activa o desactiva la comunicación verbal de KAREN.</p>
                </div>
                <button 
                  onClick={() => setState(prev => ({ ...prev, isVoiceEnabled: !prev.isVoiceEnabled }))}
                  className={`w-12 h-6 rounded-full transition-all relative ${state.isVoiceEnabled ? 'bg-[#00d2ff]' : 'bg-slate-700'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${state.isVoiceEnabled ? 'right-1' : 'left-1'}`} />
                </button>
              </div>
              
              <div className="glass p-6 rounded-2xl">
                <h3 className="font-bold mb-4">Métricas del Sistema</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 border border-[#00d2ff11] rounded-xl bg-black/40">
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Proyectos</span>
                    <p className="text-2xl font-bold text-[#00d2ff]">{state.projects.length}</p>
                  </div>
                  <div className="p-4 border border-[#00d2ff11] rounded-xl bg-black/40">
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Interacciones</span>
                    <p className="text-2xl font-bold text-[#00d2ff]">{state.generalChat.length}</p>
                  </div>
                </div>
              </div>

              <div className="pt-10">
                <button 
                  onClick={() => {
                    if(confirm("¿Estás seguro Anthony? Esto borrará todos los registros.")) {
                      localStorage.removeItem(STORAGE_KEY);
                      window.location.reload();
                    }
                  }}
                  className="px-6 py-3 border border-red-500/30 text-red-500 text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-red-500/10 transition-all"
                >
                  Purgar Memoria del Sistema
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Decorative HUD Elements */}
      <div className="fixed top-4 right-4 text-[8px] font-mono text-[#00d2ff44] pointer-events-none select-none text-right hidden lg:block">
        X: {Math.random().toFixed(4)}<br/>
        Y: {Math.random().toFixed(4)}<br/>
        Z: {Math.random().toFixed(4)}<br/>
        LATENCY: 42ms<br/>
        ENCRYPTION: AES-256
      </div>
    </div>
  );
};

export default App;
