import { useState, useEffect } from 'react';
import { Fingerprint, Shield, AlertCircle } from 'lucide-react';
import { authenticateWithBiometric } from '../utils/biometric';

interface LockScreenProps {
  onUnlock: () => void;
}

const LockScreen = ({ onUnlock }: LockScreenProps) => {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [showUI, setShowUI] = useState(false);

  const authenticate = async () => {
    setIsAuthenticating(true);
    setError('');
    try {
      const success = await authenticateWithBiometric();
      if (success) {
        onUnlock();
      } else {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        setShowUI(true);
        setError(
          newAttempts >= 3
            ? 'Too many failed attempts. Try again later.'
            : 'Authentication failed. Tap to try again.'
        );
      }
    } catch {
      setShowUI(true);
      setError('Authentication failed. Tap to try again.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Auto-trigger on mount
  useEffect(() => {
    authenticate();
  }, []);

  // Show nothing while the system prompt is showing
  if (!showUI && !error) {
    return (
      <div className="fixed inset-0 bg-gray-950 z-[999]" />
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-950 flex flex-col items-center justify-center z-[999] px-8">
      <div className="mb-12 text-center">
        <div className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-white/20">
          <Shield size={40} className="text-white" />
        </div>
        <h1 className="text-2xl font-bold text-white">SafeSpend</h1>
        <p className="text-gray-400 text-sm mt-1">Authentication required</p>
      </div>

      <button
        onClick={authenticate}
        disabled={isAuthenticating || attempts >= 3}
        className={`w-32 h-32 rounded-full flex flex-col items-center justify-center gap-3 border-2 transition-all ${
          isAuthenticating
            ? 'border-white bg-white/20 scale-95'
            : attempts >= 3
            ? 'border-gray-700 bg-gray-900 opacity-50'
            : 'border-white/50 bg-white/10 active:scale-95'
        }`}
      >
        <Fingerprint
          size={48}
          className={
            isAuthenticating ? 'text-white animate-pulse' : 'text-white'
          }
        />
        <span className="text-white text-xs font-medium">
          {isAuthenticating ? 'Verifying...' : 'Tap to retry'}
        </span>
      </button>

      {error && (
        <div className="mt-8 flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
          <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {attempts > 0 && attempts < 3 && (
        <div className="mt-4 flex gap-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full ${
                i <= attempts ? 'bg-red-400' : 'bg-gray-700'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default LockScreen;
