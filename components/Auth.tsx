
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { Lock, ShieldCheck, Delete, ArrowRight } from 'lucide-react';

interface AuthProps {
  onLogin: (user: User) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [pin, setPin] = useState('');
  const [storedPin, setStoredPin] = useState<string | null>(null);
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState<'verify' | 'create' | 'confirm'>('verify');
  const [error, setError] = useState(false);

  useEffect(() => {
    const savedPin = localStorage.getItem('financeplus_pin');
    if (!savedPin) {
      setStep('create');
    } else {
      setStoredPin(savedPin);
      setStep('verify');
    }
  }, []);

  const handleKeyPress = (num: string) => {
    setError(false);
    if (pin.length < 6) {
      setPin(prev => prev + num);
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
  };

  const validate = () => {
    if (step === 'create') {
      if (pin.length < 4) {
        setError(true);
        return;
      }
      setConfirmPin(pin);
      setPin('');
      setStep('confirm');
    } else if (step === 'confirm') {
      if (pin === confirmPin) {
        localStorage.setItem('financeplus_pin', pin);
        completeAuth();
      } else {
        setError(true);
        setPin('');
        setStep('create');
      }
    } else if (step === 'verify') {
      if (pin === storedPin) {
        completeAuth();
      } else {
        setError(true);
        setPin('');
      }
    }
  };

  const completeAuth = () => {
    const user: User = {
      id: 'local-user',
      email: 'local@financeplus.xof',
      name: 'Utilisateur Principal'
    };
    localStorage.setItem('financeplus_auth', JSON.stringify(user));
    onLogin(user);
  };

  useEffect(() => {
    // Auto-validate for 6 digits, or manual for 4+
    if (pin.length === 6) {
      validate();
    }
  }, [pin]);

  const numpad = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'delete'];

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <div className="mb-12">
          <div className="inline-flex p-4 bg-indigo-600 text-white rounded-3xl mb-6 shadow-2xl shadow-indigo-500/20">
            <Lock size={32} />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            {step === 'create' && 'Créer votre code PIN'}
            {step === 'confirm' && 'Confirmer le code PIN'}
            {step === 'verify' && 'Entrez votre code PIN'}
          </h1>
          <p className="text-slate-300 font-medium">
            {step === 'create' && 'Choisissez un code de 4 à 6 chiffres'}
            {step === 'confirm' && 'Saisissez-le à nouveau'}
            {step === 'verify' && 'Sécurisez votre accès financier'}
          </p>
        </div>

        <div className="flex justify-center gap-4 mb-12">
          {[...Array(6)].map((_, i) => (
            <div 
              key={i}
              className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                i < pin.length 
                  ? 'bg-indigo-400 border-indigo-400 scale-110' 
                  : 'border-slate-700'
              } ${error ? 'bg-rose-500 border-rose-500 animate-bounce' : ''}`}
            />
          ))}
        </div>

        {error && (
          <p className="text-rose-400 text-sm font-bold mb-6 animate-pulse">
            {step === 'confirm' ? 'Les codes ne correspondent pas' : 'Code PIN incorrect'}
          </p>
        )}

        <div className="grid grid-cols-3 gap-6 mb-8">
          {numpad.map((btn, i) => (
            btn === '' ? <div key={i} /> : (
              <button
                key={i}
                onClick={() => btn === 'delete' ? handleDelete() : handleKeyPress(btn)}
                className={`flex items-center justify-center h-16 rounded-2xl text-2xl font-bold transition-all active:scale-90 ${
                  btn === 'delete' 
                    ? 'text-slate-300 hover:text-white' 
                    : 'bg-slate-800 text-white hover:bg-slate-700 shadow-lg'
                }`}
              >
                {btn === 'delete' ? <Delete size={24} /> : btn}
              </button>
            )
          ))}
        </div>

        {pin.length >= 4 && pin.length < 6 && (
          <button 
            onClick={validate}
            className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/20"
          >
            Continuer <ArrowRight size={20} />
          </button>
        )}
      </div>
    </div>
  );
};

export default Auth;
