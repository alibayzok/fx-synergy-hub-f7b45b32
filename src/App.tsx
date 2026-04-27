import { useState, useEffect, lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import { ThemeProvider } from "./hooks/useTheme";
import { AppSettingsProvider } from "./hooks/useAppSettings";
import { SplashScreen } from "./components/layout/SplashScreen";
import { PWAInstallBanner } from "./components/layout/PWAInstallBanner";
import { captureReferralCode } from "./hooks/useReferrals";
import { initCapacitorAuthListener } from "./lib/capacitor-auth";
import HomePage from "./pages/HomePage";
import "./i18n";

// Capture referral code from URL immediately
captureReferralCode();

// Lazy load non-critical pages
const TradesPage = lazy(() => import("./pages/TradesPage"));
const CommunityPage = lazy(() => import("./pages/CommunityPage"));
const NewsPage = lazy(() => import("./pages/NewsPage"));
const ArticleDetailPage = lazy(() => import("./pages/ArticleDetailPage"));
const ServicesPage = lazy(() => import("./pages/ServicesPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const UserProfilePage = lazy(() => import("./pages/UserProfilePage"));
const MessagesPage = lazy(() => import("./pages/MessagesPage"));
const AuthPage = lazy(() => import("./pages/AuthPage"));
const AdminPage = lazy(() => import("./pages/AdminPage"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"));
const AnalysesPage = lazy(() => import("./pages/AnalysesPage"));
const AcademyPage = lazy(() => import("./pages/AcademyPage"));
const AcademyLessonPage = lazy(() => import("./pages/AcademyLessonPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes  
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const PageLoader = () => (
  <div className="flex items-center justify-center h-screen bg-background">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
  </div>
);

const App = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [isFirstVisit, setIsFirstVisit] = useState(true);

  useEffect(() => {
    initCapacitorAuthListener();

    // Only show splash on first visit per session
    const hasVisited = sessionStorage.getItem('hasVisited');
    if (hasVisited) {
      setShowSplash(false);
      setIsFirstVisit(false);
    }
  }, []);

  const handleSplashComplete = () => {
    setShowSplash(false);
    sessionStorage.setItem('hasVisited', 'true');
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <AppSettingsProvider>
          <TooltipProvider>
            {isFirstVisit && showSplash && (
              <SplashScreen onComplete={handleSplashComplete} />
            )}
            <Toaster />
            <Sonner />
            <PWAInstallBanner />
            <BrowserRouter>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/trades" element={<TradesPage />} />
                  <Route path="/community" element={<CommunityPage />} />
                  <Route path="/news" element={<NewsPage />} />
                  <Route path="/news/article/:id" element={<ArticleDetailPage />} />
                  <Route path="/markets" element={<NewsPage />} />
                  <Route path="/services" element={<ServicesPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/user/:userId" element={<UserProfilePage />} />
                  <Route path="/messages" element={<MessagesPage />} />
                  <Route path="/auth" element={<AuthPage />} />
                  <Route path="/admin" element={<AdminPage />} />
                  <Route path="/reset-password" element={<ResetPasswordPage />} />
                  <Route path="/analyses" element={<AnalysesPage />} />
                  <Route path="/academy" element={<AcademyPage />} />
                  <Route path="/academy/lesson/:lessonId" element={<AcademyLessonPage />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </TooltipProvider>
          </AppSettingsProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
