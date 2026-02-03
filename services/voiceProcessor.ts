
export class VoiceProcessor {
  private recognition: any;
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private stream: MediaStream | null = null;
  private isStarted: boolean = false;
  private silenceTimer: number | null = null;

  constructor(
    private onResult: (text: string, isFinal: boolean) => void,
    private onSilence: () => void,
    private onError: (error: string) => void
  ) {
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    
    if (!SpeechRecognition) {
      console.error("Critical: SpeechRecognition API not supported in this browser.");
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

      this.onResult(finalTranscript || interimTranscript, !!finalTranscript);
      this.resetSilenceTimer();
    };

    this.recognition.onerror = (event: any) => {
      this.onError(event.error);
    };

    this.recognition.onend = () => {
      if (this.isStarted) {
        // Only trigger stop if it wasn't manual
        this.stop();
      }
    };
  }

  private resetSilenceTimer() {
    if (this.silenceTimer) window.clearTimeout(this.silenceTimer);
    this.silenceTimer = window.setTimeout(() => {
      this.onSilence();
    }, 2000); // 2 seconds of silence
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
      // 1. Force permission request explicitly before starting engine
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // 2. Initialize Audio Analysis
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioContextClass();
      const source = this.audioCtx.createMediaStreamSource(this.stream);
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 256;
      source.connect(this.analyser);

      // 3. Start Recognition
      this.recognition.start();
      this.isStarted = true;
      this.resetSilenceTimer();
      
      return this.analyser;
    } catch (err: any) {
      console.error("Mic Access Error:", err);
      this.onError(err.name === 'NotAllowedError' ? 'mic-access-denied' : 'mic-error');
      throw err;
    }
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
