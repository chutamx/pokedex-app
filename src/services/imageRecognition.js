const API_KEY = process.env.REACT_APP_GOOGLE_API_KEY;

export const recognizeImage = async (imageData) => {
  try {
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = "Identify the Pokémon's name in this image. Respond with only the name in lowercase. If no Pokémon is found, respond with 'not found'.";

    // Asegúrate de que imageData sea una cadena base64 válida
    const base64Image = imageData.split(',')[1] || imageData;

    const imagePart = {
      inlineData: {
        data: base64Image,
        mimeType: "image/jpeg"
      }
    };

    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const pokemonName = response.text().trim().toLowerCase();

    return pokemonName === 'not found' ? '' : pokemonName;
  } catch (error) {
    console.error("Error al reconocer la imagen:", error);
    // Puedes agregar más detalles del error aquí si es necesario
    return "";
  }
};
