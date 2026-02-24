'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, Users, Video, MapPin, Wallet, TrendingUp, 
  Clock, CheckCircle, XCircle, Loader2, RefreshCw, Ban,
  Shield, User, ChevronLeft, Eye, Trash2, DollarSign
} from 'lucide-react';
import { useAppStore } from '@/store/app-store';
import { 
  getAdminStats, 
  getAllUsers, 
  getAllRequests, 
  getAllVideos,
  updateUserRole,
  updateUserStatus,
  deleteUserAccount,
  AdminStats,
  UserProfile,
  VideoRequest,
  VideoRecord,
  subscribeToRequests
} from '@/lib/firebase';
import { Button } from '@/components/ui/button';

type AdminTab = 'overview' | 'users' | 'requests' | 'videos';

export default function AdminScreen() {
  const { setScreen, user, userProfile } = useAppStore();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [requests, setRequests] = useState<VideoRequest[]>([]);
  const [videos, setVideos] = useState<VideoRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

  // Load data
  const loadData = async () => {
    try {
      const [statsData, usersData, requestsData, videosData] = await Promise.all([
        getAdminStats(),
        getAllUsers(100),
        getAllRequests(100),
        getAllVideos(100)
      ]);
      
      setStats(statsData);
      setUsers(usersData);
      setRequests(requestsData);
      setVideos(videosData);
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    
    // Subscribe to real-time request updates
    const unsubscribe = subscribeToRequests((updatedRequests) => {
      setRequests(updatedRequests);
    });
    
    return () => unsubscribe();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleUpdateRole = async (uid: string, role: 'user' | 'admin' | 'moderator') => {
    try {
      await updateUserRole(uid, role);
      loadData();
    } catch (error) {
      console.error('Error updating role:', error);
    }
  };

  const handleToggleStatus = async (uid: string, isActive: boolean) => {
    try {
      await updateUserStatus(uid, !isActive);
      loadData();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleDeleteUser = async (uid: string) => {
    if (confirm('هل أنت متأكد من حذف هذا المستخدم؟')) {
      try {
        await deleteUserAccount(uid);
        loadData();
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '-';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('ar-SA', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toFixed(2)} ر.س`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-100 text-amber-700';
      case 'in_progress': return 'bg-blue-100 text-blue-700';
      case 'completed': return 'bg-green-100 text-green-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      case 'active': return 'bg-green-100 text-green-700';
      case 'expired': return 'bg-gray-100 text-gray-700';
      case 'uploading': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'قيد الانتظار';
      case 'in_progress': return 'قيد التنفيذ';
      case 'completed': return 'مكتمل';
      case 'cancelled': return 'ملغي';
      case 'active': return 'نشط';
      case 'expired': return 'منتهي';
      case 'uploading': return 'جاري الرفع';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-50" dir="rtl">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-emerald-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">جاري تحميل لوحة التحكم...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-gray-50" dir="rtl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-l from-gray-800 to-gray-900 text-white px-4 pt-12 pb-4 shadow-lg"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setScreen('home')}
              className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold">لوحة التحكم</h1>
              <p className="text-white/70 text-sm">مرحباً، {userProfile?.displayName || 'المدير'}</p>
            </div>
          </div>
          <button 
            onClick={handleRefresh}
            className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
            disabled={refreshing}
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {[
            { id: 'overview', label: 'نظرة عامة', icon: TrendingUp },
            { id: 'users', label: 'المستخدمين', icon: Users },
            { id: 'requests', label: 'الطلبات', icon: MapPin },
            { id: 'videos', label: 'الفيديوهات', icon: Video },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as AdminTab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id 
                  ? 'bg-white text-gray-800' 
                  : 'bg-white/10 text-white/80 hover:bg-white/20'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <AnimatePresence mode="wait">
          {/* Overview Tab */}
          {activeTab === 'overview' && stats && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Users className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
                      <p className="text-gray-500 text-sm">مستخدم</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <Video className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{stats.totalVideos}</p>
                      <p className="text-gray-500 text-sm">فيديو</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{stats.totalRequests}</p>
                      <p className="text-gray-500 text-sm">طلب</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalRevenue)}</p>
                      <p className="text-gray-500 text-sm">إجمالي</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pending Requests Alert */}
              {stats.pendingRequests > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <Clock className="w-6 h-6 text-amber-600" />
                    <div>
                      <p className="font-medium text-amber-800">{stats.pendingRequests} طلب في انتظار الرد</p>
                      <p className="text-amber-600 text-sm">هناك طلبات تحتاج مستجيبين</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Recent Activity */}
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-3">آخر الطلبات</h3>
                <div className="space-y-3">
                  {requests.slice(0, 5).map((request) => (
                    <div key={request.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                          <MapPin className="w-4 h-4 text-gray-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            طلب من {request.requesterPhone}
                          </p>
                          <p className="text-xs text-gray-500">{formatDate(request.createdAt)}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(request.status)}`}>
                        {getStatusText(request.status)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <motion.div
              key="users"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-3"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900">{users.length} مستخدم</h3>
              </div>

              {users.map((userItem) => (
                <div key={userItem.uid} className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                        {userItem.photoURL ? (
                          <img src={userItem.photoURL} alt="" className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <User className="w-5 h-5 text-emerald-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{userItem.displayName || 'مستخدم'}</p>
                        <p className="text-gray-500 text-sm" dir="ltr">
                          {userItem.email || `+966${userItem.phoneNumber}`}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`px-2 py-0.5 rounded text-xs ${
                            userItem.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                            userItem.role === 'moderator' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {userItem.role === 'admin' ? 'مدير' : userItem.role === 'moderator' ? 'مشرف' : 'مستخدم'}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-xs ${
                            userItem.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {userItem.isActive ? 'نشط' : 'معطل'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <p className="text-left">
                        <span className="text-lg font-bold text-emerald-600">{userItem.balance.toFixed(2)}</span>
                        <span className="text-gray-500 text-sm"> ر.س</span>
                      </p>
                    </div>
                  </div>

                  {/* User Actions */}
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                    <Button
                      onClick={() => handleUpdateRole(userItem.uid, userItem.role === 'admin' ? 'user' : 'admin')}
                      variant="outline"
                      size="sm"
                      className="text-xs"
                    >
                      <Shield className="w-3 h-3 ml-1" />
                      {userItem.role === 'admin' ? 'إلغاء الصلاحية' : 'جعل مدير'}
                    </Button>
                    <Button
                      onClick={() => handleToggleStatus(userItem.uid, userItem.isActive)}
                      variant="outline"
                      size="sm"
                      className={`text-xs ${userItem.isActive ? 'text-red-600' : 'text-green-600'}`}
                    >
                      <Ban className="w-3 h-3 ml-1" />
                      {userItem.isActive ? 'تعطيل' : 'تفعيل'}
                    </Button>
                    <Button
                      onClick={() => handleDeleteUser(userItem.uid)}
                      variant="outline"
                      size="sm"
                      className="text-xs text-red-600"
                    >
                      <Trash2 className="w-3 h-3 ml-1" />
                      حذف
                    </Button>
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {/* Requests Tab */}
          {activeTab === 'requests' && (
            <motion.div
              key="requests"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-3"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900">{requests.length} طلب</h3>
              </div>

              {requests.map((request) => (
                <div key={request.id} className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-amber-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900" dir="ltr">
                          +966{request.requesterPhone}
                        </p>
                        <p className="text-gray-500 text-sm">
                          {formatDate(request.createdAt)}
                        </p>
                        <p className="text-gray-400 text-xs mt-1">
                          {request.location.lat.toFixed(4)}, {request.location.lng.toFixed(4)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-left">
                      <p className="text-lg font-bold text-emerald-600">
                        {formatCurrency(request.reward)}
                      </p>
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(request.status)}`}>
                        {getStatusText(request.status)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {/* Videos Tab */}
          {activeTab === 'videos' && (
            <motion.div
              key="videos"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-3"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900">{videos.length} فيديو</h3>
              </div>

              {videos.map((video) => (
                <div key={video.id} className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-12 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                        <Video className="w-6 h-6 text-gray-400" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900" dir="ltr">
                          {video.responderPhone}
                        </p>
                        <p className="text-gray-500 text-sm">
                          {video.duration} ثانية • {formatDate(video.createdAt)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(video.status)}`}>
                        {getStatusText(video.status)}
                      </span>
                      <Button variant="ghost" size="sm" className="p-1">
                        <Eye className="w-4 h-4 text-gray-400" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Admin Badge */}
      <div className="bg-gray-800 text-white text-center py-2 text-sm">
        <Shield className="w-4 h-4 inline-block ml-1" />
        لوحة تحكم المدير - نظرة
      </div>
    </div>
  );
}
