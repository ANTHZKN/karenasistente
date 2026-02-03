
export interface Message {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface IdeaNode {
  id: string;
  label: string;
  x: number;
  y: number;
}

export interface IdeaLink {
  sourceId: string;
  targetId: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: number;
  status: 'en progreso' | 'completado';
  chatHistory: Message[];
  ideaNodes: IdeaNode[];
  ideaLinks: IdeaLink[];
  images: string[];
}

export type ViewType = 'chat' | 'map' | 'workspace' | 'settings';

export interface AppState {
  projects: Project[];
  activeProjectId: string | null;
  currentView: ViewType;
  generalChat: Message[];
  isVoiceEnabled: boolean;
}
