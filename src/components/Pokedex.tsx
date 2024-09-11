import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Camera, Volume2, VolumeX, Info, Power, ChevronLeft, ChevronRight, Globe, Aperture, Smartphone } from 'lucide-react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
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
  es: { name: 'Spanish', nativeName: 'Español' },
  en: { name: 'English', nativeName: 'English' }
};

const useSound = (url: string) => {
  const [audio] = useState(new Audio(url));
  return useCallback(() => {
    audio.currentTime = 0;
    audio.play().catch(error => console.error("Error al reproducir el sonido:", error));
  }, [audio]);
};

const LEDStatus: React.FC<{ status: { blue: boolean; yellow: boolean; green: boolean } }> = ({ status }) => {
  return (
    <div className="flex space-x-2">
      <div className={`w-3 h-3 rounded-full ${status.blue ? 'bg-blue-400' : 'bg-blue-900'} shadow-inner border border-blue-500 transition-colors duration-300`}></div>
      <div className={`w-3 h-3 rounded-full ${status.yellow ? 'bg-yellow-400' : 'bg-yellow-900'} shadow-inner border border-yellow-500 transition-colors duration-300`}></div>
      <div className={`w-3 h-3 rounded-full ${status.green ? 'bg-green-400' : 'bg-green-900'} shadow-inner border border-green-500 transition-colors duration-300`}></div>
    </div>
  );
};

