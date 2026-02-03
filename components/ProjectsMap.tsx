
import React, { useRef, useEffect, useState } from 'react';
import { Project } from '../types';
import { Trash2 } from 'lucide-react';

interface ProjectsMapProps {
  projects: Project[];
  onSelectProject: (id: string) => void;
  onDeleteProject: (id: string) => void;
}

const ProjectsMap: React.FC<ProjectsMapProps> = ({ projects, onSelectProject, onDeleteProject }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight
        });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const getStatusColor = (status: Project['status']) => {
    return status === 'completado' ? '#10b981' : '#00d2ff';
  };

  return (
    <div ref={containerRef} className="w-full h-full relative overflow-hidden bg-[#050505]">
      {/* Background grid */}
      <div 
        className="absolute inset-0 opacity-10 pointer-events-none" 
        style={{ 
          backgroundImage: `linear-gradient(#00d2ff 1px, transparent 1px), linear-gradient(90deg, #00d2ff 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}
      />

      <svg width="100%" height="100%" className="relative z-10">
        <defs>
          <filter id="glow-blue">
            <feGaussianBlur stdDeviation="3.5" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <filter id="glow-green">
            <feGaussianBlur stdDeviation="3.5" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Lines connecting to a central "Core" */}
        {projects.map((project, i) => {
          const color = getStatusColor(project.status);
          const angle = (i / projects.length) * 2 * Math.PI;
          const radius = Math.min(dimensions.width, dimensions.height) * 0.3;
          const cx = dimensions.width / 2 + radius * Math.cos(angle);
          const cy = dimensions.height / 2 + radius * Math.sin(angle);

          return (
            <line 
              key={`line-${project.id}`}
              x1={dimensions.width / 2} y1={dimensions.height / 2} x2={cx} y2={cy}
              stroke={color} strokeWidth="1" strokeOpacity="0.15"
            />
          );
        })}

        {/* Project Nodes */}
        {projects.map((project, i) => {
          const angle = (i / projects.length) * 2 * Math.PI;
          const radius = Math.min(dimensions.width, dimensions.height) * 0.3;
          const cx = dimensions.width / 2 + radius * Math.cos(angle);
          const cy = dimensions.height / 2 + radius * Math.sin(angle);
          const color = getStatusColor(project.status);
          const filter = project.status === 'completado' ? 'url(#glow-green)' : 'url(#glow-blue)';

          return (
            <g key={project.id} className="cursor-pointer group">
              <circle
                cx={cx} cy={cy} r="14"
                fill={color}
                filter={filter}
                className="transition-all duration-300 group-hover:r-18"
                onClick={() => onSelectProject(project.id)}
              />
              <circle
                cx={cx} cy={cy} r="24"
                fill="transparent"
                stroke={color}
                strokeWidth="1"
                strokeDasharray="4 2"
                className="animate-[spin_12s_linear_infinite] opacity-40"
              />
              
              <text
                x={cx} y={cy + 42}
                textAnchor="middle"
                fill={color}
                className="text-[10px] font-bold uppercase tracking-[0.2em] glow-text opacity-70 group-hover:opacity-100 transition-opacity"
              >
                {project.name}
              </text>

              <text
                x={cx} y={cy + 54}
                textAnchor="middle"
                fill={color}
                className="text-[8px] font-mono uppercase tracking-[0.1em] opacity-40 group-hover:opacity-100"
              >
                [{project.status}]
              </text>

              {/* Manual Delete Button Overlay */}
              <g 
                transform={`translate(${cx + 18}, ${cy - 18})`}
                className="opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  if(confirm(`¿Eliminar proyecto "${project.name}", Anthony?`)) {
                    onDeleteProject(project.id);
                  }
                }}
              >
                <circle r="10" fill="#ef4444" fillOpacity="0.2" stroke="#ef4444" strokeWidth="0.5" />
                <path d="M-3.5 -3.5 L3.5 3.5 M3.5 -3.5 L-3.5 3.5" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
              </g>
            </g>
          );
        })}

        {/* Central Core */}
        <g transform={`translate(${dimensions.width/2}, ${dimensions.height/2})`}>
          <circle r="45" fill="rgba(0, 210, 255, 0.05)" stroke="#00d2ff" strokeWidth="0.5" strokeDasharray="5 5" className="animate-[spin_20s_linear_infinite]" />
          <circle r="35" fill="rgba(0, 210, 255, 0.1)" stroke="#00d2ff" strokeWidth="1" />
          <text textAnchor="middle" dy=".3em" fill="#00d2ff" className="text-[10px] font-bold tracking-[0.3em] glow-text">KAREN_CORE</text>
        </g>
      </svg>
      
      {projects.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-[#00d2ff] opacity-40">
          <p className="text-xl tracking-widest uppercase animate-pulse font-mono">_SIN PROYECTOS_ACTIVOS_ANTHONY</p>
        </div>
      )}
    </div>
  );
};

export default ProjectsMap;
