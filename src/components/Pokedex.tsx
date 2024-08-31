import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Camera, Volume2, VolumeX, Info, Power, ChevronLeft, ChevronRight, Globe, Aperture, Smartphone } from 'lucide-react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { useTranslation } from 'react-i18next';
import { fetchPokemonData } from '../services/pokeAPI';
import { recognizeImage } from '../services/imageRecognition';
import { speak } from '../services/textToSpeech';

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

type Language = 'en' | 'es';

const languages = {
  en: { name: 'English', nativeName: 'English' },
  es: { name: 'Spanish', nativeName: 'Español' }
};

const useSound = (url: string) => {
  const [audio] = useState(new Audio(url));
  return useCallback(() => {
    audio.currentTime = 0;
    audio.play().catch(error => console.error("Error al reproducir el sonido:", error));
  }, [audio]);
};

const LEDStatus: React.FC<{ status: { blue: boolean; yellow: boolean; green: boolean } }> = ({ status }) => (
  <div className="flex space-x-2">
    <div className={`w-3 h-3 rounded-full ${status.blue ? 'bg-blue-400' : 'bg-blue-900'} shadow-inner border border-blue-500 transition-colors duration-300`}></div>
    <div className={`w-3 h-3 rounded-full ${status.yellow ? 'bg-yellow-400' : 'bg-yellow-900'} shadow-inner border border-yellow-500 transition-colors duration-300`}></div>
    <div className={`w-3 h-3 rounded-full ${status.green ? 'bg-green-400' : 'bg-green-900'} shadow-inner border border-green-500 transition-colors duration-300`}></div>
  </div>
);

const Screen: React.FC<{
  isPoweredOn: boolean;
  activeScreen: string;
  isIdentifying: boolean;
  identifiedPokemon: Pokemon | null;
  videoRef: React.RefObject<HTMLVideoElement>;
  language: Language;
}> = ({ isPoweredOn, activeScreen, isIdentifying, identifiedPokemon, videoRef, language }) => {
  const renderInfoScreen = () => {
    if (!identifiedPokemon) return null
    const categories = {
      'Bio': (
        <div>
          <p>Número: {identifiedPokemon.number}</p>
          <p>Tipo: {identifiedPokemon.types[language].join(', ')}</p>
          <p>{identifiedPokemon.description[language]}</p>
        </div>
      ),
      'Movimientos': (
        <ul>
          {identifiedPokemon.moves.map((move, index) => (
            <li key={index}>{move}</li>
          ))}
        </ul>
      ),
      'Ubicaciones': (
        <ul>
          {identifiedPokemon.locations.map((location, index) => (
            <li key={index}>{location}</li>
          ))}
        </ul>
      ),
      'Estadísticas': (
        <div>
          {Object.entries(identifiedPokemon.stats).map(([stat, value]) => (
            <div key={stat} className="flex items-center mb-1">
              <span className="w-24 text-sm capitalize">{stat}:</span>
              <div className="w-full bg-gray-300 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{width: `${(value / 255) * 100}%`}}></div>
              </div>
              <span className="ml-2 text-sm">{value}</span>
            </div>
          ))}
        </div>
      )
    }

    return (
      <div className="h-full flex flex-col justify-center items-center text-gray-800">
        <div className="text-3xl font-bold mb-4 font-mono">{Object.keys(categories)[0]}</div>
        <div className="text-xl font-mono">{Object.values(categories)[0]}</div>
      </div>
    )
  }

  return (
    <div className="bg-gray-800 rounded-lg p-2 mb-4 shadow-[inset_0_0_6px_rgba(255,255,255,0.3)]">
      <div className={`bg-green-200 rounded-md p-4 h-64 transition-all duration-300 ${isPoweredOn ? 'opacity-100' : 'opacity-50'} shadow-[inset_0_0_6px_rgba(0,0,0,0.3)]`}>
        {isPoweredOn ? (
          activeScreen === 'main' ? (
            <div className="h-full flex items-center justify-center">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            </div>
          ) : isIdentifying ? (
            <div className="h-full flex items-center justify-center text-gray-700 font-mono">
              Identificando pokémon...
            </div>
          ) : activeScreen === 'identify' ? (
            <div className="text-center h-full flex flex-col justify-center">
              <h2 className="text-2xl font-bold mb-2 font-mono">{identifiedPokemon?.name[language]}</h2>
              <img src={identifiedPokemon?.image} alt={identifiedPokemon?.name[language]} className="mx-auto mb-2 h-40 object-contain" />
            </div>
          ) : (
            renderInfoScreen()
          )
        ) : (
          <div className="h-full flex items-center justify-center text-gray-700 font-mono">
            Apagado
          </div>
        )}
      </div>
    </div>
  )
}

