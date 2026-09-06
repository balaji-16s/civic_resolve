import "leaflet/dist/leaflet.css";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import Layout from "@/components/Layout";
import Home from "@/components/Home";
import Report from "@/components/Report";
import ReportStart from "@/components/ReportStart";
import SignUp from "@/components/SignUp";
import SignIn from "@/components/SignIn";
import Login from "@/components/Login";
import GovLogin from "@/components/GovLogin";
import ForgotPassword from "@/components/ForgotPassword";
import GoogleCallback from "@/components/GoogleCallback";
import MyComplaints from "@/components/MyComplaints";
import Dashboard from "@/components/Dashboard";
import DeptLogin from "@/components/DeptLogin";
import DeptDashboard from "@/components/DeptDashboard";
import { GovRoute, CitizenRoute, DeptRoute } from "@/components/ProtectedRoute";

const BASENAME = process.env.REACT_APP_BASENAME || process.env.PUBLIC_URL || '';

function App() {
  return (
    <BrowserRouter basename={BASENAME}>
      <AuthProvider>
        <Routes>
          {/* Public routes with Layout (navbar + footer) */}
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/auth/google/callback" element={<GoogleCallback />} />
            <Route path="/login" element={<Login />} />
            <Route path="/report" element={<ReportStart />} />
            <Route path="/report-form" element={
              <CitizenRoute>
                <Report />
              </CitizenRoute>
            } />

            {/* Citizen only */}
            <Route
              path="/my-complaints"
              element={
                <CitizenRoute>
                  <MyComplaints />
                </CitizenRoute>
              }
            />
          </Route>

          {/* Government routes - no Layout wrapper (full-screen header) */}
          <Route path="/gov-login" element={<GovLogin />} />
          <Route
            path="/dashboard"
            element={
              <GovRoute>
                <Dashboard />
              </GovRoute>
            }
          />

          {/* Department routes */}
          <Route path="/dept-login" element={<DeptLogin />} />
          <Route
            path="/dept-dashboard"
            element={
              <DeptRoute>
                <DeptDashboard />
              </DeptRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
