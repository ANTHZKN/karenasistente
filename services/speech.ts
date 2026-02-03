
class SpeechService {
  private synth: SpeechSynthesis;
  private voice: SpeechSynthesisVoice | null = null;
  private isVoicesLoaded: boolean = false;

  constructor() {
    this.synth = window.speechSynthesis;
    this.init();
  }

  private init() {
    if (this.synth.onvoiceschanged !== undefined) {
      this.synth.onvoiceschanged = () => this.loadVoices();
    }
    this.loadVoices();
  }

  private loadVoices() {
    const voices = this.synth.getVoices();
    if (voices.length === 0) return;

    // 1. Filtrar solo voces en español
    const spanishVoices = voices.filter(v => v.lang.toLowerCase().startsWith('es'));

    // 2. Blacklist de voces masculinas comunes para asegurar feminidad
    const maleNames = ['pablo', 'raul', 'jorge', 'david', 'paco', 'jose', 'google español'];

    // 3. Buscar voces femeninas explícitas o de alta calidad
    const femaleVoices = spanishVoices.filter(v => {
      const name = v.name.toLowerCase();
      return (
        name.includes('google') || 
        name.includes('mexico') || 
        name.includes('spain') ||
        name.includes('helena') || 
        name.includes('sabina') || 
        name.includes('monica') || 
        name.includes('lucia') ||
        name.includes('zira')
      ) && !maleNames.some(m => name.includes(m));
    });

    // 4. Selección final
    this.voice = femaleVoices[0] || spanishVoices[0] || voices[0];
    this.isVoicesLoaded = true;
    
    if (this.voice) {
      console.log("KAREN - Enlace Vocal Establecido:", this.voice.name);
    }
  }

  speak(text: string) {
    if (!text || !this.synth) return;

    if (!this.voice) this.loadVoices();

    // Cancelación inmediata de cualquier flujo anterior
    this.synth.cancel();

    // Latencia ultra-baja (10ms) para respuesta casi instantánea
    setTimeout(() => {
      const utterance = new SpeechSynthesisUtterance(text);
      
      if (this.voice) {
        utterance.voice = this.voice;
      }

      // CONFIGURACIÓN DE ALTO RENDIMIENTO PARA ANTHONY
      utterance.rate = 1.6;  // Velocidad ejecutiva muy alta
      utterance.pitch = 1.1; // Tono femenino equilibrado para evitar siseos a alta velocidad
      utterance.lang = 'es-ES';

      this.synth.speak(utterance);
    }, 10);
  }

  cancel() {
    this.synth.cancel();
  }
}

export const speechService = new SpeechService();
