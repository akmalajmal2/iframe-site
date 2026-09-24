'use client';

import { useEffect, useState } from 'react';

type View = 'loading' | 'gate' | 'login' | 'dashboard';

function hasSessionCookie(): boolean {
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
  const [gateError, setGateError] = useState('');
  const [loginError, setLoginError] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    (async () => {
      try {
        console.log(
          'checking storage access',
          await document.hasStorageAccess()
        );
        if (typeof document.requestStorageAccess !== 'function') {
          // API unsupported (e.g. insecure context) — fall back as if access is already available
          setView(hasSessionCookie() ? 'dashboard' : 'login');
          return;
        }
        // Try silently first. If a grant already exists (returning user),
        // this resolves instantly with no prompt and no user gesture needed.
        // It only rejects when a fresh user gesture is genuinely required
        // (first-ever visit, or a previously cleared/expired grant).
        await document.requestStorageAccess();
        setView(hasSessionCookie() ? 'dashboard' : 'login');
      } catch {
        setView('gate');
      }
    })();
  }, []);

  async function handleEnableAccess() {
    try {
      if (typeof document.requestStorageAccess !== 'function') {
        throw new Error(
          'requestStorageAccess is unsupported in this context (needs HTTPS)'
        );
      }
      await document.requestStorageAccess();
      setGateError('');
      setView(hasSessionCookie() ? 'dashboard' : 'login');
    } catch (err) {
      setGateError('Access denied by browser: ' + (err as Error).message);
    }
  }

  function handleLogin() {
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

      {view === 'gate' && (
        <div style={styles.card}>
          <h2 style={styles.h2}>Storage access needed</h2>
          <p style={styles.sub}>
            This site is embedded cross-site. Click below to allow it to use its
            own cookies.
          </p>
          <button style={styles.button} onClick={handleEnableAccess}>
            Allow storage access
          </button>
          {gateError && <div style={styles.status}>{gateError}</div>}
        </div>
      )}

      {view === 'login' && (
        <div style={styles.card}>
          <h2 style={styles.h2}>Sign in</h2>
          <p style={styles.sub}>Demo credentials: admin / admin123</p>
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
