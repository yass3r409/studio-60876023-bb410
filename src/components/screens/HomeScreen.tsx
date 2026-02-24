'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Video, Wallet, User, Bell, ChevronLeft, Shield, Settings } from 'lucide-react';
import { useAppStore } from '@/store/app-store';
import { getUserProfile } from '@/lib/firebase';
import ar from '@/lib/localization';
import { Button } from '@/components/ui/button';

export default function HomeScreen() {
  const { 
    user, 
    userProfile, 
    setUserProfile, 
    setScreen, 
  } = useAppStore();

  // Load user profile on mount
  useEffect(() => {
    const loadProfile = async () => {
      if (user?.uid) {
        try {
          const profile = await getUserProfile(user.uid);
          if (profile) {
            setUserProfile(profile);
          }
        } catch (error) {
          console.error('Error loading profile:', error);
        }
      }
    };
    
    loadProfile();
  }, [user, setUserProfile]);

  const isAdmin = userProfile?.role === 'admin' || userProfile?.role === 'moderator';

  const menuItems = [
    {
      icon: MapPin,
      title: 'طلب فيديو جديد',
      subtitle: 'حدد موقعاً واحصل على فيديو مباشر',
      color: 'from-emerald-500 to-teal-600',
      screen: 'map' as const,
    },
    {
      icon: Video,
      title: 'الفيديوهات القريبة',
      subtitle: 'اكتسب المال من خلال تسجيل الفيديوهات',
      color: 'from-blue-500 to-indigo-600',
      screen: 'camera' as const,
    },
    {
      icon: Wallet,
      title: ar.walletTitle,
      subtitle: `الرصيد: ${(userProfile?.balance || 0).toFixed(2)} ريال`,
      color: 'from-amber-500 to-orange-600',
      screen: 'wallet' as const,
    },
  ];

  return (
    <div className="fixed inset-0 flex flex-col bg-gray-50" dir="rtl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-l from-emerald-600 to-teal-700 text-white px-6 pt-12 pb-8 rounded-b-3xl shadow-xl"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">
              مرحباً {userProfile?.displayName ? `${userProfile.displayName}` : '👋'}
            </h1>
            <p className="text-white/80 mt-1" dir="ltr">
              {userProfile?.phoneNumber ? `+966 ${userProfile.phoneNumber}` : 
               userProfile?.email || 'مرحباً بك في نظرة'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Admin Button */}
            {isAdmin && (
              <button 
                onClick={() => setScreen('admin')}
                className="p-2 bg-yellow-400 rounded-full hover:bg-yellow-300 transition-colors"
                title="لوحة التحكم"
              >
                <Shield className="w-5 h-5 text-yellow-900" />
              </button>
            )}
            <button className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <button 
              onClick={() => setScreen('profile')}
              className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center overflow-hidden hover:bg-white/30 transition-colors"
            >
              {userProfile?.photoURL ? (
                <img src={userProfile.photoURL} alt="" className="w-full h-full object-cover" />
              ) : (
                <User className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Balance Card */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white/20 backdrop-blur-lg rounded-2xl p-4 border border-white/30"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/70 text-sm">رصيدك الحالي</p>
              <p className="text-3xl font-bold mt-1">
                {(userProfile?.balance || 0).toFixed(2)} ر.س
              </p>
            </div>
            <Button 
              onClick={() => setScreen('wallet')}
              className="bg-white text-emerald-700 hover:bg-white/90 rounded-xl"
            >
              اضافة رصيد
            </Button>
          </div>
        </motion.div>

        {/* Role Badge */}
        {isAdmin && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-4 bg-yellow-400/20 border border-yellow-400/30 rounded-xl p-3 flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-yellow-300" />
              <span className="text-yellow-200 font-medium">
                {userProfile?.role === 'admin' ? 'مدير النظام' : 'مشرف'}
              </span>
            </div>
            <button 
              onClick={() => setScreen('admin')}
              className="text-yellow-200 hover:text-white text-sm underline"
            >
              لوحة التحكم
            </button>
          </motion.div>
        )}
      </motion.div>

      {/* Menu Items */}
      <div className="flex-1 px-6 py-6 space-y-4 overflow-y-auto">
        {menuItems.map((item, index) => (
          <motion.button
            key={item.title}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 * (index + 1) }}
            onClick={() => setScreen(item.screen)}
            className="w-full bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg`}>
                <item.icon className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1 text-right">
                <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                <p className="text-gray-500 text-sm mt-0.5">{item.subtitle}</p>
              </div>
              <ChevronLeft className="w-5 h-5 text-gray-400 rotate-180" />
            </div>
          </motion.button>
        ))}

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-2 gap-4 mt-4"
        >
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Video className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{userProfile?.totalVideos || 0}</p>
                <p className="text-gray-500 text-sm">فيديوهات</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <MapPin className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{userProfile?.totalRequests || 0}</p>
                <p className="text-gray-500 text-sm">طلبات</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-3">النشاط الأخير</h3>
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            {userProfile?.totalVideos === 0 && userProfile?.totalRequests === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Video className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>لا يوجد نشاط حتى الآن</p>
                <p className="text-sm mt-1">ابدأ بطلب فيديو أو اكسب المال</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-3 py-2 border-b border-gray-100">
                  <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                    <Video className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">نشاط حديث</p>
                    <p className="text-xs text-gray-500">ابدأ في استخدام التطبيق</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Bottom Navigation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white border-t border-gray-100 px-6 py-3 safe-area-bottom"
      >
        <div className="flex items-center justify-around">
          <button className="flex flex-col items-center py-2 text-emerald-600">
            <Video className="w-6 h-6" />
            <span className="text-xs mt-1 font-medium">الرئيسية</span>
          </button>
          <button 
            onClick={() => setScreen('map')}
            className="flex flex-col items-center py-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <MapPin className="w-6 h-6" />
            <span className="text-xs mt-1">الخريطة</span>
          </button>
          <button 
            onClick={() => setScreen('wallet')}
            className="flex flex-col items-center py-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <Wallet className="w-6 h-6" />
            <span className="text-xs mt-1">المحفظة</span>
          </button>
          <button 
            onClick={() => setScreen('profile')}
            className="flex flex-col items-center py-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <User className="w-6 h-6" />
            <span className="text-xs mt-1">حسابي</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
