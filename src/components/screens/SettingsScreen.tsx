import { useState } from 'react';
import { GameButton } from '@/components/ui/game-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GameScreen } from '@/types/game';
import { ArrowLeft, Volume2, VolumeX, Music, Vibrate, Bell, Info, User, Lock, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface SettingsScreenProps {
  onNavigate: (screen: GameScreen) => void;
  userId?: string;
}

interface ToggleSettingProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
}

const ToggleSetting = ({ icon, label, description, enabled, onToggle }: ToggleSettingProps) => (
  <div 
    onClick={onToggle}
    className="flex items-center gap-4 bg-card/80 backdrop-blur-sm rounded-xl p-4 border border-border cursor-pointer hover:border-primary/50 transition-all"
  >
    <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center text-primary">
      {icon}
    </div>
    <div className="flex-1">
      <h3 className="font-game-heading text-foreground">{label}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
    <div className={cn(
      'w-14 h-8 rounded-full transition-all flex items-center px-1',
      enabled ? 'bg-primary' : 'bg-muted'
    )}>
      <div className={cn(
        'w-6 h-6 rounded-full bg-foreground transition-transform',
        enabled ? 'translate-x-6' : 'translate-x-0'
      )} />
    </div>
  </div>
);

export const SettingsScreen = ({ onNavigate, userId }: SettingsScreenProps) => {
  const [settings, setSettings] = useState({
    sound: true,
    music: true,
    vibration: true,
    notifications: false,
  });
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toast({ title: 'Password too short', description: 'Must be at least 6 characters', variant: 'destructive' });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: 'Passwords don\'t match', variant: 'destructive' });
      return;
    }
    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setNewPassword('');
      setConfirmPassword('');
      toast({ title: 'Password changed!', description: 'Your password has been updated.' });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to change password';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    }
    setChangingPassword(false);
  };

  return (
    <div className="min-h-screen flex flex-col p-4 animate-slide-up">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <GameButton variant="ghost" size="icon" onClick={() => onNavigate('lobby')}>
          <ArrowLeft className="w-5 h-5" />
        </GameButton>
        <h1 className="font-game-title text-3xl text-glow-orange text-primary">
          SETTINGS
        </h1>
      </div>

      {/* Settings List */}
      <div className="flex-1 space-y-4 max-w-lg mx-auto w-full">
        {/* Profile Button */}
        <div 
          onClick={() => onNavigate('profile')}
          className="flex items-center gap-4 bg-gradient-to-r from-primary/20 to-orange-600/20 rounded-xl p-4 border border-primary/50 cursor-pointer hover:border-primary transition-all"
        >
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-primary-foreground">
            <User className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-game-heading text-foreground">Edit Profile</h3>
            <p className="text-sm text-muted-foreground">Change your name and avatar</p>
          </div>
        </div>

        <ToggleSetting
          icon={settings.sound ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
          label="Sound Effects"
          description="Enable battle sounds and effects"
          enabled={settings.sound}
          onToggle={() => toggleSetting('sound')}
        />

        <ToggleSetting
          icon={<Music className="w-6 h-6" />}
          label="Background Music"
          description="Play music during gameplay"
          enabled={settings.music}
          onToggle={() => toggleSetting('music')}
        />

        <ToggleSetting
          icon={<Vibrate className="w-6 h-6" />}
          label="Vibration"
          description="Haptic feedback on actions"
          enabled={settings.vibration}
          onToggle={() => toggleSetting('vibration')}
        />

        <ToggleSetting
          icon={<Bell className="w-6 h-6" />}
          label="Notifications"
          description="Get notified about challenges"
          enabled={settings.notifications}
          onToggle={() => toggleSetting('notifications')}
        />

        {/* Change Password */}
        <div className="bg-card/80 backdrop-blur-sm rounded-xl p-6 border border-border space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <Lock className="w-5 h-5 text-primary" />
            <h3 className="font-game-heading text-foreground">Change Password</h3>
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password">New Password</Label>
            <Input
              id="new-password"
              type="password"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="bg-muted border-border"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm Password</Label>
            <Input
              id="confirm-password"
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="bg-muted border-border"
            />
          </div>
          <GameButton
            variant="primary"
            size="lg"
            className="w-full"
            onClick={handleChangePassword}
            disabled={changingPassword || !newPassword || !confirmPassword}
          >
            {changingPassword ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Update Password'}
          </GameButton>
        </div>

        {/* About Section */}
        <div className="mt-8 bg-card/80 backdrop-blur-sm rounded-xl p-6 border border-border">
          <div className="flex items-center gap-3 mb-4">
            <Info className="w-5 h-5 text-primary" />
            <h3 className="font-game-heading text-foreground">About</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Fruit Clash is an epic battle game featuring fruit-powered warriors. 
            Choose your fighter and dominate the arena!
          </p>
          <p className="text-xs text-muted-foreground">
            Version 1.0.0 • Made with 💜
          </p>
        </div>
      </div>
    </div>
  );
};
