import { useState } from "react";

// Official Google "G" logo (4-color)
function GoogleLogo({ className = "w-5 h-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"
      />
    </svg>
  );
}

export default function GoogleSignInButton({ label = "Continue with Google", redirect = "/my-complaints" }) {
  const [notice, setNotice] = useState("");

  const handleClick = () => {
    const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
    if (!clientId) {
      setNotice(
        "Google Sign-In isn't configured yet. Add your Google OAuth Client ID (REACT_APP_GOOGLE_CLIENT_ID) to enable it."
      );
      return;
    }
    const apiBase = process.env.REACT_APP_API_URL || "http://localhost:8000/api";
    const redirectUri =
      process.env.REACT_APP_GOOGLE_REDIRECT_URI ||
      `${apiBase}/auth/google/callback`;
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "openid email profile",
      prompt: "select_account",
    });
    // Round-trip the post-login destination through Google's state param
    if (redirect && redirect.startsWith("/")) params.set("state", redirect);
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleClick}
        className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white hover:bg-gray-50 text-gray-800 font-medium rounded-xl border border-white/20 shadow-lg shadow-black/10 transition-all hover:-translate-y-0.5 hover:shadow-xl"
      >
        <GoogleLogo />
        {label}
      </button>
      {notice && (
        <p className="text-xs text-amber-300/90 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
          {notice}
        </p>
      )}
    </div>
  );
}