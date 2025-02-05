declare module '../services/pokeAPI' {
  export function fetchPokemonData(name: string): Promise<Pokemon>;
} 