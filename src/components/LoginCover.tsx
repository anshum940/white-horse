import { useEffect, useState, type FormEvent } from 'react';
import { verifyDemoCredentials } from '../domain/demoAuthentication';
import type { ThemePreference } from '../domain/themePreference';
import { Icon } from './Icon';
import { ThemeToggle } from './ThemeToggle';

const MAX_ATTEMPTS = 5;
const LOCK_SECONDS = 30;

export function LoginCover({ onAuthenticated, theme, onToggleTheme }: { onAuthenticated: () => void; theme: ThemePreference; onToggleTheme: () => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [lockRemaining, setLockRemaining] = useState(0);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (lockRemaining <= 0) return;
    const timer = window.setInterval(() => {
      setLockRemaining((remaining) => Math.max(0, remaining - 1));
    }, 1_000);
    return () => window.clearInterval(timer);
  }, [lockRemaining]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (lockRemaining > 0 || busy) return;
    if (!username.trim() || !password) {
      setError('Enter both the username and password.');
      return;
    }

    setBusy(true);
    setError('');
    try {
      if (await verifyDemoCredentials(username, password)) {
        setAttempts(0);
        setPassword('');
        onAuthenticated();
        return;
      }
      const nextAttempts = attempts + 1;
      setAttempts(nextAttempts);
      setPassword('');
      if (nextAttempts >= MAX_ATTEMPTS) {
        setAttempts(0);
        setLockRemaining(LOCK_SECONDS);
        setError(`Too many unsuccessful attempts. Try again in ${LOCK_SECONDS} seconds.`);
      } else {
        setError(`Username or password is incorrect. ${MAX_ATTEMPTS - nextAttempts} attempt${MAX_ATTEMPTS - nextAttempts === 1 ? '' : 's'} remaining.`);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="login-cover">
      <section className="login-visual" aria-label="White Horse financial reporting">
        <div className="login-grid"/>
        <div className="login-orbit login-orbit-one"/>
        <div className="login-orbit login-orbit-two"/>
        <header className="login-brand">
          <img src={`${import.meta.env.BASE_URL}white-horse.svg`} alt=""/>
          <div><strong>WHITE HORSE</strong><span>Financial reporting workspace</span></div>
        </header>
        <div className="login-hero-mark"><img src={`${import.meta.env.BASE_URL}white-horse.svg`} alt="White Horse emblem"/></div>
        <div className="login-visual-copy">
          <span>Clarity · control · confidence</span>
          <h1>Financial statements,<br/>prepared with discipline.</h1>
          <p>A focused workspace for Trial Balance control, Schedule III-oriented presentation, professional review and board-ready reporting.</p>
        </div>
        <div className="login-assurance-row">
          <div><Icon name="shield"/><span><strong>Controlled</strong><small>Review-led workflow</small></span></div>
          <div><Icon name="database"/><span><strong>Local-first</strong><small>Browser-held data</small></span></div>
          <div><Icon name="statements"/><span><strong>Professional</strong><small>Traceable outputs</small></span></div>
        </div>
      </section>

      <section className="login-panel">
        <ThemeToggle theme={theme} onToggle={onToggleTheme} className="login-theme-toggle"/>
        <div className="login-form-shell">
          <div className="login-mobile-brand"><img src={`${import.meta.env.BASE_URL}white-horse.svg`} alt=""/><strong>WHITE HORSE</strong></div>
          <p className="eyebrow">Secure workspace entry</p>
          <h2>Welcome back</h2>
          <p className="login-intro">Enter the authorised study credentials to open the White Horse workspace.</p>

          <form onSubmit={(event) => void submit(event)} noValidate>
            <label className="login-field">
              <span>Username</span>
              <div><Icon name="company" size={17}/><input autoFocus autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} placeholder="Enter username" disabled={lockRemaining > 0}/></div>
            </label>
            <label className="login-field">
              <span>Password</span>
              <div><Icon name="lock" size={17}/><input type={showPassword ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter password" disabled={lockRemaining > 0}/><button type="button" onClick={() => setShowPassword((shown) => !shown)} aria-label={showPassword ? 'Hide password' : 'Show password'}><Icon name="eye" size={17}/></button></div>
            </label>
            {(error || lockRemaining > 0) && <div className="login-error" role="alert"><Icon name="error" size={16}/><span>{lockRemaining > 0 ? `Access temporarily paused. Try again in ${lockRemaining} second${lockRemaining === 1 ? '' : 's'}.` : error}</span></div>}
            <button className="login-submit" type="submit" disabled={busy || lockRemaining > 0}>{busy ? 'Verifying…' : 'Enter White Horse'}<Icon name="arrow-right" size={17}/></button>
          </form>

          <div className="login-security-note"><Icon name="info" size={16}/><p><strong>Study access cover</strong><span>This public static demo uses a client-side presentation gate. Production deployment requires server-enforced identity and tenant access controls.</span></p></div>
          <footer><span>Schedule III · Division I-oriented</span><span>Data remains in this browser</span></footer>
        </div>
      </section>
    </main>
  );
}
