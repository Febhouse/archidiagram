import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useEditorStore, PRO_MODELS } from '../store/useEditorStore';

interface CloudProject {
  id: string;
  name: string;
  size_mb: number;
  updated_at: string;
  is_public: boolean;
}

interface CloudStorageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRequireAuth: () => void;
}

export default function CloudStorageModal({ isOpen, onClose, onRequireAuth }: CloudStorageModalProps) {
  const { user, isPro, renewsAt, uiTheme, setCloudProjectInfo } = useEditorStore();
  const isLight = uiTheme === 'light';
  const bgPanel = isLight ? '#ffffff' : '#252525';
  const textMain = isLight ? '#111827' : '#eaeaea';
  const textMuted = isLight ? '#6b7280' : '#888';
  const borderCol = isLight ? '#e5e7eb' : '#333';

  const [projects, setProjects] = useState<CloudProject[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      fetchProjects();
    }
  }, [isOpen, user]);

  const fetchProjects = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('projects')
      .select('id, name, size_mb, updated_at, is_public')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching projects:', error);
    } else {
      setProjects(data || []);
    }
    setLoading(false);
  };

  if (!isOpen) return null;

  if (!user) {
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999 }}>
        <div style={{ background: bgPanel, color: textMain, padding: '40px 30px', borderRadius: '12px', width: '90%', maxWidth: '450px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', position: 'relative', textAlign: 'center' }}>
          <button onClick={onClose} style={{ position: 'absolute', top: '15px', right: '15px', background: 'transparent', border: 'none', color: textMuted, cursor: 'pointer', fontSize: '1.2rem' }}>x</button>
          <div style={{ fontSize: '3rem', marginBottom: '15px' }}>☁️</div>
          <h2 style={{ margin: '0 0 10px 0', fontSize: '1.5rem', fontWeight: 'bold' }}>Cloud Storage</h2>
          <p style={{ margin: '0 0 25px 0', color: textMuted, fontSize: '0.95rem', lineHeight: '1.5' }}>
            Securely store your projects in the cloud. Access them from any device. Sign in now to get your free storage space!
          </p>
          <button 
            onClick={() => { onClose(); onRequireAuth(); }}
            style={{ width: '100%', padding: '12px', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem' }}
          >
            Sign In / Sign Up
          </button>
        </div>
      </div>
    );
  }

  const storageLimit = isPro ? 100 : 10;
  const storageUsed = projects.reduce((acc, p) => acc + (Number(p.size_mb) || 0), 0);
  const percentUsed = (storageUsed / storageLimit) * 100;
  const isNearLimit = percentUsed > 80;

  const daysRemaining = renewsAt ? Math.ceil((new Date(renewsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;

  const handleOpen = async (proj: CloudProject) => {
    try {
      const { data, error } = await supabase.from('projects').select('state_json').eq('id', proj.id).single();
      if (error) throw error;
      if (data && data.state_json) {
        const { user, isPro, customerPortalUrl, renewsAt, mapboxToken } = useEditorStore.getState();
        useEditorStore.setState({
          ...data.state_json,
          user,
          isPro,
          customerPortalUrl,
          renewsAt,
          mapboxToken
        });
        setCloudProjectInfo(proj.id, proj.name);
        onClose();
        useEditorStore.getState().setCustomAlert({ title: 'Project Loaded', message: `Loaded "${proj.name}" successfully.` });
        
        const hasPro = data.state_json.objects?.some((obj: any) => obj.url && PRO_MODELS.some(proName => obj.url.toUpperCase().includes(proName)));
        if (hasPro && !isPro) {
          setTimeout(() => {
            useEditorStore.getState().setCustomAlert({
              title: 'Pro Objects Detected',
              message: 'This file contains PRO objects. Since you are using a Free account, you will not be able to move, scale, or rotate these specific objects.'
            });
          }, 500);
        }
      }
    } catch (err: any) {
      useEditorStore.getState().setCustomAlert({ title: 'Error', message: 'Failed to load project: ' + err.message });
    }
  };

  const handleDelete = async (proj: CloudProject) => {
    if (!(await useEditorStore.getState().showConfirm('Delete Project', `Delete project "${proj.name}"?`))) return;
    try {
      const { error } = await supabase.from('projects').delete().eq('id', proj.id);
      if (error) throw error;
      setProjects(prev => prev.filter(p => p.id !== proj.id));
      if (useEditorStore.getState().cloudProjectId === proj.id) {
        setCloudProjectInfo(null, 'Untitled Project');
      }
    } catch (err: any) {
      useEditorStore.getState().setCustomAlert({ title: 'Error', message: 'Failed to delete: ' + err.message });
    }
  };

  const handleRename = async (proj: CloudProject) => {
    const newName = await useEditorStore.getState().showPrompt('Rename Project', 'New project name:', proj.name);
    if (!newName || newName === proj.name) return;
    try {
      const { error } = await supabase.from('projects').update({ name: newName }).eq('id', proj.id);
      if (error) throw error;
      setProjects(prev => prev.map(p => p.id === proj.id ? { ...p, name: newName } : p));
      if (useEditorStore.getState().cloudProjectId === proj.id) {
        setCloudProjectInfo(proj.id, newName);
      }
    } catch (err: any) {
      useEditorStore.getState().setCustomAlert({ title: 'Error', message: 'Failed to rename: ' + err.message });
    }
  };

  const handleShare = async (proj: CloudProject) => {
    const makePublic = await useEditorStore.getState().showConfirm(
      'Share Project',
      `Do you want to make this project public?\n\nIf "Make Public", anyone with the link can view the project.\nIf "Keep Private", only you can view it.`,
      'Make Public',
      'Keep Private'
    );
    try {
      if (makePublic) {
        if (!proj.is_public) {
          const { error } = await supabase.from('projects').update({ is_public: true }).eq('id', proj.id);
          if (error) throw error;
          setProjects(prev => prev.map(p => p.id === proj.id ? { ...p, is_public: true } : p));
        }
        const shareUrl = `${window.location.origin}/?p=${proj.id}`;
        navigator.clipboard.writeText(shareUrl);
        useEditorStore.getState().setCustomAlert({ title: 'Share link copied!', message: shareUrl });
      } else {
        if (proj.is_public) {
          const { error } = await supabase.from('projects').update({ is_public: false }).eq('id', proj.id);
          if (error) throw error;
          setProjects(prev => prev.map(p => p.id === proj.id ? { ...p, is_public: false } : p));
        }
        useEditorStore.getState().setCustomAlert({ title: 'Project is Private', message: 'This project is now private. Only you can view it.' });
      }
    } catch (err: any) {
      useEditorStore.getState().setCustomAlert({ title: 'Error', message: 'Failed to update share settings: ' + err.message });
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999 }}>
      <div style={{ background: bgPanel, color: textMain, padding: '30px', borderRadius: '12px', width: '90%', maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '15px', right: '15px', background: 'transparent', border: 'none', color: textMuted, cursor: 'pointer', fontSize: '1.2rem' }}>x</button>
        
        <h2 style={{ margin: '0 0 20px 0', fontSize: '1.5rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
          📂 My Cloud Projects
        </h2>

        <div style={{ background: isLight ? '#f9fafb' : '#1f2937', borderRadius: '8px', padding: '15px', border: `1px solid ${borderCol}`, marginBottom: '25px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>
                {user.email?.charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: 'bold', fontSize: '1rem' }}>{user.email}</div>
                <div style={{ fontSize: '0.8rem', color: textMuted }}>
                  Current Plan: <span style={{ color: isPro ? '#f59e0b' : textMain, fontWeight: 'bold' }}>{isPro ? '🚀 PRO' : '🌱 FREE'}</span>
                  {isPro && daysRemaining !== null && ` • ${daysRemaining} days remaining`}
                </div>
              </div>
            </div>
            {!isPro && (
              <button onClick={() => { onClose(); onRequireAuth(); }} style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}>
                Upgrade to Pro
              </button>
            )}
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '8px', fontWeight: 'bold' }}>
              <span>Storage Used</span>
              <span>{storageUsed.toFixed(2)} MB / {storageLimit} MB</span>
            </div>
            <div style={{ width: '100%', height: '8px', background: isLight ? '#e5e7eb' : '#374151', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ 
                width: `${Math.min(percentUsed, 100)}%`, height: '100%', 
                background: isNearLimit ? '#ef4444' : '#3b82f6',
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>
        </div>

        <div>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '1.1rem', fontWeight: 'bold' }}>Your Projects ({projects.length})</h3>
          
          {loading ? (
            <div style={{ textAlign: 'center', padding: '30px', color: textMuted }}>Loading...</div>
          ) : projects.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px', color: textMuted, border: `1px dashed ${borderCol}`, borderRadius: '8px' }}>
              No projects saved to cloud yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {projects.map((proj) => (
                <div key={proj.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 15px', background: isLight ? '#f9fafb' : '#1f2937', border: `1px solid ${borderCol}`, borderRadius: '8px', transition: '0.2s' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 'bold', fontSize: '0.95rem', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      {proj.name}
                      {proj.is_public && <span style={{ fontSize: '0.65rem', background: '#10b981', color: 'white', padding: '2px 6px', borderRadius: '4px' }}>Public</span>}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: textMuted }}>
                      {proj.size_mb ? proj.size_mb.toFixed(2) : 0} MB • Updated {new Date(proj.updated_at).toLocaleString()}
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button 
                      onClick={() => handleOpen(proj)}
                      style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}
                    >
                      Open
                    </button>
                    
                    <button 
                      onClick={() => handleShare(proj)}
                      style={{ background: 'transparent', color: '#10b981', border: `1px solid #10b981`, padding: '5px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}
                      title="Share link"
                    >
                      🔗
                    </button>
                    
                    <button 
                      onClick={() => handleRename(proj)}
                      style={{ background: 'transparent', color: textMuted, border: 'none', padding: '5px', cursor: 'pointer', fontSize: '1rem' }}
                      title="Rename"
                    >
                      ✏️
                    </button>
                    
                    <button 
                      onClick={() => handleDelete(proj)}
                      style={{ background: 'transparent', color: '#ef4444', border: 'none', padding: '5px', cursor: 'pointer', fontSize: '1rem' }}
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
