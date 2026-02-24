import { initializeApp, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  Auth, 
  signInWithPhoneNumber,
  PhoneAuthProvider,
  ConfirmationResult,
  RecaptchaVerifier,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { 
  getFirestore, 
  Firestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  addDoc,
  increment,
  onSnapshot
} from 'firebase/firestore';
import { 
  getStorage, 
  FirebaseStorage, 
  ref, 
  uploadBytes, 
  getDownloadURL,
  deleteObject
} from 'firebase/storage';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBc8bv2SeZPITH6SBBX2eBQYBchQDIQclo",
  authDomain: "studio-60876023-bb410.firebaseapp.com",
  projectId: "studio-60876023-bb410",
  storageBucket: "studio-60876023-bb410.firebasestorage.app",
  messagingSenderId: "162095046422",
  appId: "1:162095046422:web:33cbfaf82fdd5672fffa37"
};

// Initialize Firebase immediately
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;
let googleProvider: GoogleAuthProvider;
let recaptchaVerifier: RecaptchaVerifier | null = null;

// Initialize on module load
if (typeof window !== 'undefined') {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
  
  // Set language to Arabic
  auth.languageCode = 'ar';
  
  // Initialize Google Auth Provider
  googleProvider = new GoogleAuthProvider();
  googleProvider.addScope('email');
  googleProvider.addScope('profile');
}

// Get auth instance (ensures auth is available)
function getAuthInstance(): Auth {
  if (!auth && typeof window !== 'undefined') {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    auth.languageCode = 'ar';
  }
  return auth;
}

// Get Firestore instance
function getDbInstance(): Firestore {
  if (!db && typeof window !== 'undefined') {
    db = getFirestore(app || initializeApp(firebaseConfig));
  }
  return db;
}

// Get Storage instance
function getStorageInstance(): FirebaseStorage {
  if (!storage && typeof window !== 'undefined') {
    storage = getStorage(app || initializeApp(firebaseConfig));
  }
  return storage;
}

// ============ AUTHENTICATION ============

// Initialize reCAPTCHA verifier
function initRecaptcha(buttonId: string): RecaptchaVerifier {
  const authInstance = getAuthInstance();
  
  // Clear existing verifier if any
  if (recaptchaVerifier) {
    try {
      recaptchaVerifier.clear();
    } catch (e) {
      // Ignore errors
    }
  }
  
  recaptchaVerifier = new RecaptchaVerifier(authInstance, buttonId, {
    size: 'invisible',
    hl: 'ar',
    callback: () => {
      console.log('reCAPTCHA verified');
    },
    'expired-callback': () => {
      console.log('reCAPTCHA expired');
    }
  });
  
  return recaptchaVerifier;
}

// Send OTP
async function sendOTP(phoneNumber: string, buttonId: string): Promise<ConfirmationResult> {
  const authInstance = getAuthInstance();
  
  const verifier = initRecaptcha(buttonId);
  const formattedNumber = `+966${phoneNumber}`;
  
  try {
    const confirmationResult = await signInWithPhoneNumber(authInstance, formattedNumber, verifier);
    return confirmationResult;
  } catch (error: any) {
    console.error('Error sending OTP:', error);
    throw error;
  }
}

// Verify OTP
async function verifyOTP(confirmationResult: ConfirmationResult, otp: string): Promise<FirebaseUser> {
  try {
    const result = await confirmationResult.confirm(otp);
    return result.user;
  } catch (error: any) {
    console.error('Error verifying OTP:', error);
    throw error;
  }
}

// Email/Password Sign Up
async function signUpWithEmail(email: string, password: string, displayName?: string): Promise<FirebaseUser> {
  const authInstance = getAuthInstance();
  
  try {
    const result = await createUserWithEmailAndPassword(authInstance, email, password);
    
    if (displayName && result.user) {
      await updateProfile(result.user, { displayName });
    }
    
    return result.user;
  } catch (error: any) {
    console.error('Error signing up:', error);
    throw error;
  }
}

