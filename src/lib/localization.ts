// Arabic localization strings for Nazrah App
export const ar = {
  // App name
  appName: 'نظرة',
  
  // Splash Screen
  splashTagline: 'شاهد أي مكان، الآن',
  
  // Login Screen
  loginTitle: 'تسجيل الدخول',
  loginSubtitle: 'أدخل رقم هاتفك للمتابعة',
  phoneNumberPlaceholder: '5XXXXXXXX',
  phoneNumberLabel: 'رقم الجوال',
  continueButton: 'متابعة',
  termsText: 'بالمتابعة، أنت توافق على',
  termsLink: 'الشروط والأحكام',
  privacyLink: 'سياسة الخصوصية',
  
  // OTP Screen
  otpTitle: 'رمز التحقق',
  otpSubtitle: 'أدخل الرمز المرسل إلى',
  otpPlaceholder: 'XXXXXX',
  verifyButton: 'تحقق',
  resendCode: 'إعادة إرسال الرمز',
  didntReceiveCode: 'لم تستلم الرمز؟',
  
  // Home Screen
  homeTitle: 'الرئيسية',
  welcomeMessage: 'مرحباً بك في نظرة',
  requestVideo: 'اطلب فيديو',
  earnMoney: 'اكسب المال',
  
  // Map Screen
  mapTitle: 'اختر الموقع',
  dropPin: 'حدد الموقع',
  confirmLocation: 'تأكيد الموقع',
  searchLocation: 'ابحث عن موقع...',
  
  // Camera Screen
  cameraTitle: 'تسجيل الفيديو',
  startRecording: 'ابدأ التسجيل',
  stopRecording: 'إيقاف التسجيل',
  recordingTime: 'مدة التسجيل',
  seconds: 'ثواني',
  
  // Profile Screen
  profileTitle: 'الملف الشخصي',
  editProfile: 'تعديل الملف',
  myVideos: 'فيديوهاتي',
  myRequests: 'طلباتي',
  
  // Wallet Screen
  walletTitle: 'المحفظة',
  balance: 'الرصيد',
  addBalance: 'إضافة رصيد',
  withdraw: 'سحب',
  transactions: 'المعاملات',
  
  // Common
  loading: 'جاري التحميل...',
  error: 'حدث خطأ',
  retry: 'إعادة المحاولة',
  cancel: 'إلغاء',
  confirm: 'تأكيد',
  save: 'حفظ',
  delete: 'حذف',
  back: 'رجوع',
  next: 'التالي',
  done: 'تم',
  
  // Errors
  invalidPhone: 'رقم الجوال غير صحيح',
  invalidOtp: 'رمز التحقق غير صحيح',
  networkError: 'خطأ في الاتصال',
  cameraPermission: 'يرجى السماح بالوصول إلى الكاميرا',
  locationPermission: 'يرجى السماح بالوصول إلى الموقع',
  
  // Success messages
  loginSuccess: 'تم تسجيل الدخول بنجاح',
  videoUploaded: 'تم رفع الفيديو بنجاح',
  paymentSuccess: 'تم الدفع بنجاح',
};

export type LocalizationKeys = typeof ar;
export default ar;
