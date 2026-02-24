import { create } from 'zustand';
import { FirebaseUser, ConfirmationResult, UserProfile, UserRole } from '@/lib/firebase';

// App screen types
export type AppScreen = 'splash' | 'login' | 'register' | 'otp' | 'home' | 'map' | 'camera' | 'profile' | 'wallet' | 'request' | 'admin';

// Auth method type
export type AuthMethod = 'phone' | 'email' | 'google';

// Video Request state
export interface ActiveRequest {
  id: string;
  location: { lat: number; lng: number; address?: string };
  reward: number;
  status: string;
}

// App state interface
interface AppState {
  currentScreen: AppScreen;
  user: FirebaseUser | null;
  userProfile: UserProfile | null;
  isLoading: boolean;
  phoneNumber: string;
  otpCode: string;
  confirmationResult: ConfirmationResult | null;
  error: string | null;
  activeRequest: ActiveRequest | null;
  recordedVideoBlob: Blob | null;
  videoUrl: string | null;
  authMethod: AuthMethod;
  email: string;
  password: string;
  displayName: string;
  
  // Actions
  setScreen: (screen: AppScreen) => void;
  setUser: (user: FirebaseUser | null) => void;
  setUserProfile: (profile: UserProfile | null) => void;
  setLoading: (loading: boolean) => void;
  setPhoneNumber: (phone: string) => void;
  setOtpCode: (code: string) => void;
  setConfirmationResult: (result: ConfirmationResult | null) => void;
  setError: (error: string | null) => void;
  setActiveRequest: (request: ActiveRequest | null) => void;
  setRecordedVideoBlob: (blob: Blob | null) => void;
  setVideoUrl: (url: string | null) => void;
  setAuthMethod: (method: AuthMethod) => void;
  setEmail: (email: string) => void;
  setPassword: (password: string) => void;
  setDisplayName: (name: string) => void;
  logout: () => void;
  reset: () => void;
}

const initialState = {
  currentScreen: 'splash' as AppScreen,
  user: null,
  userProfile: null,
  isLoading: false,
  phoneNumber: '',
  otpCode: '',
  confirmationResult: null,
  error: null,
  activeRequest: null,
  recordedVideoBlob: null,
  videoUrl: null,
  authMethod: 'phone' as AuthMethod,
  email: '',
  password: '',
  displayName: '',
};

export const useAppStore = create<AppState>((set) => ({
  ...initialState,
  
  setScreen: (screen) => set({ currentScreen: screen, error: null }),
  setUser: (user) => set({ user }),
  setUserProfile: (userProfile) => set({ userProfile }),
  setLoading: (loading) => set({ isLoading: loading }),
  setPhoneNumber: (phone) => set({ phoneNumber: phone, error: null }),
  setOtpCode: (code) => set({ otpCode: code, error: null }),
  setConfirmationResult: (result) => set({ confirmationResult: result }),
  setError: (error) => set({ error }),
  setActiveRequest: (request) => set({ activeRequest: request }),
  setRecordedVideoBlob: (blob) => set({ recordedVideoBlob: blob }),
  setVideoUrl: (url) => set({ videoUrl: url }),
  setAuthMethod: (method) => set({ authMethod: method, error: null }),
  setEmail: (email) => set({ email, error: null }),
  setPassword: (password) => set({ password, error: null }),
  setDisplayName: (name) => set({ displayName: name, error: null }),
  logout: () => set({ 
    ...initialState,
    currentScreen: 'login'
  }),
  reset: () => set(initialState),
}));
