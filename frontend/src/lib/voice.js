// Minimal voice service using Web Speech API (recognition + synthesis)
class VoiceService {
  constructor() {
    this.recognition = null;
    this.listening = false;
    this.onResult = null; // callback(text)
    this.onError = null;
    this.lang = 'fr-FR';

    if (typeof window !== 'undefined' && window.SpeechRecognition) {
      this.recognition = new window.SpeechRecognition();
    } else if (typeof window !== 'undefined' && window.webkitSpeechRecognition) {
      this.recognition = new window.webkitSpeechRecognition();
    }

    if (this.recognition) {
      this.recognition.lang = this.lang;
      this.recognition.interimResults = false;
      this.recognition.maxAlternatives = 1;
      this.recognition.onresult = (ev) => {
        const text = ev.results[0][0].transcript.trim();
        if (this.onResult) this.onResult(text);
      };
      this.recognition.onerror = (ev) => {
        if (this.onError) this.onError(ev.error || 'speech_error');
      };
      this.recognition.onend = () => {
        this.listening = false;
      };
    }
  }

  isSupported() {
    return !!this.recognition && !!window.speechSynthesis;
  }

  start() {
    if (!this.recognition) return Promise.reject(new Error('SpeechRecognition not supported'));
    try {
      this.recognition.start();
      this.listening = true;
      return Promise.resolve();
    } catch (err) {
      return Promise.reject(err);
    }
  }

  stop() {
    if (!this.recognition) return;
    try {
      this.recognition.stop();
    } catch (e) {
      // ignore
    }
    this.listening = false;
  }

  speak(text, opts = {}) {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = opts.lang || this.lang;
    utter.rate = opts.rate || 1;
    utter.pitch = opts.pitch || 1;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  }
}

const voice = new VoiceService();
export default voice;
