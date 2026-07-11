import { useEffect, useState } from 'react';
import voice from '../lib/voice';

export default function VoiceButton({ onCommand }) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);

  useEffect(() => {
    setSupported(voice.isSupported());
    voice.onResult = (text) => {
      setListening(false);
      if (onCommand) onCommand(text);
    };
    voice.onError = (err) => {
      setListening(false);
      console.warn('Voice error', err);
    };
    return () => {
      voice.onResult = null;
      voice.onError = null;
      voice.stop();
    };
  }, [onCommand]);

  const toggle = async () => {
    if (!supported) return;
    if (listening) {
      voice.stop();
      setListening(false);
      return;
    }
    try {
      await voice.start();
      setListening(true);
    } catch (e) {
      console.warn('Failed to start recognition', e);
    }
  };

  if (!supported) return null;

  return (
    <button
      aria-label="Parler"
      onClick={toggle}
      className={`voice-btn fixed z-50 bottom-24 right-6 p-3 rounded-full shadow-lg bg-primary text-white ${listening ? 'ring-4 ring-yellow-300' : ''}`}
    >
      {listening ? '🎤...' : '🎙️'}
    </button>
  );
}
