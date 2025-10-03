import { GoogleGenAI } from '@google/genai';

const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;

export const recognizeImage = async (imageData: string): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    const model = 'gemini-2.0-flash-lite';

    const prompt = "Identify the Pokémon's name in this image. Respond with only the name in lowercase. If no Pokémon is found, respond with 'not found'.";

    // Asegúrate de que imageData sea una cadena base64 válida
    const base64Image = imageData.split(',')[1] || imageData;

    const contents = [
      {
        role: 'user' as const,
        parts: [
          { text: prompt },
          {
            inlineData: {
              data: base64Image,
              mimeType: 'image/jpeg',
            },
          },
        ],
      },
    ];

    const stream = await ai.models.generateContentStream({
      model,
      contents,
      config: {},
    });

    let fullText = '';
    for await (const chunk of stream) {
      if (chunk.text) fullText += chunk.text;
    }

    const pokemonName = fullText.trim().toLowerCase();

    return pokemonName === 'not found' ? '' : pokemonName;
  } catch (error) {
    console.error("Error al reconocer la imagen:", error);
    // Puedes agregar más detalles del error aquí si es necesario
    return "";
  }
};
 