// Email/Password Sign In
async function signInWithEmail(email: string, password: string): Promise<FirebaseUser> {
  const authInstance = getAuthInstance();
  
  try {
    const result = await signInWithEmailAndPassword(authInstance, email, password);
    return result.user;
  } catch (error: any) {
    console.error('Error signing in:', error);
    throw error;
  }
}

// Google Sign In
async function signInWithGoogle(): Promise<FirebaseUser> {
  const authInstance = getAuthInstance();
  
  if (!googleProvider) {
    googleProvider = new GoogleAuthProvider();
    googleProvider.addScope('email');
    googleProvider.addScope('profile');
  }
  
  try {
    const result = await signInWithPopup(authInstance, googleProvider);
    return result.user;
  } catch (error: any) {
    console.error('Error with Google sign in:', error);
    throw error;
  }
}

// Password Reset
async function resetPassword(email: string): Promise<void> {
  const authInstance = getAuthInstance();
  
  try {
    await sendPasswordResetEmail(authInstance, email);
  } catch (error: any) {
    console.error('Error sending password reset:', error);
    throw error;
  }
}

// Sign out
async function signOutUser(): Promise<void> {
  const authInstance = getAuthInstance();
  await signOut(authInstance);
}

// Auth state listener
function onAuthChange(callback: (user: FirebaseUser | null) => void): () => void {
  const authInstance = getAuthInstance();
  return onAuthStateChanged(authInstance, callback);
}

// ============ FIRESTORE OPERATIONS ============

// User roles
export type UserRole = 'user' | 'admin' | 'moderator';

// User type for Firestore
export interface UserProfile {
  uid: string;
  phoneNumber?: string;
  email?: string;
  displayName?: string;
  photoURL?: string;
  balance: number;
  totalVideos: number;
  totalRequests: number;
  role: UserRole;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isActive: boolean;
}

// Video Request type
export interface VideoRequest {
  id?: string;
  requesterId: string;
  requesterPhone: string;
  location: {
    lat: number;
    lng: number;
    address?: string;
  };
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  reward: number;
  createdAt: Timestamp;
  completedAt?: Timestamp;
  videoId?: string;
  responderId?: string;
}

// Video type
export interface VideoRecord {
  id?: string;
  requestId: string;
  responderId: string;
  responderPhone: string;
  videoUrl: string;
  thumbnailUrl?: string;
  duration: number;
  location: {
    lat: number;
    lng: number;
  };
  status: 'uploading' | 'active' | 'expired';
  createdAt: Timestamp;
  expiresAt: Timestamp;
}

// Transaction type
export interface Transaction {
  id?: string;
  userId: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  relatedId?: string;
  createdAt: Timestamp;
}

// Admin Stats type
export interface AdminStats {
  totalUsers: number;
  totalVideos: number;
  totalRequests: number;
  totalRevenue: number;
  pendingRequests: number;
  activeUsers: number;
}

// Create or update user profile
async function createUserProfile(
  uid: string, 
  phoneNumber?: string, 
  email?: string,
  displayName?: string,
  photoURL?: string
): Promise<UserProfile> {
  const dbInstance = getDbInstance();
  const userRef = doc(dbInstance, 'users', uid);
  const userSnap = await getDoc(userRef);
  
  if (userSnap.exists()) {
    const userData = userSnap.data() as UserProfile;
    await updateDoc(userRef, { 
      updatedAt: serverTimestamp(),
      ...(phoneNumber && { phoneNumber }),
      ...(email && { email }),
      ...(displayName && { displayName }),
      ...(photoURL && { photoURL })
    });
    return { ...userData, ...(phoneNumber && { phoneNumber }), ...(email && { email }) };
  }
  
  const newUser: UserProfile = {
    uid,
    phoneNumber: phoneNumber || '',
    email: email || '',
    displayName: displayName || 'مستخدم نظرة',
    photoURL: photoURL || '',
    balance: 0,
    totalVideos: 0,
    totalRequests: 0,
    role: 'user',
    createdAt: serverTimestamp() as Timestamp,
    updatedAt: serverTimestamp() as Timestamp,
    isActive: true
  };
  
  await setDoc(userRef, newUser);
  return newUser;
}

