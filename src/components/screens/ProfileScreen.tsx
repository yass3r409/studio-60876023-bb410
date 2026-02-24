'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, User, Video, Settings, HelpCircle, LogOut, ChevronLeft, Shield, Bell, Loader2 } from 'lucide-react';
import { useAppStore } from '@/store/app-store';
import { getUserProfile, signOutUser } from '@/lib/firebase';
import ar from '@/lib/localization';

export default function ProfileScreen() {
  const { user, userProfile, setUserProfile, setScreen, logout } = useAppStore();

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

  const menuItems = [
    { icon: User, title: 'تعديل الملف الشخصي', subtitle: 'الاسم، الصورة، المعلومات' },
    { icon: Video, title: ar.myVideos, subtitle: 'الفديوهات التي سجلتها' },
    { icon: Bell, title: 'الإشعارات', subtitle: 'إعدادات الإشعارات' },
    { icon: Settings, title: 'الإعدادات', subtitle: 'اللغة، الخصوصية، الأمان' },
    { icon: HelpCircle, title: 'المساعدة والدعم', subtitle: 'الأسئلة الشائعة، تواصل معنا' },
    { icon: Shield, title: 'الشروط والأحكام', subtitle: 'سياسة الاستخدام والخصوصية' },
  ];

  const handleLogout = async () => {
    try {
      await signOutUser();
      logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-gray-50" dir="rtl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white px-4 pt-12 pb-6 shadow-sm"
      >
        <div className="flex items-center gap-3 mb-6">
          <button 
            onClick={() => setScreen('home')}
            className="p-2 -mr-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowRight className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-semibold text-gray-900">{ar.profileTitle}</h1>
        </div>

        {/* Profile Info */}
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center shadow-lg">
            <User className="w-10 h-10 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900">مستخدم نظرة</h2>
            <p className="text-gray-500 mt-0.5" dir="ltr">
              {userProfile?.phoneNumber ? `+966 ${userProfile.phoneNumber}` : 'مرحباً بك'}
            </p>
            <p className="text-emerald-600 text-sm mt-1">عضو منذ اليوم</p>
          </div>
          <button className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="px-4 py-4"
      >
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-xl p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-emerald-600">{userProfile?.totalVideos || 0}</p>
            <p className="text-gray-500 text-sm mt-1">فيديوهات</p>
          </div>
          <div className="bg-white rounded-xl p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-blue-600">{userProfile?.totalRequests || 0}</p>
            <p className="text-gray-500 text-sm mt-1">طلبات</p>
          </div>
          <div className="bg-white rounded-xl p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-amber-600">{(userProfile?.balance || 0).toFixed(0)}</p>
            <p className="text-gray-500 text-sm mt-1">ريال</p>
          </div>
        </div>
      </motion.div>

      {/* Menu Items */}
      <div className="flex-1 px-4 py-2 overflow-y-auto">
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {menuItems.map((item, index) => (
            <motion.button
              key={item.title}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * (index + 1) }}
              className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
            >
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <item.icon className="w-5 h-5 text-gray-600" />
              </div>
              <div className="flex-1 text-right">
                <p className="font-medium text-gray-900">{item.title}</p>
                <p className="text-gray-500 text-sm">{item.subtitle}</p>
              </div>
              <ChevronLeft className="w-5 h-5 text-gray-400 rotate-180" />
            </motion.button>
          ))}
        </div>

        {/* Logout Button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          onClick={handleLogout}
          className="w-full mt-4 flex items-center justify-center gap-2 p-4 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">تسجيل الخروج</span>
        </motion.button>
      </div>

      {/* Version */}
      <div className="text-center py-4 text-gray-400 text-sm">
        نظرة MVP v1.0.0 • Firebase Edition
      </div>
    </div>
  );
}
