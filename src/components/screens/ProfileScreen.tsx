import { useState, useRef } from 'react';
import { GameButton } from '@/components/ui/game-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GameScreen } from '@/types/game';
import { ArrowLeft, Camera, Loader2, Save, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface ProfileScreenProps {
  onNavigate: (screen: GameScreen) => void;
  profile: {
    id: string;
    user_id: string;
    name: string;
    level: number;
    total_wins: number;
    avatar_url?: string | null;
  } | null;
  onProfileUpdate: (updates: { name?: string; avatar_url?: string }) => Promise<void>;
}

export const ProfileScreen = ({ onNavigate, profile, onProfileUpdate }: ProfileScreenProps) => {
  const [name, setName] = useState(profile?.name || '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !profile) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload an image file.',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please upload an image smaller than 2MB.',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.user_id}/${Date.now()}.${fileExt}`;

      // Upload file
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      setAvatarUrl(publicUrl);

      // Update profile
      await onProfileUpdate({ avatar_url: publicUrl });

      toast({
        title: 'Avatar updated!',
        description: 'Your new avatar is looking great!',
      });
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: 'Upload failed',
        description: 'Could not upload avatar. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast({
        title: 'Name required',
        description: 'Please enter a display name.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);

    try {
      await onProfileUpdate({ name: name.trim() });
      toast({
        title: 'Profile updated!',
        description: 'Your changes have been saved.',
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Update failed',
        description: 'Could not update profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col p-4 animate-slide-up">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <GameButton variant="ghost" size="icon" onClick={() => onNavigate('settings')}>
          <ArrowLeft className="w-5 h-5" />
        </GameButton>
        <h1 className="font-game-title text-3xl text-glow-orange text-primary">
          PROFILE
        </h1>
      </div>

      {/* Profile Content */}
      <div className="flex-1 max-w-lg mx-auto w-full space-y-6">
        {/* Avatar Section */}
        <div className="flex flex-col items-center gap-4">
          <div 
            className="relative cursor-pointer group"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className={cn(
              "w-28 h-28 rounded-2xl bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center text-5xl border-4 border-primary/50 overflow-hidden",
              uploading && "opacity-50"
            )}>
              {avatarUrl ? (
                <img 
                  src={avatarUrl} 
                  alt="Avatar" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>🎮</span>
              )}
            </div>
            
            {/* Upload overlay */}
            <div className="absolute inset-0 rounded-2xl bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              {uploading ? (
                <Loader2 className="w-8 h-8 animate-spin text-white" />
              ) : (
                <Camera className="w-8 h-8 text-white" />
              )}
            </div>
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarUpload}
            className="hidden"
          />
          
          <p className="text-sm text-muted-foreground">
            Click to upload a custom avatar
          </p>
        </div>

        {/* Name Field */}
        <div className="bg-card/80 backdrop-blur-sm rounded-xl p-6 border border-border space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Display Name
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-muted border-border"
              maxLength={20}
            />
          </div>

          <GameButton
            variant="primary"
            size="lg"
            className="w-full"
            onClick={handleSave}
            disabled={saving || name === profile?.name}
          >
            {saving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Save className="w-5 h-5" />
                Save Changes
              </>
            )}
          </GameButton>
        </div>

        {/* Stats Section */}
        <div className="bg-card/80 backdrop-blur-sm rounded-xl p-6 border border-border">
          <h3 className="font-game-heading text-foreground mb-4">Stats</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-3xl font-game-title text-primary">{profile?.level || 1}</p>
              <p className="text-sm text-muted-foreground">Level</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-3xl font-game-title text-primary">{profile?.total_wins || 0}</p>
              <p className="text-sm text-muted-foreground">Wins</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
