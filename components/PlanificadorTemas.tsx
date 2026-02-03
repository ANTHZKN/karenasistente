
import React, { useState } from 'react';
import { Plus, Trash2, BookOpen, BarChart2, Filter, ChevronRight, Star } from 'lucide-react';
import { StudyTopic } from '../types';

interface PlanificadorTemasProps {
  subjectName: string;
  topics: StudyTopic[];
  onAddTopic: (topic: Omit<StudyTopic, 'id' | 'chatHistory'>) => void;
  onDeleteTopic: (id: string) => void;
  onSelectTopic: (id: string) => void;
  onUpdateTopicStatus: (id: string, status: StudyTopic['status']) => void;
}

const PlanificadorTemas: React.FC<PlanificadorTemasProps> = ({
  subjectName,
  topics,
  onAddTopic,
  onDeleteTopic,
  onSelectTopic,
  onUpdateTopicStatus
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [filterQuarter, setFilterQuarter] = useState<number | 'all'>('all');
  const [filterDifficulty, setFilterDifficulty] = useState<string | 'all'>('all');
  
  const [newTopic, setNewTopic] = useState({
    name: '',
    quarter: 1 as 1 | 2 | 3,
    difficulty: 'basico' as 'basico' | 'intermedio' | 'avanzado'
  });

  const filteredTopics = topics.filter(t => {
    const qMatch = filterQuarter === 'all' || t.quarter === filterQuarter;
    const dMatch = filterDifficulty === 'all' || t.difficulty === filterDifficulty;
    return qMatch && dMatch;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopic.name.trim()) return;
    onAddTopic({
      ...newTopic,
      status: 'pendiente'
    });
    setNewTopic({ name: '', quarter: 1, difficulty: 'basico' });
    setShowAddForm(false);
  };

  const getDifficultyColor = (d: string) => {
    switch (d) {
      case 'basico': return 'text-green-400';
      case 'intermedio': return 'text-yellow-400';
      case 'avanzado': return 'text-red-400';
      default: return 'text-slate-400';
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden animate-in slide-in-from-right-4 duration-500">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-sm font-mono text-[#ff8c00] opacity-50 tracking-[0.3em]">PLANIFICADOR_DE_TEMAS</h2>
          <h1 className="text-3xl font-bold text-white tracking-tighter uppercase">{subjectName}</h1>
        </div>
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="glass p-3 rounded-xl border-[#ff8c0044] text-[#ff8c00] hover:bg-[#ff8c0022] transition-all flex items-center gap-2"
        >
          <Plus size={20} /> <span className="text-xs font-bold tracking-widest">AÑADIR TEMA</span>
        </button>
      </div>

      {/* Filtros */}
      <div className="flex gap-4 mb-6 glass p-3 rounded-2xl border-white/5">
        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2">
          <Filter size={14} /> FILTRAR:
        </div>
        <select 
          value={filterQuarter} 
          onChange={(e) => setFilterQuarter(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
          className="bg-transparent text-xs text-white border-none outline-none cursor-pointer hover:text-[#ff8c00]"
        >
          <option value="all">TODOS LOS TRIMESTRES</option>
          <option value="1">1º TRIMESTRE</option>
          <option value="2">2º TRIMESTRE</option>
          <option value="3">3º TRIMESTRE</option>
        </select>
        <select 
          value={filterDifficulty} 
          onChange={(e) => setFilterDifficulty(e.target.value)}
          className="bg-transparent text-xs text-white border-none outline-none cursor-pointer hover:text-[#ff8c00]"
        >
          <option value="all">CUALQUIER DIFICULTAD</option>
          <option value="basico">BÁSICO</option>
          <option value="intermedio">INTERMEDIO</option>
          <option value="avanzado">AVANZADO</option>
        </select>
      </div>

      {showAddForm && (
        <form onSubmit={handleSubmit} className="glass p-6 rounded-2xl border-[#ff8c0033] mb-8 animate-in zoom-in-95 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 tracking-[0.2em] uppercase">Nombre del Tema</label>
              <input 
                autoFocus
                type="text" 
                value={newTopic.name} 
                onChange={(e) => setNewTopic({...newTopic, name: e.target.value})}
                placeholder="Ej: Leyes de Newton"
                className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-sm focus:border-[#ff8c00] outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 tracking-[0.2em] uppercase">Trimestre</label>
              <select 
                value={newTopic.quarter} 
                onChange={(e) => setNewTopic({...newTopic, quarter: parseInt(e.target.value) as 1|2|3})}
                className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-sm focus:border-[#ff8c00] outline-none"
              >
                <option value="1">1º Trimestre</option>
                <option value="2">2º Trimestre</option>
                <option value="3">3º Trimestre</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 tracking-[0.2em] uppercase">Dificultad</label>
              <select 
                value={newTopic.difficulty} 
                onChange={(e) => setNewTopic({...newTopic, difficulty: e.target.value as any})}
                className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-sm focus:border-[#ff8c00] outline-none"
              >
                <option value="basico">Básico</option>
                <option value="intermedio">Intermedio</option>
                <option value="avanzado">Avanzado</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={() => setShowAddForm(false)} className="px-4 py-2 text-xs text-slate-400 font-bold uppercase hover:text-white">Cancelar</button>
            <button type="submit" className="bg-[#ff8c00] text-black px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-[#ffaa00] transition-all">Sincronizar Tema</button>
          </div>
        </form>
      )}

      <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-hide">
        {filteredTopics.length === 0 ? (
          <div className="h-40 flex items-center justify-center border border-dashed border-white/5 rounded-2xl text-slate-600 font-mono text-sm">
            _NO_HAY_TEMAS_CON_ESTE_FILTRO_
          </div>
        ) : (
          filteredTopics.map((topic) => (
            <div 
              key={topic.id}
              onClick={() => onSelectTopic(topic.id)}
              className="group glass p-4 rounded-2xl border-white/5 hover:border-[#ff8c0044] transition-all cursor-pointer flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-white/5 text-slate-400 group-hover:text-[#ff8c00] transition-colors`}>
                  <BookOpen size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-white group-hover:text-[#ff8c00] transition-colors">{topic.name}</h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[9px] font-mono text-slate-500 uppercase">{topic.quarter}º Trimestre</span>
                    <span className={`text-[9px] font-mono font-bold uppercase ${getDifficultyColor(topic.difficulty)}`}>{topic.difficulty}</span>
                    <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full ${
                      topic.status === 'dominado' ? 'bg-green-500/10 text-green-400' : 
                      topic.status === 'estudiando' ? 'bg-blue-500/10 text-blue-400' : 'bg-white/5 text-slate-500'
                    }`}>
                      {topic.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <select 
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => onUpdateTopicStatus(topic.id, e.target.value as any)}
                    value={topic.status}
                    className="bg-black/50 border border-white/10 rounded-md text-[9px] text-white p-1 outline-none"
                  >
                    <option value="pendiente">PENDIENTE</option>
                    <option value="estudiando">ESTUDIANDO</option>
                    <option value="dominado">DOMINADO</option>
                  </select>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onDeleteTopic(topic.id); }}
                    className="p-2 text-red-500/50 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <ChevronRight className="text-slate-700 group-hover:text-[#ff8c00]" size={20} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PlanificadorTemas;