// Get user profile
async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const dbInstance = getDbInstance();
  const userRef = doc(dbInstance, 'users', uid);
  const userSnap = await getDoc(userRef);
  
  if (userSnap.exists()) {
    return userSnap.data() as UserProfile;
  }
  return null;
}

// Check if user is admin
async function isUserAdmin(uid: string): Promise<boolean> {
  const profile = await getUserProfile(uid);
  return profile?.role === 'admin' || profile?.role === 'moderator';
}

// Update user role (admin only)
async function updateUserRole(uid: string, role: UserRole): Promise<void> {
  const dbInstance = getDbInstance();
  const userRef = doc(dbInstance, 'users', uid);
  await updateDoc(userRef, { role, updatedAt: serverTimestamp() });
}

// Update user balance
async function updateBalance(uid: string, amount: number): Promise<void> {
  const dbInstance = getDbInstance();
  const userRef = doc(dbInstance, 'users', uid);
  await updateDoc(userRef, {
    balance: increment(amount),
    updatedAt: serverTimestamp()
  });
}

// ============ ADMIN OPERATIONS ============

// Get all users (admin)
async function getAllUsers(limitCount: number = 50): Promise<UserProfile[]> {
  const dbInstance = getDbInstance();
  const q = query(
    collection(dbInstance, 'users'),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );
  
  const snapshot = await getDocs(q);
  const users: UserProfile[] = [];
  
  snapshot.forEach((doc) => {
    users.push({ id: doc.id, ...doc.data() } as UserProfile);
  });
  
  return users;
}

// Get all video requests (admin)
async function getAllRequests(limitCount: number = 50): Promise<VideoRequest[]> {
  const dbInstance = getDbInstance();
  const q = query(
    collection(dbInstance, 'videoRequests'),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );
  
  const snapshot = await getDocs(q);
  const requests: VideoRequest[] = [];
  
  snapshot.forEach((doc) => {
    requests.push({ id: doc.id, ...doc.data() } as VideoRequest);
  });
  
  return requests;
}

// Get all videos (admin)
async function getAllVideos(limitCount: number = 50): Promise<VideoRecord[]> {
  const dbInstance = getDbInstance();
  const q = query(
    collection(dbInstance, 'videos'),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );
  
  const snapshot = await getDocs(q);
  const videos: VideoRecord[] = [];
  
  snapshot.forEach((doc) => {
    videos.push({ id: doc.id, ...doc.data() } as VideoRecord);
  });
  
  return videos;
}

// Get admin stats
async function getAdminStats(): Promise<AdminStats> {
  const dbInstance = getDbInstance();
  const usersSnapshot = await getDocs(collection(dbInstance, 'users'));
  const requestsSnapshot = await getDocs(collection(dbInstance, 'videoRequests'));
  const videosSnapshot = await getDocs(collection(dbInstance, 'videos'));
  
  let pendingRequests = 0;
  requestsSnapshot.forEach((doc) => {
    const data = doc.data();
    if (data.status === 'pending') pendingRequests++;
  });
  
  let totalRevenue = 0;
  const transactionsSnapshot = await getDocs(collection(dbInstance, 'transactions'));
  transactionsSnapshot.forEach((doc) => {
    const data = doc.data();
    if (data.type === 'credit') totalRevenue += data.amount;
  });
  
  return {
    totalUsers: usersSnapshot.size,
    totalVideos: videosSnapshot.size,
    totalRequests: requestsSnapshot.size,
    totalRevenue,
    pendingRequests,
    activeUsers: usersSnapshot.size
  };
}