const Controls: React.FC<{
  isPoweredOn: boolean;
  cameraActive: boolean;
  handleIdentify: () => void;
  setCameraActive: React.Dispatch<React.SetStateAction<boolean>>;
  isNarrating: boolean;
  identifiedPokemon: Pokemon | null;
  handleNarrate: () => void;
  stopNarration: () => void;
  handleInfoToggle: () => void;
  language: Language;
  activeScreen: string;
}> = ({ isPoweredOn, cameraActive, handleIdentify, setCameraActive, isNarrating, identifiedPokemon, handleNarrate, stopNarration, handleInfoToggle, language, activeScreen }) => (
  <div className="grid grid-cols-3 gap-4 mb-4">
    <Button 
      className="bg-gray-300 hover:bg-gray-400 shadow-[inset_0_-4px_0_rgba(0,0,0,0.3)] active:shadow-[inset_0_4px_0_rgba(0,0,0,0.3)] active:translate-y-1 transition-all duration-100 flex items-center justify-center py-4 rounded-lg"
      onClick={handleIdentify}
      disabled={!isPoweredOn}
    >
      <Aperture className="h-8 w-8 text-gray-700" />
    </Button>
    <Button 
      className="bg-gray-300 hover:bg-gray-400 shadow-[inset_0_-4px_0_rgba(0,0,0,0.3)] active:shadow-[inset_0_4px_0_rgba(0,0,0,0.3)] active:translate-y-1 transition-all duration-100 flex items-center justify-center py-4 rounded-lg"
      onClick={isNarrating ? stopNarration : handleNarrate}
      disabled={!isPoweredOn || !identifiedPokemon}
    >
      {isNarrating ? <VolumeX className="h-8 w-8 text-gray-700" /> : <Volume2 className="h-8 w-8 text-gray-700" />}
    </Button>
    <Button 
      className="bg-gray-300 hover:bg-gray-400 shadow-[inset_0_-4px_0_rgba(0,0,0,0.3)] active:shadow-[inset_0_4px_0_rgba(0,0,0,0.3)] active:translate-y-1 transition-all duration-100 flex items-center justify-center py-4 rounded-lg"
      onClick={handleInfoToggle}
      disabled={!isPoweredOn || !identifiedPokemon}
    >
      {activeScreen === 'info' ? <Smartphone className="h-8 w-8 text-gray-700" /> : <Info className="h-8 w-8 text-gray-700" />}
    </Button>
  </div>
)

const DPad: React.FC<{ handleNavigation: (direction: 'left' | 'right' | 'up' | 'down') => void }> = ({ handleNavigation }) => (
  <div className="relative w-24 h-24">
    <div className="absolute inset-0 bg-gray-700 rounded-full shadow-[inset_0_0_10px_rgba(0,0,0,0.6)]"></div>
    <Button
      className="absolute left-1/2 top-0 -translate-x-1/2 w-8 h-8 bg-gray-300 hover:bg-gray-400 shadow-[inset_0_-2px_0_rgba(0,0,0,0.3)] hover:shadow-[inset_0_-1px_0_rgba(0,0,0,0.3)] active:shadow-[inset_0_2px_0_rgba(0,0,0,0.3)] active:translate-y-[2px] transition-all duration-100 rounded-md"
      onClick={() => handleNavigation('up')}
    />
    <Button
      className="absolute left-1/2 bottom-0 -translate-x-1/2 w-8 h-8 bg-gray-300 hover:bg-gray-400 shadow-[inset_0_-2px_0_rgba(0,0,0,0.3)] hover:shadow-[inset_0_-1px_0_rgba(0,0,0,0.3)] active:shadow-[inset_0_2px_0_rgba(0,0,0,0.3)] active:translate-y-[-2px] transition-all duration-100 rounded-md"
      onClick={() => handleNavigation('down')}
    />
    <Button
      className="absolute left-0 top-1/2 -translate-y-1/2 w-8 h-8 bg-gray-300 hover:bg-gray-400 shadow-[inset_-2px_0_0_rgba(0,0,0,0.3)] hover:shadow-[inset_-1px_0_0_rgba(0,0,0,0.3)] active:shadow-[inset_2px_0_0_rgba(0,0,0,0.3)] active:translate-x-[2px] transition-all duration-100 rounded-md"
      onClick={() => handleNavigation('left')}
    >
      <ChevronLeft className="h-4 w-4 text-gray-700" />
    </Button>
    <Button
      className="absolute right-0 top-1/2 -translate-y-1/2 w-8 h-8 bg-gray-300 hover:bg-gray-400 shadow-[inset_2px_0_0_rgba(0,0,0,0.3)] hover:shadow-[inset_1px_0_0_rgba(0,0,0,0.3)] active:shadow-[inset_-2px_0_0_rgba(0,0,0,0.3)] active:translate-x-[-2px] transition-all duration-100 rounded-md"
      onClick={() => handleNavigation('right')}
    >
      <ChevronRight className="h-4 w-4 text-gray-700" />
    </Button>
  </div>
)

