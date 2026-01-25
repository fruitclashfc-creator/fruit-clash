import { GameButton } from '@/components/ui/game-button';
import { GameScreen } from '@/types/game';
import { ArrowLeft, Users, Loader2, RefreshCw, Swords, X, Check, Clock } from 'lucide-react';
import { useGameInvitations } from '@/hooks/useGameInvitations';

interface OnlinePlayer {
  id: string;
  user_id: string;
  name: string;
  level: number;
  last_seen: string;
}

interface MultiplayerScreenProps {
  onNavigate: (screen: GameScreen) => void;
  onStartMultiplayerMatch: (opponentId: string, opponentName: string) => void;
  onlinePlayers: OnlinePlayer[];
  playersLoading: boolean;
  refreshPlayers: () => void;
}

export const MultiplayerScreen = ({ 
  onNavigate, 
  onStartMultiplayerMatch,
  onlinePlayers,
  playersLoading,
  refreshPlayers,
}: MultiplayerScreenProps) => {
  const { 
    pendingInvitations, 
    sentInvitations,
    acceptedInvitation,
    loading: invitationsLoading,
    sendInvitation,
    acceptInvitation,
    declineInvitation,
    cancelInvitation,
    clearAcceptedInvitation,
  } = useGameInvitations();

  // Handle when an invitation is accepted (either by us or opponent)
  if (acceptedInvitation) {
    // Start the match
    const isFromUs = sentInvitations.some(inv => inv.id === acceptedInvitation.id);
    const opponentId = isFromUs ? acceptedInvitation.to_user_id : acceptedInvitation.from_user_id;
    const opponentName = isFromUs ? acceptedInvitation.to_user_name : acceptedInvitation.from_user_name;
    
    // Clear and navigate
    clearAcceptedInvitation();
    onStartMultiplayerMatch(opponentId, opponentName);
    return null;
  }

  const handleInvite = async (userId: string, userName: string) => {
    await sendInvitation(userId, userName);
  };

  const handleAccept = async (invitationId: string) => {
    const result = await acceptInvitation(invitationId);
    if (result) {
      onStartMultiplayerMatch(result.from_user_id, result.from_user_name);
    }
  };

  const isInvitedAlready = (userId: string) => {
    return sentInvitations.some(inv => inv.to_user_id === userId);
  };

  return (
    <div className="min-h-screen flex flex-col p-4 animate-slide-up">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <GameButton variant="ghost" size="icon" onClick={() => onNavigate('mode-select')}>
          <ArrowLeft className="w-5 h-5" />
        </GameButton>
        <h1 className="font-game-title text-3xl text-glow-orange text-primary">
          MULTIPLAYER
        </h1>
        <GameButton 
          variant="ghost" 
          size="icon" 
          onClick={refreshPlayers}
          className="ml-auto"
        >
          <RefreshCw className={`w-5 h-5 ${playersLoading ? 'animate-spin' : ''}`} />
        </GameButton>
      </div>

      {/* Pending Invitations Section */}
      {pendingInvitations.length > 0 && (
        <div className="mb-6">
          <h2 className="font-game-heading text-lg text-foreground mb-3 flex items-center gap-2">
            <Swords className="w-5 h-5 text-primary" />
            Battle Invitations
          </h2>
          <div className="space-y-3">
            {pendingInvitations.map((invitation) => (
              <div 
                key={invitation.id}
                className="bg-gradient-to-r from-primary/20 to-orange-600/20 rounded-xl p-4 border border-primary/50 animate-pulse-glow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center text-lg">
                      ⚔️
                    </div>
                    <div>
                      <p className="font-game-heading text-foreground">
                        {invitation.from_user_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        wants to battle you!
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <GameButton 
                      variant="primary" 
                      size="sm"
                      onClick={() => handleAccept(invitation.id)}
                      disabled={invitationsLoading}
                    >
                      <Check className="w-4 h-4" />
                      Accept
                    </GameButton>
                    <GameButton 
                      variant="ghost" 
                      size="sm"
                      onClick={() => declineInvitation(invitation.id)}
                      disabled={invitationsLoading}
                    >
                      <X className="w-4 h-4" />
                    </GameButton>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sent Invitations Section */}
      {sentInvitations.length > 0 && (
        <div className="mb-6">
          <h2 className="font-game-heading text-lg text-muted-foreground mb-3 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Waiting for response...
          </h2>
          <div className="space-y-2">
            {sentInvitations.map((invitation) => (
              <div 
                key={invitation.id}
                className="bg-card/60 rounded-xl p-3 border border-border flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Invited <span className="text-foreground font-semibold">{invitation.to_user_name}</span>
                  </span>
                </div>
                <GameButton 
                  variant="ghost" 
                  size="sm"
                  onClick={() => cancelInvitation(invitation.id)}
                  disabled={invitationsLoading}
                >
                  <X className="w-4 h-4" />
                  Cancel
                </GameButton>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Online Players Section */}
      <div className="flex-1">
        <h2 className="font-game-heading text-lg text-foreground mb-3 flex items-center gap-2">
          <Users className="w-5 h-5 text-secondary" />
          Online Players
          <span className="text-sm text-muted-foreground">({onlinePlayers.length})</span>
        </h2>

        {playersLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : onlinePlayers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-4">
              <Users className="w-10 h-10 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground font-game-heading text-lg mb-2">
              No one is online at the moment
            </p>
            <p className="text-sm text-muted-foreground max-w-xs">
              Try again later or play against the bot in the meantime!
            </p>
            <GameButton 
              variant="accent" 
              size="lg"
              className="mt-6"
              onClick={() => onNavigate('mode-select')}
            >
              Play VS Bot
            </GameButton>
          </div>
        ) : (
          <div className="space-y-3">
            {onlinePlayers.map((player) => (
              <div 
                key={player.id}
                className="group bg-card/80 backdrop-blur-sm rounded-xl p-4 border border-border hover:border-secondary transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-secondary to-purple-800 flex items-center justify-center text-xl">
                        🎮
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-game-health border-2 border-background animate-pulse" />
                    </div>
                    <div>
                      <p className="font-game-heading text-foreground">
                        {player.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Level {player.level}
                      </p>
                    </div>
                  </div>
                  
                  {isInvitedAlready(player.user_id) ? (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Invited
                    </span>
                  ) : (
                    <GameButton 
                      variant="secondary" 
                      size="sm"
                      onClick={() => handleInvite(player.user_id, player.name)}
                      disabled={invitationsLoading}
                    >
                      <Swords className="w-4 h-4" />
                      Challenge
                    </GameButton>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
