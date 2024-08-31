export const recognizeImage = async (imageData) => {
  // Aquí implementarías la lógica de reconocimiento de imagen
  // Por ahora, retornamos un Pokémon aleatorio
  const pokemon = ['Pikachu', 'Charizard', 'Bulbasaur', 'Squirtle'];
  return pokemon[Math.floor(Math.random() * pokemon.length)];
};
