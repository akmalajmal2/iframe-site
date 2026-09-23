'use client';

import { useEffect, useState } from 'react';

const COOKIE_NAME = 'session';

function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function setSessionCookie(username: string) {
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(username)}; SameSite=None; Secure; path=/; max-age=${60 * 60 * 24}`;
}

function clearSessionCookie() {
  document.cookie = `${COOKIE_NAME}=; SameSite=None; Secure; path=/; max-age=0`;
}

type View = 'checking' | 'no-access' | 'login' | 'dashboard';

// This is the page that gets iframed by site-a-embedder.
// It's the "third-party" widget that needs storage access before it can
// touch its own cookies.
export default function EmbeddedWidget() {
  const [supported, setSupported] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [view, setView] = useState<View>('checking');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof document === 'undefined' || !('hasStorageAccess' in document)) {
      setSupported(false);
      return;
    }
    console.log('has access', document.hasStorageAccess());
    document.hasStorageAccess().then((granted) => {
      console.log('[site-b] hasStorageAccess():', granted);
      setHasAccess(granted);
      // Only look at the cookie once access is confirmed - not before.
      setView(
        granted
          ? readCookie(COOKIE_NAME)
            ? 'dashboard'
            : 'login'
          : 'no-access'
      );
    });
  }, []);

  const handleEnableAccess = async () => {
    setError(null);
    try {
      // Must run synchronously inside this click handler - a user gesture.
      await document.requestStorageAccess();
      setHasAccess(true);
      setView(readCookie(COOKIE_NAME) ? 'dashboard' : 'login');
    } catch {
      setError('Storage access was denied.');
    }
  };

  const handleLogin = (username: string) => {
    // Only reachable once hasAccess is true - safe to write the cookie now.
    setSessionCookie(username);
    setView('dashboard');
  };

  const handleLogout = () => {
    clearSessionCookie();
    setView('login');
  };

  if (!supported) {
    return <p>Storage Access API isn&apos;t supported in this browser.</p>;
  }

  if (view === 'checking') {
    return <p>Checking storage access…</p>;
  }

  // --- Restriction: no cookie is ever read or written until access is granted ---
  if (view === 'no-access' || !hasAccess) {
    return (
      <div>
        <p>This embedded widget can&apos;t read or set cookies here yet.</p>
        <button onClick={handleEnableAccess}>Enable storage access</button>
        {error && <p style={{ color: 'crimson' }}>{error}</p>}
      </div>
    );
  }

  if (view === 'login') {
    return <LoginForm onLogin={handleLogin} />;
  }

  return (
    <Dashboard
      username={readCookie(COOKIE_NAME) ?? ''}
      onLogout={handleLogout}
    />
  );
}

function LoginForm({ onLogin }: { onLogin: (username: string) => void }) {
  const [username, setUsername] = useState('');

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (username.trim()) onLogin(username.trim());
      }}
    >
      <p>Not logged in.</p>
      <input
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="username"
      />
      <button type="submit">Log in</button>
    </form>
  );
}

function Dashboard({
  username,
  onLogout,
}: {
  username: string;
  onLogout: () => void;
}) {
  return (
    <div>
      <p>✅ Logged in as {username}</p>
      <p>
        This cookie persists across reloads as long as storage access stays
        granted.
      </p>
      <button onClick={onLogout}>Log out</button>
    </div>
  );
}
