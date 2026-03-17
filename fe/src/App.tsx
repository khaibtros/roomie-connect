import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import Landing from "./pages/Landing";
import Home from "./pages/Home";
import FindRoom from "./pages/FindRoom";
import FindRoommateChoice from "./pages/FindRoommateChoice";
import RoomDetail from "./pages/RoomDetail";
import SavedRooms from "./pages/tenant/features/saved-rooms/page";
import HistoryPage from "./pages/tenant/features/history/page";
import NotificationPage from "./pages/tenant/features/notification/page";
import PrivacyPage from "./pages/tenant/features/privacy/page";
import RatingPage from "./pages/tenant/features/rating/page";
import FAQPage from "./pages/tenant/features/support/pages/FAQPage";
import ContactSupportPage from "./pages/tenant/features/support/pages/ContactSupportPage";
import Quiz from "./pages/Quiz";
import Matches from "./pages/Matches";
import Messages from "./pages/Messages";
import Profile from "./pages/Profile";
import EditProfile from "./pages/EditProfile";
import NotFound from "./pages/NotFound";
import LoginPage from "./pages/auth/Login";
import RegisterPage from "./pages/auth/Register";
import ForgotPasswordPage from "./pages/auth/ForgotPassword";
import ChangePasswordPage from "./pages/auth/ChangePassword";
import ScrollToTop from "./components/ScrollToTop";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import TenantAIChat from "./pages/tenant/AIChat";
import TenantAIPayment from "./pages/tenant/AIPayment";
import TenantViewings from "./pages/tenant/features/contracts/page";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminRooms from "./pages/admin/Rooms";
import AdminUsers from "./pages/admin/Users";
import AdminReports from "./pages/admin/Reports";
import AdminTransactions from "./pages/admin/Transactions";
import AdminSettings from "./pages/admin/Settings";
import AdminViewings from "./pages/admin/Viewings";
import LandlordDashboard from "./pages/landlord/Dashboard";
import LandlordPosts from "./pages/landlord/Posts";
import LandlordProfile from "./pages/landlord/Profile";
import CreatePost from "./pages/landlord/CreatePost";
import LandlordSubscription from "./pages/landlord/Subscription";
import LandlordViewingPage from "./pages/landlord/ViewingManagement";
// import ContractManagement from "./pages/landlord/ContractManagement";
import History from "./pages/History";
import Notifications from "./pages/Notifications";
import Privacy from "./pages/Privacy";
import Support from "./pages/Support";
import AppRating from "./pages/AppRating";

const queryClient = new QueryClient();

function ProtectedRoute({
  children,
  role,
}: {
  children: JSX.Element;
  role?: "tenant" | "landlord" | "admin";
}) {
  const auth = useAuth();
  const location = useLocation();

  if (auth.loading) return <div className="container py-8">Loading...</div>;
  if (!auth.user) {
    return (
      <Navigate to={`/auth/login?returnTo=${location.pathname}`} replace />
    );
  }
  if (role && auth.role !== role && auth.role !== "admin") {
    return <div className="container py-8">Không có quyền truy cập</div>;
  }
  return children;
}

const App = () => (
  <AuthProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth/login" element={<LoginPage />} />
            <Route path="/auth/register" element={<RegisterPage />} />
            <Route
              path="/auth/forgot-password"
              element={<ForgotPasswordPage />}
            />
            <Route
              path="/auth/change-password"
              element={<ChangePasswordPage />}
            />

            <Route path="/home" element={<Home />} />
            <Route path="/find-room" element={<FindRoom />} />
            <Route path="/find-roommate" element={<FindRoommateChoice />} />
            <Route path="/rooms/:id" element={<RoomDetail />} />
            <Route path="/saved-rooms" element={<SavedRooms />} />

            {/* Tenant routes */}
            <Route
              path="/tenant/ai-chat"
              element={
                <ProtectedRoute role="tenant">
                  <TenantAIChat />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tenant/ai-payment"
              element={
                <ProtectedRoute role="tenant">
                  <TenantAIPayment />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tenant/find-room"
              element={
                <ProtectedRoute role="tenant">
                  <FindRoom />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tenant/viewings"
              element={
                <ProtectedRoute role="tenant">
                  <TenantViewings />
                </ProtectedRoute>
              }
            />

            {/* Landlord routes (dashboard + create) */}
            <Route
              path="/landlord/dashboard"
              element={
                <ProtectedRoute role="landlord">
                  <LandlordDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/landlord/posts"
              element={
                <ProtectedRoute role="landlord">
                  <LandlordPosts />
                </ProtectedRoute>
              }
            />
            <Route
              path="/landlord/subscription"
              element={
                <ProtectedRoute role="landlord">
                  <LandlordSubscription />
                </ProtectedRoute>
              }
            />
            <Route
              path="/landlord/viewings"
              element={
                <ProtectedRoute role="landlord">
                  <LandlordViewingPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/landlord/create-post"
              element={
                <ProtectedRoute role="landlord">
                  <CreatePost />
                </ProtectedRoute>
              }
            />
            <Route
              path="/landlord/profile"
              element={
                <ProtectedRoute role="landlord">
                  <LandlordProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/landlord/post"
              element={
                <ProtectedRoute role="landlord">
                  <CreatePost />
                </ProtectedRoute>
              }
            />
            <Route
              path="/landlord/edit-post/:id"
              element={
                <ProtectedRoute role="landlord">
                  <CreatePost />
                </ProtectedRoute>
              }
            />
            {/* keep legacy /landlord -> redirect to dashboard */}
            <Route
              path="/landlord"
              element={<Navigate to="/landlord/dashboard" replace />}
            />

            {/* Admin routes */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute role="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/rooms"
              element={
                <ProtectedRoute role="admin">
                  <AdminRooms />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute role="admin">
                  <AdminUsers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/reports"
              element={
                <ProtectedRoute role="admin">
                  <AdminReports />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/transactions"
              element={
                <ProtectedRoute role="admin">
                  <AdminTransactions />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <ProtectedRoute role="admin">
                  <AdminSettings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/viewings"
              element={
                <ProtectedRoute role="admin">
                  <AdminViewings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={<Navigate to="/admin/dashboard" replace />}
            />

            <Route path="/history" element={<HistoryPage />} />
            <Route path="/notifications" element={<NotificationPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/rate-app" element={<RatingPage />} />
            <Route path="/faq" element={<FAQPage />} />
            <Route path="/support/contact" element={<ContactSupportPage />} />
            <Route path="/quiz" element={<Quiz />} />
            <Route path="/matches" element={<Matches />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/profile" element={<Profile />} />
            <Route
              path="/quiz"
              element={
                <ProtectedRoute>
                  <Quiz />
                </ProtectedRoute>
              }
            />
            <Route
              path="/matches"
              element={
                <ProtectedRoute>
                  <Matches />
                </ProtectedRoute>
              }
            />
            <Route
              path="/messages"
              element={
                <ProtectedRoute>
                  <Messages />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route path="/history" element={<History />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/support" element={<Support />} />
            <Route path="/app-rating" element={<AppRating />} />
            <Route
              path="/edit-profile"
              element={
                <ProtectedRoute>
                  <EditProfile />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </AuthProvider>
);

export default App;
