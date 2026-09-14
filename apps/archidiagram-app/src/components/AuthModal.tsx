import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useEditorStore } from '../store/useEditorStore'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLogin, setIsLogin] = useState(true)
  
  const uiTheme = useEditorStore(state => state.uiTheme)
  const isLight = uiTheme === 'light'
  const bg = isLight ? '#ffffff' : '#1a1a1a'
  const text = isLight ? '#111827' : '#ffffff'
  const textMuted = isLight ? '#6b7280' : '#9ca3af'
  const border = isLight ? '#e5e7eb' : '#333'
  const inputBg = isLight ? '#f9fafb' : '#2a2a2a'
  const user = useEditorStore(state => state.user)
  const isPro = useEditorStore(state => state.isPro)

  useEffect(() => {
    // @ts-ignore
    if (window.createLemonSqueezy) {
      // @ts-ignore
      window.createLemonSqueezy()
      // @ts-ignore
      if (window.LemonSqueezy) {
        // @ts-ignore
        window.LemonSqueezy.Setup({
          eventHandler: (event: any) => {
            if (event.event === 'Checkout.Success') {
              // Optimistic local update
              useEditorStore.getState().setIsPro(true);
              
              // Close Lemon Squeezy overlay if possible
              // @ts-ignore
              if (window.LemonSqueezy.Url && window.LemonSqueezy.Url.Close) {
                // @ts-ignore
                window.LemonSqueezy.Url.Close();
              }
              
              onClose();
              setTimeout(() => {
                useEditorStore.getState().setCustomAlert({
                  title: 'Upgrade Successful! 🎉',
                  message: 'Payment successful! You are now a Pro user and have unlocked all premium features.'
                });
              }, 500);
            }
          }
        });
      }
    }
  }, [onClose])

  if (!isOpen) return null

  if (user && !isPro) {
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999 }}>
        <div style={{ background: bg, color: text, padding: '30px', borderRadius: '12px', width: '90%', maxWidth: '400px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', position: 'relative', textAlign: 'center' }}>
          <button onClick={onClose} style={{ position: 'absolute', top: '15px', right: '15px', background: 'transparent', border: 'none', color: textMuted, cursor: 'pointer', fontSize: '1.2rem' }}>×</button>
          
          <div style={{ fontSize: '3rem', marginBottom: '10px' }}>🚀</div>
          <h2 style={{ margin: '0 0 10px 0', fontSize: '1.5rem', fontWeight: '900', background: 'linear-gradient(135deg, #f59e0b, #d97706)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Upgrade to Pro
          </h2>
          <p style={{ margin: '0 0 20px 0', color: textMuted, fontSize: '0.9rem' }}>
            You need a Pro subscription to use this feature. Unlock premium dynamic symbols, custom styling, and video exports.
          </p>

          <button 
            onClick={(e) => {
              e.preventDefault();
              const btn = e.currentTarget;
              btn.innerText = 'Opening Checkout...';
              
              // Removed locale=en-US to fix 422 error
              const checkoutUrl = `https://febhouse.lemonsqueezy.com/checkout/buy/24cf4911-d493-4471-bffb-d059eb2b7197?embed=1&checkout[custom][user_id]=${user.id}&checkout[email]=${encodeURIComponent(user.email || '')}`;
              
              try {
                // @ts-ignore
                if (window.LemonSqueezy && window.LemonSqueezy.Url) {
                  // @ts-ignore
                  window.createLemonSqueezy();
                  // @ts-ignore
                  window.LemonSqueezy.Url.Open(checkoutUrl);
                } else {
                  window.open(checkoutUrl, '_blank');
                }
              } catch (err) {
                console.error("LemonSqueezy overlay error:", err);
                window.open(checkoutUrl, '_blank');
              }
              
              setTimeout(() => {
                if (btn) btn.innerText = 'Upgrade Now';
              }, 3000);
            }}
            style={{ display: 'block', boxSizing: 'border-box', width: '100%', padding: '12px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem', boxShadow: '0 4px 6px rgba(245, 158, 11, 0.25)', textDecoration: 'none', transition: 'background 0.3s' }}>
            Upgrade Now
          </button>
        </div>
      </div>
    )
  }

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      } else {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        useEditorStore.getState().setCustomAlert({ title: 'Success', message: 'Please check your email to verify your account!' })
      }
      onClose()
    } catch (err: any) {
      setError(err.message || 'An error occurred.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({ 
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`
        }
      })
      if (error) throw error
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999 }}>
      <div style={{ background: bg, color: text, padding: '30px', borderRadius: '12px', width: '90%', maxWidth: '400px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '15px', right: '15px', background: 'transparent', border: 'none', color: textMuted, cursor: 'pointer', fontSize: '1.2rem' }}>×</button>
        
        <h2 style={{ margin: '0 0 5px 0', fontSize: '1.5rem', fontWeight: '900', background: 'linear-gradient(135deg, #f59e0b, #d97706)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          {isLogin ? 'Welcome Back' : 'Join ARCHIDIAGRAM'}
        </h2>
        <p style={{ margin: '0 0 20px 0', color: textMuted, fontSize: '0.9rem' }}>
          {isLogin ? 'Log in to access your Pro features and saved views.' : 'Create an account to upgrade to Pro and save your work.'}
        </p>

        {error && <div style={{ background: '#fef2f2', color: '#b91c1c', padding: '10px', borderRadius: '6px', marginBottom: '15px', fontSize: '0.85rem' }}>{error}</div>}

        <button 
          onClick={handleGoogleLogin}
          style={{ width: '100%', padding: '10px', background: isLight ? '#fff' : '#2a2a2a', color: text, border: `1px solid ${border}`, borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', cursor: 'pointer', fontWeight: 'bold', transition: '0.2s', marginBottom: '15px' }}>
          <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Continue with Google
        </button>

        <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0' }}>
          <hr style={{ flex: 1, border: 'none', borderTop: `1px solid ${border}` }} />
          <span style={{ padding: '0 10px', color: textMuted, fontSize: '0.8rem' }}>OR</span>
          <hr style={{ flex: 1, border: 'none', borderTop: `1px solid ${border}` }} />
        </div>

        <form onSubmit={handleEmailAuth} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.85rem', fontWeight: 'bold' }}>Email Address</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: `1px solid ${border}`, background: inputBg, color: text, boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.85rem', fontWeight: 'bold' }}>Password</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: `1px solid ${border}`, background: inputBg, color: text, boxSizing: 'border-box' }}
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            style={{ width: '100%', padding: '10px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer', marginTop: '5px' }}>
            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.85rem', color: textMuted }}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <span onClick={() => setIsLogin(!isLogin)} style={{ color: '#3b82f6', cursor: 'pointer', fontWeight: 'bold' }}>
            {isLogin ? 'Sign up' : 'Log in'}
          </span>
        </div>

        <div style={{ marginTop: '25px', textAlign: 'center', fontSize: '0.75rem', color: textMuted, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px' }}>
          <a href="https://febhouse.com/privacy-policy/" target="_blank" rel="noreferrer" style={{ color: textMuted, textDecoration: 'underline' }}>Privacy Policy</a>
          <span>•</span>
          <a href="https://febhouse.com/terms-of-use/" target="_blank" rel="noreferrer" style={{ color: textMuted, textDecoration: 'underline' }}>Terms of Use</a>
          <span>•</span>
          <a href="https://febhouse.com/refund-policy/" target="_blank" rel="noreferrer" style={{ color: textMuted, textDecoration: 'underline' }}>Refund Policy</a>
          <span>•</span>
          <a href="https://febhouse.com/legal-notice/" target="_blank" rel="noreferrer" style={{ color: textMuted, textDecoration: 'underline' }}>Legal Notice</a>
        </div>
      </div>
    </div>
  )
}
