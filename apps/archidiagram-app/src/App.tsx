import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import { useEffect, lazy, Suspense } from 'react'
import { supabase } from './lib/supabase'
import { useEditorStore } from './store/useEditorStore'
import Studio from './components/Studio'

const DifyChat = lazy(() => import('./components/DifyChat'))
function Dashboard() {
  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Archi Diagram Hub (Dashboard)</h1>
      <p>Welcome to the project management center.</p>
      
      <div style={{ marginTop: '2rem', padding: '1.5rem', border: '1px solid #ddd', borderRadius: '8px' }}>
        <h2>PoC (Proof of Concept)</h2>
        <p>Click the button below to open the 3D Studio workspace.</p>
        <Link to="/studio" style={{ display: 'inline-block', marginTop: '1rem', padding: '10px 20px', background: '#3b82f6', color: 'white', textDecoration: 'none', borderRadius: '5px', fontWeight: 'bold' }}>
          Open 3D Studio
        </Link>
      </div>
    </div>
  )
}

export default function App() {
  const setUser = useEditorStore(state => state.setUser)
  const setIsPro = useEditorStore(state => state.setIsPro)

  useEffect(() => {
    const checkProStatus = async (userId: string) => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('is_pro, customer_portal_url, renews_at')
          .eq('id', userId)
          .single()

        if (error) {
          console.error('Error fetching profile:', error)
          setIsPro(false)
          useEditorStore.getState().setSubscriptionInfo(null, null)
        } else if (data) {
          setIsPro(!!data.is_pro)
          useEditorStore.getState().setSubscriptionInfo(data.customer_portal_url || null, data.renews_at || null)
        }
      } catch (err) {
        console.error('Error fetching pro status:', err)
      }
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        checkProStatus(session.user.id)
      } else {
        setIsPro(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        checkProStatus(session.user.id)
      } else {
        setIsPro(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [setUser, setIsPro])

  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<Studio />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </Router>
      <Suspense fallback={null}>
        <DifyChat />
      </Suspense>
    </>
  )
}
