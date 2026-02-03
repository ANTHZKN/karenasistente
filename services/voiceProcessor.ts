
export class VoiceProcessor {
  private recognition: any;
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private stream: MediaStream | null = null;
  private isStarted: boolean = false;
  private silenceTimer: number | null = null;
  private commandQueue: string[] = [];

  constructor(
    private onResult: (text: string, isFinal: boolean) => void,
    private onSilence: () => void,
    private onError: (error: string) => void
  ) {
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    
    if (!SpeechRecognition) {
      console.error("Critical: SpeechRecognition API not supported.");
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'es-ES';

    this.recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      const resultText = finalTranscript || interimTranscript;
      this.onResult(resultText, !!finalTranscript);
      this.resetSilenceTimer();
    };

    this.recognition.onerror = (event: any) => {
      this.onError(event.error);
    };

    this.recognition.onend = () => {
      if (this.isStarted) {
        this.stop();
      }
    };
  }

  /**
   * Tokenización de Comandos: Divide una frase compleja en acciones atómicas.
   * Busca conectores lógicos para separar instrucciones múltiples.
   */
  public tokenizeInstructions(input: string): string[] {
    // Limpieza de ruido y normalización
    const cleanInput = input.trim().toLowerCase();
    
    // Separadores lógicos: "y luego", "y también", "punto", "además", "y" (con cuidado)
    // Usamos regex para detectar estos puntos de quiebre
    const separators = /\s+(?:y luego|luego|además|también|y además|y)\s+/g;
    
    // Filtramos comandos vacíos o demasiado cortos
    return cleanInput
      .split(separators)
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 3);
  }

  private resetSilenceTimer() {
    if (this.silenceTimer) window.clearTimeout(this.silenceTimer);
    // Latencia ajustada para permitir que Anthony encadene frases sin ser interrumpido
    this.silenceTimer = window.setTimeout(() => {
      this.onSilence();
    }, 1800); 
  }

  public static isSupported(): boolean {
    return !!((window as any).webkitSpeechRecognition || (window as any).SpeechRecognition);
  }

  async start(): Promise<AnalyserNode | null> {
    if (this.isStarted) return this.analyser;

    if (!VoiceProcessor.isSupported()) {
      this.onError('speech-recognition-not-supported');
      return null;
    }

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioContextClass();
      const source = this.audioCtx.createMediaStreamSource(this.stream);
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 256;
      source.connect(this.analyser);

      this.recognition.start();
      this.isStarted = true;
      this.resetSilenceTimer();
      
      return this.analyser;
    } catch (err: any) {
      this.onError(err.name === 'NotAllowedError' ? 'mic-access-denied' : 'mic-error');
      throw err;
    }
  }

  public clearBuffer() {
    this.commandQueue = [];
    console.log("KAREN: Memoria de comandos purgada.");
  }

  stop() {
    if (!this.isStarted) return;
    if (this.silenceTimer) window.clearTimeout(this.silenceTimer);
    this.recognition?.stop();
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      this.audioCtx.close();
    }
    this.isStarted = false;
    this.audioCtx = null;
    this.analyser = null;
  }
}