// Delete user (admin)
async function deleteUserAccount(uid: string): Promise<void> {
  const dbInstance = getDbInstance();
  const userRef = doc(dbInstance, 'users', uid);
  await deleteDoc(userRef);
}

// Update user status (admin)
async function updateUserStatus(uid: string, isActive: boolean): Promise<void> {
  const dbInstance = getDbInstance();
  const userRef = doc(dbInstance, 'users', uid);
  await updateDoc(userRef, { isActive, updatedAt: serverTimestamp() });
}

// Create video request
async function createVideoRequest(
  requesterId: string,
  requesterPhone: string,
  location: { lat: number; lng: number; address?: string },
  reward: number = 2.00
): Promise<string> {
  const dbInstance = getDbInstance();
  const requestRef = await addDoc(collection(dbInstance, 'videoRequests'), {
    requesterId,
    requesterPhone,
    location,
    status: 'pending',
    reward,
    createdAt: serverTimestamp()
  });
  
  const userRef = doc(dbInstance, 'users', requesterId);
  await updateDoc(userRef, {
    totalRequests: increment(1)
  });
  
  return requestRef.id;
}

// Get pending requests near location
async function getPendingRequestsNearLocation(
  lat: number,
  lng: number,
  radiusKm: number = 1
): Promise<VideoRequest[]> {
  const dbInstance = getDbInstance();
  const q = query(
    collection(dbInstance, 'videoRequests'),
    where('status', '==', 'pending'),
    orderBy('createdAt', 'desc'),
    limit(20)
  );
  
  const snapshot = await getDocs(q);
  const requests: VideoRequest[] = [];
  
  snapshot.forEach((doc) => {
    const data = doc.data() as VideoRequest;
    data.id = doc.id;
    
    const distance = Math.sqrt(
      Math.pow((data.location.lat - lat) * 111, 2) +
      Math.pow((data.location.lng - lng) * 111, 2)
    );
    
    if (distance <= radiusKm) {
      requests.push(data);
    }
  });
  
  return requests;
}

// Accept video request
async function acceptVideoRequest(requestId: string, responderId: string): Promise<void> {
  const dbInstance = getDbInstance();
  const requestRef = doc(dbInstance, 'videoRequests', requestId);
  await updateDoc(requestRef, {
    status: 'in_progress',
    responderId,
    updatedAt: serverTimestamp()
  });
}

// Complete video request
async function completeVideoRequest(requestId: string, responderId: string, videoId: string): Promise<void> {
  const dbInstance = getDbInstance();
  const requestRef = doc(dbInstance, 'videoRequests', requestId);
  await updateDoc(requestRef, {
    status: 'completed',
    videoId,
    completedAt: serverTimestamp()
  });
  
  const requestSnap = await getDoc(requestRef);
  const requestData = requestSnap.data() as VideoRequest;
  
  await updateBalance(responderId, requestData.reward);
  
  await addDoc(collection(dbInstance, 'transactions'), {
    userId: responderId,
    type: 'credit',
    amount: requestData.reward,
    description: 'مكافأة تسجيل فيديو',
    relatedId: videoId,
    createdAt: serverTimestamp()
  });
  
  const userRef = doc(dbInstance, 'users', responderId);
  await updateDoc(userRef, {
    totalVideos: increment(1)
  });
}

// ============ STORAGE OPERATIONS ============

// Upload video to Firebase Storage
async function uploadVideo(
  uid: string,
  videoBlob: Blob,
  requestId: string
): Promise<string> {
  const storageInstance = getStorageInstance();
  const videoRef = ref(storageInstance, `videos/${uid}/${requestId}_${Date.now()}.webm`);
  await uploadBytes(videoRef, videoBlob);
  const downloadUrl = await getDownloadURL(videoRef);
  return downloadUrl;
}

