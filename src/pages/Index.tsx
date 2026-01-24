import { useState, useCallback } from 'react';
import { LobbyScreen } from '@/components/screens/LobbyScreen';
import { FightersScreen } from '@/components/screens/FightersScreen';
import { ModeSelectScreen } from '@/components/screens/ModeSelectScreen';
import { BattleScreen } from '@/components/screens/BattleScreen';
import { SettingsScreen } from '@/components/screens/SettingsScreen';
import { useBattle } from '@/hooks/useBattle';
import { Player, GameScreen, FruitFighter } from '@/types/game';
import { FRUIT_FIGHTERS } from '@/data/fighters';

const Index = () => {
  const [currentScreen, setCurrentScreen] = useState<GameScreen>('lobby');
  const [player, setPlayer] = useState<Player>({
    id: 'player-1',
    name: 'Champion',
    trophies: 1250,
    level: 12,
    selectedFighter: FRUIT_FIGHTERS[0],
    fighters: FRUIT_FIGHTERS,
  });

  const { 
    battleState, 
    startBattle, 
    playerAttack, 
    playerDefend, 
    playerSpecial,
    restartBattle 
  } = useBattle();

  const handleSelectFighter = useCallback((fighter: FruitFighter) => {
    setPlayer(prev => ({
      ...prev,
      selectedFighter: fighter,
    }));
  }, []);

  const handleStartBattle = useCallback((vsBot: boolean) => {
    if (player.selectedFighter) {
      startBattle(player.selectedFighter, vsBot);
      setCurrentScreen('battle');
    }
  }, [player.selectedFighter, startBattle]);

  const handleNavigate = useCallback((screen: GameScreen) => {
    setCurrentScreen(screen);
  }, []);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Animated background stars */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-primary/30 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      {/* Screen content */}
      <div className="relative z-10">
        {currentScreen === 'lobby' && (
          <LobbyScreen 
            player={player} 
            onNavigate={handleNavigate} 
          />
        )}
        
        {currentScreen === 'fighters' && (
          <FightersScreen
            selectedFighter={player.selectedFighter}
            onSelectFighter={handleSelectFighter}
            onNavigate={handleNavigate}
          />
        )}
        
        {currentScreen === 'mode-select' && (
          <ModeSelectScreen
            selectedFighter={player.selectedFighter}
            onStartBattle={handleStartBattle}
            onNavigate={handleNavigate}
          />
        )}
        
        {currentScreen === 'battle' && battleState && (
          <BattleScreen
            battleState={battleState}
            onAttack={playerAttack}
            onDefend={playerDefend}
            onSpecial={playerSpecial}
            onNavigate={handleNavigate}
            onRestart={restartBattle}
          />
        )}
        
        {currentScreen === 'settings' && (
          <SettingsScreen onNavigate={handleNavigate} />
        )}
      </div>
    </div>
  );
};

export default Index;
