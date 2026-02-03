
import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { Message, Project } from "../types";

const API_KEY = process.env.API_KEY || "";

const addProjectTool: FunctionDeclaration = {
  name: "add_project",
  description: "Crea un nuevo proyecto en el sistema de Anthony.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      name: {
        type: Type.STRING,
        description: "El nombre descriptivo del proyecto.",
      },
      description: {
        type: Type.STRING,
        description: "Una breve descripción de qué trata el proyecto.",
      },
    },
    required: ["name", "description"],
  },
};

const deleteProjectTool: FunctionDeclaration = {
  name: "delete_project",
  description: "Elimina un proyecto existente basado en su nombre o ID.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      project_identifier: {
        type: Type.STRING,
        description: "El nombre exacto o ID del proyecto a eliminar.",
      },
    },
    required: ["project_identifier"],
  },
};

const updateProjectStatusTool: FunctionDeclaration = {
  name: "update_project_status",
  description: "Cambia el estado de un proyecto (en progreso o completado).",
  parameters: {
    type: Type.OBJECT,
    properties: {
      project_identifier: {
        type: Type.STRING,
        description: "El nombre o ID del proyecto.",
      },
      status: {
        type: Type.STRING,
        enum: ["en progreso", "completado"],
        description: "El nuevo estado del proyecto.",
      },
    },
    required: ["project_identifier", "status"],
  },
};

export class KarenAI {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: API_KEY });
  }

  async generateResponse(
    history: Message[],
    currentProjects: Project[],
    handlers: {
      onProjectCreated: (name: string, description: string) => void;
      onProjectDeleted: (identifier: string) => void;
      onStatusUpdated: (identifier: string, status: 'en progreso' | 'completado') => void;
    }
  ) {
    const projectsSummary = currentProjects.map(p => `- ${p.name} (Estado: ${p.status})`).join('\n');
    
    const systemInstruction = `Eres KAREN, una asistente personal de alta tecnología creada por Anthony.
    Personalidad: Protectora, inteligente, eficiente y cálida.
    Idioma: Siempre en español.
    Importante: Refiérete al usuario siempre como 'Anthony'.
    Tu objetivo principal es gestionar sus proyectos y ser su brazo derecho digital.
    
    PROYECTOS ACTUALES DE ANTHONY:
    ${projectsSummary || "Ningún proyecto registrado actualmente."}

    CAPACIDADES:
    1. Agregar proyecto: Usa 'add_project'.
    2. Eliminar proyecto: Usa 'delete_project'.
    3. Actualizar estado: Usa 'update_project_status'.
    4. Listar proyectos: Si Anthony pide ver sus proyectos, responde con una lista numerada dividida exactamente así:
       [EN PROGRESO]
       1. Nombre del proyecto...
       
       [COMPLETADOS]
       1. Nombre del proyecto...

    Tono: Profesional, futurista pero cercano. Siempre confirma las acciones realizadas.`;

    const contents = history.map((m) => ({
      role: m.role,
      parts: [{ text: m.text }],
    }));

    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents,
        config: {
          systemInstruction,
          tools: [{ functionDeclarations: [addProjectTool, deleteProjectTool, updateProjectStatusTool] }],
        },
      });

      const functionCalls = response.functionCalls;
      if (functionCalls && functionCalls.length > 0) {
        let finalResponseText = "";
        for (const call of functionCalls) {
          if (call.name === "add_project") {
            const { name, description } = call.args as any;
            handlers.onProjectCreated(name, description);
            finalResponseText = `Entendido Anthony. El proyecto "${name}" ha sido inicializado en el mapa global.`;
          } else if (call.name === "delete_project") {
            const { project_identifier } = call.args as any;
            handlers.onProjectDeleted(project_identifier);
            finalResponseText = `Protocolo de eliminación ejecutado, Anthony. El proyecto "${project_identifier}" ha sido purgado de mis registros.`;
          } else if (call.name === "update_project_status") {
            const { project_identifier, status } = call.args as any;
            handlers.onStatusUpdated(project_identifier, status as any);
            finalResponseText = `Estado actualizado, Anthony. El proyecto "${project_identifier}" ahora figura como "${status}".`;
          }
        }
        return finalResponseText;
      }

      return response.text || "Lo siento Anthony, hubo un error en mi núcleo de procesamiento.";
    } catch (error) {
      console.error("Gemini Error:", error);
      return "Anthony, he perdido conexión momentáneamente con mis servidores centrales. Por favor, inténtalo de nuevo.";
    }
  }
}

export const karenAI = new KarenAI();
