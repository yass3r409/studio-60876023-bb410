'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/store/app-store';
import { 
  initializeFirebase, 
  onAuthChange, 
  getUserProfile, 
  createUserProfile 
} from '@/lib/firebase';

// Screens
import SplashScreen from '@/components/screens/SplashScreen';
import LoginScreen from '@/components/screens/LoginScreen';
import OTPScreen from '@/components/screens/OTPScreen';
import HomeScreen from '@/components/screens/HomeScreen';
import MapScreen from '@/components/screens/MapScreen';
import CameraScreen from '@/components/screens/CameraScreen';
import ProfileScreen from '@/components/screens/ProfileScreen';
import WalletScreen from '@/components/screens/WalletScreen';
import RequestScreen from '@/components/screens/RequestScreen';
import AdminScreen from '@/components/screens/AdminScreen';

export default function Home() {
  const { currentScreen, setUser, setUserProfile, setScreen } = useAppStore();
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  // Initialize Firebase on mount
  useEffect(() => {
    const init = async () => {
      try {
        // Initialize Firebase
        initializeFirebase();
        setIsInitialized(true);
      } catch (error: any) {
        console.error('Firebase initialization error:', error);
        setInitError(error.message || 'Failed to initialize Firebase');
      }
    };
    
    init();
  }, []);

  // Auth state listener
  useEffect(() => {
    if (!isInitialized) return;
    
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        
        // Get or create user profile
        try {
          const profile = await getUserProfile(firebaseUser.uid);
          if (profile) {
            setUserProfile(profile);
          } else {
            // Create profile if it doesn't exist
            const phoneNumber = firebaseUser.phoneNumber?.replace('+966', '') || '';
            const newProfile = await createUserProfile(
              firebaseUser.uid, 
              phoneNumber,
              firebaseUser.email || undefined,
              firebaseUser.displayName || undefined,
              firebaseUser.photoURL || undefined
            );
            setUserProfile(newProfile);
          }
        } catch (error) {
          console.error('Error loading user profile:', error);
        }
      }
    });

    return () => unsubscribe();
  }, [isInitialized, setUser, setUserProfile]);

  // Error screen
  if (initError) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-100" dir="rtl">
        <div className="text-center p-8 max-w-md">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">خطأ في الاتصال</h2>
          <p className="text-gray-600 mb-4">{initError}</p>
          <p className="text-gray-500 text-sm">
            تأكد من إعدادات Firebase في Console
          </p>
        </div>
      </div>
    );
  }

  // Loading screen
  if (!isInitialized) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-emerald-700">
        <div className="text-center text-white">
          <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4" />
          <p className="text-lg">جاري تحميل التطبيق...</p>
        </div>
      </div>
    );
  }

  const renderScreen = () => {
    switch (currentScreen) {
      case 'splash':
        return <SplashScreen key="splash" />;
      case 'login':
        return <LoginScreen key="login" />;
      case 'otp':
        return <OTPScreen key="otp" />;
      case 'home':
        return <HomeScreen key="home" />;
      case 'map':
        return <MapScreen key="map" />;
      case 'camera':
        return <CameraScreen key="camera" />;
      case 'profile':
        return <ProfileScreen key="profile" />;
      case 'wallet':
        return <WalletScreen key="wallet" />;
      case 'request':
        return <RequestScreen key="request" />;
      case 'admin':
        return <AdminScreen key="admin" />;
      default:
        return <SplashScreen key="splash" />;
    }
  };

  return (
    <main className="fixed inset-0 overflow-hidden">
      {renderScreen()}
    </main>
  );
}
