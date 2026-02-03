
import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { Message, Project, StudySubject } from "../types";

// Asumimos que API_KEY está configurada en el entorno
const API_KEY = process.env.API_KEY || "";

const addProjectTool: FunctionDeclaration = {
  name: "add_project",
  description: "Crea un nuevo proyecto en el sistema de Anthony.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING, description: "El nombre descriptivo del proyecto." },
      description: { type: Type.STRING, description: "Una breve descripción de qué trata el proyecto." },
    },
    required: ["name", "description"],
  },
};

const addStudySubjectTool: FunctionDeclaration = {
  name: "add_study_subject",
  description: "Crea una nueva materia o asignatura de estudio global para Anthony.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING, description: "El nombre de la materia (ej: Física, Historia)." },
    },
    required: ["name"],
  },
};

const addStudyTopicTool: FunctionDeclaration = {
  name: "add_study_topic",
  description: "Añade un tema específico dentro de una materia existente.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      subject_name: { type: Type.STRING, description: "El nombre de la materia donde se guardará el tema (ej: Química)." },
      topic_name: { type: Type.STRING, description: "El nombre del tema específico (ej: Enlaces Covalentes)." },
      quarter: { type: Type.STRING, description: "Trimestre (1, 2 o 3).", enum: ["1", "2", "3"] },
      difficulty: { type: Type.STRING, description: "Nivel de dificultad.", enum: ["basico", "intermedio", "avanzado"] },
    },
    required: ["subject_name", "topic_name"],
  },
};

const startQuizTool: FunctionDeclaration = {
  name: "start_quiz",
  description: "Inicia un protocolo de evaluación (Quiz) para una materia específica.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      subject_name: { type: Type.STRING, description: "El nombre de la materia a evaluar." },
    },
    required: ["subject_name"],
  },
};

const deleteProjectTool: FunctionDeclaration = {
  name: "delete_project",
  description: "Elimina un proyecto existente.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      project_identifier: { type: Type.STRING, description: "Nombre o ID del proyecto." },
    },
    required: ["project_identifier"],
  },
};

export class KarenAI {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
  }

  async generateQuiz(subjectName: string, topics: string[]) {
    const prompt = `Genera un examen de 5 preguntas de opción múltiple para Anthony sobre la materia "${subjectName}". 
    Temas incluidos: ${topics.join(", ")}.
    Cada pregunta debe tener 4 opciones, un índice de respuesta correcta (0-3) y una breve explicación de 1 oración.
    Formato: JSON.`;

    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              questions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    question: { type: Type.STRING },
                    options: { type: Type.ARRAY, items: { type: Type.STRING } },
                    correctAnswerIndex: { type: Type.NUMBER },
                    explanation: { type: Type.STRING }
                  },
                  required: ["id", "question", "options", "correctAnswerIndex", "explanation"]
                }
              }
            },
            required: ["questions"]
          }
        }
      });
      return JSON.parse(response.text);
    } catch (error) {
      console.error("Quiz Generation Error:", error);
      return null;
    }
  }

  /**
   * Genera una respuesta manejando instrucciones múltiples en cascada.
   */
  async generateResponse(
    history: Message[],
    context: {
      projects: Project[];
      subjects: StudySubject[];
      currentView: string;
      activeSubjectName?: string;
    },
    handlers: {
      onProjectCreated: (name: string, description: string) => Promise<void> | void;
      onSubjectCreated: (name: string) => Promise<void> | void;
      onTopicCreated: (subjectName: string, topicData: any) => Promise<void> | void;
      onStartQuiz: (subjectName: string) => Promise<void> | void;
      onProjectDeleted: (identifier: string) => Promise<void> | void;
    }
  ): Promise<string> {
    const { projects, subjects, currentView, activeSubjectName } = context;
    const projectsSummary = projects.map(p => `- ${p.name}`).join('\n');
    const subjectsSummary = subjects.map(s => `- ${s.name} (Temas: ${s.topics.map(t => t.name).join(", ")})`).join('\n');
    
    let systemInstruction = `Eres KAREN, la asistente personal de Anthony. 
    Idioma: Español. Siempre llama al usuario 'Anthony'.
    CONTEXTO VISUAL ACTUAL: ${currentView.toUpperCase()}.

    PROTOCOLO DE ACCIÓN MÚLTIPLE (CASCADA):
    Anthony puede dar varias órdenes a la vez. Eres capaz de identificar y ejecutar múltiples herramientas en una sola respuesta.
    Si una acción depende de otra (ej: crear materia y luego agregar tema), asegúrate de llamar a ambas herramientas.

    PROTOCOLO DE EVALUACIÓN:
    Si Anthony dice "examíname", "hazme un test" o "inicia protocolo de evaluación", usa 'start_quiz'. 

    CONFIRMACIONES:
    - Sé precisa y profesional. Confirma todas las acciones realizadas.`;

    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: history.map(m => ({ role: m.role, parts: [{ text: m.text }] })),
        config: {
          systemInstruction,
          tools: [{ functionDeclarations: [addProjectTool, addStudySubjectTool, addStudyTopicTool, startQuizTool, deleteProjectTool] }],
        },
      });

      const functionCalls = response.functionCalls;
      if (functionCalls && functionCalls.length > 0) {
        let executionResults: string[] = [];
        let partialFailure = false;

        // Ejecución secuencial (en Cascada) para manejar dependencias
        for (const call of functionCalls) {
          try {
            if (call.name === "add_project") {
              const { name, description } = call.args as any;
              await handlers.onProjectCreated(name, description);
              executionResults.push(`Proyecto "${name}" inicializado.`);
            } else if (call.name === "add_study_subject") {
              const { name } = call.args as any;
              await handlers.onSubjectCreated(name);
              executionResults.push(`Materia "${name}" registrada.`);
            } else if (call.name === "add_study_topic") {
              const { subject_name, topic_name, quarter, difficulty } = call.args as any;
              await handlers.onTopicCreated(subject_name, { 
                name: topic_name, 
                quarter: parseInt(String(quarter)) || 1, 
                difficulty: difficulty || 'basico',
                status: 'pendiente'
              });
              executionResults.push(`Tema "${topic_name}" añadido a ${subject_name}.`);
            } else if (call.name === "start_quiz") {
              const { subject_name } = call.args as any;
              await handlers.onStartQuiz(subject_name);
              executionResults.push(`Protocolo de evaluación para ${subject_name} activado.`);
            } else if (call.name === "delete_project") {
              const { project_identifier } = call.args as any;
              await handlers.onProjectDeleted(project_identifier);
              executionResults.push(`Proyecto "${project_identifier}" eliminado.`);
            }
          } catch (error) {
            console.error(`Error al ejecutar acción ${call.name}:`, error);
            partialFailure = true;
          }
        }

        if (partialFailure && executionResults.length > 0) {
          return `Anthony, pude procesar parte de tus instrucciones: ${executionResults.join(" ")} Pero hubo un problema con el resto. ¿Podrías repetirlo?`;
        } else if (executionResults.length > 0) {
          return `Entendido Anthony. He completado las siguientes acciones: ${executionResults.join(" ")}`;
        }
      }

      return response.text || "Anthony, estoy lista para tus instrucciones.";
    } catch (e) {
      console.error("Gemini Critical Error:", e);
      return "Anthony, he detectado una anomalía en mi procesamiento neural. ¿Podrías reformular tu instrucción?";
    }
  }
}

export const karenAI = new KarenAI();
