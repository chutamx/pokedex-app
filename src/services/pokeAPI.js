export const fetchPokemonData = async (pokemonName) => {
  // Aquí implementarías la lógica para obtener datos de la PokeAPI
  // Por ahora, retornamos datos de ejemplo que coinciden con el tipo Pokemon
  return {
    name: { en: pokemonName, es: pokemonName },
    number: Math.floor(Math.random() * 1000),
    types: { en: ['Normal'], es: ['Normal'] },
    description: { en: `This is ${pokemonName}. It's a Pokemon!`, es: `Este es ${pokemonName}. ¡Es un Pokémon!` },
    stats: {
      hp: 100,
      attack: 100,
      defense: 100,
      specialAttack: 100,
      specialDefense: 100,
      speed: 100
    },
    moves: ['Tackle'],
    locations: ['Kanto'],
    image: 'https://example.com/pokemon.jpg'
  };
};
