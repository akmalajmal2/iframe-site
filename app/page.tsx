'use client';

import { useEffect, useState } from 'react';

type View = 'loading' | 'login' | 'dashboard';

function hasSessionCookie(): boolean {
  if (typeof document === 'undefined') return false;
  return document.cookie
    .split('; ')
    .some((c) => c.startsWith('session=loggedin'));
}

function setSessionCookie() {
  document.cookie =
    'session=loggedin; Secure; SameSite=None; path=/; max-age=3600';
}

function clearSessionCookie() {
  document.cookie = 'session=; Secure; SameSite=None; path=/; max-age=0';
}

export default function Page() {
  const [view, setView] = useState<View>('loading');
  const [storageAccessEnabled, setStorageAccessEnabled] = useState(false);
  const [enableError, setEnableError] = useState('');
  const [loginError, setLoginError] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    (async () => {
      console.log(444, document.hasStorageAccess());
      // If a session cookie already exists (unpartitioned access must have
      // worked before), go straight to dashboard — no banner needed.
      if (hasSessionCookie()) {
        setStorageAccessEnabled(true);
        setView('dashboard');
        return;
      }
      // Not logged in — check current status to decide whether to show
      // the banner. This is a pure read, informational only; it does
      // NOT block the login form either way.
      if (typeof document.hasStorageAccess === 'function') {
        const has = await document.hasStorageAccess();
        setStorageAccessEnabled(has);
      }
      setView('login');
    })();
  }, []);

  async function handleEnableAccess() {
    try {
      if (typeof document.requestStorageAccess !== 'function') {
        throw new Error('Not supported in this context (needs HTTPS)');
      }
      await document.requestStorageAccess();
      setStorageAccessEnabled(true);
      setEnableError('');
    } catch (err) {
      setEnableError('Access denied: ' + (err as Error).message);
    }
  }

  function handleLogin() {
    // Login always works, with or without storage access.
    // Without it, the cookie write may not survive a refresh —
    // that's expected, not something to hide from the user.
    if (username === 'admin' && password === 'admin123') {
      setLoginError(false);
      setSessionCookie();
      setView('dashboard');
    } else {
      setLoginError(true);
    }
  }

  function handleLogout() {
    clearSessionCookie();
    setUsername('');
    setPassword('');
    setView('login');
  }

  return (
    <div style={styles.page}>
      {view === 'loading' && <div style={styles.status}>Loading…</div>}

      {view === 'login' && (
        <div style={styles.card}>
          <h2 style={styles.h2}>Sign in</h2>
          <p style={styles.sub}>Demo credentials: admin / admin123</p>

          {!storageAccessEnabled && (
            <div style={styles.banner}>
              <p style={styles.bannerText}>
                Storage access isn&apos;t enabled. You can still log in, but the
                session may not persist after a refresh.
              </p>
              <button style={styles.bannerButton} onClick={handleEnableAccess}>
                Enable storage access
              </button>
              {enableError && <div style={styles.error}>{enableError}</div>}
            </div>
          )}

          {loginError && <div style={styles.error}>Invalid credentials</div>}
          <input
            style={styles.input}
            placeholder="Username"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            style={styles.input}
            type="password"
            placeholder="Password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button style={styles.button} onClick={handleLogin}>
            Login
          </button>
        </div>
      )}

      {view === 'dashboard' && (
        <div style={styles.card}>
          <div style={styles.dashRow}>
            <h2 style={{ ...styles.h2, margin: 0 }}>Dashboard</h2>
            <span style={styles.badge}>Logged in</span>
          </div>
          <p style={styles.sub}>
            Session cookie is being read successfully from this iframe&apos;s
            own origin.
          </p>
          <button
            style={{ ...styles.button, ...styles.logout }}
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  page: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    padding: 16,
  },
  card: {
    background: '#1e293b',
    border: '1px solid #334155',
    borderRadius: 10,
    padding: 28,
    width: '100%',
    maxWidth: 340,
  },
  h2: { margin: '0 0 6px', fontSize: 18 },
  sub: { margin: '0 0 20px', color: '#94a3b8', fontSize: 13 },
  banner: {
    background: '#312e81',
    border: '1px solid #4338ca',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  bannerText: {
    margin: '0 0 10px',
    fontSize: 12,
    color: '#c7d2fe',
    lineHeight: 1.4,
  },
  bannerButton: {
    width: '100%',
    padding: 8,
    border: 'none',
    borderRadius: 6,
    background: '#4f46e5',
    color: 'white',
    fontWeight: 600,
    cursor: 'pointer',
    fontSize: 13,
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    marginBottom: 12,
    borderRadius: 6,
    border: '1px solid #334155',
    background: '#0f172a',
    color: '#e2e8f0',
    fontSize: 14,
  },
  button: {
    width: '100%',
    padding: 10,
    border: 'none',
    borderRadius: 6,
    background: '#6366f1',
    color: 'white',
    fontWeight: 600,
    cursor: 'pointer',
    fontSize: 14,
  },
  logout: { background: '#334155', marginTop: 8 },
  status: {
    marginTop: 14,
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
  error: { color: '#f87171', fontSize: 12, margin: '8px 0 0' },
  dashRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  badge: {
    background: '#16a34a',
    color: 'white',
    fontSize: 11,
    padding: '3px 8px',
    borderRadius: 999,
  },
};
