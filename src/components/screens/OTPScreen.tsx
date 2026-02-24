'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ShieldCheck, RefreshCw, Loader2, CheckCircle } from 'lucide-react';
import { useAppStore } from '@/store/app-store';
import { verifyOTP, createUserProfile, onAuthChange } from '@/lib/firebase';
import ar from '@/lib/localization';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function OTPScreen() {
  const { 
    phoneNumber, 
    otpCode, 
    setOtpCode, 
    setScreen, 
    isLoading, 
    setLoading,
    confirmationResult,
    setUser,
    setUserProfile,
    error,
    setError
  } = useAppStore();
  const [countdown, setCountdown] = useState(120);
  const [canResend, setCanResend] = useState(false);
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      if (firebaseUser && verificationSuccess) {
        try {
          // Create or get user profile
          const profile = await createUserProfile(
            firebaseUser.uid, 
            phoneNumber,
            firebaseUser.email || undefined,
            firebaseUser.displayName || undefined,
            firebaseUser.photoURL || undefined
          );
          setUserProfile(profile);
          setUser(firebaseUser);
          
          // Navigate to home
          setTimeout(() => {
            setScreen('home');
          }, 500);
        } catch (err) {
          console.error('Error creating profile:', err);
        }
      }
    });

    return () => unsubscribe();
  }, [verificationSuccess, phoneNumber, setUser, setUserProfile, setScreen]);

  const handleOTPChange = (index: number, value: string) => {
    // Only allow numbers
    const numericValue = value.replace(/\D/g, '');
    
    if (numericValue.length <= 1) {
      const newOtp = otpCode.split('');
      newOtp[index] = numericValue;
      const updatedOtp = newOtp.join('');
      setOtpCode(updatedOtp);
      setError(null);

      // Auto-focus next input
      if (numericValue && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
      
      // Auto-submit when complete
      if (updatedOtp.length === 6 && confirmationResult) {
        setTimeout(() => handleVerify(updatedOtp), 100);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    // Handle backspace
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    setOtpCode(pastedData);
    // Focus the last filled input or the last one
    const focusIndex = Math.min(pastedData.length, 5);
    inputRefs.current[focusIndex]?.focus();
    
    // Auto-submit if complete
    if (pastedData.length === 6 && confirmationResult) {
      setTimeout(() => handleVerify(pastedData), 100);
    }
  };

  const handleVerify = async (code?: string) => {
    const codeToVerify = code || otpCode;
    
    if (codeToVerify.length !== 6) {
      setError(ar.invalidOtp);
      return;
    }

    if (!confirmationResult) {
      setError('يرجى طلب رمز جديد');
      setScreen('login');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const firebaseUser = await verifyOTP(confirmationResult, codeToVerify);
      setUser(firebaseUser);
      setVerificationSuccess(true);
      
      // The auth state listener will handle profile creation and navigation
    } catch (err: any) {
      console.error('OTP verification error:', err);
      
      let errorMessage = ar.invalidOtp;
      if (err.code === 'auth/invalid-verification-code') {
        errorMessage = 'رمز التحقق غير صحيح';
      } else if (err.code === 'auth/code-expired') {
        errorMessage = 'انتهت صلاحية الرمز، اطلب رمزاً جديداً';
        setCanResend(true);
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    setScreen('login');
  };

  const formatPhoneForDisplay = (phone: string) => {
    return `+966 ${phone.slice(0, 2)} ${phone.slice(2, 5)} ${phone.slice(5)}`;
  };

  if (verificationSuccess) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-emerald-50 to-white" dir="rtl">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mb-6"
        >
          <CheckCircle className="w-12 h-12 text-emerald-600" />
        </motion.div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{ar.loginSuccess}</h2>
        <p className="text-gray-500">جاري التوجيه...</p>
        <div className="mt-6">
          <Loader2 className="w-6 h-6 text-emerald-600 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-gradient-to-b from-white to-gray-50" dir="rtl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="safe-area-top"
      >
        <div className="h-14 flex items-center px-4">
          <button 
            onClick={() => setScreen('login')}
            className="p-2 -mr-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowRight className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-semibold text-gray-900 mr-2">{ar.otpTitle}</h1>
        </div>
      </motion.div>

      {/* Content */}
      <div className="flex-1 flex flex-col px-6 pt-6">
        {/* Title Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{ar.otpTitle}</h2>
          <p className="text-gray-500">
            {ar.otpSubtitle}
            <span className="font-semibold text-gray-700 mr-1" dir="ltr">
              {formatPhoneForDisplay(phoneNumber)}
            </span>
          </p>
        </motion.div>

        {/* OTP Input Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          <div className="flex justify-center gap-3" dir="ltr">
            {[0, 1, 2, 3, 4, 5].map((index) => (
              <motion.div
                key={index}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 * index }}
              >
                <Input
                  ref={(el) => { inputRefs.current[index] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={otpCode[index] || ''}
                  onChange={(e) => handleOTPChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  className={`w-12 h-14 text-center text-2xl font-bold rounded-xl border-2 
                    ${error ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-emerald-500'} 
                    transition-colors`}
                  autoFocus={index === 0}
                  disabled={isLoading}
                />
              </motion.div>
            ))}
          </div>

          {/* Error Message */}
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-red-500 text-sm text-center mt-4 bg-red-50 p-3 rounded-lg"
            >
              {error}
            </motion.p>
          )}
        </motion.div>

        {/* Verify Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8"
        >
          <Button
            onClick={() => handleVerify()}
            disabled={otpCode.length !== 6 || isLoading}
            className="w-full h-14 text-lg font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-50 disabled:shadow-none"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>{ar.loading}</span>
              </div>
            ) : (
              ar.verifyButton
            )}
          </Button>
        </motion.div>

        {/* Resend Code */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-6 text-center"
        >
          <p className="text-gray-500 mb-2">{ar.didntReceiveCode}</p>
          
          {canResend ? (
            <Button
              variant="ghost"
              onClick={handleResend}
              className="text-emerald-600 hover:text-emerald-700 font-semibold"
            >
              <RefreshCw className="w-4 h-4 ml-2" />
              {ar.resendCode}
            </Button>
          ) : (
            <p className="text-gray-400">
              ({countdown} ثانية)
            </p>
          )}
        </motion.div>

        {/* Security Badge */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-auto pb-8"
        >
          <div className="flex items-center justify-center gap-2 text-gray-400">
            <ShieldCheck className="w-5 h-5" />
            <span className="text-sm">رمز التحقق صالح لمدة دقيقتين</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
