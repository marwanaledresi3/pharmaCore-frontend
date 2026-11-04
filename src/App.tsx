// import React from 'react';
// import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
// import { AuthProvider, useAuth } from './context/AuthContext';
// import { LoginPage } from './pages/LoginPage';
// import { DeliveryConfirmPage } from './pages/DeliveryConfirmPage';
// import { AppLayout } from './components/layout/AppLayout';
// import { LoadingSpinner } from './components/common/LoadingSpinner';
// import { WebSocketProvider } from './context/WebSocketContext';
// import LandingPage from './pages/LandingPage';
// const MainApp: React.FC = () => {
//   const { isAuthenticated, isLoading } = useAuth();

//   if (isLoading) {
//     return (
//       <div className="flex h-screen w-full items-center justify-center bg-slate-900" dir="rtl">
//         <div className="text-center space-y-4">
//           <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500 text-white font-black text-2xl shadow-lg">
//             PH
//           </div>
//           <div>
//             <h1 className="text-xl font-black text-white">PharmaCore ERP</h1>
//             <p className="text-xs text-slate-400 mt-1">نظام إدارة سلاسل الإمداد وسوق B2B الدوائي</p>
//           </div>
//           <div className="pt-2">
//             <LoadingSpinner message="جاري التحقق من جلسة العمل..." />
//           </div>
//         </div>
//       </div>
//     );
//   }

//   if (!isAuthenticated) return <LandingPage  />;

//   return <AppLayout />;
// };

// export default function App() {
//   return (
//     <AuthProvider>
//        <WebSocketProvider>
//          <BrowserRouter>
//         <Routes>
//           {/* ✅ صفحة QR العامة — تعمل مع/بدون مصادقة */}
//           <Route path="/deliveries/confirm" element={<DeliveryConfirmPage />} />

//           {/* التطبيق الرئيسي (مصادقة + layout) */}
//           <Route path="/*" element={<MainApp />} />

//           {/* تحويل المسارات غير المعروفة */}
//           <Route path="*" element={<Navigate to="/" replace />} />
//         </Routes>
//       </BrowserRouter>

//        </WebSocketProvider>
     
//     </AuthProvider>
//   );
// }


import React from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';

import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { DeliveryConfirmPage } from './pages/DeliveryConfirmPage';
import { AppLayout } from './components/layout/AppLayout';
import { LoadingSpinner } from './components/common/LoadingSpinner';
import { WebSocketProvider } from './context/WebSocketContext';
import LandingPage from './pages/LandingPage';

function FullScreenLoader() {
  return (
    <div
      className="flex h-screen w-full items-center justify-center bg-slate-900"
      dir="rtl"
    >
      <div className="text-center space-y-4">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500 text-white font-black text-2xl shadow-lg">
          PH
        </div>

        <div>
          <h1 className="text-xl font-black text-white">
            PharmaCore ERP
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            نظام إدارة سلاسل الإمداد وسوق B2B الدوائي
          </p>
        </div>

        <div className="pt-2">
          <LoadingSpinner message="جاري التحقق من جلسة العمل..." />
        </div>
      </div>
    </div>
  );
}

// حارس صفحة تسجيل الدخول
function PublicOnlyRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <FullScreenLoader />;

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

// حارس التطبيق
function ProtectedApp() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <FullScreenLoader />;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <AppLayout />;
}

export default function App() {
  return (
    <AuthProvider>
      <WebSocketProvider>
        <BrowserRouter>
            {/* صفحة تأكيد التسليم العامة */}
           <Routes>

  {/* الصفحة التعريفية العامة */}
  <Route
    path="/"
    element={<LandingPage />}
  />

  {/* تأكيد التسليم - متاح للجميع */}
  <Route
    path="/deliveries/confirm"
    element={<DeliveryConfirmPage />}
  />

  {/* تسجيل الدخول */}
  <Route
    path="/login"
    element={
      <PublicOnlyRoute>
        <LoginPage />
      </PublicOnlyRoute>
    }
  />

  {/* جميع صفحات النظام التشغيلية محمية */}
  <Route
    path="/*"
    element={<ProtectedApp />}
  />

</Routes>
        </BrowserRouter>
      </WebSocketProvider>
    </AuthProvider>
  );
}
