import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { sendOtp, verifyOtp, signup as apiSignup, signin as apiSignin, setPassword as apiSetPassword, getMe, govLogin as apiGovLogin, deptLogin as apiDeptLogin, forgotPassword as apiForgotPassword, resetPassword as apiResetPassword } from "@/lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [deptUser, setDeptUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session from stored token on mount
  useEffect(() => {
    const stored = localStorage.getItem("civicUser");
    const storedDept = localStorage.getItem("civicDeptUser");

    // Restore department user
    if (storedDept) {
      try {
        const parsed = JSON.parse(storedDept);
        if (parsed.token) {
          setDeptUser(parsed);
        }
      } catch {
        localStorage.removeItem("civicDeptUser");
      }
    }

    // Restore regular user
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.token) {
          getMe()
            .then((data) => {
              const freshUser = {
                id: data.id,
                name: data.name,
                email: data.email,
                phone: data.phone,
                token: parsed.token,
                role: "citizen",
              };
              localStorage.setItem("civicUser", JSON.stringify(freshUser));
              setUser(freshUser);
            })
            .catch(() => {
              localStorage.removeItem("civicUser");
            })
            .finally(() => setLoading(false));
          return;
        }

        if (parsed.role === "citizen" && parsed.name) {
          setUser(parsed);
        } else if (parsed.role === "gov") {
          setUser(parsed);
        }
      } catch {
        localStorage.removeItem("civicUser");
      }
    }
    setLoading(false);
  }, []);

  // Sign up a new user (sends OTP for email verification)
  const signup = useCallback(async (email, password, name, phone) => {
    try {
      const result = await apiSignup(email, password, name, phone);
      return { success: true, emailSent: result.email_sent };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, []);

  // Sign in with email + password (no OTP)
  const signin = useCallback(async (email, password) => {
    try {
      const result = await apiSignin(email, password);
      if (result.success) {
        const userData = {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
          phone: result.user.phone,
          token: result.token,
          role: "citizen",
        };
        localStorage.setItem("civicUser", JSON.stringify(userData));
        setUser(userData);
        return { success: true };
      }
      // Check if user needs to set up password first
      if (result.needs_password_setup) {
        return {
          success: false,
          needsPasswordSetup: true,
          email: result.email,
          emailSent: result.email_sent,
          message: result.message,
        };
      }
      return { success: false, error: "Sign in failed" };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, []);

  // Set password for OTP-only accounts via OTP verification
  const setPassword = useCallback(async (email, otp, password) => {
    try {
      const result = await apiSetPassword(email, otp, password);
      if (result.success) {
        const userData = {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
          phone: result.user.phone,
          token: result.token,
          role: "citizen",
        };
        localStorage.setItem("civicUser", JSON.stringify(userData));
        setUser(userData);
        return { success: true };
      }
      return { success: false, error: "Failed to set password" };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, []);

  const requestOtp = useCallback(async (email) => {
    const result = await sendOtp(email);
    return { success: true, emailSent: result.email_sent };
  }, []);

  const verifyOtpAndLogin = useCallback(async (email, otp, name, phone, password) => {
    try {
      const result = await verifyOtp(email, otp, name, phone, password);
      if (result.success) {
        const userData = {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
          phone: result.user.phone,
          token: result.token,
          role: "citizen",
        };
        localStorage.setItem("civicUser", JSON.stringify(userData));
        setUser(userData);
        return { success: true };
      }
      return { success: false, error: "Verification failed" };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, []);

  // Gov login – authenticates via backend and stores JWT token
  const govLogin = useCallback(async ({ username, password }) => {
    try {
      const result = await apiGovLogin(username, password);
      if (result.success) {
        const userData = {
          id: result.user.id,
          name: result.user.name,
          role: result.user.role,
          token: result.token,
        };
        localStorage.setItem("civicUser", JSON.stringify(userData));
        setUser(userData);
        return { success: true };
      }
      return { success: false, error: "Login failed" };
    } catch (err) {
      return { success: false, error: err.message || "Invalid credentials. Try admin / admin123" };
    }
  }, []);

  // Department login
  const deptLogin = useCallback(async ({ username, password }) => {
    try {
      const result = await apiDeptLogin(username, password);
      if (result.success) {
        const deptData = {
          id: result.user.id,
          name: result.user.name,
          username: result.user.username,
          phone: result.user.phone,
          deptSlug: result.user.deptSlug,
          deptName: result.user.deptName,
          role: result.user.role,
          token: result.token,
        };
        localStorage.setItem("civicDeptUser", JSON.stringify(deptData));
        setDeptUser(deptData);
        return { success: true };
      }
      return { success: false, error: "Login failed" };
    } catch (err) {
      return { success: false, error: err.message || "Invalid department credentials" };
    }
  }, []);

  // Forgot password - send OTP
  const forgotPassword = useCallback(async (email) => {
    try {
      const result = await apiForgotPassword(email);
      return { success: true, emailSent: result.email_sent, message: result.message };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, []);

  // Reset password after OTP verification
  const resetPassword = useCallback(async (email, otp, password) => {
    try {
      const result = await apiResetPassword(email, otp, password);
      if (result.success) {
        const userData = {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
          phone: result.user.phone,
          token: result.token,
          role: "citizen",
        };
        localStorage.setItem("civicUser", JSON.stringify(userData));
        setUser(userData);
        return { success: true };
      }
      return { success: false, error: "Failed to reset password" };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("civicUser");
    localStorage.removeItem("civicDeptUser");
    setUser(null);
    setDeptUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        deptUser,
        loading,
        signup,
        signin,
        setPassword,
        requestOtp,
        verifyOtpAndLogin,
        govLogin,
        deptLogin,
        forgotPassword,
        resetPassword,
        logout,
        isAuthenticated: !!user,
        isDept: !!deptUser,
        isGov: user?.role === "gov",
        isCitizen: user?.role === "citizen",
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
