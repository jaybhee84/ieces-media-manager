import { useState, useEffect, useRef } from "react";
import { supabase } from "./lib/supabase";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import UpdateBanner from "./components/UpdateBanner";
import mediaManagerLogo from "./image/iecesmediamanager.png";
import { validateMediaSession } from "./lib/mediaAuth";

async function setPresence(session, profile, status) {
  if (!session?.user?.id) return;
  await supabase.from("user_presence").upsert(
    {
      user_id: session.user.id,
      app_id: "media",
      email: profile?.real_email || null,
      status,
      last_seen: new Date().toISOString(),
    },
    { onConflict: "user_id,app_id" },
  );
}

export default function App() {
  const [session, setSession] = useState(null);
  const [mediaProfile, setMediaProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(false);
  const splashTimer = useRef(null);

  useEffect(() => {
    let active = true;

    const loadSession = async (candidateSession, showLoginSplash = false) => {
      if (!candidateSession) {
        if (active) {
          setSession(null);
          setMediaProfile(null);
          setLoading(false);
        }
        return;
      }

      const access = await validateMediaSession(candidateSession);
      if (!access.valid) {
        await supabase.auth.signOut();
        if (active) {
          setSession(null);
          setMediaProfile(null);
          setLoading(false);
        }
        return;
      }

      if (active) {
        setSession(candidateSession);
        setMediaProfile(access.profile);
        setLoading(false);
        if (showLoginSplash) {
          setShowSplash(true);
          clearTimeout(splashTimer.current);
          splashTimer.current = setTimeout(() => setShowSplash(false), 2200);
        }
      }
    };

    supabase.auth.getSession().then(({ data: { session: storedSession } }) =>
      loadSession(storedSession),
    );

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (event === "SIGNED_OUT") {
        setSession(null);
        setMediaProfile(null);
        setLoading(false);
        clearTimeout(splashTimer.current);
        setShowSplash(false);
        return;
      }

      // Defer Supabase queries until the auth callback has returned.
      setTimeout(
        () => loadSession(nextSession, event === "SIGNED_IN"),
        0,
      );
    });

    return () => {
      active = false;
      clearTimeout(splashTimer.current);
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session) return undefined;
    setPresence(session, mediaProfile, "online");
    const heartbeat = setInterval(async () => {
      const access = await validateMediaSession(session);
      if (!access.valid) {
        await supabase.auth.signOut();
        return;
      }
      setPresence(session, access.profile, "online");
    }, 60000);
    const updateVisibility = () =>
      setPresence(
        session,
        mediaProfile,
        document.hidden ? "offline" : "online",
      );
    document.addEventListener("visibilitychange", updateVisibility);
    return () => {
      clearInterval(heartbeat);
      document.removeEventListener("visibilitychange", updateVisibility);
      setPresence(session, mediaProfile, "offline");
    };
  }, [session, mediaProfile]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-rose-900 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 text-sm font-medium">Loading…</p>
        </div>
      </div>
    );
  }

  if (session && showSplash) {
    return (
      <div className="login-splash" role="status" aria-label="Opening dashboard">
        <div className="login-splash-glow" />
        <img
          src={mediaManagerLogo}
          alt="IECES Media Manager"
          className="login-splash-logo"
        />
        <p className="login-splash-text">IECES Media Manager</p>
      </div>
    );
  }

  return (
    <>
      <UpdateBanner />
      {session ? <DashboardPage session={session} profile={mediaProfile} /> : <LoginPage />}
    </>
  );
}