const Screen: React.FC<{
  isPoweredOn: boolean;
  activeScreen: string;
  isIdentifying: boolean;
  identifiedPokemon: Pokemon | null;
  videoRef: React.RefObject<HTMLVideoElement>;
  language: Language;
  identificationMessage: string | null;
  activeInfoCategory: string;
}> = ({ isPoweredOn, activeScreen, isIdentifying, identifiedPokemon, videoRef, language, identificationMessage, activeInfoCategory }) => {
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
        <div className="text-3xl font-bold mb-4 font-mono">{activeInfoCategory}</div>
        <div className="text-xl font-mono">{categories[activeInfoCategory as keyof typeof categories]}</div>
      </div>
    )
  }

  return (
    <div className="bg-gray-800 rounded-lg p-2 mb-4 shadow-[inset_0_0_6px_rgba(255,255,255,0.3)]">
      <div className={`bg-green-200 rounded-md p-4 h-64 transition-all duration-300 ${isPoweredOn ? 'opacity-100' : 'opacity-50'} shadow-[inset_0_0_6px_rgba(0,0,0,0.3)]`}>
        {isPoweredOn ? (
          activeScreen === 'main' ? (
            <div className="h-full flex items-center justify-center relative">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              {identificationMessage && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-white font-mono">
                  {identificationMessage}
                </div>
              )}
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
  vibrate: (duration: number) => void;
  setLedIndicator: (operation: 'identify' | 'narrate' | 'info', state: boolean) => void;
  resetCamera: () => void;
}> = ({ isPoweredOn, cameraActive, handleIdentify, setCameraActive, isNarrating, identifiedPokemon, handleNarrate, stopNarration, handleInfoToggle, language, activeScreen, vibrate, setLedIndicator, resetCamera }) => (
  <div className="grid grid-cols-3 gap-4 mb-4">
    <Button 
      className="bg-gray-300 hover:bg-gray-400 shadow-[inset_0_-4px_0_rgba(0,0,0,0.3)] active:shadow-[inset_0_4px_0_rgba(0,0,0,0.3)] active:translate-y-1 transition-all duration-100 flex items-center justify-center py-4 rounded-lg"
      onClick={() => {
        if (identifiedPokemon) {
          stopNarration();
          resetCamera();
        } else {
          handleIdentify();
        }
        vibrate(50);
      }}
      disabled={!isPoweredOn}
    >
      {identifiedPokemon ? <Camera className="h-8 w-8 text-gray-700" /> : <Aperture className="h-8 w-8 text-gray-700" />}
    </Button>
    <Button 
      className="bg-gray-300 hover:bg-gray-400 shadow-[inset_0_-4px_0_rgba(0,0,0,0.3)] active:shadow-[inset_0_4px_0_rgba(0,0,0,0.3)] active:translate-y-1 transition-all duration-100 flex items-center justify-center py-4 rounded-lg"
      onClick={() => {
        if (isNarrating) {
          stopNarration();
        } else {
          handleNarrate();
        }
        setLedIndicator('narrate', !isNarrating);
        vibrate(50);
      }}
      disabled={!isPoweredOn || !identifiedPokemon}
    >
      {isNarrating ? <VolumeX className="h-8 w-8 text-gray-700" /> : <Volume2 className="h-8 w-8 text-gray-700" />}
    </Button>
    <Button 
      className="bg-gray-300 hover:bg-gray-400 shadow-[inset_0_-4px_0_rgba(0,0,0,0.3)] active:shadow-[inset_0_4px_0_rgba(0,0,0,0.3)] active:translate-y-1 transition-all duration-100 flex items-center justify-center py-4 rounded-lg"
      onClick={() => {
        handleInfoToggle();
        setLedIndicator('info', activeScreen !== 'info');
        vibrate(50);
      }}
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
  const [isPoweredOn, setIsPoweredOn] = useState(false);
  const [activeScreen, setActiveScreen] = useState('main');
  const [identifiedPokemon, setIdentifiedPokemon] = useState<Pokemon | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [isNarrating, setIsNarrating] = useState(false);
  const [identifiedPokemonList, setIdentifiedPokemonList] = useState<Pokemon[]>([]);
  const [currentPokemonIndex, setCurrentPokemonIndex] = useState(0);
  const [language, setLanguage] = useState<Language>('es');
  const [activeInfoCategory, setActiveInfoCategory] = useState('Bio');
  const [isIdentifying, setIsIdentifying] = useState(false);
  const [identificationMessage, setIdentificationMessage] = useState<string | null>(null);
  const [ledStatus, setLedStatus] = useState({ blue: false, yellow: false, green: false });
  const blinkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const playPowerSound = useSound('/sounds/power.mp3');
  const playCameraSound = useSound('/sounds/camera.mp3');

  const setLedIndicator = useCallback((operation: 'identify' | 'narrate' | 'info', state: boolean) => {
    setLedStatus(prev => ({
      ...prev,
      [operation === 'identify' ? 'blue' : operation === 'narrate' ? 'yellow' : 'green']: state
    }));
  }, []);

  const powerOnLedSequence = useCallback(() => {
    const sequence = [
      { blue: true, yellow: false, green: false },
      { blue: false, yellow: true, green: false },
      { blue: false, yellow: false, green: true },
    ];

    let index = 0;
  
    const runSequence = () => {
      if (index < sequence.length) {
        setLedStatus(sequence[index]);
        index++;
        
        if (index < sequence.length) {
          setTimeout(runSequence, 200);
        }
      }
    };

    if (blinkIntervalRef.current) {
      clearInterval(blinkIntervalRef.current);
      blinkIntervalRef.current = null;
    }

    runSequence();
  }, []);

  const powerOffLedSequence = useCallback(() => {
    const sequence = [
      { blue: false, yellow: false, green: true },
      { blue: false, yellow: true, green: false },
      { blue: true, yellow: false, green: false },
      { blue: false, yellow: false, green: false },
    ];

    let index = 0;
  
    const runSequence = () => {
      if (index < sequence.length) {
        setLedStatus(sequence[index]);
        index++;
        
        if (index < sequence.length) {
          setTimeout(runSequence, 200);
        } else {
          setLedStatus({ blue: false, yellow: false, green: false });
        }
      }
    };

    if (blinkIntervalRef.current) {
      clearInterval(blinkIntervalRef.current);
      blinkIntervalRef.current = null;
    }

    runSequence();
  }, []);

  const handlePower = useCallback(() => {
    playPowerSound();
    if (isPoweredOn) {
      powerOffLedSequence();
      setTimeout(() => {
        setIsPoweredOn(false);
        setActiveScreen('main');
        setIdentifiedPokemon(null);
        setCameraActive(false);
        setIsNarrating(false);
        setIdentifiedPokemonList([]);
        setCurrentPokemonIndex(0);
        setActiveInfoCategory('Bio');
        stopAllSounds();
      }, 800);
      vibrate(100);
    } else {
      setIsPoweredOn(true);
      powerOnLedSequence();
      setCameraActive(true);
      vibrate(200);
    }
  }, [isPoweredOn, playPowerSound, powerOffLedSequence, powerOnLedSequence]);

  const stopAllSounds = () => {
    window.speechSynthesis.cancel();
  };

  const vibrate = (duration: number) => {
    if ("vibrate" in navigator) {
      navigator.vibrate(duration);
    }
  };

  const handleLanguageChange = (newLanguage: Language) => {
    setLanguage(newLanguage);
    resetPokedex();
  };

  const resetPokedex = useCallback(() => {
    setActiveScreen('main');
    setIdentifiedPokemon(null);
    setCameraActive(true);
    setIsNarrating(false);
    setIdentifiedPokemonList([]);
    setCurrentPokemonIndex(0);
    setActiveInfoCategory('Bio');
    setIdentificationMessage(null);
    stopAllSounds();
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
    }
    startCamera();
  }, []);

  const startYellowLedBlink = useCallback(() => {
    if (blinkIntervalRef.current) {
      clearInterval(blinkIntervalRef.current);
    }
    blinkIntervalRef.current = setInterval(() => {
      setLedStatus(prev => ({ ...prev, yellow: !prev.yellow }));
    }, 500);
  }, []);

  const stopYellowLedBlink = useCallback(() => {
    if (blinkIntervalRef.current) {
      clearInterval(blinkIntervalRef.current);
      blinkIntervalRef.current = null;
    }
    setLedStatus(prev => ({ ...prev, yellow: false }));
  }, []);

  const handleNarrate = useCallback(() => {
    if (identifiedPokemon) {
      const speechLanguage = language === 'en' ? 'en-US' : 'es-ES';
      speak(identifiedPokemon.description[language], speechLanguage, () => {
        setIsNarrating(false);
        stopYellowLedBlink();
      });
      setIsNarrating(true);
      startYellowLedBlink();
    }
  }, [identifiedPokemon, language, startYellowLedBlink, stopYellowLedBlink]);

  const stopNarration = useCallback(() => {
    setIsNarrating(false);
    stopYellowLedBlink();
    window.speechSynthesis.cancel();
  }, [stopYellowLedBlink]);

  const resetCamera = useCallback(() => {
    setActiveScreen('main');
    setIdentifiedPokemon(null);
    setCameraActive(true);
    setIdentificationMessage(null);
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
    }
    startCamera();
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error al acceder a la cámara", err);
      setIdentificationMessage("Error al acceder a la cámara");
    }
  };

  const handleIdentify = useCallback(async () => {
    if (!isPoweredOn) return;
  
    if (identifiedPokemon) {
      stopNarration();
      resetCamera();
      return;
    }

    playCameraSound();
    setCameraActive(false);
    setIsIdentifying(true);
    setActiveScreen('main');
    setLedIndicator('identify', true);
    vibrate(50);
    setIdentificationMessage("Identificando pokémon...");

    try {
      const imageData = await captureImage();
      const recognizedPokemon = await recognizeImage(imageData);
      
      if (recognizedPokemon) {
        const pokemonData = await fetchPokemonData(recognizedPokemon);
        setIdentifiedPokemon(pokemonData);
        setIdentifiedPokemonList(prev => [...prev, pokemonData]);
        setCurrentPokemonIndex(identifiedPokemonList.length);
        setActiveScreen('identify');
        setIdentificationMessage(null);
        setTimeout(() => {
          if (pokemonData && pokemonData.description) {
            const speechLanguage = language === 'en' ? 'en-US' : 'es-ES';
            speak(pokemonData.description[language], speechLanguage, () => {
              setIsNarrating(false);
              stopYellowLedBlink();
            });
            setIsNarrating(true);
            startYellowLedBlink();
          }
        }, 500);
      } else {
        setIdentificationMessage("No se pudo identificar el Pokémon");
        setTimeout(() => {
          setIdentificationMessage(null);
          resetCamera();
        }, 3000);
      }
    } catch (error) {
      console.error("Error al identificar Pokémon", error);
      setIdentificationMessage("Error al identificar Pokémon");
      setTimeout(() => {
        setIdentificationMessage(null);
        resetCamera();
      }, 3000);
    } finally {
      setIsIdentifying(false);
      setLedIndicator('identify', false);
    }
  }, [isPoweredOn, playCameraSound, language, startYellowLedBlink, stopYellowLedBlink, identifiedPokemonList.length, resetCamera, identifiedPokemon, setLedIndicator, stopNarration]);

  const captureImage = async (): Promise<string> => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
      return canvas.toDataURL('image/jpeg');
    }
    throw new Error('No se pudo capturar la imagen');
  };

  const handleInfoToggle = () => {
    setActiveScreen(prevScreen => prevScreen === 'identify' ? 'info' : 'identify');
  };

  const handleNavigation = (direction: 'left' | 'right' | 'up' | 'down') => {
    if (!isPoweredOn || !identifiedPokemon) return;

    vibrate(30);

    if (activeScreen === 'identify') {
      if (direction === 'left' || direction === 'right') {
        let newIndex = currentPokemonIndex;
        if (direction === 'left') {
          newIndex = (newIndex - 1 + identifiedPokemonList.length) % identifiedPokemonList.length;
        } else {
          newIndex = (newIndex + 1) % identifiedPokemonList.length;
        }
        setCurrentPokemonIndex(newIndex);
        setIdentifiedPokemon(identifiedPokemonList[newIndex]);
      }
    } else if (activeScreen === 'info') {
      const categories = ['Bio', 'Movimientos', 'Ubicaciones', 'Estadísticas'];
      let newIndex = categories.indexOf(activeInfoCategory);
      if (direction === 'up' || direction === 'left') {
        newIndex = (newIndex - 1 + categories.length) % categories.length;
      } else if (direction === 'down' || direction === 'right') {
        newIndex = (newIndex + 1) % categories.length;
      }
      setActiveInfoCategory(categories[newIndex]);
    }
  };

  useEffect(() => {
    if (isPoweredOn) {
      startCamera();
    }
  
    const currentVideo = videoRef.current;
  
    return () => {
      if (currentVideo && currentVideo.srcObject) {
        const tracks = (currentVideo.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
      if (blinkIntervalRef.current) {
        clearInterval(blinkIntervalRef.current);
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
                <span className="sr-only">Cambiar idioma</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="end" 
              className="bg-red-100 border border-red-300 shadow-lg rounded-md overflow-hidden"
            >
              {Object.entries(languages).map(([code, { name, nativeName }]) => (
                <DropdownMenuItem 
                  key={code} 
                  onClick={() => handleLanguageChange(code as Language)}
                  className={`px-4 py-2 hover:bg-red-200 cursor-pointer ${
                    language === code ? 'bg-red-300 font-bold' : ''
                  }`}
                >
                  <span>{nativeName} ({name})</span>
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
          identificationMessage={identificationMessage}
          activeInfoCategory={activeInfoCategory}
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
          vibrate={vibrate}
          setLedIndicator={setLedIndicator}
          resetCamera={resetCamera}
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
