import React, { useState, useEffect } from 'react';
import { Card, Button } from '../ui/brutalist';
import { X, Download, Smartphone, Share2, Plus } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const InstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Detect device
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
    const isIOSDevice = /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;
    const isAndroidDevice = /android/i.test(userAgent);

    setIsIOS(isIOSDevice);
    setIsAndroid(isAndroidDevice);

    // Check if dismissed from localStorage
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      setIsDismissed(true);
      return;
    }

    // Listen for beforeinstallprompt event (Android)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setIsInstalled(true);
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  const handleShowIOSInstructions = () => {
    setShowIOSInstructions(true);
  };

  // Don't show if installed or dismissed
  if (isInstalled || isDismissed) return null;

  // Android Install Prompt
  if (isAndroid && deferredPrompt) {
    return (
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-in slide-in-from-bottom-4">
        <Card className="border-4 border-black shadow-[8px_8px_0px_0px_#000] bg-[#4F46E5] text-white p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 bg-white p-2 border-2 border-black">
              <Download className="w-6 h-6 text-[#4F46E5]" />
            </div>
            <div className="flex-1">
              <h3 className="font-black text-lg mb-1">Install Aplikasi</h3>
              <p className="font-bold text-sm mb-3 opacity-90">
                Install aplikasi untuk akses lebih cepat dan bisa digunakan offline!
              </p>
              <div className="flex gap-2">
                <Button
                  variant="primary"
                  onClick={handleInstall}
                  className="flex-1 bg-white text-[#4F46E5] hover:bg-gray-100 flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Install
                </Button>
                <Button
                  variant="outline"
                  onClick={handleDismiss}
                  className="border-white text-white hover:bg-white/20"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // iOS Install Instructions
  if (isIOS && !showIOSInstructions) {
    return (
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-in slide-in-from-bottom-4">
        <Card className="border-4 border-black shadow-[8px_8px_0px_0px_#000] bg-[#51CF66] text-black p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 bg-white p-2 border-2 border-black">
              <Smartphone className="w-6 h-6 text-[#51CF66]" />
            </div>
            <div className="flex-1">
              <h3 className="font-black text-lg mb-1">Install Aplikasi</h3>
              <p className="font-bold text-sm mb-3">
                Install aplikasi untuk akses lebih cepat!
              </p>
              <Button
                variant="primary"
                onClick={handleShowIOSInstructions}
                className="w-full bg-black text-white hover:bg-gray-800 flex items-center justify-center gap-2 mb-2"
              >
                <Share2 className="w-4 h-4" />
                Lihat Cara Install
              </Button>
              <Button
                variant="outline"
                onClick={handleDismiss}
                className="w-full border-black text-black hover:bg-black/10"
              >
                <X className="w-4 h-4 inline mr-2" />
                Tutup
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // iOS Detailed Instructions
  if (isIOS && showIOSInstructions) {
    return (
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-in slide-in-from-bottom-4">
        <Card className="border-4 border-black shadow-[8px_8px_0px_0px_#000] bg-[#51CF66] text-black p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 bg-white p-2 border-2 border-black">
              <Share2 className="w-6 h-6 text-[#51CF66]" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-black text-lg">Cara Install di iOS</h3>
                <Button
                  variant="outline"
                  onClick={handleDismiss}
                  className="border-black text-black hover:bg-black/10 p-1"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <ol className="text-sm font-bold space-y-2 mb-3 list-decimal list-inside">
                <li>Tap tombol <strong>Share</strong> <Share2 className="w-4 h-4 inline" /> di browser (bawah tengah)</li>
                <li>Scroll ke bawah, pilih <strong>"Add to Home Screen"</strong> <Plus className="w-4 h-4 inline" /></li>
                <li>Tap <strong>"Add"</strong> di pojok kanan atas</li>
                <li>Selesai! Aplikasi akan muncul di home screen</li>
              </ol>
              <Button
                variant="outline"
                onClick={() => setShowIOSInstructions(false)}
                className="w-full border-black text-black hover:bg-black/10"
              >
                Kembali
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return null;
};

