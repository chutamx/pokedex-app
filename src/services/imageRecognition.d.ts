declare module '../services/imageRecognition' {
  export function recognizeImage(imageData: string): Promise<string | null>;
} 