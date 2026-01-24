import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LobbyScreen } from '@/components/screens/LobbyScreen';
import { FightersScreen } from '@/components/screens/FightersScreen';
import { ModeSelectScreen } from '@/components/screens/ModeSelectScreen';
import { TeamSelectScreen } from '@/components/screens/TeamSelectScreen';
import { BattleScreen } from '@/components/screens/BattleScreen';
import { SettingsScreen } from '@/components/screens/SettingsScreen';
import { LevelUpNotification } from '@/components/LevelUpNotification';
import { useBattle } from '@/hooks/useBattle';
import { useAuth } from '@/hooks/useAuth';
import { Player, GameScreen, FruitFighter } from '@/types/game';
import { calculateLevel } from '@/components/LevelProgress';
import { Loader2 } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading, updateProfile, signOut } = useAuth();
  
  const [currentScreen, setCurrentScreen] = useState<GameScreen>('lobby');
  const [isVsBot, setIsVsBot] = useState(true);
  const [levelUpNotification, setLevelUpNotification] = useState<number | null>(null);
  
  const [player, setPlayer] = useState<Player>({
    id: 'player-1',
    name: 'Champion',
    trophies: 0,
    level: 1,
    totalWins: 0,
    selectedTeam: [],
    fighters: [],
  });

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth', { replace: true });
    }
  }, [authLoading, user, navigate]);

  // Sync player state with profile
  useEffect(() => {
    if (profile) {
      setPlayer(prev => ({
        ...prev,
        id: profile.user_id,
        name: profile.name,
        level: profile.level,
        totalWins: profile.total_wins,
      }));
    }
  }, [profile]);

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

  const handleVictory = useCallback(async () => {
    const newTotalWins = player.totalWins + 1;
    const oldLevel = player.level;
    const newLevel = calculateLevel(newTotalWins);
    
    // Update local state
    setPlayer(prev => ({
      ...prev,
      totalWins: newTotalWins,
      level: newLevel,
    }));

    // Show level up notification if level increased
    if (newLevel > oldLevel) {
      setLevelUpNotification(newLevel);
    }

    // Update database
    await updateProfile({
      total_wins: newTotalWins,
      level: newLevel,
    });
  }, [player.totalWins, player.level, updateProfile]);

  const handleLogout = useCallback(async () => {
    await signOut();
    navigate('/auth', { replace: true });
  }, [signOut, navigate]);

  // Show loading state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground font-game-heading">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Level Up Notification */}
      {levelUpNotification !== null && (
        <LevelUpNotification
          newLevel={levelUpNotification}
          onClose={() => setLevelUpNotification(null)}
        />
      )}

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
            onLogout={handleLogout}
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
