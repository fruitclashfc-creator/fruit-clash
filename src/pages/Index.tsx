import { useState, useCallback } from 'react';
import { LobbyScreen } from '@/components/screens/LobbyScreen';
import { FightersScreen } from '@/components/screens/FightersScreen';
import { ModeSelectScreen } from '@/components/screens/ModeSelectScreen';
import { TeamSelectScreen } from '@/components/screens/TeamSelectScreen';
import { BattleScreen } from '@/components/screens/BattleScreen';
import { SettingsScreen } from '@/components/screens/SettingsScreen';
import { useBattle } from '@/hooks/useBattle';
import { Player, GameScreen, FruitFighter } from '@/types/game';
import { calculateLevel } from '@/components/LevelProgress';

const Index = () => {
  const [currentScreen, setCurrentScreen] = useState<GameScreen>('lobby');
  const [isVsBot, setIsVsBot] = useState(true);
  const [player, setPlayer] = useState<Player>({
    id: 'player-1',
    name: 'Champion',
    trophies: 1250,
    level: 1,
    totalWins: 0,
    selectedTeam: [],
    fighters: [],
  });

  const { 
    battleState, 
    startBattle, 
    proceedFromCoinToss,
    selectFighter,
    useAbility,
    defendWithFighter,
    skipDefense,
    restartBattle 
  } = useBattle();

  const handleStartModeSelect = useCallback((vsBot: boolean) => {
    setIsVsBot(vsBot);
    setCurrentScreen('team-select');
  }, []);

  const handleTeamSelected = useCallback((team: FruitFighter[]) => {
    setPlayer(prev => ({
      ...prev,
      selectedTeam: team,
    }));
    startBattle(team, isVsBot);
    setCurrentScreen('battle');
  }, [isVsBot, startBattle]);

  const handleNavigate = useCallback((screen: GameScreen) => {
    setCurrentScreen(screen);
  }, []);

  const handleVictory = useCallback(() => {
    setPlayer(prev => {
      const newTotalWins = prev.totalWins + 1;
      const newLevel = calculateLevel(newTotalWins);
      const newTrophies = prev.trophies + 30; // Award trophies on win
      
      return {
        ...prev,
        totalWins: newTotalWins,
        level: newLevel,
        trophies: newTrophies,
      };
    });
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
            onNavigate={handleNavigate}
          />
        )}
        
        {currentScreen === 'mode-select' && (
          <ModeSelectScreen
            onStartBattle={handleStartModeSelect}
            onNavigate={handleNavigate}
          />
        )}

        {currentScreen === 'team-select' && (
          <TeamSelectScreen
            onTeamSelected={handleTeamSelected}
            onNavigate={handleNavigate}
          />
        )}
        
        {currentScreen === 'battle' && battleState && (
          <BattleScreen
            battleState={battleState}
            onProceedFromCoinToss={proceedFromCoinToss}
            onSelectFighter={selectFighter}
            onUseAbility={useAbility}
            onDefend={defendWithFighter}
            onSkipDefense={skipDefense}
            onNavigate={handleNavigate}
            onRestart={restartBattle}
            onVictory={handleVictory}
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
