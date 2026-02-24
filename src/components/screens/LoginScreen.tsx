'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Mail, Chrome, Shield, Loader2, ChevronLeft, User } from 'lucide-react';
import { useAppStore } from '@/store/app-store';
import { sendOTP, signInWithGoogle, signInWithEmail, signUpWithEmail } from '@/lib/firebase';
import ar from '@/lib/localization';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type AuthView = 'main' | 'phone' | 'email' | 'register';

export default function LoginScreen() {
  const { 
    phoneNumber, setPhoneNumber, 
    email, setEmail,
    password, setPassword,
    displayName, setDisplayName,
    setScreen, isLoading, setLoading, 
    setConfirmationResult, setError, error,
    authMethod, setAuthMethod,
    setUser, setUserProfile
  } = useAppStore();
  
  const [localError, setLocalError] = useState<string | null>(null);
  const [view, setView] = useState<AuthView>('main');

  const validatePhoneNumber = (phone: string): boolean => {
    const saudiPhoneRegex = /^5[0-9]{8}$/;
    return saudiPhoneRegex.test(phone);
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string): boolean => {
    return password.length >= 6;
  };

  // Phone OTP
  const handlePhoneSubmit = async () => {
    setLocalError(null);
    setError(null);
    
    if (!validatePhoneNumber(phoneNumber)) {
      setLocalError(ar.invalidPhone);
      return;
    }

    setLoading(true);
    
    try {
      const confirmationResult = await sendOTP(phoneNumber, 'submit-btn');
      setConfirmationResult(confirmationResult);
      setScreen('otp');
    } catch (err: any) {
      console.error('Login error:', err);
      
      let errorMessage = ar.networkError;
      if (err.code === 'auth/invalid-phone-number') {
        errorMessage = ar.invalidPhone;
      } else if (err.code === 'auth/too-many-requests') {
        errorMessage = 'تم تجاوز عدد المحاولات، حاول لاحقاً';
      }
      
      setLocalError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Email Sign In
  const handleEmailSignIn = async () => {
    setLocalError(null);
    setError(null);
    
    if (!validateEmail(email)) {
      setLocalError('البريد الإلكتروني غير صحيح');
      return;
    }
    
    if (!validatePassword(password)) {
      setLocalError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }

    setLoading(true);
    
    try {
      const firebaseUser = await signInWithEmail(email, password);
      setUser(firebaseUser);
      setScreen('home');
    } catch (err: any) {
      console.error('Email sign in error:', err);
      
      let errorMessage = ar.networkError;
      if (err.code === 'auth/user-not-found') {
        errorMessage = 'لم يتم العثور على حساب بهذا البريد';
      } else if (err.code === 'auth/wrong-password') {
        errorMessage = 'كلمة المرور غير صحيحة';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'البريد الإلكتروني غير صحيح';
      }
      
      setLocalError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Email Sign Up
  const handleEmailSignUp = async () => {
    setLocalError(null);
    setError(null);
    
    if (!validateEmail(email)) {
      setLocalError('البريد الإلكتروني غير صحيح');
      return;
    }
    
    if (!validatePassword(password)) {
      setLocalError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }
    
    if (!displayName.trim()) {
      setLocalError('يرجى إدخال الاسم');
      return;
    }

    setLoading(true);
    
    try {
      const firebaseUser = await signUpWithEmail(email, password, displayName);
      setUser(firebaseUser);
      setScreen('home');
    } catch (err: any) {
      console.error('Sign up error:', err);
      
      let errorMessage = ar.networkError;
      if (err.code === 'auth/email-already-in-use') {
        errorMessage = 'البريد الإلكتروني مستخدم بالفعل';
      } else if (err.code === 'auth/weak-password') {
        errorMessage = 'كلمة المرور ضعيفة جداً';
      }
      
      setLocalError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Google Sign In
  const handleGoogleSignIn = async () => {
    setLocalError(null);
    setError(null);
    setLoading(true);
    
    try {
      const firebaseUser = await signInWithGoogle();
      setUser(firebaseUser);
      setScreen('home');
    } catch (err: any) {
      console.error('Google sign in error:', err);
      
      let errorMessage = ar.networkError;
      if (err.code === 'auth/popup-closed-by-user') {
        errorMessage = 'تم إلغاء تسجيل الدخول';
      }
      
      setLocalError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneChange = (value: string) => {
    const numericValue = value.replace(/\D/g, '');
    if (numericValue.length <= 9) {
      setPhoneNumber(numericValue);
      setLocalError(null);
    }
  };

  const displayError = localError || error;

  // Main Login View
  const MainView = () => (
    <div className="flex flex-col gap-4">
      {/* Google Sign In */}
      <Button
        onClick={handleGoogleSignIn}
        disabled={isLoading}
        variant="outline"
        className="w-full h-14 text-lg font-medium border-2 border-gray-200 hover:border-gray-300 rounded-xl flex items-center justify-center gap-3"
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>
            <Chrome className="w-6 h-6 text-blue-500" />
            <span>المتابعة بحساب قوقل</span>
          </>
        )}
      </Button>

      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200"></div>
        </div>
        <div className="relative flex justify-center">
          <span className="bg-white px-4 text-gray-500 text-sm">أو</span>
        </div>
      </div>

      {/* Phone Sign In */}
      <Button
        onClick={() => setView('phone')}
        variant="outline"
        className="w-full h-14 text-lg font-medium border-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50 rounded-xl flex items-center justify-center gap-3"
      >
        <Phone className="w-6 h-6" />
        <span>تسجيل برقم الجوال</span>
      </Button>

      {/* Email Sign In */}
      <Button
        onClick={() => setView('email')}
        variant="outline"
        className="w-full h-14 text-lg font-medium border-2 border-blue-200 text-blue-700 hover:bg-blue-50 rounded-xl flex items-center justify-center gap-3"
      >
        <Mail className="w-6 h-6" />
        <span>تسجيل بالبريد الإلكتروني</span>
      </Button>
    </div>
  );

  // Phone Login View
  const PhoneView = () => (
    <div className="space-y-4">
      <Label htmlFor="phone" className="text-base font-medium text-gray-700">
        {ar.phoneNumberLabel}
      </Label>
      
      <div className="flex gap-2">
        <div className="flex items-center justify-center px-4 py-3 bg-gray-100 rounded-xl border border-gray-200 min-w-[100px]">
          <span className="text-lg font-medium text-gray-600">🇸🇦 +966</span>
        </div>
        
        <div className="flex-1 relative">
          <Input
            id="phone"
            type="tel"
            value={phoneNumber}
            onChange={(e) => handlePhoneChange(e.target.value)}
            placeholder={ar.phoneNumberPlaceholder}
            className={`h-14 text-lg rounded-xl border-2 ${displayError ? 'border-red-400' : 'border-gray-200 focus:border-emerald-500'}`}
            maxLength={9}
            dir="ltr"
            disabled={isLoading}
          />
          {phoneNumber.length > 0 && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2">
              <Phone className="w-5 h-5 text-gray-400" />
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <span className={`text-sm ${phoneNumber.length === 9 ? 'text-emerald-600' : 'text-gray-400'}`}>
          {phoneNumber.length}/9
        </span>
      </div>

      <Button
        id="submit-btn"
        onClick={handlePhoneSubmit}
        disabled={phoneNumber.length < 9 || isLoading}
        className="w-full h-14 text-lg font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-lg"
      >
        {isLoading ? (
          <div className="flex items-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>جاري الإرسال...</span>
          </div>
        ) : (
          ar.continueButton
        )}
      </Button>
    </div>
  );

  // Email Login View
  const EmailView = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email" className="text-base font-medium text-gray-700">
          البريد الإلكتروني
        </Label>
        <div className="relative">
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setLocalError(null); }}
            placeholder="example@email.com"
            className={`h-14 text-lg rounded-xl border-2 pr-10 ${displayError ? 'border-red-400' : 'border-gray-200 focus:border-blue-500'}`}
            dir="ltr"
            disabled={isLoading}
          />
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="text-base font-medium text-gray-700">
          كلمة المرور
        </Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => { setPassword(e.target.value); setLocalError(null); }}
          placeholder="••••••••"
          className={`h-14 text-lg rounded-xl border-2 ${displayError ? 'border-red-400' : 'border-gray-200 focus:border-blue-500'}`}
          dir="ltr"
          disabled={isLoading}
        />
      </div>

      <Button
        onClick={handleEmailSignIn}
        disabled={!email || !password || isLoading}
        className="w-full h-14 text-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg"
      >
        {isLoading ? (
          <div className="flex items-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>جاري تسجيل الدخول...</span>
          </div>
        ) : (
          'تسجيل الدخول'
        )}
      </Button>

      <div className="text-center">
        <button 
          onClick={() => setView('register')}
          className="text-blue-600 hover:underline text-sm"
        >
          ليس لديك حساب؟ سجل الآن
        </button>
      </div>
    </div>
  );

  // Register View
  const RegisterView = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="displayName" className="text-base font-medium text-gray-700">
          الاسم
        </Label>
        <div className="relative">
          <Input
            id="displayName"
            type="text"
            value={displayName}
            onChange={(e) => { setDisplayName(e.target.value); setLocalError(null); }}
            placeholder="أدخل اسمك"
            className={`h-14 text-lg rounded-xl border-2 pr-10 ${displayError ? 'border-red-400' : 'border-gray-200 focus:border-emerald-500'}`}
            disabled={isLoading}
          />
          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="registerEmail" className="text-base font-medium text-gray-700">
          البريد الإلكتروني
        </Label>
        <div className="relative">
          <Input
            id="registerEmail"
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setLocalError(null); }}
            placeholder="example@email.com"
            className={`h-14 text-lg rounded-xl border-2 pr-10 ${displayError ? 'border-red-400' : 'border-gray-200 focus:border-emerald-500'}`}
            dir="ltr"
            disabled={isLoading}
          />
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="registerPassword" className="text-base font-medium text-gray-700">
          كلمة المرور
        </Label>
        <Input
          id="registerPassword"
          type="password"
          value={password}
          onChange={(e) => { setPassword(e.target.value); setLocalError(null); }}
          placeholder="••••••••"
          className={`h-14 text-lg rounded-xl border-2 ${displayError ? 'border-red-400' : 'border-gray-200 focus:border-emerald-500'}`}
          dir="ltr"
          disabled={isLoading}
        />
        <p className="text-xs text-gray-500">يجب أن تكون 6 أحرف على الأقل</p>
      </div>

      <Button
        onClick={handleEmailSignUp}
        disabled={!email || !password || !displayName || isLoading}
        className="w-full h-14 text-lg font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-lg"
      >
        {isLoading ? (
          <div className="flex items-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>جاري إنشاء الحساب...</span>
          </div>
        ) : (
          'إنشاء حساب'
        )}
      </Button>

      <div className="text-center">
        <button 
          onClick={() => setView('email')}
          className="text-blue-600 hover:underline text-sm"
        >
          لديك حساب بالفعل؟ سجل الدخول
        </button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 flex flex-col bg-gradient-to-b from-white to-gray-50" dir="rtl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="safe-area-top"
      >
        <div className="h-14 flex items-center px-4">
          {view !== 'main' && (
            <button 
              onClick={() => setView('main')}
              className="p-2 -mr-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ChevronLeft className="w-6 h-6 rotate-180" />
            </button>
          )}
          <h1 className="text-2xl font-bold text-emerald-700">{ar.appName}</h1>
        </div>
      </motion.div>

      {/* Content */}
      <div className="flex-1 flex flex-col px-6 pt-8">
        {/* Title Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {view === 'register' ? 'إنشاء حساب جديد' : ar.loginTitle}
          </h2>
          <p className="text-gray-500 text-lg">
            {view === 'phone' && ar.loginSubtitle}
            {view === 'email' && 'أدخل بريدك الإلكتروني وكلمة المرور'}
            {view === 'register' && 'أنشئ حسابك للمتابعة'}
            {view === 'main' && 'اختر طريقة التسجيل'}
          </p>
        </motion.div>

        {/* Auth Forms */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {view === 'main' && <MainView />}
              {view === 'phone' && <PhoneView />}
              {view === 'email' && <EmailView />}
              {view === 'register' && <RegisterView />}
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Error Message */}
        {displayError && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-red-500 text-sm mt-4 bg-red-50 p-3 rounded-lg text-center"
          >
            {displayError}
          </motion.p>
        )}

        {/* Terms and Conditions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-auto pb-8 pt-4"
        >
          <p className="text-center text-gray-500 text-sm leading-relaxed">
            {ar.termsText}
            <button className="text-emerald-600 hover:underline font-medium mx-1">
              {ar.termsLink}
            </button>
            <span className="mx-1">و</span>
            <button className="text-emerald-600 hover:underline font-medium mx-1">
              {ar.privacyLink}
            </button>
          </p>
        </motion.div>

        {/* Security Badge */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex items-center justify-center gap-2 pb-6 text-gray-400"
        >
          <Shield className="w-4 h-4" />
          <span className="text-xs">محمي بتشفير Firebase Auth</span>
        </motion.div>
      </div>
    </div>
  );
}
