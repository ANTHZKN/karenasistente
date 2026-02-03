
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

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export interface Quiz {
  subjectId: string;
  subjectName: string;
  questions: QuizQuestion[];
}

export interface StudyTopic {
  id: string;
  name: string;
  quarter: 1 | 2 | 3;
  difficulty: 'basico' | 'intermedio' | 'avanzado';
  status: 'pendiente' | 'estudiando' | 'dominado';
  chatHistory: Message[];
}

export interface StudySubject {
  id: string;
  name: string;
  topics: StudyTopic[];
  lastAccessed: number;
  progressNotes?: string;
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

export type ViewType = 'chat' | 'map' | 'workspace' | 'settings' | 'study';

export interface AppState {
  projects: Project[];
  activeProjectId: string | null;
  currentView: ViewType;
  generalChat: Message[];
  isVoiceEnabled: boolean;
  studySessionsCount: number;
  studySubjects: StudySubject[];
  activeSubjectId: string | null;
}
