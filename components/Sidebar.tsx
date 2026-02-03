
import React from 'react';
import { MessageSquare, Map, Settings, Layout, Timer } from 'lucide-react';
import { ViewType } from '../types';
import SpiderLogo from './SpiderLogo';

interface SidebarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  activeProjectName?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange, activeProjectName }) => {
  const items = [
    { id: 'chat', icon: MessageSquare, label: 'KAREN CHAT' },
    { id: 'map', icon: Map, label: 'MAPA GLOBAL' },
    { id: 'study', icon: Timer, label: 'SESIONES DE ESTUDIO' },
    { id: 'settings', icon: Settings, label: 'CONFIGURACIÓN' },
  ];

  return (
    <div className="w-20 md:w-64 h-full glass border-r border-[#00d2ff22] flex flex-col p-4 z-50">
      <div className="mb-10 flex items-center gap-3 px-2">
        <div className="w-10 h-10 rounded-lg bg-[#00d2ff11] border border-[#00d2ff33] flex items-center justify-center glow-blue shadow-[#00d2ff22]">
          <SpiderLogo size={28} />
        </div>
        <div className="hidden md:flex flex-col">
          <span className="font-bold tracking-tighter text-xl text-[#00d2ff] glow-text leading-none">KAREN</span>
          <span className="text-[8px] text-[#00d2ff] opacity-50 tracking-[0.3em] font-mono">NEURAL_LINK</span>
        </div>
      </div>

      <nav className="flex-1 space-y-4">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id as ViewType)}
            className={`w-full flex items-center gap-4 p-3 rounded-lg transition-all duration-300 ${
              currentView === item.id 
                ? 'bg-[#00d2ff22] text-[#00d2ff] border border-[#00d2ff44]' 
                : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
            }`}
          >
            <item.icon size={20} />
            <span className="hidden md:block text-xs font-bold tracking-widest">{item.label}</span>
          </button>
        ))}

        {activeProjectName && (
          <button
            onClick={() => onViewChange('workspace')}
            className={`w-full flex items-center gap-4 p-3 rounded-lg transition-all duration-300 ${
              currentView === 'workspace'
                ? 'bg-[#00d2ff22] text-[#00d2ff] border border-[#00d2ff44]'
                : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
            }`}
          >
            <Layout size={20} />
            <span className="hidden md:block text-xs font-bold tracking-widest truncate">WORKSPACE: {activeProjectName}</span>
          </button>
        )}
      </nav>

      <div className="mt-auto p-4 md:p-2 border-t border-[#00d2ff11] pt-4">
        <div className="hidden md:block text-[10px] text-slate-600 font-mono space-y-1">
          <div className="flex justify-between"><span>STATUS:</span> <span className="text-[#00d2ff] animate-pulse">ONLINE</span></div>
          <div className="flex justify-between"><span>USER:</span> <span className="text-slate-300">ANTHONY</span></div>
          <div className="flex justify-between"><span>CORE:</span> <span className="text-slate-300">ACTIVE</span></div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
