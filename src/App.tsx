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
const AIChatPage = lazy(() => import("./pages/AIChatPage"));
const OnboardingPage = lazy(() => import("./pages/OnboardingPage"));
const SupportPage = lazy(() => import("./pages/SupportPage"));
const SupportDashboardPage = lazy(() => import("./pages/SupportDashboardPage"));
const VipPage = lazy(() => import("./pages/VipPage"));
const SubscriptionsPage = lazy(() => import("./pages/SubscriptionsPage"));
const GamificationPage = lazy(() => import("./pages/GamificationPage"));
const RewardsPage = lazy(() => import("./pages/RewardsPage"));
const ProjectDocsPage = lazy(() => import("./pages/ProjectDocsPage"));
const InstallPage = lazy(() => import("./pages/InstallPage"));
const PrivacyPolicyPage = lazy(() => import("./pages/PrivacyPolicyPage"));
const CompleteProfilePage = lazy(() => import("./pages/CompleteProfilePage"));
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
                  <Route path="/ai-chat" element={<AIChatPage />} />
                  <Route path="/onboarding" element={<OnboardingPage />} />
                  <Route path="/support" element={<SupportPage />} />
                  <Route path="/support-dashboard" element={<SupportDashboardPage />} />
                  <Route path="/vip" element={<VipPage />} />
                  <Route path="/admin/subscriptions" element={<SubscriptionsPage />} />
                  <Route path="/gamification" element={<GamificationPage />} />
                  <Route path="/rewards" element={<RewardsPage />} />
                  <Route path="/project-docs" element={<ProjectDocsPage />} />
                  <Route path="/install" element={<InstallPage />} />
                  <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
                  <Route path="/complete-profile" element={<CompleteProfilePage />} />
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
