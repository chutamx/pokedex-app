declare module '../services/pokeAPI' {
  type Pokemon = {
    name: { en: string; es: string };
    number: number;
    types: { en: string[]; es: string[] };
    description: { en: string; es: string };
    stats: {
      hp: number;
      attack: number;
      defense: number;
      specialAttack: number;
      specialDefense: number;
      speed: number;
    };
    moves: string[];
    locations: string[];
    image: string;
  }

  export function fetchPokemonData(name: string): Promise<Pokemon>;
} 