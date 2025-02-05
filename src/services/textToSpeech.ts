export const speak = (
  text: string,
  language: string = 'es-ES',
  callback?: () => void
): void => {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = language;
  utterance.rate = 0.9; // Velocidad ligeramente más lenta
  utterance.pitch = 1.1; // Tono ligeramente más alto

  // Seleccionar una voz más agradable si está disponible
  const voices = window.speechSynthesis.getVoices();
  const preferredVoice = voices.find(voice => 
    voice.lang.startsWith(language.slice(0, 2)) && 
    (voice.name.includes('Samantha') || voice.name.includes('Natural'))
  );
  
  if (preferredVoice) {
    utterance.voice = preferredVoice;
  }

  if (callback) {
    utterance.onend = callback;
  }

  window.speechSynthesis.speak(utterance);
}; 