"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PageTransition from '@/components/animations/PageTransition';
import SmoothLink from '@/components/animations/SmoothLink';
import { Smartphone } from 'lucide-react';
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';
import { firebaseAuth } from '@/lib/firebase/client';
import { createCustomerProfileIfMissing } from '@/lib/firebase/authService';
import { useAuth } from '@/components/providers/AuthProvider';

export default function PhoneAuthPage() {
  const router = useRouter();
  const { refreshProfile } = useAuth();
  
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  // Initialize reCAPTCHA when the component mounts
  useEffect(() => {
    if (!(window as any).recaptchaVerifier) {
      (window as any).recaptchaVerifier = new RecaptchaVerifier(firebaseAuth, 'recaptcha-container', {
        'size': 'invisible',
        'callback': () => {
          // reCAPTCHA solved, allow signInWithPhoneNumber.
        }
      });
    }
  }, []);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Ensure the phone number has a '+' for the country code
      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber.replace(/\D/g, '')}`;
      
      const appVerifier = (window as any).recaptchaVerifier;
      const confirmation = await signInWithPhoneNumber(firebaseAuth, formattedPhone, appVerifier);
      
      setConfirmationResult(confirmation);
      setStep(2);
    } catch (err: any) {
      console.error("SMS Error:", err);
      setError(err.message || "Failed to send SMS code. Make sure you include the country code (e.g., +1 or +61).");
      
      // Reset reCAPTCHA if it fails so the user can try again
      if ((window as any).recaptchaVerifier) {
        (window as any).recaptchaVerifier.render().then((widgetId: any) => {
          (window as any).grecaptcha.reset(widgetId);
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmationResult) return;
    
    setError(null);
    setLoading(true);

    try {
      const result = await confirmationResult.confirm(verificationCode);
      
      // If this is a new phone user, generate a Firestore profile for them
      await createCustomerProfileIfMissing(result.user, "Phone User");
      await refreshProfile();
      
      router.push('/store');
    } catch (err: any) {
      console.error("Verification Error:", err);
      setError("Invalid verification code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition>
      <div className="min-h-[70vh] flex items-center justify-center py-12 px-4">
        <div className="glass-panel max-w-md w-full p-8 rounded-3xl border border-white/10 shadow-2xl">
          <div className="flex flex-col items-center mb-6">
            <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center mb-4 border border-blue-500/30">
              <Smartphone className="text-blue-500 w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black text-white">Phone Sign-In</h2>
          </div>

          {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-sm text-center">{error}</div>}

          {/* This div is required by Firebase to anchor the invisible reCAPTCHA */}
          <div id="recaptcha-container"></div>

          {step === 1 ? (
            <form onSubmit={handleSendCode} className="space-y-4">
              <p className="text-slate-400 text-sm text-center mb-4">Enter your phone number including the country code.</p>
              <div>
                <input
                  type="tel"
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-blue-500 outline-none transition-colors"
                  placeholder="+61 400 000 000"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-500 transition disabled:opacity-50"
              >
                {loading ? "Sending..." : "Send SMS Code"}
              </button>
            </form>
          ) : (
             <form onSubmit={handleVerifyCode} className="space-y-4">
              <p className="text-slate-400 text-sm text-center mb-4">Enter the 6-digit code sent to <span className="text-white font-bold">{phoneNumber}</span></p>
              <div>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))} // Only allow numbers
                  className="w-full bg-black/50 border border-white/10 rounded-xl py-3 px-4 text-white text-center text-2xl tracking-widest focus:border-blue-500 outline-none transition-colors"
                  placeholder="000000"
                />
              </div>
              <button
                type="submit"
                disabled={loading || verificationCode.length !== 6}
                className="w-full bg-success text-white font-bold py-3 rounded-xl hover:bg-green-500 transition disabled:opacity-50"
              >
                {loading ? "Verifying..." : "Verify & Sign In"}
              </button>
              <button
                type="button"
                onClick={() => { setStep(1); setVerificationCode(''); }}
                className="w-full text-slate-400 text-sm hover:text-white transition mt-2"
              >
                Use a different number
              </button>
            </form>
          )}

          <div className="mt-8 text-center">
            <SmoothLink href="/login" className="text-blue-400 hover:text-blue-300 font-medium text-sm">
              &larr; Back to Login options
            </SmoothLink>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}