'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, MapPin, Navigation, Search, Loader2, Check, X, Video } from 'lucide-react';
import { useAppStore } from '@/store/app-store';
import MapboxMap, { MapLocation, SAUDI_LOCATIONS, MapboxMapHandle } from '@/components/MapboxMap';
import { createVideoRequest, getUserProfile } from '@/lib/firebase';
import ar from '@/lib/localization';
import { Button } from '@/components/ui/button';

export default function MapScreen() {
  const { setScreen, user, userProfile, setUserProfile, isLoading, setLoading, setActiveRequest } = useAppStore();
  const mapRef = useRef<MapboxMapHandle>(null);
  const [selectedLocation, setSelectedLocation] = useState<MapLocation | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [insufficientBalance, setInsufficientBalance] = useState(false);
  const [requestCreated, setRequestCreated] = useState(false);

  const REWARD_AMOUNT = 2.00; // SAR per video request

  // Load user profile on mount
  useEffect(() => {
    const loadProfile = async () => {
      if (user?.uid && !userProfile) {
        const profile = await getUserProfile(user.uid);
        if (profile) {
          setUserProfile(profile);
        }
      }
    };
    loadProfile();
  }, [user, userProfile, setUserProfile]);

  const handleLocationSelect = (location: MapLocation) => {
    setSelectedLocation(location);
    setInsufficientBalance(false);
  };

  const handleQuickLocation = (locationKey: keyof typeof SAUDI_LOCATIONS) => {
    const location = SAUDI_LOCATIONS[locationKey];
    mapRef.current?.flyTo(location);
    mapRef.current?.addUserMarker(location);
    setSelectedLocation(location);
  };

  const handleConfirmLocation = async () => {
    if (!selectedLocation) return;
    
    // Check balance
    if (userProfile && userProfile.balance < REWARD_AMOUNT) {
      setInsufficientBalance(true);
      return;
    }
    
    setShowConfirmModal(true);
  };

  const handleCreateRequest = async () => {
    if (!user || !selectedLocation) return;
    
    setLoading(true);
    
    try {
      const requestId = await createVideoRequest(
        user.uid,
        userProfile?.phoneNumber || '',
        {
          lat: selectedLocation.lat,
          lng: selectedLocation.lng,
          address: selectedLocation.address
        },
        REWARD_AMOUNT
      );
      
      // Set active request for camera screen
      setActiveRequest({
        id: requestId,
        location: selectedLocation,
        reward: REWARD_AMOUNT,
        status: 'pending'
      });
      
      // Update local balance
      if (userProfile) {
        setUserProfile({
          ...userProfile,
          balance: userProfile.balance - REWARD_AMOUNT,
          totalRequests: userProfile.totalRequests + 1
        });
      }
      
      setRequestCreated(true);
      setShowConfirmModal(false);
      
      // Navigate after success animation
      setTimeout(() => {
        setScreen('request');
      }, 1500);
      
    } catch (error) {
      console.error('Error creating request:', error);
      alert('حدث خطأ، يرجى المحاولة مرة أخرى');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-gray-100" dir="rtl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-0 left-0 right-0 z-20 bg-white/95 backdrop-blur-sm shadow-sm"
      >
        <div className="safe-area-top" />
        <div className="flex items-center gap-3 px-4 py-2">
          <button 
            onClick={() => setScreen('home')}
            className="p-2 -mr-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowRight className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">{ar.mapTitle}</h1>
        </div>
        
        {/* Search Bar */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={ar.searchLocation}
              className="w-full h-12 pr-10 pl-4 bg-gray-100 rounded-xl text-right focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Quick Location Buttons */}
        <div className="flex gap-2 px-4 pb-3 overflow-x-auto">
          {Object.entries(SAUDI_LOCATIONS).map(([key, location]) => (
            <button
              key={key}
              onClick={() => handleQuickLocation(key as keyof typeof SAUDI_LOCATIONS)}
              className="flex-shrink-0 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full text-sm font-medium hover:bg-emerald-100 transition-colors"
            >
              {location.name}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Map */}
      <div className="flex-1 pt-48">
        <MapboxMap
          ref={mapRef}
          onLocationSelect={handleLocationSelect}
          showUserLocation={true}
          className="w-full h-full"
        />
      </div>

      {/* Current Location Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.3 }}
        onClick={() => mapRef.current?.flyTo(SAUDI_LOCATIONS.riyadh)}
        className="absolute bottom-48 left-4 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center z-10"
      >
        <Navigation className="w-5 h-5 text-gray-600" />
      </motion.button>

      {/* Bottom Sheet */}
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl z-20"
        >
          <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mt-3" />
          
          <div className="px-6 pt-4 pb-6 safe-area-bottom">
            {/* Selected Location Info */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                <MapPin className="w-6 h-6 text-emerald-600" />
              </div>
              <div className="flex-1 text-right">
                <p className="text-sm text-gray-500">الموقع المحدد</p>
                <p className="font-semibold text-gray-900">
                  {selectedLocation?.address || 'الموقع غير محدد'}
                </p>
                {selectedLocation && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    {selectedLocation.lat.toFixed(4)}, {selectedLocation.lng.toFixed(4)}
                  </p>
                )}
              </div>
            </div>

            {/* Cost Info */}
            <div className="flex items-center justify-between bg-gray-50 rounded-xl p-3 mb-4">
              <span className="text-gray-600">تكلفة الطلب</span>
              <span className="font-bold text-emerald-600">{REWARD_AMOUNT.toFixed(2)} ر.س</span>
            </div>

            {/* Balance Info */}
            {userProfile && (
              <div className="flex items-center justify-between bg-gray-50 rounded-xl p-3 mb-4">
                <span className="text-gray-600">رصيدك الحالي</span>
                <span className={`font-bold ${userProfile.balance >= REWARD_AMOUNT ? 'text-emerald-600' : 'text-red-600'}`}>
                  {userProfile.balance.toFixed(2)} ر.س
                </span>
              </div>
            )}

            {/* Insufficient Balance Warning */}
            {insufficientBalance && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4"
              >
                <p className="text-red-600 text-sm text-center">
                  رصيد غير كافي. يرجى إضافة رصيد أولاً.
                </p>
                <Button
                  onClick={() => setScreen('wallet')}
                  variant="outline"
                  className="w-full mt-2 border-red-200 text-red-600"
                >
                  إضافة رصيد
                </Button>
              </motion.div>
            )}

            {/* Confirm Button */}
            <Button
              onClick={handleConfirmLocation}
              disabled={!selectedLocation || isLoading}
              className="w-full h-14 text-lg font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-lg disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
              ) : (
                <Video className="w-5 h-5 mr-2" />
              )}
              {ar.confirmLocation}
            </Button>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Confirm Modal */}
      <AnimatePresence>
        {showConfirmModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowConfirmModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 w-full max-w-sm"
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Video className="w-8 h-8 text-emerald-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">تأكيد طلب الفيديو</h3>
                <p className="text-gray-500">
                  سيتم خصم {REWARD_AMOUNT.toFixed(2)} ر.س من رصيدك
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => setShowConfirmModal(false)}
                  variant="outline"
                  className="flex-1 h-12"
                >
                  <X className="w-4 h-4 ml-2" />
                  إلغاء
                </Button>
                <Button
                  onClick={handleCreateRequest}
                  disabled={isLoading}
                  className="flex-1 h-12 bg-emerald-600 hover:bg-emerald-700"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Check className="w-4 h-4 ml-2" />
                      تأكيد
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Modal */}
      <AnimatePresence>
        {requestCreated && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-emerald-600 z-50 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="text-center text-white"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 }}
                className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <Check className="w-10 h-10" />
              </motion.div>
              <h2 className="text-2xl font-bold mb-2">تم إنشاء الطلب!</h2>
              <p className="text-white/80">جاري البحث عن مستخدم قريب...</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
