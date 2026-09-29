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
    'session=loggedin; Secure; SameSite=None; path=/; max-age=3600;';
}

function clearSessionCookie() {
  document.cookie = 'session=; Secure; SameSite=None; path=/; max-age=0;';
}

export default function Page() {
  const [view, setView] = useState<View>('loading');
  const [loginError, setLoginError] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      // Fallback for browsers that do not support Storage Access API
      if (!document.hasStorageAccess) {
        setView(hasSessionCookie() ? 'dashboard' : 'login');
        return;
      }

      try {
        const has = await document.hasStorageAccess();
        console.log('is storage access enabled:', has);

        if (!has) {
          // Silent attempt on load: succeeds only if a grant already exists
          // await document.requestStorageAccess();
          console.log('helll');
        }
        setView(hasSessionCookie() ? 'dashboard' : 'login');
      } catch {
        // No grant yet — show login; permission is requested on Login click
        setView('login');
      }
    })();
  }, []);

  async function handleLogin() {
    if (username !== 'admin' || password !== 'admin123') {
      setLoginError('Invalid credentials');
      return;
    }

    setLoginError('');
    setSubmitting(true);

    try {
      // Called directly from the click handler (valid user gesture),
      // so the browser shows the "allow embedded content" prompt here.
      if (document.requestStorageAccess) {
        const has = document.hasStorageAccess
          ? await document.hasStorageAccess()
          : false;
        // if (!has) await document.requestStorageAccess();
        await document.requestStorageAccess();
      }
      setSessionCookie();
      setView('dashboard');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Access request failed';
      setLoginError('Storage access denied: ' + message);
    } finally {
      setSubmitting(false);
    }
  }

  function handleLogout() {
    clearSessionCookie();
    setUsername('');
    setPassword('');
    setLoginError('');
    setView('login');
  }

  return (
    <div style={styles.page}>
      {view === 'loading' && (
        <div style={styles.card}>
          <p style={{ ...styles.sub, margin: 0, textAlign: 'center' }}>
            Loading...
          </p>
        </div>
      )}

      {view === 'login' && (
        <div style={styles.card}>
          <h2 style={styles.h2}>Sign in</h2>
          <p style={styles.sub}>Demo credentials: admin / admin123</p>
          {loginError && <div style={styles.error}>{loginError}</div>}
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
          <button
            style={{ ...styles.button, opacity: submitting ? 0.7 : 1 }}
            onClick={handleLogin}
            disabled={submitting}
          >
            {submitting ? 'Signing in...' : 'Login'}
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
  error: { color: '#f87171', fontSize: 12, margin: '-6px 0 12px' },
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
