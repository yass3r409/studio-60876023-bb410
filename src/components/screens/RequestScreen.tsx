'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, MapPin, Clock, Users, CheckCircle, XCircle, Video, RefreshCw } from 'lucide-react';
import { useAppStore } from '@/store/app-store';
import ar from '@/lib/localization';
import { Button } from '@/components/ui/button';

export default function RequestScreen() {
  const { setScreen, activeRequest } = useAppStore();
  const [status, setStatus] = useState<'pending' | 'matched' | 'recording' | 'completed' | 'cancelled'>('pending');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [responderName, setResponderName] = useState<string | null>(null);

  // Simulate status changes for demo
  useEffect(() => {
    if (status === 'pending') {
      const timer1 = setTimeout(() => {
        setStatus('matched');
        setResponderName('أحمد محمد');
      }, 5000);
      return () => clearTimeout(timer1);
    }
    
    if (status === 'matched') {
      const timer2 = setTimeout(() => {
        setStatus('recording');
      }, 3000);
      return () => clearTimeout(timer2);
    }
    
    if (status === 'recording') {
      const timer3 = setTimeout(() => {
        setStatus('completed');
      }, 15000);
      return () => clearTimeout(timer3);
    }
  }, [status]);

  // Elapsed time counter
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const statusConfig = {
    pending: {
      icon: Clock,
      color: 'text-amber-600',
      bgColor: 'bg-amber-100',
      title: 'جاري البحث عن مستجيب...',
      subtitle: 'يتم إرسال إشعار للمستخدمين القريبين',
    },
    matched: {
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      title: 'تم العثور على مستجيب!',
      subtitle: responderName ? `${responderName} يقبل الطلب` : '',
    },
    recording: {
      icon: Video,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100',
      title: 'جاري التسجيل...',
      subtitle: 'سيتم إرسال الفيديو قريباً',
    },
    completed: {
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      title: 'تم استلام الفيديو!',
      subtitle: 'يمكنك مشاهدته الآن',
    },
    cancelled: {
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      title: 'تم إلغاء الطلب',
      subtitle: 'تم إرجاع المبلغ إلى رصيدك',
    },
  };

  const currentStatus = statusConfig[status];
  const StatusIcon = currentStatus.icon;

  return (
    <div className="fixed inset-0 flex flex-col bg-gray-50" dir="rtl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white px-4 pt-12 pb-4 shadow-sm"
      >
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setScreen('home')}
            className="p-2 -mr-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowRight className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-semibold text-gray-900">تفاصيل الطلب</h1>
        </div>
      </motion.div>

      {/* Content */}
      <div className="flex-1 px-4 py-6 overflow-y-auto">
        {/* Status Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-6 shadow-sm mb-4"
        >
          <div className="flex items-center justify-center mb-6">
            <motion.div
              animate={{ 
                scale: status === 'recording' ? [1, 1.1, 1] : 1,
              }}
              transition={{ 
                repeat: status === 'recording' ? Infinity : 0,
                duration: 1
              }}
              className={`w-20 h-20 ${currentStatus.bgColor} rounded-full flex items-center justify-center`}
            >
              <StatusIcon className={`w-10 h-10 ${currentStatus.color}`} />
            </motion.div>
          </div>

          <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">
            {currentStatus.title}
          </h2>
          <p className="text-gray-500 text-center mb-6">
            {currentStatus.subtitle}
          </p>

          {/* Timer */}
          {status !== 'completed' && status !== 'cancelled' && (
            <div className="flex items-center justify-center gap-2 text-gray-600">
              <Clock className="w-4 h-4" />
              <span className="font-mono text-lg">{formatTime(elapsedTime)}</span>
            </div>
          )}

          {/* Progress Steps */}
          <div className="flex items-center justify-between mt-8 px-4">
            {['pending', 'matched', 'recording', 'completed'].map((step, index) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  ['pending', 'matched', 'recording', 'completed'].indexOf(status) >= index
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-200 text-gray-400'
                }`}>
                  {index + 1}
                </div>
                {index < 3 && (
                  <div className={`w-12 h-1 ${
                    ['pending', 'matched', 'recording', 'completed'].indexOf(status) > index
                      ? 'bg-emerald-600'
                      : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 px-2 text-xs text-gray-500">
            <span>البحث</span>
            <span>مطابق</span>
            <span>تسجيل</span>
            <span>مكتمل</span>
          </div>
        </motion.div>

        {/* Location Info */}
        {activeRequest && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl p-4 shadow-sm mb-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <MapPin className="w-5 h-5 text-gray-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500">الموقع</p>
                <p className="font-medium text-gray-900">
                  {activeRequest.location.lat.toFixed(4)}, {activeRequest.location.lng.toFixed(4)}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Reward Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-4 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-gray-600">مكافأة المستجيب</span>
            <span className="font-bold text-emerald-600">
              {activeRequest?.reward.toFixed(2) || '2.00'} ر.س
            </span>
          </div>
        </motion.div>

        {/* Action Buttons */}
        {status === 'completed' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 space-y-3"
          >
            <Button
              className="w-full h-14 text-lg font-semibold bg-emerald-600 hover:bg-emerald-700 rounded-xl"
            >
              <Video className="w-5 h-5 ml-2" />
              مشاهدة الفيديو
            </Button>
            <Button
              onClick={() => setScreen('map')}
              variant="outline"
              className="w-full h-14 text-lg rounded-xl"
            >
              <RefreshCw className="w-5 h-5 ml-2" />
              طلب جديد
            </Button>
          </motion.div>
        )}

        {status === 'cancelled' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6"
          >
            <Button
              onClick={() => setScreen('map')}
              variant="outline"
              className="w-full h-14 text-lg rounded-xl"
            >
              <RefreshCw className="w-5 h-5 ml-2" />
              طلب جديد
            </Button>
          </motion.div>
        )}

        {/* Cancel Button (only during pending/matched) */}
        {(status === 'pending' || status === 'matched') && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6"
          >
            <Button
              onClick={() => setStatus('cancelled')}
              variant="ghost"
              className="w-full h-12 text-red-600 hover:bg-red-50"
            >
              إلغاء الطلب
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