// Create video record
async function createVideoRecord(
  requestId: string,
  responderId: string,
  responderPhone: string,
  videoUrl: string,
  duration: number,
  location: { lat: number; lng: number }
): Promise<string> {
  const dbInstance = getDbInstance();
  const videoRef = await addDoc(collection(dbInstance, 'videos'), {
    requestId,
    responderId,
    responderPhone,
    videoUrl,
    duration,
    location,
    status: 'active',
    createdAt: serverTimestamp(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
  });
  
  return videoRef.id;
}

// Get user transactions
async function getUserTransactions(uid: string, limitCount: number = 20): Promise<Transaction[]> {
  const dbInstance = getDbInstance();
  const q = query(
    collection(dbInstance, 'transactions'),
    where('userId', '==', uid),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );
  
  const snapshot = await getDocs(q);
  const transactions: Transaction[] = [];
  
  snapshot.forEach((doc) => {
    const data = doc.data() as Transaction;
    data.id = doc.id;
    transactions.push(data);
  });
  
  return transactions;
}

// Add balance
async function addBalance(uid: string, amount: number): Promise<void> {
  const dbInstance = getDbInstance();
  await updateBalance(uid, amount);
  
  await addDoc(collection(dbInstance, 'transactions'), {
    userId: uid,
    type: 'credit',
    amount,
    description: 'إضافة رصيد',
    createdAt: serverTimestamp()
  });
}

// Real-time listener for requests
function subscribeToRequests(callback: (requests: VideoRequest[]) => void): () => void {
  const dbInstance = getDbInstance();
  const q = query(
    collection(dbInstance, 'videoRequests'),
    orderBy('createdAt', 'desc'),
    limit(20)
  );
  
  return onSnapshot(q, (snapshot) => {
    const requests: VideoRequest[] = [];
    snapshot.forEach((doc) => {
      requests.push({ id: doc.id, ...doc.data() } as VideoRequest);
    });
    callback(requests);
  });
}

// Real-time listener for users
function subscribeToUsers(callback: (users: UserProfile[]) => void): () => void {
  const dbInstance = getDbInstance();
  const q = query(
    collection(dbInstance, 'users'),
    orderBy('createdAt', 'desc'),
    limit(50)
  );
  
  return onSnapshot(q, (snapshot) => {
    const users: UserProfile[] = [];
    snapshot.forEach((doc) => {
      users.push({ id: doc.id, ...doc.data() } as UserProfile);
    });
    callback(users);
  });
}

// Initialize Firebase function (for explicit initialization)
function initializeFirebase() {
  if (typeof window !== 'undefined') {
    if (!app) {
      app = initializeApp(firebaseConfig);
    }
    if (!auth) {
      auth = getAuth(app);
      auth.languageCode = 'ar';
    }
    if (!db) {
      db = getFirestore(app);
    }
    if (!storage) {
      storage = getStorage(app);
    }
    if (!googleProvider) {
      googleProvider = new GoogleAuthProvider();
      googleProvider.addScope('email');
      googleProvider.addScope('profile');
    }
  }
  return { app, auth, db, storage };
}

export {
  initializeFirebase,
  initRecaptcha,
  sendOTP,
  verifyOTP,
  signUpWithEmail,
  signInWithEmail,
  signInWithGoogle,
  resetPassword,
  signOutUser,
  onAuthChange,
  app,
  auth,
  db,
  storage,
  getAuthInstance,
  getDbInstance,
  getStorageInstance
};

// Export Firestore functions
export {
  createUserProfile,
  getUserProfile,
  isUserAdmin,
  updateUserRole,
  updateBalance,
  createVideoRequest,
  getPendingRequestsNearLocation,
  acceptVideoRequest,
  completeVideoRequest,
  uploadVideo,
  createVideoRecord,
  getUserTransactions,
  addBalance,
  // Admin functions
  getAllUsers,
  getAllRequests,
  getAllVideos,
  getAdminStats,
  deleteUserAccount,
  updateUserStatus,
  subscribeToRequests,
  subscribeToUsers
};

export type { FirebaseUser, UserProfile, VideoRequest, VideoRecord, Transaction, AdminStats, UserRole };
