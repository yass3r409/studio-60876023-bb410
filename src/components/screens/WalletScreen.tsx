'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Plus, ArrowDownUp, Wallet, ArrowUpRight, ArrowDownRight, Loader2, CheckCircle } from 'lucide-react';
import { useAppStore } from '@/store/app-store';
import { getUserTransactions, getUserProfile, addBalance, Transaction } from '@/lib/firebase';
import ar from '@/lib/localization';
import { Button } from '@/components/ui/button';

export default function WalletScreen() {
  const { user, userProfile, setUserProfile, setScreen } = useAppStore();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddBalance, setShowAddBalance] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  // Load transactions on mount
  useEffect(() => {
    const loadData = async () => {
      if (user?.uid) {
        try {
          const txData = await getUserTransactions(user.uid);
          setTransactions(txData);
          
          // Refresh user profile
          const profile = await getUserProfile(user.uid);
          if (profile) {
            setUserProfile(profile);
          }
        } catch (error) {
          console.error('Error loading transactions:', error);
        } finally {
          setLoading(false);
        }
      }
    };
    
    loadData();
  }, [user, setUserProfile]);

  const quickAmounts = [
    { amount: 5, label: '5 ر.س' },
    { amount: 10, label: '10 ر.س' },
    { amount: 20, label: '20 ر.س' },
    { amount: 50, label: '50 ر.س' },
    { amount: 100, label: '100 ر.س' },
    { amount: 200, label: '200 ر.س' },
  ];

  const handleAddBalance = async () => {
    if (!selectedAmount || !user?.uid) return;
    
    setIsProcessing(true);
    
    try {
      // Add balance via Firestore
      await addBalance(user.uid, selectedAmount);
      
      // Refresh profile
      const profile = await getUserProfile(user.uid);
      if (profile) {
        setUserProfile(profile);
      }
      
      // Refresh transactions
      const txData = await getUserTransactions(user.uid);
      setTransactions(txData);
      
      setSuccess(true);
      setTimeout(() => {
        setShowAddBalance(false);
        setSuccess(false);
        setSelectedAmount(null);
      }, 1500);
      
    } catch (error) {
      console.error('Error adding balance:', error);
      alert('حدث خطأ، يرجى المحاولة مرة أخرى');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('ar-SA');
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-gray-50" dir="rtl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-l from-emerald-600 to-teal-700 text-white px-4 pt-12 pb-8 rounded-b-3xl shadow-xl"
      >
        <div className="flex items-center gap-3 mb-6">
          <button 
            onClick={() => setScreen('home')}
            className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
          >
            <ArrowRight className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-xl font-semibold">{ar.walletTitle}</h1>
        </div>

        {/* Balance Card */}
        <div className="text-center py-4">
          <p className="text-white/70 mb-2">{ar.balance}</p>
          <motion.p
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            key={userProfile?.balance}
            className="text-5xl font-bold"
          >
            {(userProfile?.balance || 0).toFixed(2)}
          </motion.p>
          <p className="text-white/70 mt-2 text-lg">ريال سعودي</p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-4">
          <Button 
            onClick={() => setShowAddBalance(true)}
            className="flex-1 h-12 bg-white text-emerald-700 hover:bg-white/90 rounded-xl font-semibold"
          >
            <Plus className="w-5 h-5 ml-2" />
            {ar.addBalance}
          </Button>
          <Button 
            variant="outline" 
            className="flex-1 h-12 bg-transparent border-white/30 text-white hover:bg-white/10 rounded-xl font-semibold"
            disabled={(userProfile?.balance || 0) < 20}
          >
            <ArrowDownUp className="w-5 h-5 ml-2" />
            {ar.withdraw}
          </Button>
        </div>
      </motion.div>

      {/* Transactions */}
      <div className="flex-1 px-4 py-4 overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900">{ar.transactions}</h3>
          <button className="text-emerald-600 text-sm font-medium">عرض الكل</button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-12 text-center">
              <Loader2 className="w-8 h-8 mx-auto text-emerald-600 animate-spin" />
              <p className="text-gray-500 mt-3">جاري التحميل...</p>
            </div>
          ) : transactions.length > 0 ? (
            transactions.map((tx, index) => (
              <motion.div
                key={tx.id || index}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 * index }}
                className="flex items-center gap-4 p-4 border-b border-gray-100 last:border-b-0"
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  tx.type === 'credit' 
                    ? 'bg-emerald-100 text-emerald-600' 
                    : 'bg-red-100 text-red-600'
                }`}>
                  {tx.type === 'credit' ? (
                    <ArrowDownRight className="w-5 h-5" />
                  ) : (
                    <ArrowUpRight className="w-5 h-5" />
                  )}
                </div>
                <div className="flex-1 text-right">
                  <p className="font-medium text-gray-900">{tx.description}</p>
                  <p className="text-gray-500 text-sm">{formatDate(tx.createdAt)}</p>
                </div>
                <p className={`font-bold ${
                  tx.type === 'credit' ? 'text-emerald-600' : 'text-red-600'
                }`}>
                  {tx.type === 'credit' ? '+' : '-'}{tx.amount.toFixed(2)} ر.س
                </p>
              </motion.div>
            ))
          ) : (
            <div className="py-12 text-center text-gray-400">
              <Wallet className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>لا توجد معاملات</p>
              <p className="text-sm mt-1">ابدأ بإضافة رصيد</p>
            </div>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="px-4 py-4 text-center text-gray-400 text-sm">
        <p>الحد الأدنى للسحب: 20 ريال</p>
      </div>

      {/* Add Balance Modal */}
      {showAddBalance && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center"
          onClick={() => setShowAddBalance(false)}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-t-3xl w-full max-w-lg p-6 safe-area-bottom"
          >
            {success ? (
              <div className="text-center py-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4"
                >
                  <CheckCircle className="w-8 h-8 text-emerald-600" />
                </motion.div>
                <h3 className="text-xl font-bold text-gray-900">تمت الإضافة بنجاح!</h3>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900">{ar.addBalance}</h3>
                  <button 
                    onClick={() => setShowAddBalance(false)}
                    className="p-2 text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-6">
                  {quickAmounts.map((item) => (
                    <button
                      key={item.amount}
                      onClick={() => setSelectedAmount(item.amount)}
                      className={`p-4 rounded-xl text-center transition-all ${
                        selectedAmount === item.amount
                          ? 'bg-emerald-600 text-white'
                          : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                      }`}
                    >
                      <span className="font-bold">{item.label}</span>
                    </button>
                  ))}
                </div>

                <Button
                  onClick={handleAddBalance}
                  disabled={!selectedAmount || isProcessing}
                  className="w-full h-14 text-lg font-semibold bg-emerald-600 hover:bg-emerald-700 rounded-xl"
                >
                  {isProcessing ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    `إضافة ${selectedAmount?.toFixed(2) || ''} ر.س`
                  )}
                </Button>

                <p className="text-center text-gray-400 text-sm mt-4">
                  * محاكاة - في الإنتاج، سيتم ربط بوابة دفع
                </p>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
