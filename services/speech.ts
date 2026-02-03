
class SpeechService {
  private synth: SpeechSynthesis;
  private voice: SpeechSynthesisVoice | null = null;

  constructor() {
    this.synth = window.speechSynthesis;
    this.loadVoices();
    // Re-load when voices change (async loading in some browsers)
    if (this.synth.onvoiceschanged !== undefined) {
      this.synth.onvoiceschanged = () => this.loadVoices();
    }
  }

  private loadVoices() {
    const allVoices = this.synth.getVoices();
    
    // Debug for Anthony: Display all available voices in a readable table
    if (allVoices.length > 0) {
      console.log("KAREN - Analizando espectro vocal disponible...");
      console.table(allVoices.map(v => ({ name: v.name, lang: v.lang, default: v.default })));
    }

    // 1. Blacklist of confirmed male voices
    const blacklist = ['pablo', 'raul', 'paco', 'jose', 'microsoft david', 'jorge', 'male', 'masculino', 'guy'];

    // 2. Filter Spanish voices that are NOT in the blacklist
    const filteredSpanishVoices = allVoices.filter(v => {
      const name = v.name.toLowerCase();
      const isSpanish = v.lang.toLowerCase().startsWith('es');
      const isBlacklisted = blacklist.some(b => name.includes(b));
      return isSpanish && !isBlacklisted;
    });

    // 3. Selection Logic: 
    // Often index 0 is system default (sometimes male). 
    // Index 1 or specific Google variants are usually the high-quality female ones.
    if (filteredSpanishVoices.length > 1) {
      // Pick the second one if available, as requested
      this.voice = filteredSpanishVoices[1];
    } else if (filteredSpanishVoices.length > 0) {
      this.voice = filteredSpanishVoices[0];
    } else {
      // Last resort fallback
      this.voice = allVoices.find(v => v.lang.toLowerCase().startsWith('es')) || null;
    }

    if (this.voice) {
      console.log(`KAREN - Protocolo Vocal: [${this.voice.name}] SELECCIONADO PARA ANTHONY`);
    }
  }

  speak(text: string) {
    if (!text || !window.speechSynthesis) return;
    
    // Cancel any ongoing speech to avoid overlap
    this.synth.cancel();

    // 100ms safety delay to ensure engine reset
    setTimeout(() => {
      const utterance = new SpeechSynthesisUtterance(text);
      
      if (this.voice) {
        utterance.voice = this.voice;
      }
      
      // Technical parameters for forced female tone and agility
      utterance.pitch = 1.3;  // Sharper/High-pitched to force feminine profile
      utterance.rate = 1.1;   // Quick and efficient pace
      utterance.lang = 'es-ES';

      this.synth.speak(utterance);
    }, 100);
  }

  cancel() {
    this.synth.cancel();
  }
}

export const speechService = new SpeechService();
