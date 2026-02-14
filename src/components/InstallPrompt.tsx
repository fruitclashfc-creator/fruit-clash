import { useState, useEffect } from 'react';
import { GameButton } from '@/components/ui/game-button';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (!deferredPrompt || dismissed) return null;

  const handleInstall = async () => {
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 animate-slide-up">
      <div className="bg-card/95 backdrop-blur-md rounded-2xl p-4 border border-primary/50 box-glow-orange max-w-md mx-auto flex items-center gap-3">
        <Download className="w-6 h-6 text-primary shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-game-heading text-sm text-foreground">Install Fruit Clash</p>
          <p className="text-xs text-muted-foreground">Play anytime, even offline!</p>
        </div>
        <GameButton variant="primary" size="sm" onClick={handleInstall}>
          Install
        </GameButton>
        <button onClick={() => setDismissed(true)} className="text-muted-foreground hover:text-foreground">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
