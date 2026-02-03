import { WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useEffect } from 'react';

const Offline = () => {
  const isOnline = useNetworkStatus();

  useEffect(() => {
    if (isOnline) {
      window.location.reload();
    }
  }, [isOnline]);

  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-primary flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-8">
        {/* Icon Container */}
        <div className="relative mx-auto w-32 h-32">
          <div className="absolute inset-0 bg-white/20 rounded-full animate-pulse" />
          <div className="absolute inset-4 bg-white/30 rounded-full flex items-center justify-center">
            <WifiOff className="w-16 h-16 text-white" strokeWidth={1.5} />
          </div>
        </div>

        {/* Text Content */}
        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-white">
            You're Offline
          </h1>
          <p className="text-lg text-white/80">
            It seems you've lost your internet connection. Please check your network settings and try again.
          </p>
        </div>

        {/* Retry Button */}
        <Button
          onClick={handleRetry}
          size="lg"
          className="bg-white text-primary hover:bg-white/90 font-semibold px-8 py-6 text-lg shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5"
        >
          <RefreshCw className="w-5 h-5 mr-2" />
          Try Again
        </Button>

        {/* Helper Text */}
        <p className="text-sm text-white/60">
          The page will automatically refresh when you're back online.
        </p>
      </div>
    </div>
  );
};

export default Offline;