const Pokedex: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [isPoweredOn, setIsPoweredOn] = useState(false);
  const [activeScreen, setActiveScreen] = useState('main');
  const [identifiedPokemon, setIdentifiedPokemon] = useState<Pokemon | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [isNarrating, setIsNarrating] = useState(false);
  const [identifiedPokemonList, setIdentifiedPokemonList] = useState<Pokemon[]>([]);
  const [currentPokemonIndex, setCurrentPokemonIndex] = useState(0);
  const [language, setLanguage] = useState<Language>('en');
  const [activeInfoCategory, setActiveInfoCategory] = useState('Bio');
  const [ledStatus, setLedStatus] = useState({ blue: false, yellow: false, green: false });
  const [isIdentifying, setIsIdentifying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const blinkIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const playPowerSound = useSound('/sounds/power.mp3');
  const playButtonSound = useSound('/sounds/button.mp3');
  const playCameraSound = useSound('/sounds/camera.mp3');

  const handlePower = () => {
    if (isPoweredOn) {
      setIsPoweredOn(false);
      setActiveScreen('main');
      setIdentifiedPokemon(null);
      setCameraActive(false);
      setIsNarrating(false);
      setIdentifiedPokemonList([]);
      setCurrentPokemonIndex(0);
      setActiveInfoCategory('Bio');
      // Detener la animación de LEDs y apagarlos
      if (blinkIntervalRef.current) {
        clearInterval(blinkIntervalRef.current);
        blinkIntervalRef.current = null;
      }
      setLedStatus({ blue: false, yellow: false, green: false });
      setIsIdentifying(false);
    } else {
      setIsPoweredOn(true);
      setCameraActive(true); // Activar la cámara al encender
      powerOnLedSequence();
    }
    playPowerSound();
  };

  const powerOnLedSequence = () => {
    let sequence = [
      { blue: true, yellow: false, green: false },
      { blue: false, yellow: true, green: false },
      { blue: false, yellow: false, green: true },
      { blue: true, yellow: true, green: true },
      { blue: false, yellow: false, green: true }, // Estado final: solo verde encendido
    ];

    let index = 0;
    // Limpiar cualquier intervalo existente antes de iniciar uno nuevo
    if (blinkIntervalRef.current) {
      clearInterval(blinkIntervalRef.current);
    }
    blinkIntervalRef.current = setInterval(() => {
      setLedStatus(sequence[index]);
      index++;
      if (index >= sequence.length) {
        // Detener la animación después de completar la secuencia
        if (blinkIntervalRef.current) {
          clearInterval(blinkIntervalRef.current);
          blinkIntervalRef.current = null;
        }
        // Asegurar que solo el LED verde quede encendido
        setLedStatus({ blue: false, yellow: false, green: true });
      }
    }, 200);
  };

  const handleLanguageChange = (newLanguage: Language) => {
    setLanguage(newLanguage);
    i18n.changeLanguage(newLanguage);
  };

  const handleNarrate = useCallback(() => {
    if (identifiedPokemon) {
      speak(identifiedPokemon.description[language]);
      setIsNarrating(true);
    }
  }, [identifiedPokemon, language]);

  const handleIdentify = useCallback(async () => {
    playButtonSound()
    playCameraSound()
    setCameraActive(false)
    setIsIdentifying(true)
    setActiveScreen('main')
    setLedStatus(prev => ({ ...prev, blue: true }))

    try {
      // Simulación de identificación de Pokémon con un retraso
      await new Promise(resolve => setTimeout(resolve, 2000))
      const newPokemon: Pokemon = {
        name: { en: "Pikachu", es: "Pikachu" },
        number: 25,
        types: { en: ["Electric"], es: ["Eléctrico"] },
        description: {
          en: "Pikachu is an Electric-type Pokémon introduced in Generation I. It evolves from Pichu when leveled up with high friendship and evolves into Raichu when exposed to a Thunder Stone.",
          es: "Pikachu es un Pokémon de tipo Eléctrico introducido en la primera generación. Evoluciona de Pichu al subir un nivel con amistad alta y evoluciona a Raichu al usar una piedra trueno."
        },
        stats: {
          hp: 35,
          attack: 55,
          defense: 40,
          specialAttack: 50,
          specialDefense: 50,
          speed: 90
        },
        moves: ["Impactrueno", "Ataque Rápido", "Cola Férrea", "Bola Voltio"],
        locations: ["Bosque Verde", "Central Eléctrica", "Pueblo Paleta"],
        image: "/placeholder.svg?height=200&width=200"
      }
      setIdentifiedPokemon(newPokemon)
      setIdentifiedPokemonList(prev => [...prev, newPokemon])
      setCurrentPokemonIndex(identifiedPokemonList.length)
      setActiveScreen('identify')
      handleNarrate()
    } catch (error) {
      console.error("Error al identificar Pokémon", error)
      // Manejar el error (por ejemplo, mostrar un mensaje de error al usuario)
    } finally {
      setIsIdentifying(false)
      setLedStatus(prev => ({ ...prev, blue: false }))
    }
  }, [playButtonSound, playCameraSound, identifiedPokemonList.length, handleNarrate])

  const stopNarration = () => {
    setIsNarrating(false);
  };

  const handleInfoToggle = () => {
    setActiveScreen(prevScreen => prevScreen === 'identify' ? 'info' : 'identify');
  };

  const handleNavigation = (direction: 'left' | 'right' | 'up' | 'down') => {
    if (activeScreen === 'identify' && identifiedPokemonList.length > 0) {
      let newIndex = currentPokemonIndex;
      if (direction === 'left') {
        newIndex = (newIndex - 1 + identifiedPokemonList.length) % identifiedPokemonList.length;
      } else if (direction === 'right') {
        newIndex = (newIndex + 1) % identifiedPokemonList.length;
      }
      setCurrentPokemonIndex(newIndex);
      setIdentifiedPokemon(identifiedPokemonList[newIndex]);
    }
  };

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Error al acceder a la cámara", err);
      }

    };

    if (isPoweredOn) {
      startCamera();
    } else {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
    }

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, [isPoweredOn]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-200 p-4">
      <div className="w-full max-w-md bg-red-600 rounded-3xl p-6 shadow-[inset_0_0_10px_rgba(0,0,0,0.6)] border-8 border-red-700">
        <div className="flex justify-between items-center mb-4">
          <LEDStatus status={ledStatus} />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="bg-red-700 text-white hover:bg-red-800 hover:text-white">
                <Globe className="h-4 w-4" />
                <span className="sr-only">{t('toggleLanguage')}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {Object.entries(languages).map(([code, { name, nativeName }]) => (
                <DropdownMenuItem key={code} onClick={() => handleLanguageChange(code as Language)}>
                  <span className={`${language === code ? 'font-bold' : 'font-normal'}`}>
                    {nativeName} ({name})
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Screen 
          isPoweredOn={isPoweredOn}
          activeScreen={activeScreen}
          isIdentifying={isIdentifying}
          identifiedPokemon={identifiedPokemon}
          videoRef={videoRef}
          language={language}
        />

        <Controls 
          isPoweredOn={isPoweredOn}
          cameraActive={cameraActive}
          handleIdentify={handleIdentify}
          setCameraActive={setCameraActive}
          isNarrating={isNarrating}
          identifiedPokemon={identifiedPokemon}
          handleNarrate={handleNarrate}
          stopNarration={stopNarration}
          handleInfoToggle={handleInfoToggle}
          language={language}
          activeScreen={activeScreen}
        />

        <div className="flex justify-between items-center">
          <DPad handleNavigation={handleNavigation} />
          <Button 
            size="icon" 
            className="rounded-full bg-gray-800 text-white shadow-[inset_0_-4px_0_rgba(0,0,0,0.3)] active:shadow-[inset_0_4px_0_rgba(0,0,0,0.3)] active:translate-y-1 transition-all duration-100 w-16 h-16" 
            onClick={handlePower}
          >
            <Power className="h-8 w-8" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Pokedex;
