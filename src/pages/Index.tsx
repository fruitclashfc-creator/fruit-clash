import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LobbyScreen } from '@/components/screens/LobbyScreen';
import { FightersScreen } from '@/components/screens/FightersScreen';
import { TeamSelectScreen } from '@/components/screens/TeamSelectScreen';
import { BattleScreen } from '@/components/screens/BattleScreen';
import { SettingsScreen } from '@/components/screens/SettingsScreen';
import { ProfileScreen } from '@/components/screens/ProfileScreen';
import { ShopScreen } from '@/components/screens/ShopScreen';
import { LevelUpNotification } from '@/components/LevelUpNotification';
import { BattleRewardsPopup } from '@/components/BattleRewardsPopup';
import { useBattle } from '@/hooks/useBattle';
import { useAuth } from '@/hooks/useAuth';
import { useInventory } from '@/hooks/useInventory';
import { Player, GameScreen, FruitFighter, BattleRewards, Rarity } from '@/types/game';
import { calculateLevel } from '@/components/LevelProgress';
import { Loader2 } from 'lucide-react';

// Extended GameScreen type to include profile
type ExtendedGameScreen = GameScreen | 'profile';

// Reward amounts - higher rewards
const VICTORY_THUNDER = 60;
const DEFEAT_THUNDER = 25;
const VICTORY_GEMS = 12;
const DEFEAT_GEMS = 4;

const Index = () => {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading, updateProfile, signOut } = useAuth();
  const { grantStarterFruits, addFighter, getOwnedFighters, refetch: refetchInventory } = useInventory(user?.id ?? null);
  
  const [currentScreen, setCurrentScreen] = useState<ExtendedGameScreen>('lobby');
  const [starterGranted, setStarterGranted] = useState(false);
  const [levelUpNotification, setLevelUpNotification] = useState<number | null>(null);
  const [battleRewards, setBattleRewards] = useState<BattleRewards | null>(null);
  
  const [player, setPlayer] = useState<Player>({
    id: 'player-1',
    name: 'Champion',
    trophies: 0,
    level: 1,
    totalWins: 0,
    thunderPoints: 100,
    gems: 10,
    selectedTeam: [],
    fighters: [],
    avatarUrl: null,
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
        name: profile.name || 'Champion',
        level: profile.level,
        totalWins: profile.total_wins,
        thunderPoints: profile.thunder_points,
        gems: profile.gems,
        avatarUrl: profile.avatar_url,
      }));
    }
  }, [profile]);

  // Grant starter fruits on first login
  useEffect(() => {
    if (user && !starterGranted) {
      grantStarterFruits();
      setStarterGranted(true);
    }
  }, [user, starterGranted, grantStarterFruits]);

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

  const handleStartBattle = useCallback(() => {
    setCurrentScreen('team-select');
  }, []);

  const handleTeamSelected = useCallback((team: FruitFighter[]) => {
    setPlayer(prev => ({
      ...prev,
      selectedTeam: team,
    }));
    startBattle(team, true);
    setCurrentScreen('battle');
  }, [startBattle]);

  const handleNavigate = useCallback((screen: ExtendedGameScreen) => {
    setCurrentScreen(screen);
  }, []);

  const handleProfileUpdate = useCallback(async (updates: { name?: string; avatar_url?: string }) => {
    await updateProfile(updates);
    if (updates.name) {
      setPlayer(prev => ({ ...prev, name: updates.name! }));
    }
    if (updates.avatar_url) {
      setPlayer(prev => ({ ...prev, avatarUrl: updates.avatar_url }));
    }
  }, [updateProfile]);

  const handleVictory = useCallback(async () => {
    const newTotalWins = player.totalWins + 1;
    const oldLevel = player.level;
    const newLevel = calculateLevel(newTotalWins);
    const newThunder = player.thunderPoints + VICTORY_THUNDER;
    const newGems = player.gems + VICTORY_GEMS;
    
    setPlayer(prev => ({
      ...prev,
      totalWins: newTotalWins,
      level: newLevel,
      thunderPoints: newThunder,
      gems: newGems,
    }));

    if (newLevel > oldLevel) {
      setLevelUpNotification(newLevel);
    }

    setBattleRewards({
      thunderPoints: VICTORY_THUNDER,
      gems: VICTORY_GEMS,
      isVictory: true,
    });

    await updateProfile({
      total_wins: newTotalWins,
      level: newLevel,
      thunder_points: newThunder,
      gems: newGems,
    });
  }, [player.totalWins, player.level, player.thunderPoints, player.gems, updateProfile]);

  const handleDefeat = useCallback(async () => {
    const newThunder = player.thunderPoints + DEFEAT_THUNDER;
    const newGems = player.gems + DEFEAT_GEMS;
    
    setPlayer(prev => ({
      ...prev,
      thunderPoints: newThunder,
      gems: newGems,
    }));

    setBattleRewards({
      thunderPoints: DEFEAT_THUNDER,
      gems: DEFEAT_GEMS,
      isVictory: false,
    });

    await updateProfile({
      thunder_points: newThunder,
      gems: newGems,
    });
  }, [player.thunderPoints, player.gems, updateProfile]);

  const handlePurchaseBox = useCallback(async (cost: number, gemsReceived: number, _fruitRarity: Rarity, fighterId?: string) => {
    const newThunder = player.thunderPoints - cost;
    const newGems = player.gems + gemsReceived;
    
    setPlayer(prev => ({
      ...prev,
      thunderPoints: newThunder,
      gems: newGems,
    }));

    // Save fighter to inventory
    if (fighterId) {
      await addFighter(fighterId);
    }

    await updateProfile({
      thunder_points: newThunder,
      gems: newGems,
    });
  }, [player.thunderPoints, player.gems, updateProfile, addFighter]);

  const handleLogout = useCallback(async () => {
    await signOut();
    navigate('/auth', { replace: true });
  }, [signOut, navigate]);

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

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {levelUpNotification !== null && (
        <LevelUpNotification
          newLevel={levelUpNotification}
          onClose={() => setLevelUpNotification(null)}
        />
      )}

      {battleRewards && (
        <BattleRewardsPopup
          rewards={battleRewards}
          onClose={() => setBattleRewards(null)}
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
            onStartBattle={handleStartBattle}
            onAvatarUpdate={async (avatarUrl) => {
              setPlayer(prev => ({ ...prev, avatarUrl }));
              await updateProfile({ avatar_url: avatarUrl });
            }}
          />
        )}
        
        {currentScreen === 'fighters' && (
          <FightersScreen
            onNavigate={handleNavigate}
          />
        )}

        {currentScreen === 'team-select' && (
          <TeamSelectScreen
            onTeamSelected={handleTeamSelected}
            onNavigate={handleNavigate}
            ownedFighterIds={getOwnedFighters().map(f => f.id)}
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
            onDefeat={handleDefeat}
          />
        )}
        
        {currentScreen === 'settings' && (
          <SettingsScreen onNavigate={handleNavigate as (screen: GameScreen) => void} />
        )}

        {currentScreen === 'profile' && (
          <ProfileScreen 
            onNavigate={handleNavigate as (screen: GameScreen) => void}
            profile={profile}
            onProfileUpdate={handleProfileUpdate}
          />
        )}

        {currentScreen === 'shop' && (
          <ShopScreen
            player={player}
            onNavigate={handleNavigate}
            onPurchaseBox={handlePurchaseBox}
          />
        )}
      </div>
    </div>
  );
};

export default Index;
