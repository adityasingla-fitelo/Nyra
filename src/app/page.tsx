"use client";

import { useState, useEffect } from "react";
import ChatPage from "@/components/ChatPage";
import { Sun, Moon } from "lucide-react";
import {
  signInWithGoogle,
  getCurrentSession,
  upsertGoogleUser,
  signOut,
} from "@/lib/supabase";

export default function Home() {
  const [darkMode, setDarkMode] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showIntro, setShowIntro] = useState(true);

  // Restore session on load
  useEffect(() => {
    (async () => {
      const session = await getCurrentSession();
      if (session?.user) {
        const dbUser = await upsertGoogleUser();
        setUser(dbUser);
        setShowIntro(false);
      }

      const theme = localStorage.getItem("nyra_theme");
      if (theme) setDarkMode(theme === "dark");
      
      const hasSeenIntro = localStorage.getItem("nyra_intro_seen");
      if (hasSeenIntro) setShowIntro(false);
    })();
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("nyra_theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  const handleLogout = async () => {
    await signOut();
    setUser(null);
  };

  const handleContinueFromIntro = () => {
    localStorage.setItem("nyra_intro_seen", "true");
    setShowIntro(false);
  };

  // ─── Logged in → Chat ─────────────────────────────────────────────
  if (user) {
    return (
      <ChatPage
        user={user}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        onLogout={handleLogout}
      />
    );
  }

  // ─── Intro Screen ─────────────────────────────────────────────────
  if (showIntro) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-black flex items-center justify-center px-4 transition-colors duration-300">
        {/* Theme toggle */}
        <button
          type="button"
          onClick={() => setDarkMode(!darkMode)}
          className="fixed top-4 right-4 z-[100] w-14 h-8 rounded-full bg-stone-200 dark:bg-gray-700 shrink-0 flex items-center transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-stone-400 dark:focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-black"
          aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          <span
            className="absolute top-1 left-1 w-6 h-6 rounded-full bg-white dark:bg-gray-600 shadow-md transition-transform duration-300 ease-out"
            style={{ transform: darkMode ? 'translateX(24px)' : 'translateX(0)' }}
          />
          <span className="relative flex w-full justify-between items-center px-2 pointer-events-none">
            <Sun className="w-4 h-4 text-amber-500 dark:text-stone-500 transition-colors duration-300" />
            <Moon className="w-4 h-4 text-stone-500 dark:text-amber-400 transition-colors duration-300" />
          </span>
        </button>

        <div className="w-full max-w-2xl">
          <div className="flex flex-col items-center mb-12">
            <div className="w-32 h-32 rounded-full overflow-hidden mb-8 bg-stone-200 dark:bg-gray-800 ring-2 ring-stone-100 dark:ring-gray-700 animate-fade-in-up">
              <img
                src="https://images.pexels.com/photos/3768894/pexels-photo-3768894.jpeg?auto=compress&cs=tinysrgb&w=400"
                alt="Nyra"
                className="w-full h-full object-cover"
              />
            </div>
            <h1 className="text-stone-800 dark:text-white text-2xl md:text-3xl font-normal text-center leading-relaxed animate-fade-in-up-delay-1">
              <span className="text-[#FF6B4A] font-medium">Nyra</span> is a modern personal health
              <br />
              coach built to provide <span className="text-[#FF6B4A] font-medium">personalized</span>
              <br />
              guidance, consistency, and clarity
              <br />
              across your <span className="text-[#FF6B4A] font-medium">health journey</span>.
            </h1>
          </div>

          <div className="flex justify-center animate-fade-in-up-delay-2">
            <button
              onClick={handleContinueFromIntro}
              className="px-32 py-4 bg-stone-600 dark:bg-[#FF6B4A] text-white rounded-full font-medium hover:bg-stone-700 dark:hover:bg-[#ff5a39] transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2 shadow-md dark:shadow-none"
            >
              Continue
              <span className="text-xl">›</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Login Screen ─────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-stone-50 dark:bg-black flex flex-col items-center justify-center px-4 py-8 transition-colors">
      {/* Theme toggle */}
      <button
        type="button"
        onClick={() => setDarkMode(!darkMode)}
        className="fixed top-4 right-4 z-[100] w-14 h-8 rounded-full bg-stone-200 dark:bg-gray-700 shrink-0 flex items-center transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-stone-400 dark:focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-black"
        aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        <span
          className="absolute top-1 left-1 w-6 h-6 rounded-full bg-white dark:bg-gray-600 shadow-md transition-transform duration-300 ease-out"
          style={{ transform: darkMode ? 'translateX(24px)' : 'translateX(0)' }}
        />
        <span className="relative flex w-full justify-between items-center px-2 pointer-events-none">
          <Sun className="w-4 h-4 text-amber-500 dark:text-stone-500 transition-colors duration-300" />
          <Moon className="w-4 h-4 text-stone-500 dark:text-amber-400 transition-colors duration-300" />
        </span>
      </button>

      <div className="w-full max-w-md">
        {/* Branding with avatar image */}
        <div className="flex flex-col items-center mb-8 animate-fade-in-up">
          <div className="w-28 h-28 rounded-full overflow-hidden mb-5 bg-stone-200 dark:bg-gray-800 ring-2 ring-stone-100 dark:ring-gray-700">
            <img
              src="https://images.pexels.com/photos/3768894/pexels-photo-3768894.jpeg?auto=compress&cs=tinysrgb&w=400"
              alt="Nyra"
              className="w-full h-full object-cover"
            />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-stone-800 dark:text-white tracking-tight">
            Nyra
          </h1>
          <p className="text-stone-500 dark:text-gray-400 text-sm mt-1">
            Your personal health companion
          </p>
        </div>

        {/* Central card - elevated, rounded, shadow */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl dark:shadow-none border border-stone-100 dark:border-gray-800 p-6 sm:p-8 animate-fade-in-up-delay-1 transition-shadow hover:shadow-2xl dark:hover:shadow-none">
          <button
            onClick={async () => {
              setLoading(true);
              await signInWithGoogle();
            }}
            disabled={loading}
            className="w-full py-3.5 rounded-xl font-medium text-white bg-stone-600 dark:bg-[#FF6B4A] hover:bg-stone-700 dark:hover:bg-[#ff5a39] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 flex items-center justify-center gap-3 shadow-md dark:shadow-none"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Sign in with Google
              </>
            )}
          </button>

          <p className="text-stone-500 dark:text-gray-400 text-xs text-center mt-4 flex items-center justify-center gap-1.5">
            <span>🔒</span> Secure sign-in · No OTP · No forms
          </p>
        </div>
      </div>
    </div>
  );
}
