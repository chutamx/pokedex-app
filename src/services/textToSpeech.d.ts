declare module '../services/textToSpeech' {
  export function speak(text: string, language: string, onEnd?: () => void): void;
} 