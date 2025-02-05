import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

interface PokemonName {
  en: string;
  es: string;
}

interface PokemonTypes {
  en: string[];
  es: string[];
}

interface PokemonDescription {
  en: string;
  es: string;
}

interface PokemonStats {
  hp: number;
  attack: number;
  defense: number;
  specialAttack: number;
  specialDefense: number;
  speed: number;
}

interface PokemonData {
  name: PokemonName;
  number: number;
  types: PokemonTypes;
  description: PokemonDescription;
  stats: PokemonStats;
  moves: string[];
  locations: string[];
  image: string;
}

export const fetchPokemonData = async (pokemonName: string): Promise<PokemonData> => {
  try {
    const response = await axios.get(`${API_URL}/pokemon/${pokemonName.toLowerCase()}`);
    const speciesResponse = await axios.get(response.data.species.url);
    
    const englishDescription = speciesResponse.data.flavor_text_entries.find(
      (entry: { language: { name: string } }) => entry.language.name === 'en'
    )?.flavor_text || '';

    const spanishDescription = speciesResponse.data.flavor_text_entries.find(
      (entry: { language: { name: string } }) => entry.language.name === 'es'
    )?.flavor_text || '';

    return {
      name: { 
        en: response.data.name, 
        es: speciesResponse.data.names.find((name: { language: { name: string } }) => 
          name.language.name === 'es'
        )?.name || response.data.name 
      },
      number: response.data.id,
      types: { 
        en: response.data.types.map((type: { type: { name: string } }) => type.type.name),
        es: response.data.types.map((type: { type: { name: string } }) => type.type.name)
      },
      description: { 
        en: englishDescription.replace(/\f/g, ' '),
        es: spanishDescription.replace(/\f/g, ' ')
      },
      stats: {
        hp: response.data.stats.find((stat: { stat: { name: string } }) => 
          stat.stat.name === 'hp'
        )?.base_stat || 0,
        attack: response.data.stats.find((stat: { stat: { name: string } }) => 
          stat.stat.name === 'attack'
        )?.base_stat || 0,
        defense: response.data.stats.find((stat: { stat: { name: string } }) => 
          stat.stat.name === 'defense'
        )?.base_stat || 0,
        specialAttack: response.data.stats.find((stat: { stat: { name: string } }) => 
          stat.stat.name === 'special-attack'
        )?.base_stat || 0,
        specialDefense: response.data.stats.find((stat: { stat: { name: string } }) => 
          stat.stat.name === 'special-defense'
        )?.base_stat || 0,
        speed: response.data.stats.find((stat: { stat: { name: string } }) => 
          stat.stat.name === 'speed'
        )?.base_stat || 0,
      },
      moves: response.data.moves.slice(0, 4).map((move: { move: { name: string } }) => 
        move.move.name
      ),
      locations: [],
      image: response.data.sprites.other['official-artwork'].front_default,
    };
  } catch (error) {
    console.error('Error fetching Pokemon data:', error);
    throw error;
  }
}; 