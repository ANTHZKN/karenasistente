
import React, { useState } from 'react';
import { Project, IdeaNode, IdeaLink } from '../types';
import ChatInterface from './ChatInterface';
import { Plus, Link, Image as ImageIcon, Trash2, X } from 'lucide-react';

interface ProjectWorkspaceProps {
  project: Project;
  onUpdateProject: (updated: Project) => void;
  isVoiceEnabled: boolean;
  onToggleVoice: () => void;
}

const ProjectWorkspace: React.FC<ProjectWorkspaceProps> = ({ 
  project, 
  onUpdateProject,
  isVoiceEnabled,
  onToggleVoice
}) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'ideas' | 'gallery'>('chat');
  const [newNodeLabel, setNewNodeLabel] = useState('');

  const addIdeaNode = () => {
    if (!newNodeLabel.trim()) return;
    const newNode: IdeaNode = {
      id: Math.random().toString(36).substr(2, 9),
      label: newNodeLabel,
      x: Math.random() * 400 + 50,
      y: Math.random() * 300 + 50
    };
    onUpdateProject({
      ...project,
      ideaNodes: [...project.ideaNodes, newNode]
    });
    setNewNodeLabel('');
  };

  const deleteNode = (id: string) => {
    onUpdateProject({
      ...project,
      ideaNodes: project.ideaNodes.filter(n => n.id !== id),
      ideaLinks: project.ideaLinks.filter(l => l.sourceId !== id && l.targetId !== id)
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpdateProject({
          ...project,
          images: [...project.images, reader.result as string]
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const sendMessageToProjectChat = (text: string) => {
    const newMsg = { role: 'user', text, timestamp: Date.now() };
    onUpdateProject({
      ...project,
      chatHistory: [...project.chatHistory, newMsg as any]
    });
    // AI integration would ideally happen at App level, but for individual chat we'd trigger it here
  };

  return (
    <div className="h-full flex flex-col p-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-end mb-8 border-b border-[#00d2ff11] pb-4">
        <div>
          <h1 className="text-3xl font-bold text-[#00d2ff] glow-text tracking-tighter uppercase">{project.name}</h1>
          <p className="text-slate-500 text-sm mt-1">{project.description}</p>
        </div>
        <div className="flex gap-1 glass p-1 rounded-lg">
          {(['chat', 'ideas', 'gallery'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded text-[10px] font-bold tracking-widest uppercase transition-all ${
                activeTab === tab ? 'bg-[#00d2ff] text-black' : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {activeTab === 'chat' && (
          <div className="h-full max-w-4xl mx-auto">
            <ChatInterface 
              messages={project.chatHistory} 
              onSendMessage={sendMessageToProjectChat}
              isVoiceEnabled={isVoiceEnabled}
              onToggleVoice={onToggleVoice}
              placeholder="Habla sobre este proyecto, Anthony..."
            />
          </div>
        )}

        {activeTab === 'ideas' && (
          <div className="h-full flex gap-6">
            <div className="w-64 space-y-4">
              <div className="glass p-4 rounded-xl space-y-4">
                <h3 className="text-xs font-bold text-[#00d2ff] tracking-widest uppercase">Añadir Nodo</h3>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={newNodeLabel}
                    onChange={(e) => setNewNodeLabel(e.target.value)}
                    placeholder="Idea..."
                    className="flex-1 bg-black/50 border border-[#00d2ff22] text-xs p-2 rounded outline-none focus:border-[#00d2ff]"
                  />
                  <button onClick={addIdeaNode} className="p-2 bg-[#00d2ff] text-black rounded hover:bg-[#00b8e6]"><Plus size={16} /></button>
                </div>
              </div>
              <div className="text-[10px] text-slate-600 font-mono p-2">
                NODOS: {project.ideaNodes.length}<br/>
                CONEXIONES: {project.ideaLinks.length}
              </div>
            </div>
            
            <div className="flex-1 glass rounded-2xl relative overflow-hidden bg-black/30">
              <svg width="100%" height="100%" className="absolute inset-0">
                {project.ideaNodes.map(node => (
                  <g key={node.id}>
                    <circle cx={node.x} cy={node.y} r="6" fill="#00d2ff" className="glow-blue" />
                    <text x={node.x + 10} y={node.y + 4} fill="#00d2ff" className="text-[10px] uppercase tracking-wider font-bold">{node.label}</text>
                    <foreignObject x={node.x - 30} y={node.y - 30} width="20" height="20">
                      <button onClick={() => deleteNode(node.id)} className="text-red-500 hover:text-red-400"><X size={12} /></button>
                    </foreignObject>
                  </g>
                ))}
              </svg>
            </div>
          </div>
        )}

        {activeTab === 'gallery' && (
          <div className="h-full overflow-y-auto pr-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <label className="aspect-square glass rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer border-dashed border-[#00d2ff22] hover:border-[#00d2ff] transition-all group">
                <ImageIcon className="text-[#00d2ff44] group-hover:text-[#00d2ff] transition-all" size={32} />
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Subir Imagen</span>
                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
              </label>
              {project.images.map((img, idx) => (
                <div key={idx} className="aspect-square glass rounded-xl relative overflow-hidden group">
                  <img src={img} alt="Project asset" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all" />
                  <button 
                    onClick={() => onUpdateProject({ ...project, images: project.images.filter((_, i) => i !== idx) })}
                    className="absolute top-2 right-2 p-1 bg-red-500/80 text-white rounded opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectWorkspace;
