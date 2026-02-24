'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Video, Square, Circle, CheckCircle, Upload, X, Loader2 } from 'lucide-react';
import { useAppStore } from '@/store/app-store';
import { 
  uploadVideo, 
  createVideoRecord, 
  completeVideoRequest,
  getPendingRequestsNearLocation,
  acceptVideoRequest,
  getUserProfile
} from '@/lib/firebase';
import ar from '@/lib/localization';
import { Button } from '@/components/ui/button';

interface NearbyRequest {
  id: string;
  requesterPhone: string;
  location: { lat: number; lng: number };
  reward: number;
  distance: number;
}

export default function CameraScreen() {
  const { setScreen, user, userProfile, setUserProfile, isLoading, setLoading, activeRequest } = useAppStore();
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [mode, setMode] = useState<'earn' | 'request'>('earn');
  const [nearbyRequests, setNearbyRequests] = useState<NearbyRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<NearbyRequest | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Load nearby requests when in earn mode
  useEffect(() => {
    const loadNearbyRequests = async () => {
      if (mode === 'earn' && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            try {
              const requests = await getPendingRequestsNearLocation(
                position.coords.latitude,
                position.coords.longitude,
                1 // 1km radius
              );
              setNearbyRequests(requests.map(r => ({
                id: r.id!,
                requesterPhone: r.requesterPhone,
                location: r.location,
                reward: r.reward,
                distance: Math.random() * 0.5 // Mock distance
              })));
            } catch (error) {
              console.error('Error loading nearby requests:', error);
            }
          },
          (error) => {
            console.log('Geolocation error:', error);
            // Use mock data for demo
            setNearbyRequests([
              {
                id: 'demo1',
                requesterPhone: '5XXXXXXXX',
                location: { lat: 24.7136, lng: 46.6753 },
                reward: 2.00,
                distance: 0.2
              }
            ]);
          }
        );
      }
    };
    
    loadNearbyRequests();
    const interval = setInterval(loadNearbyRequests, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [mode]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }, 
        audio: true 
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9'
      });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        setRecordedVideoUrl(url);
        setRecordedBlob(blob);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= 10) {
            stopRecording();
            return 10;
          }
          return prev + 1;
        });
      }, 1000);

    } catch (error) {
      console.error('Camera access error:', error);
      alert(ar.cameraPermission);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const handleUpload = async () => {
    if (!user || !recordedBlob) return;
    
    setLoading(true);
    setUploadProgress(0);
    
    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const requestId = selectedRequest?.id || activeRequest?.id || `demo_${Date.now()}`;
      
      // Upload video to Firebase Storage
      const videoUrl = await uploadVideo(user.uid, recordedBlob, requestId);
      setUploadProgress(95);
      
      // Create video record in Firestore
      const videoId = await createVideoRecord(
        requestId,
        user.uid,
        userProfile?.phoneNumber || '',
        videoUrl,
        recordingTime,
        selectedRequest?.location || activeRequest?.location || { lat: 24.7136, lng: 46.6753 }
      );
      
      // Complete the request and credit user
      if (selectedRequest) {
        await completeVideoRequest(requestId, user.uid, videoId);
        
        // Update local profile
        const updatedProfile = await getUserProfile(user.uid);
        if (updatedProfile) {
          setUserProfile(updatedProfile);
        }
      }
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      setUploadComplete(true);
      
    } catch (error) {
      console.error('Upload error:', error);
      alert('حدث خطأ أثناء رفع الفيديو');
      setUploadProgress(0);
    } finally {
      setLoading(false);
    }
  };

  const handleRetake = () => {
    if (recordedVideoUrl) {
      URL.revokeObjectURL(recordedVideoUrl);
    }
    setRecordedVideoUrl(null);
    setRecordedBlob(null);
    setRecordingTime(0);
    setUploadProgress(0);
    setUploadComplete(false);
  };

  const handleBack = () => {
    // Cleanup
    if (isRecording && streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    if (recordedVideoUrl) {
      URL.revokeObjectURL(recordedVideoUrl);
    }
    setScreen('home');
  };

  const handleSelectRequest = async (request: NearbyRequest) => {
    try {
      await acceptVideoRequest(request.id, user!.uid);
      setSelectedRequest(request);
    } catch (error) {
      console.error('Error accepting request:', error);
      // For demo, still select it
      setSelectedRequest(request);
    }
  };

  const formatTime = (seconds: number) => {
    return `${seconds.toString().padStart(2, '0')}`;
  };

  // Upload Complete Screen
  if (uploadComplete) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-emerald-600 to-teal-700" dir="rtl">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mb-6"
        >
          <CheckCircle className="w-12 h-12 text-white" />
        </motion.div>
        <h2 className="text-2xl font-bold text-white mb-2">تم رفع الفيديو بنجاح!</h2>
        <p className="text-white/80 mb-4">تم إضافة {selectedRequest?.reward.toFixed(2) || '2.00'} ر.س إلى رصيدك</p>
        <Button
          onClick={() => setScreen('home')}
          className="bg-white text-emerald-700 hover:bg-white/90"
        >
          العودة للرئيسية
        </Button>
      </div>
    );
  }

  // Request Selection Screen (Earn Mode)
  if (mode === 'earn' && !selectedRequest && !isRecording && !recordedVideoUrl) {
    return (
      <div className="fixed inset-0 flex flex-col bg-gray-50" dir="rtl">
        {/* Header */}
        <div className="bg-white px-4 pt-12 pb-4 shadow-sm">
          <div className="flex items-center gap-3">
            <button onClick={handleBack} className="p-2 -mr-2 text-gray-600">
              <ArrowRight className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-semibold text-gray-900">الطلبات القريبة</h1>
          </div>
        </div>

        <div className="flex-1 p-4 overflow-y-auto">
          {nearbyRequests.length > 0 ? (
            <div className="space-y-3">
              {nearbyRequests.map((request) => (
                <motion.button
                  key={request.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => handleSelectRequest(request)}
                  className="w-full bg-white rounded-xl p-4 shadow-sm text-right"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">طلب فيديو</p>
                      <p className="text-sm text-gray-500">
                        على بعد {(request.distance * 1000).toFixed(0)} متر
                      </p>
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-emerald-600">{request.reward.toFixed(2)} ر.س</p>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <Video className="w-16 h-16 mb-4 opacity-50" />
              <p>لا توجد طلبات قريبة حالياً</p>
              <p className="text-sm mt-2">سيتم إشعارك عند وجود طلبات جديدة</p>
            </div>
          )}
        </div>

        {/* Switch to Request Mode */}
        <div className="p-4 bg-white border-t">
          <Button
            onClick={() => setMode('request')}
            variant="outline"
            className="w-full"
          >
            أريد طلب فيديو
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-black" dir="rtl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/80 to-transparent px-4 pt-12 pb-8"
      >
        <div className="flex items-center justify-between">
          <button 
            onClick={handleBack}
            className="p-2 bg-white/20 backdrop-blur-sm rounded-full"
          >
            <ArrowRight className="w-6 h-6 text-white" />
          </button>
          <h1 className="text-lg font-semibold text-white">{ar.cameraTitle}</h1>
          <div className="w-10" />
        </div>
      </motion.div>

      {/* Camera View */}
      <div className="flex-1 relative">
        {recordedVideoUrl ? (
          <video
            src={recordedVideoUrl}
            controls
            className="w-full h-full object-cover"
          />
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        )}

        {/* Grid Overlay */}
        {!recordedVideoUrl && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="w-full h-full grid grid-cols-3 grid-rows-3">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="border border-white/20" />
              ))}
            </div>
          </div>
        )}

        {/* Recording Timer */}
        {isRecording && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute top-28 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-red-500 px-4 py-2 rounded-full"
          >
            <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
            <span className="text-white font-bold">{formatTime(recordingTime)} / 10</span>
          </motion.div>
        )}

        {/* Progress Bar */}
        {isRecording && (
          <div className="absolute bottom-44 left-8 right-8">
            <div className="h-1 bg-white/30 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-red-500"
                initial={{ width: '0%' }}
                animate={{ width: `${(recordingTime / 10) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Upload Progress */}
        {uploadProgress > 0 && uploadProgress < 100 && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-30">
            <div className="text-center text-white">
              <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin" />
              <p className="text-lg mb-2">جاري رفع الفيديو...</p>
              <div className="w-48 h-2 bg-white/20 rounded-full overflow-hidden mx-auto">
                <div 
                  className="h-full bg-emerald-500 transition-all duration-200"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="mt-2 text-sm text-white/60">{uploadProgress}%</p>
            </div>
          </div>
        )}

        {/* Instructions */}
        {!isRecording && !recordedVideoUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute bottom-44 left-0 right-0 text-center"
          >
            <p className="text-white/80 text-lg">اضغط للتسجيل</p>
            <p className="text-white/50 text-sm mt-1">الحد الأقصى 10 ثواني</p>
          </motion.div>
        )}
      </div>

      {/* Bottom Controls */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-6 pb-8 pt-16"
      >
        {recordedVideoUrl ? (
          <div className="flex items-center justify-center gap-6">
            <Button
              onClick={handleRetake}
              variant="outline"
              className="h-14 px-6 bg-white/10 border-white/30 text-white hover:bg-white/20"
            >
              <X className="w-5 h-5 ml-2" />
              إعادة
            </Button>
            <Button
              onClick={handleUpload}
              disabled={isLoading}
              className="h-14 px-8 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Upload className="w-5 h-5 ml-2" />
                  إرسال
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-center">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={isRecording ? stopRecording : startRecording}
              className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
                isRecording 
                  ? 'bg-red-500 hover:bg-red-600' 
                  : 'bg-white hover:bg-gray-100'
              }`}
            >
              {isRecording ? (
                <Square className="w-8 h-8 text-white" fill="white" />
              ) : (
                <Circle className="w-16 h-16 text-red-500" fill="currentColor" />
              )}
            </motion.button>
          </div>
        )}
      </motion.div>

      {/* Safe Area */}
      <div className="absolute bottom-0 left-0 right-0 h-safe-area-inset-bottom bg-black" />
    </div>
  );
}
