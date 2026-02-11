import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import { ThemeProvider } from "./hooks/useTheme";
import { AppSettingsProvider } from "./hooks/useAppSettings";
import { SplashScreen } from "./components/layout/SplashScreen";
import HomePage from "./pages/HomePage";
import TradesPage from "./pages/TradesPage";
import CommunityPage from "./pages/CommunityPage";
import NewsPage from "./pages/NewsPage";
import ArticleDetailPage from "./pages/ArticleDetailPage";
import ServicesPage from "./pages/ServicesPage";
import ProfilePage from "./pages/ProfilePage";
import UserProfilePage from "./pages/UserProfilePage";
import MessagesPage from "./pages/MessagesPage";
import AuthPage from "./pages/AuthPage";
import AdminPage from "./pages/AdminPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import AnalysesPage from "./pages/AnalysesPage";
import AIChatPage from "./pages/AIChatPage";
import OnboardingPage from "./pages/OnboardingPage";
import SupportPage from "./pages/SupportPage";
import SupportDashboardPage from "./pages/SupportDashboardPage";
import VipPage from "./pages/VipPage";
import SubscriptionsPage from "./pages/SubscriptionsPage";
import NotFound from "./pages/NotFound";
import "./i18n";

const queryClient = new QueryClient();

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
            <BrowserRouter>
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
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
          </AppSettingsProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
