import axios from 'axios';

export const fetchPokemonData = async (pokemonName) => {
  try {
    const response = await axios.get(`https://pokeapi.co/api/v2/pokemon/${pokemonName.toLowerCase()}`);
    const speciesResponse = await axios.get(response.data.species.url);
    
    const englishDescription = speciesResponse.data.flavor_text_entries.find(
      entry => entry.language.name === 'en'
    )?.flavor_text || '';

    const spanishDescription = speciesResponse.data.flavor_text_entries.find(
      entry => entry.language.name === 'es'
    )?.flavor_text || '';

    return {
      name: { 
        en: response.data.name, 
        es: speciesResponse.data.names.find(name => name.language.name === 'es')?.name || response.data.name 
      },
      number: response.data.id,
      types: { 
        en: response.data.types.map(type => type.type.name),
        es: response.data.types.map(type => type.type.name) // Necesitaría una traducción adicional
      },
      description: { 
        en: englishDescription.replace(/\f/g, ' '),
        es: spanishDescription.replace(/\f/g, ' ')
      },
      stats: {
        hp: response.data.stats.find(stat => stat.stat.name === 'hp')?.base_stat || 0,
        attack: response.data.stats.find(stat => stat.stat.name === 'attack')?.base_stat || 0,
        defense: response.data.stats.find(stat => stat.stat.name === 'defense')?.base_stat || 0,
        specialAttack: response.data.stats.find(stat => stat.stat.name === 'special-attack')?.base_stat || 0,
        specialDefense: response.data.stats.find(stat => stat.stat.name === 'special-defense')?.base_stat || 0,
        speed: response.data.stats.find(stat => stat.stat.name === 'speed')?.base_stat || 0,
      },
      moves: response.data.moves.slice(0, 4).map(move => move.move.name),
      locations: [], // La API de Pokémon no proporciona esta información directamente
      image: response.data.sprites.other['official-artwork'].front_default,
    };
  } catch (error) {
    console.error('Error fetching Pokemon data:', error);
    throw error;
  }
};
