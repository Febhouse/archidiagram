import { useState, useEffect } from 'react'
import Scene from './Scene'
import { useEditorStore } from '../store/useEditorStore'
import { LIBRARY_MODELS } from '../config/library'
import LibraryItem from './LibraryItem'
import { isDstActive } from './NativeSunpath'
import { getDayOfYear } from './SunLight'
import AuthModal from './AuthModal'
import CloudStorageModal from './CloudStorageModal'
import { supabase } from '../lib/supabase'
import { GLTFLoader } from 'three-stdlib'

const TIMEZONES = [
  { offset: -12, label: '(UTC-12:00) International Date Line West' },
  { offset: -11, label: '(UTC-11:00) Coordinated Universal Time-11' },
  { offset: -10, label: '(UTC-10:00) Hawaii' },
  { offset: -9, label: '(UTC-09:00) Alaska' },
  { offset: -8, label: '(UTC-08:00) Pacific Time (US & Canada)' },
  { offset: -7, label: '(UTC-07:00) Mountain Time (US & Canada)' },
  { offset: -6, label: '(UTC-06:00) Central Time (US & Canada)' },
  { offset: -5, label: '(UTC-05:00) Eastern Time (US & Canada)' },
  { offset: -4, label: '(UTC-04:00) Atlantic Time (Canada)' },
  { offset: -3.5, label: '(UTC-03:30) Newfoundland' },
  { offset: -3, label: '(UTC-03:00) Buenos Aires, Georgetown' },
  { offset: -2, label: '(UTC-02:00) Coordinated Universal Time-02' },
  { offset: -1, label: '(UTC-01:00) Azores' },
  { offset: 0, label: '(UTC+00:00) London, Dublin, Lisbon' },
  { offset: 1, label: '(UTC+01:00) Paris, Berlin, Rome, Madrid' },
  { offset: 2, label: '(UTC+02:00) Cairo, Athens, Bucharest' },
  { offset: 3, label: '(UTC+03:00) Moscow, Istanbul, Riyadh' },
  { offset: 3.5, label: '(UTC+03:30) Tehran' },
  { offset: 4, label: '(UTC+04:00) Dubai, Baku' },
  { offset: 4.5, label: '(UTC+04:30) Kabul' },
  { offset: 5, label: '(UTC+05:00) Islamabad, Karachi' },
  { offset: 5.5, label: '(UTC+05:30) Chennai, Kolkata, Mumbai, New Delhi' },
  { offset: 5.75, label: '(UTC+05:45) Kathmandu' },
  { offset: 6, label: '(UTC+06:00) Dhaka, Almaty' },
  { offset: 6.5, label: '(UTC+06:30) Yangon (Rangoon)' },
  { offset: 7, label: '(UTC+07:00) Bangkok, Hanoi, Jakarta' },
  { offset: 8, label: '(UTC+08:00) Beijing, Singapore, Hong Kong' },
  { offset: 9, label: '(UTC+09:00) Tokyo, Seoul' },
  { offset: 9.5, label: '(UTC+09:30) Adelaide, Darwin' },
  { offset: 10, label: '(UTC+10:00) Sydney, Melbourne, Brisbane' },
  { offset: 11, label: '(UTC+11:00) Solomon Is., New Caledonia' },
  { offset: 12, label: '(UTC+12:00) Auckland, Wellington, Fiji' },
  { offset: 13, label: '(UTC+13:00) Samoa' },
  { offset: 14, label: '(UTC+14:00) Kiritimati Island' },
]

function CustomMaterialEditor({ obj }: { obj: any }) {
  const [materials, setMaterials] = useState<Record<string, any>>({})
  const [activeMaterial, setActiveMaterial] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const updateObjectProperties = useEditorStore(state => state.updateObjectProperties)
  const isLight = useEditorStore(state => state.uiTheme) === 'light'
  const showEdges = useEditorStore(state => state.showEdges)
  const setEnvironment = useEditorStore(state => state.setEnvironment)

  const PRESET_COLORS = ['#ffffff', '#cccccc', '#6b7280', '#000000', '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef']

  useEffect(() => {
    if (!obj || !obj.url || (!obj.url.startsWith('data:') && !obj.url.toLowerCase().endsWith('.glb') && !obj.url.toLowerCase().endsWith('.gltf') && !['BOX', 'CYLINDER', 'CONE', 'SPHERE', 'PYRAMID'].includes(obj.url))) return
    
    if (['BOX', 'CYLINDER', 'CONE', 'SPHERE', 'PYRAMID'].includes(obj.url)) {
      // Special case for primitive
      setMaterials({ 'default': { color: { getHexString: () => 'cccccc' }, opacity: 1 } })
      setActiveMaterial('default')
      return
    }

    setLoading(true)
    const loader = new GLTFLoader()
    loader.load(obj.url, (gltf) => {
      const mats: Record<string, any> = {}
      gltf.scene.traverse((child: any) => {
        if (child.isMesh && child.material) {
          mats[child.material.name || 'default'] = child.material
        }
      })
      setMaterials(mats)
      const firstMat = Object.keys(mats)[0]
      if (firstMat) setActiveMaterial(firstMat)
      setLoading(false)
    }, undefined, () => setLoading(false))
  }, [obj?.url])

  if (loading) return <div style={{ padding: '15px', color: '#6b7280', fontSize: '0.85rem' }}>Loading materials...</div>
  
  const matEntries = Object.entries(materials)
  if (matEntries.length === 0) return <div style={{ padding: '15px', color: '#6b7280', fontSize: '0.85rem' }}>No custom materials found.</div>

  const handleOverride = (matName: string, key: string, value: any) => {
    const current = obj.materialOverrides || {}
    const matOverride = current[matName] || {}
    updateObjectProperties([obj.id], {
      materialOverrides: {
        ...current,
        [matName]: { ...matOverride, [key]: value }
      }
    })
  }

  const currentMatName = activeMaterial || matEntries[0][0]
  const currentMat = materials[currentMatName]
  const currentOverride = obj.materialOverrides?.[currentMatName] || {}
  const origColorHex = currentMat?.color && typeof currentMat.color.getHexString === 'function' ? '#' + currentMat.color.getHexString() : '#cccccc'
  const currentColor = currentOverride.color || origColorHex
  const currentOpacity = currentOverride.opacity ?? (currentMat?.opacity !== undefined ? currentMat.opacity : 1)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
      {/* Object-level Settings */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '10px', background: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.05)', borderRadius: '6px', border: `1px solid ${isLight ? '#e5e7eb' : '#333'}` }}>
        <div style={{ fontWeight: 'bold', fontSize: '0.85rem', color: isLight ? '#111827' : '#f9fafb', marginBottom: '4px' }}>Object Options</div>
        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '8px' }}>
          <input type="checkbox" checked={showEdges} onChange={(e) => setEnvironment({ showEdges: e.target.checked })} />
          <span style={{ fontSize: '0.8rem', color: isLight ? '#4b5563' : '#9ca3af' }}>Show Edges (Global)</span>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '8px' }}>
          <input type="checkbox" checked={obj.castShadow ?? true} onChange={(e) => updateObjectProperties([obj.id], { castShadow: e.target.checked })} />
          <span style={{ fontSize: '0.8rem', color: isLight ? '#4b5563' : '#9ca3af' }}>Cast Shadow</span>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '8px' }}>
          <input type="checkbox" checked={obj.receiveShadow ?? true} onChange={(e) => updateObjectProperties([obj.id], { receiveShadow: e.target.checked })} />
          <span style={{ fontSize: '0.8rem', color: isLight ? '#4b5563' : '#9ca3af' }}>Receive Shadow</span>
        </label>
      </div>

      {/* Main Material Editor */}
      {currentMat && (
        <div style={{ display: 'flex', flexDirection: 'column', padding: '10px', background: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.05)', borderRadius: '6px', border: `1px solid ${isLight ? '#e5e7eb' : '#333'}`, gap: '10px' }}>
          <div style={{ fontWeight: 'bold', fontSize: '0.85rem', color: isLight ? '#111827' : '#f9fafb' }}>Editing: {currentMatName}</div>
          
          {/* Standard Material Palette */}
          <div>
            <div style={{ fontSize: '0.75rem', color: isLight ? '#4b5563' : '#9ca3af', marginBottom: '6px' }}>Color Palette</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {PRESET_COLORS.map(c => (
                <div 
                  key={c}
                  onClick={() => handleOverride(currentMatName, 'color', c)}
                  style={{ 
                    width: '20px', height: '20px', borderRadius: '50%', background: c, cursor: 'pointer',
                    border: currentColor.toLowerCase() === c ? '2px solid #3b82f6' : `1px solid ${isLight ? '#d1d5db' : '#4b5563'}`
                  }}
                  title={c}
                />
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '0.75rem', width: '45px', color: isLight ? '#4b5563' : '#9ca3af' }}>Custom</span>
            <input type="color" value={currentColor} onChange={(e) => handleOverride(currentMatName, 'color', e.target.value)} style={{ cursor: 'pointer', padding: 0, border: 'none', width: '30px', height: '24px', borderRadius: '4px' }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '0.75rem', width: '45px', color: isLight ? '#4b5563' : '#9ca3af' }}>Opacity</span>
            <input type="range" min="0" max="1" step="0.05" value={currentOpacity} onChange={(e) => handleOverride(currentMatName, 'opacity', parseFloat(e.target.value))} style={{ flex: 1 }} />
            <span style={{ fontSize: '0.75rem', width: '35px', textAlign: 'right', color: isLight ? '#4b5563' : '#9ca3af' }}>{Math.round(currentOpacity * 100)}%</span>
          </div>

          {currentMat.map && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '5px' }}>
              <span style={{ fontSize: '0.75rem', width: '45px', color: isLight ? '#4b5563' : '#9ca3af' }}>Texture</span>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', flex: 1 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={currentOverride.map !== 'none'} onChange={(e) => handleOverride(currentMatName, 'map', e.target.checked ? undefined : 'none')} />
                  <span style={{ fontSize: '0.75rem', color: isLight ? '#4b5563' : '#9ca3af' }}>Show Texture</span>
                </label>
                
                {currentOverride.map !== 'none' && (
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      const reader = new FileReader()
                      reader.onload = (event) => {
                        if (typeof event.target?.result === 'string') {
                          handleOverride(currentMatName, 'map', event.target.result)
                        }
                      }
                      reader.readAsDataURL(file)
                      e.target.value = ''
                    }} 
                    style={{ fontSize: '0.7rem', width: '100%' }} 
                  />
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Multi-Material List */}
      {matEntries.length > 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: isLight ? '#111827' : '#f9fafb', marginBottom: '5px' }}>Sub-Materials ({matEntries.length})</div>
          {matEntries.map(([name, mat], index) => {
            const override = obj.materialOverrides?.[name] || {}
            const origColorHex = mat.color && typeof mat.color.getHexString === 'function' ? '#' + mat.color.getHexString() : '#cccccc'
            const color = override.color || origColorHex
            const isVisible = override.visible ?? true
            const isSelected = name === currentMatName

            return (
              <div 
                key={name} 
                style={{ 
                  display: 'flex', alignItems: 'center', padding: '6px 8px', 
                  background: isSelected ? (isLight ? '#e0e7ff' : '#374151') : (isLight ? '#f9fafb' : '#1f2937'), 
                  border: `1px solid ${isSelected ? '#3b82f6' : (isLight ? '#e5e7eb' : '#333')}`,
                  borderRadius: '4px', cursor: 'pointer', gap: '10px'
                }}
                onClick={() => setActiveMaterial(name)}
              >
                <div style={{ fontSize: '0.7rem', color: isLight ? '#6b7280' : '#9ca3af', width: '15px' }}>{index + 1}</div>
                <div style={{ 
                  width: '16px', height: '16px', borderRadius: '3px', background: color, 
                  border: `1px solid ${isLight ? '#d1d5db' : '#4b5563'}`, flexShrink: 0 
                }} />
                <div style={{ fontSize: '0.75rem', color: isLight ? '#111827' : '#f9fafb', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {name}
                </div>
                <div onClick={(e) => e.stopPropagation()}>
                  <input 
                    type="checkbox" 
                    checked={isVisible} 
                    onChange={(e) => handleOverride(name, 'visible', e.target.checked)} 
                    title={isVisible ? 'Visible' : 'Hidden'}
                    style={{ cursor: 'pointer' }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function Studio() {
  const { 
    transformMode, setTransformMode, setPlacingUrl, placingUrl, 
    undo, redo, selectedIds, replaceObjectUrl, updateObjectProperties, 
    objects, recentColors, addRecentColor, hudPosition, contextMenu, setContextMenu,
    latitude, longitude, activeMonth, monthDates, visibleMonths, timeOfDay, northOffset, shadowsEnabled, showEdges, gridSize, setEnvironment,
    sunpathSettings, setSunpathSettings, timezoneMode, utcOffset, dstMode, showHUD, uiTheme,
    legendItems, showSunDiagramLayer,
    showMapBackground, mapZoom, mapStyle, mapOpacity, mapRadius,
    showScaleRings, scaleRingCount, scaleRingUnit,
    setShowMapBackground, setMapZoom, setMapStyle, setMapOpacity, setMapRadius,
    setShowScaleRings, setScaleRingCount, setScaleRingUnit,
    exportWidth, exportHeight, setExportResolution, hudScale, globalTextSize,
    user, setUser, isPro
  } = useEditorStore()
  const addSavedView = useEditorStore((state) => state.addSavedView)
  const savedViews = useEditorStore((state) => state.savedViews)

  useEffect(() => {
    // Only run once on mount
    const state = useEditorStore.getState();
    const mapRadius = state.mapRadius || 20;
    const hasTop = state.savedViews.some(v => v.id === 'default-top');
    const hasFront = state.savedViews.some(v => v.id === 'default-front');
    const hasIso = state.savedViews.some(v => v.id === 'default-iso');
    const hasPersp = state.savedViews.some(v => v.id === 'default-persp');

    if (!hasTop) addSavedView({ id: 'default-top', name: 'Top', cameraPosition: [0, mapRadius * 2, 0.001], cameraTarget: [0, 0, 0] })
    if (!hasFront) addSavedView({ id: 'default-front', name: 'Front', cameraPosition: [0, 0, mapRadius * 2], cameraTarget: [0, 0, 0] })
    if (!hasIso) addSavedView({ id: 'default-iso', name: 'Isometric', cameraPosition: [mapRadius * 4, mapRadius * 4, mapRadius * 4], cameraTarget: [0, 0, 0], fov: 10 })
    if (!hasPersp) addSavedView({ id: 'default-persp', name: 'Perspective', cameraPosition: [mapRadius, mapRadius * 0.75, mapRadius], cameraTarget: [0, 0, 0], fov: 50 })

    if (!localStorage.getItem('archidiagram_has_loaded_sample')) {
      fetch('/samples/Thesample1.archi')
        .then(res => res.json())
        .then(data => {
          const currentState = useEditorStore.getState()
          useEditorStore.setState({ 
            ...data, 
            user: currentState.user, 
            isPro: currentState.isPro,
            customerPortalUrl: currentState.customerPortalUrl,
            renewsAt: currentState.renewsAt,
            mapboxToken: currentState.mapboxToken
          })
          localStorage.setItem('archidiagram_has_loaded_sample', 'true')
        })
        .catch(err => console.error('Failed to load sample:', err))
    }
  }, [addSavedView])

  // H2 Accordion State
  const [activeH2, setActiveH2] = useState<'global' | 'location' | 'sundiagram' | 'symbols' | 'import' | 'export' | 'info' | null>('location')
  
  // Tabs State within H2
  const [sunTab, setSunTab] = useState<'create' | 'shadow' | 'style'>('shadow')
  const [symbolTab, setSymbolTab] = useState<'library' | 'properties'>('library')
  const [importTab, setImportTab] = useState<'import3d' | 'materials'>('import3d')
  const [exportFormat, setExportFormat] = useState<'JPG' | 'PDF' | 'VIDEO'>('JPG')
  const [exportQuality, setExportQuality] = useState<number>(70)
  const [pdfExportMode, setPdfExportMode] = useState<'SINGLE' | 'MULTI'>('SINGLE')
  const [exportSettings, setExportSettings] = useState<Record<number, { checked: boolean, start: number, end: number }>>({})

  
  // Collapsible sections
  const [showSunPathComponents, setShowSunPathComponents] = useState(true)
  const [showObjectColors, setShowObjectColors] = useState(false)
  const [showMonthColors, setShowMonthColors] = useState(false)
  
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedColor, setSelectedColor] = useState('#ffffff')
  const [selectedOpacity, setSelectedOpacity] = useState(1)
  const [isAspectRatioLocked, setIsAspectRatioLocked] = useState(false)

  // Mobile Responsive State
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  const [showMobileMenu, setShowMobileMenu] = useState(true)
  const [isViewsExpanded, setIsViewsExpanded] = useState(window.innerWidth > 768)
  const [isNotesExpanded, setIsNotesExpanded] = useState(window.innerWidth > 768)
  const [showAddSymbolMenu, setShowAddSymbolMenu] = useState(false)
  const [showGlobalMenu, setShowGlobalMenu] = useState(false)
  const [showFileMenu, setShowFileMenu] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)

  const customAlert = useEditorStore(state => state.customAlert)
  const setCustomAlert = useEditorStore(state => state.setCustomAlert)
  const customConfirm = useEditorStore(state => state.customConfirm)
  const setCustomConfirm = useEditorStore(state => state.setCustomConfirm)
  const customPrompt = useEditorStore(state => state.customPrompt)
  const setCustomPrompt = useEditorStore(state => state.setCustomPrompt)
  
  const isCloudStorageModalOpen = useEditorStore(state => state.isCloudStorageModalOpen)
  const setIsCloudStorageModalOpen = useEditorStore(state => state.setIsCloudStorageModalOpen)
  const cloudProjectName = useEditorStore(state => state.cloudProjectName)
  const setCloudProjectInfo = useEditorStore(state => state.setCloudProjectInfo)

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768
      setIsMobile(mobile)
      if (!mobile) {
        setIsViewsExpanded(true)
        setIsNotesExpanded(true)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Theme Colors
  const isLight = uiTheme === 'light'
  
  const isSunPathSelected = objects.some(o => selectedIds.includes(o.id) && o.url?.toUpperCase().includes('SUNPATH'))
  const monthColorsLight = useEditorStore((state) => state.monthColorsLight)
  const monthColorsDark = useEditorStore((state) => state.monthColorsDark)
  const monthColors = isLight ? monthColorsLight : monthColorsDark
  const setMonthColor = useEditorStore((state) => state.setMonthColor)
  const bgMain = monthColors[17] || (isLight ? '#ffffff' : '#333333')
  const bgPanel = isLight ? '#ffffff' : '#252525'
  const textMain = isLight ? '#111827' : '#eaeaea'
  const textMuted = isLight ? '#6b7280' : '#888'
  const borderCol = isLight ? '#e5e7eb' : '#333'
  const inputBg = isLight ? '#f9fafb' : '#333'
  const inputBorder = isLight ? '#d1d5db' : '#555'

  useEffect(() => {
    if (selectedIds.length > 0) {
      const obj = objects.find(o => o.id === selectedIds[0])
      if (obj) {
        if (obj.url?.toUpperCase().includes('SUNPATH')) {
          if (showMobileMenu || !isMobile) {
            setActiveH2('sundiagram')
            setSunTab('shadow')
          }
        } else {
          const isCustomModel = obj.url.startsWith('data:') || obj.url.startsWith('blob:') || ['BOX', 'CYLINDER', 'CONE', 'SPHERE', 'PYRAMID'].includes(obj.url) || obj.url.toLowerCase().endsWith('.glb') || obj.url.toLowerCase().endsWith('.gltf')
          if (isCustomModel) {
            if (showMobileMenu || !isMobile) {
              setActiveH2('import')
              setImportTab('materials')
            }
          } else {
            if (obj.color) setSelectedColor(obj.color)
            setSelectedOpacity(obj.opacity ?? 1)
            if (showMobileMenu || !isMobile) {
              setSymbolTab('properties')
              setActiveH2('symbols')
            }
          }
        }
      }
    }
  }, [selectedIds, objects, showMobileMenu, isMobile])

  useEffect(() => {
    const handleReFocus = (e: any) => {
      const obj = objects.find(o => o.id === e.detail)
      if (obj) {
        if (obj.url?.toUpperCase().includes('SUNPATH')) {
          if (showMobileMenu || !isMobile) { setActiveH2('sundiagram'); setSunTab('shadow'); }
        } else {
          const isCustomModel = obj.url.startsWith('data:') || obj.url.startsWith('blob:') || ['BOX', 'CYLINDER', 'CONE', 'SPHERE', 'PYRAMID'].includes(obj.url) || obj.url.toLowerCase().endsWith('.glb') || obj.url.toLowerCase().endsWith('.gltf')
          if (isCustomModel) {
            if (showMobileMenu || !isMobile) { setActiveH2('import'); setImportTab('materials'); }
          } else {
            if (showMobileMenu || !isMobile) { setActiveH2('symbols'); setSymbolTab('properties'); }
          }
        }
      }
    };
    const handleSunpathFocus = () => {
      if (showMobileMenu || !isMobile) { setActiveH2('sundiagram'); setSunTab('shadow'); }
    };
    const handleLocationFocus = () => {
      if (showMobileMenu || !isMobile) { setActiveH2('location'); }
    };
    window.addEventListener('re-focus-object', handleReFocus);
    window.addEventListener('focus-sunpath', handleSunpathFocus);
    window.addEventListener('focus-location', handleLocationFocus);
    return () => {
      window.removeEventListener('re-focus-object', handleReFocus);
      window.removeEventListener('focus-sunpath', handleSunpathFocus);
      window.removeEventListener('focus-location', handleLocationFocus);
    }
  }, [objects, showMobileMenu, isMobile]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && placingUrl) setPlacingUrl(null)
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        if (e.shiftKey) redo()
        else undo()
      }
      else if ((e.ctrlKey || e.metaKey) && e.key === 'y') redo()
      else if (e.key === 'Delete' || e.key === 'Backspace') {
        const store = useEditorStore.getState()
        if (document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
          if (store.selectedIds.length > 0) store.removeObjects(store.selectedIds)
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [undo, redo, placingUrl, setPlacingUrl])

  useEffect(() => {
    const handleClick = () => {
      setContextMenu(null)
      setShowFileMenu(false)
    }
    window.addEventListener('click', handleClick)
    return () => window.removeEventListener('click', handleClick)
  }, [setContextMenu])

  useEffect(() => {
    setExportSettings(prev => {
      const next = { ...prev }
      visibleMonths.forEach(m => {
        if (!next[m]) next[m] = { checked: true, start: 6, end: 18 }
      })
      return next
    })
  }, [visibleMonths])



  const getModelUrl = (name: string) => name === 'SUNPATH' ? 'https://pub-5837f996e3144244a501515264ddf495.r2.dev/SUNPATH/my_model.glb' : `/images/dynamicsymbols/${name}.svg`
  const filteredModels = LIBRARY_MODELS.filter(name => name.toLowerCase().includes(searchTerm.toLowerCase()))

  const H2Header = ({ id, title, icon, onToggle }: { id: 'global' | 'location' | 'sundiagram' | 'symbols' | 'import' | 'export' | 'info', title: string, icon?: string | React.ReactNode, onToggle?: () => void }) => (
    <div 
      onClick={() => {
        setActiveH2(activeH2 === id ? null : id);
        if (onToggle) onToggle();
      }}
      style={{ 
        padding: '12px 15px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: activeH2 === id ? (isLight ? '#e5e7eb' : '#333') : bgPanel,
        borderBottom: `1px solid ${borderCol}`,
        fontWeight: 'bold', fontSize: '1rem', color: textMain
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {typeof icon === 'string' ? (
          <img src={icon} alt={title} style={{ height: '20px', filter: activeH2 === id ? 'none' : 'grayscale(1)' }} />
        ) : (
          <div style={{ display: 'flex', opacity: activeH2 === id ? 1 : 0.6, color: activeH2 === id ? '#3b82f6' : 'currentColor' }}>
            {icon}
          </div>
        )}
        {title}
      </div>
      <span>{activeH2 === id ? '▼' : '▶'}</span>
    </div>
  )

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

  return (
    <>
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      <CloudStorageModal isOpen={isCloudStorageModalOpen} onClose={() => setIsCloudStorageModalOpen(false)} onRequireAuth={() => setIsAuthModalOpen(true)} />
      
      {customAlert && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999999 }}>
          <div style={{ background: bgPanel, color: textMain, padding: '30px', borderRadius: '12px', width: '90%', maxWidth: '400px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', position: 'relative', textAlign: 'center' }}>
            <img src="/images/LOGO/LOGO_FEBHOUSE1.svg" alt="ArchiDiagram" style={{ height: '32px', marginBottom: '15px' }} />
            <h2 style={{ margin: '0 0 10px 0', fontSize: '1.2rem', fontWeight: 'bold' }}>{customAlert.title}</h2>
            <p style={{ margin: '0 0 20px 0', color: textMuted, fontSize: '0.9rem', lineHeight: '1.5' }}>
              {customAlert.message}
            </p>
            <button 
              onClick={() => setCustomAlert(null)}
              style={{ padding: '8px 24px', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              OK
            </button>
          </div>
        </div>
      )}

      {customConfirm && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999999 }}>
          <div style={{ background: bgPanel, color: textMain, padding: '30px', borderRadius: '12px', width: '90%', maxWidth: '400px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', position: 'relative', textAlign: 'center' }}>
            <img src="/images/LOGO/LOGO_FEBHOUSE1.svg" alt="ArchiDiagram" style={{ height: '32px', marginBottom: '15px' }} />
            <h2 style={{ margin: '0 0 10px 0', fontSize: '1.2rem', fontWeight: 'bold' }}>{customConfirm.title}</h2>
            <p style={{ margin: '0 0 20px 0', color: textMuted, fontSize: '0.9rem', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
              {customConfirm.message}
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button 
                onClick={() => { customConfirm.resolve(false); setCustomConfirm(null); }}
                style={{ padding: '8px 24px', background: 'transparent', border: `1px solid ${borderCol}`, color: textMain, borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                {customConfirm.cancelText || 'Cancel'}
              </button>
              <button 
                onClick={() => { customConfirm.resolve(true); setCustomConfirm(null); }}
                style={{ padding: '8px 24px', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                {customConfirm.okText || 'OK'}
              </button>
            </div>
          </div>
        </div>
      )}

      {customPrompt && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999999 }}>
          <div style={{ background: bgPanel, color: textMain, padding: '30px', borderRadius: '12px', width: '90%', maxWidth: '400px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', position: 'relative', textAlign: 'center' }}>
            <img src="/images/LOGO/LOGO_FEBHOUSE1.svg" alt="ArchiDiagram" style={{ height: '32px', marginBottom: '15px' }} />
            <h2 style={{ margin: '0 0 10px 0', fontSize: '1.2rem', fontWeight: 'bold' }}>{customPrompt.title}</h2>
            <p style={{ margin: '0 0 15px 0', color: textMuted, fontSize: '0.9rem', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
              {customPrompt.message}
            </p>
            <input 
              type="text" 
              defaultValue={customPrompt.defaultValue || ''} 
              autoFocus 
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  customPrompt.resolve(e.currentTarget.value);
                  setCustomPrompt(null);
                }
              }}
              id="custom-prompt-input"
              style={{ width: '100%', padding: '10px', marginBottom: '20px', borderRadius: '6px', border: `1px solid ${borderCol}`, background: isLight ? '#f9fafb' : '#333', color: textMain }}
            />
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button 
                onClick={() => { customPrompt.resolve(null); setCustomPrompt(null); }}
                style={{ padding: '8px 24px', background: 'transparent', border: `1px solid ${borderCol}`, color: textMain, borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                Cancel
              </button>
              <button 
                onClick={() => { 
                  const val = (document.getElementById('custom-prompt-input') as HTMLInputElement)?.value;
                  customPrompt.resolve(val); 
                  setCustomPrompt(null); 
                }}
                style={{ padding: '8px 24px', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {isProfileModalOpen && user && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999 }}>
          <div style={{ background: bgPanel, color: textMain, padding: '30px', borderRadius: '12px', width: '90%', maxWidth: '400px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', position: 'relative' }}>
            <button onClick={() => setIsProfileModalOpen(false)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'transparent', border: 'none', color: textMuted, cursor: 'pointer', fontSize: '1.2rem' }}>×</button>
            
            <h2 style={{ margin: '0 0 20px 0', fontSize: '1.5rem', fontWeight: 'bold' }}>My Account</h2>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '1.5rem', fontWeight: 'bold' }}>
                {user.email?.charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{user.email}</div>
                <div style={{ fontSize: '0.85rem', color: textMuted }}>Joined {new Date(user.created_at).toLocaleDateString()}</div>
              </div>
            </div>

            <div style={{ background: isLight ? '#f3f4f6' : '#374151', padding: '15px', borderRadius: '8px', marginBottom: '25px' }}>
              <div style={{ fontSize: '0.85rem', color: textMuted, marginBottom: '5px' }}>Current Plan</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: isPro ? '#f59e0b' : textMain }}>
                    {isPro ? '🚀 PRO Plan' : '🌱 FREE Plan'}
                  </span>
                  {isPro && useEditorStore.getState().renewsAt && (
                    <div style={{ fontSize: '0.75rem', color: textMuted, marginTop: '4px' }}>
                      Renews at {new Date(useEditorStore.getState().renewsAt!).toLocaleDateString()}
                    </div>
                  )}
                </div>
                {!isPro && (
                  <button onClick={() => { setIsProfileModalOpen(false); setIsAuthModalOpen(true); }} style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}>Upgrade</button>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button 
                onClick={() => {
                  const url = useEditorStore.getState().customerPortalUrl;
                  if (url) {
                    window.open(url, '_blank');
                  } else {
                    setCustomAlert({
                      title: 'Manage Subscription',
                      message: 'To manage your billing or cancel your subscription, please use the secure Customer Portal link sent to your email by Lemon Squeezy when you upgraded.'
                    });
                  }
                }}
                style={{ width: '100%', padding: '10px', background: 'transparent', border: `1px solid ${borderCol}`, color: textMain, borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', transition: '0.2s' }}
                onMouseEnter={(e) => e.currentTarget.style.background = isLight ? '#f3f4f6' : '#374151'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                Manage Billing
              </button>
              <button 
                onClick={async () => {
                  await supabase.auth.signOut()
                  setUser(null)
                  useEditorStore.getState().setIsPro(false)
                  setIsProfileModalOpen(false)
                }}
                style={{ width: '100%', padding: '10px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                Sign Out
              </button>
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
      )}

      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', width: '100vw', height: '100dvh', overflow: 'hidden', fontFamily: '"Quicksand", sans-serif', background: bgMain, color: textMain }}>
      

      {/* Left Panel */}
      <div style={{ 
        width: isMobile ? '100vw' : '25vw', 
        minWidth: isMobile ? '100vw' : '340px', 
        maxWidth: isMobile ? '100vw' : '500px', 
        resize: isMobile ? (showMobileMenu ? 'vertical' : 'none') : 'horizontal', 
        background: bgPanel, 
        display: 'flex', 
        position: 'relative',
        height: isMobile ? (showMobileMenu ? '50vh' : 'auto') : '100%',
        order: 1,
        flexDirection: 'column', 
        borderRight: isMobile ? 'none' : `1px solid ${borderCol}`, 
        borderBottom: isMobile ? `1px solid ${borderCol}` : 'none',
        zIndex: 100 
      }}>
        {/* Replaced floating close button */}
        
        {/* H1 & Global Toggle */}
        <div style={{ position: 'relative', zIndex: 9999, padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `2px solid ${borderCol}`, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
            <img src="/images/LOGO/LOGO_FEBHOUSE1.svg" alt="Logo" style={{ height: '32px', flexShrink: 0 }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
              <div style={{ display: isMobile ? 'none' : 'block', fontWeight: 900, fontSize: '0.85rem', letterSpacing: '1px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>ARCHI DIAGRAM</div>
              {isPro ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '32px', fontSize: '0.65rem', fontWeight: 'bold', background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: 'white', padding: '0 10px', borderRadius: '6px', flexShrink: 0, boxSizing: 'border-box' }}>PRO</div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '32px', fontSize: '0.65rem', fontWeight: 'bold', background: 'transparent', color: '#3b82f6', padding: '0', flexShrink: 0, boxSizing: 'border-box', letterSpacing: '1px' }}>BETA</div>
              )}
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
            <div style={{ display: 'flex', gap: '10px', position: 'relative', zIndex: 99999, alignItems: 'center' }}>


              <div 
                style={{ 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', height: '32px',
                  fontSize: '0.8rem', padding: '0 12px', borderRadius: '6px', 
                  background: showFileMenu ? '#3b82f6' : 'transparent', border: `1px solid ${borderCol}`,
                  color: showFileMenu ? '#fff' : textMain, cursor: 'pointer', fontWeight: 'bold', boxSizing: 'border-box',
                  transition: '0.2s', gap: '4px', whiteSpace: 'nowrap'
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowFileMenu(!showFileMenu);
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = borderCol}
              >
                FILE ▼
              </div>
              
              {showFileMenu && (
                <div 
                  onClick={(e) => e.stopPropagation()}
                  style={{
                  position: 'absolute', top: '100%', right: 0, marginTop: '4px',
                  background: bgPanel, border: `1px solid ${borderCol}`, borderRadius: '6px',
                  boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', minWidth: '180px',
                  display: 'flex', flexDirection: 'column', zIndex: 9999, overflow: 'hidden'
                }}>
                  <div style={{ padding: '10px 15px', borderBottom: `1px solid ${borderCol}` }}>
                    <div style={{ fontSize: '0.65rem', fontWeight: 'bold', color: textMain, marginBottom: '6px', opacity: 0.6, letterSpacing: '0.5px' }}>PROJECT NAME</div>
                    <input 
                      type="text" 
                      value={cloudProjectName} 
                      onChange={(e) => setCloudProjectInfo(useEditorStore.getState().cloudProjectId, e.target.value)}
                      style={{ 
                        width: '100%', background: isLight ? '#f3f4f6' : '#374151', border: `1px solid ${borderCol}`, 
                        color: textMain, fontSize: '0.8rem', padding: '6px 8px', borderRadius: '4px', outline: 'none',
                        boxSizing: 'border-box'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                      onBlur={(e) => e.target.style.borderColor = borderCol}
                      placeholder="Untitled Project"
                    />
                  </div>
                  <button
                    onClick={async () => {
                      if (await useEditorStore.getState().showConfirm("New Project", "Are you sure you want to create a new project? All unsaved changes will be lost.")) {
                        useEditorStore.setState({ 
                          objects: [], past: [], future: [], selectedIds: [],
                          latitude: 21.0285, longitude: 105.8542,
                          timezoneMode: 'auto', utcOffset: 8, dstMode: 'auto',
                          cloudProjectId: null, cloudProjectName: 'Untitled Project'
                        })
                        setActiveH2('sundiagram')
                        setSunTab('create')
                        setSymbolTab('library')
                        setTransformMode('translate')
                        setShowFileMenu(false)
                      }
                    }}
                    style={{ textAlign: 'left', padding: '10px 15px', background: 'transparent', border: 'none', borderBottom: `1px solid ${borderCol}`, color: textMain, cursor: 'pointer', fontSize: '0.8rem' }}
                    onMouseEnter={e => e.currentTarget.style.background = isLight ? '#f3f4f6' : '#374151'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    ✨ New Project
                  </button>

                  <button
                    onClick={async () => {
                      setShowFileMenu(false)
                      if (!user) {
                        setIsAuthModalOpen(true);
                      } else {
                        try {
                          const { user, isPro, customerPortalUrl, renewsAt, mapboxToken, past, future, ...safeState } = useEditorStore.getState()
                          const stateJson = JSON.stringify(safeState)
                          const sizeMb = (new Blob([stateJson]).size / (1024 * 1024)).toFixed(2)
                          
                          if (useEditorStore.getState().cloudProjectId) {
                            const { error } = await supabase.from('projects').update({
                              state_json: safeState,
                              size_mb: sizeMb,
                              updated_at: new Date().toISOString()
                            }).eq('id', useEditorStore.getState().cloudProjectId);
                            if (error) throw error;
                            useEditorStore.getState().setCustomAlert({ title: 'Success', message: 'Project saved successfully!' });
                          } else {
                            const name = await useEditorStore.getState().showPrompt('Project Name', 'Enter project name:', useEditorStore.getState().cloudProjectName || 'Untitled Project')
                            if (!name) return;
                            const { data, error } = await supabase.from('projects').insert({
                              user_id: user.id,
                              name: name,
                              state_json: safeState,
                              size_mb: sizeMb,
                              is_public: false
                            }).select('id').single();
                            if (error) throw error;
                            if (data) {
                              useEditorStore.getState().setCloudProjectInfo(data.id, name);
                              useEditorStore.getState().setCustomAlert({ title: 'Success', message: `Project "${name}" saved to cloud!` });
                            }
                          }
                        } catch (err: any) {
                            useEditorStore.getState().setCustomAlert({ title: 'Error', message: 'Failed to save: ' + err.message });
                        }
                      }
                    }}
                    style={{ textAlign: 'left', padding: '10px 15px', background: 'transparent', border: 'none', color: '#3b82f6', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}
                    onMouseEnter={e => e.currentTarget.style.background = isLight ? '#f3f4f6' : '#374151'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    ☁️ Save to Cloud
                  </button>

                  <button
                    onClick={() => { setShowFileMenu(false); setIsCloudStorageModalOpen(true) }}
                    style={{ textAlign: 'left', padding: '10px 15px', background: 'transparent', border: 'none', borderBottom: `1px solid ${borderCol}`, color: textMain, cursor: 'pointer', fontSize: '0.8rem' }}
                    onMouseEnter={e => e.currentTarget.style.background = isLight ? '#f3f4f6' : '#374151'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    📂 My Projects
                  </button>

                  <button
                    onClick={() => {
                      setShowFileMenu(false)
                      const input = document.createElement('input')
                      input.type = 'file'
                      input.accept = '.archi,.json'
                      input.onchange = (e: any) => {
                        const file = e.target.files[0]
                        if (!file) return
                        const reader = new FileReader()
                        reader.onload = (ev) => {
                          try {
                            const data = JSON.parse(ev.target?.result as string)
                            const currentState = useEditorStore.getState()
                            useEditorStore.setState({ 
                              ...data, 
                              user: currentState.user, 
                              isPro: currentState.isPro,
                              customerPortalUrl: currentState.customerPortalUrl,
                              renewsAt: currentState.renewsAt,
                              mapboxToken: currentState.mapboxToken,
                              cloudProjectId: null, // Loading local file unbinds from cloud
                              cloudProjectName: file.name.replace('.archi', '').replace('.json', '')
                            })
                          } catch (err) {
                            useEditorStore.getState().setCustomAlert({ title: 'Error', message: 'Invalid file!' });
                          }
                        }
                        reader.readAsText(file)
                      }
                      input.click()
                    }}
                    style={{ textAlign: 'left', padding: '10px 15px', background: 'transparent', border: 'none', color: textMain, cursor: 'pointer', fontSize: '0.8rem' }}
                    onMouseEnter={e => e.currentTarget.style.background = isLight ? '#f3f4f6' : '#374151'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    🖥️ Open Local
                  </button>

                  <button
                    onClick={() => {
                      setShowFileMenu(false)
                      const { user, isPro, customerPortalUrl, renewsAt, mapboxToken, past, future, ...safeState } = useEditorStore.getState()
                      const dataStr = JSON.stringify(safeState)
                      const blob = new Blob([dataStr], { type: 'application/json' })
                      const url = URL.createObjectURL(blob)
                      const link = document.createElement('a')
                      link.href = url
                      link.download = `${cloudProjectName}.archi`
                      link.click()
                      URL.revokeObjectURL(url)
                    }}
                    style={{ textAlign: 'left', padding: '10px 15px', background: 'transparent', border: 'none', borderBottom: `1px solid ${borderCol}`, color: textMain, cursor: 'pointer', fontSize: '0.8rem' }}
                    onMouseEnter={e => e.currentTarget.style.background = isLight ? '#f3f4f6' : '#374151'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    💻 Save Local
                  </button>

                  <button
                    onClick={() => {
                      setShowFileMenu(false)
                      if (!useEditorStore.getState().cloudProjectId) {
                        useEditorStore.getState().setCustomAlert({ title: 'Error', message: 'You must Save to Cloud first before sharing.' });
                      } else {
                        const shareUrl = `${window.location.origin}/?p=${useEditorStore.getState().cloudProjectId}`;
                        navigator.clipboard.writeText(shareUrl);
                        useEditorStore.getState().setCustomAlert({ title: 'Success', message: `Share link copied to clipboard!\n${shareUrl}` });
                      }
                    }}
                    style={{ textAlign: 'left', padding: '10px 15px', background: 'transparent', border: 'none', color: '#10b981', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}
                    onMouseEnter={e => e.currentTarget.style.background = isLight ? '#f3f4f6' : '#374151'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    🔗 Share Project
                  </button>
                </div>
              )}
            </div>
            
            <div style={{ display: isMobile ? 'none' : 'flex', height: '24px', width: '1px', background: borderCol, margin: '0 5px', flexShrink: 0 }} />
            
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexShrink: 0 }}>
            {user ? (
              <div 
                onClick={() => setIsProfileModalOpen(true)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', background: isLight ? '#f3f4f6' : '#374151', borderRadius: '6px', border: `1px solid ${borderCol}`, cursor: 'pointer', boxSizing: 'border-box', flexShrink: 0 }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = borderCol}
                title={user.email}
              >
                <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.75rem', fontWeight: 'bold', flexShrink: 0 }}>
                  {user.email?.charAt(0).toUpperCase()}
                </div>
              </div>
            ) : (
              <button 
                onClick={() => setIsAuthModalOpen(true)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '32px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff', border: 'none', borderRadius: '6px', padding: '0 10px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.75rem', transition: '0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', boxSizing: 'border-box', flexShrink: 0, whiteSpace: 'nowrap' }}
              >
                Sign In
              </button>
            )}
            <button 
              onClick={() => { setShowMobileMenu(!showMobileMenu); if (!showMobileMenu) setShowGlobalMenu(false); }}
              style={{ display: isMobile ? 'flex' : 'none', alignItems: 'center', justifyContent: 'center', height: '32px', background: showMobileMenu ? '#3b82f6' : 'transparent', color: showMobileMenu ? '#fff' : textMain, border: `1px solid ${borderCol}`, borderRadius: '6px', padding: '0 10px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.75rem', transition: '0.2s', boxSizing: 'border-box', flexShrink: 0, whiteSpace: 'nowrap' }}
            >
              TOOLS
            </button>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', display: (!isMobile || showMobileMenu) ? 'block' : 'none', paddingBottom: isMobile ? '100px' : '20px' }}>
          
          {/* H2: Global Settings */}
          <H2Header id="global" title="Global Settings" icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
          } />
          {activeH2 === 'global' && (
            <div style={{ background: isLight ? '#f9fafb' : '#1a1a1a', padding: '15px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {/* Row 1: Light/Dark Mode, Background, Grid, Axes */}
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Light</span>
                    <label style={{ position: 'relative', display: 'inline-block', width: '34px', height: '18px' }}>
                      <input type="checkbox" checked={!isLight} onChange={(e) => { setEnvironment({ uiTheme: e.target.checked ? 'dark' : 'light' }); setMonthColor(17, e.target.checked ? '#464646' : '#ffffff'); }} style={{ opacity: 0, width: 0, height: 0 }} />
                      <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: isLight ? '#ccc' : '#2196F3', transition: '.4s', borderRadius: '18px' }}>
                        <span style={{ position: 'absolute', content: '""', height: '14px', width: '14px', left: '2px', bottom: '2px', backgroundColor: 'white', transition: '.4s', borderRadius: '50%', transform: !isLight ? 'translateX(16px)' : 'translateX(0)' }}></span>
                      </span>
                    </label>
                    <span style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Dark</span>
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ fontSize: '0.75rem' }}>Background Color</span>
                    <input 
                      type="color" 
                      value={monthColors[17] || (isLight ? '#ffffff' : '#000000')} 
                      onChange={(e) => setMonthColor(17, e.target.value)}
                      style={{ width: '20px', height: '20px', padding: 0, border: 'none', background: 'transparent', cursor: 'pointer' }}
                    />
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={sunpathSettings.showGrid} 
                      onChange={(e) => setSunpathSettings({ showGrid: e.target.checked })}
                    />
                    <span style={{ fontSize: '0.75rem' }}>GRID</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={sunpathSettings.showAxes} 
                      onChange={(e) => setSunpathSettings({ showAxes: e.target.checked })}
                    />
                    <span style={{ fontSize: '0.75rem' }}>AXES</span>
                  </label>
                </div>

                {/* Row 2: Animation, Shadows, Default */}
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={objects.some(o => o.isAnimated)} 
                      onChange={(e) => {
                        const ids = objects.map(o => o.id)
                        useEditorStore.getState().updateObjectProperties(ids, { isAnimated: e.target.checked })
                      }}
                    />
                    <span style={{ marginLeft: '4px', fontSize: '0.75rem' }}>ANIMATION</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={shadowsEnabled} 
                      onChange={(e) => setEnvironment({ shadowsEnabled: e.target.checked })}
                    />
                    <span style={{ marginLeft: '4px', fontSize: '0.75rem' }}>SHADOWS</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={showEdges} 
                      onChange={(e) => setEnvironment({ showEdges: e.target.checked })}
                    />
                    <span style={{ marginLeft: '4px', fontSize: '0.75rem' }}>EDGES</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={showHUD} 
                      onChange={(e) => setEnvironment({ showHUD: e.target.checked })}
                    />
                    <span style={{ marginLeft: '4px', fontSize: '0.75rem' }}>NOTES</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ fontSize: '0.75rem' }}>GLOBAL TEXT SIZE</span>
                    <input 
                      type="number" min="0.1" max="10" step="0.1" 
                      value={globalTextSize ?? 1} 
                      onChange={(e) => setEnvironment({ globalTextSize: parseFloat(e.target.value) || 0.1 })}
                      style={{ width: '60px', padding: '2px 4px', fontSize: '0.8rem', border: `1px solid ${inputBorder}`, borderRadius: '4px', background: inputBg, color: textMain }}
                    />
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ fontSize: '0.75rem' }}>GLOBAL UNIT</span>
                    <select 
                      value={scaleRingUnit} 
                      onChange={(e) => {
                        const newUnit = e.target.value;
                        setScaleRingUnit(newUnit);
                        const store = useEditorStore.getState();
                        if (newUnit === 'ft') {
                          const ftValue = store.mapRadius * 3.28084;
                          const snappedFt = Math.round(ftValue / 10) * 10;
                          setMapRadius(snappedFt / 3.28084);
                        } else {
                          const mValue = store.mapRadius;
                          const snappedM = Math.round(mValue / 10) * 10;
                          setMapRadius(snappedM);
                        }
                      }}
                      style={{ fontSize: '0.75rem', padding: '2px 4px', background: inputBg, color: textMain, border: `1px solid ${inputBorder}`, borderRadius: '4px' }}
                    >
                      <option value="m">M (m)</option>
                      <option value="ft">FT (ft)</option>
                    </select>
                  </label>
                  <button 
                    title="Reset all colors and sizes to defaults"
                    onClick={() => {
                      const defaultMonthColors = {
                        1: '#cccccc', 2: '#cccccc', 3: '#cccccc', 4: '#cccccc', 5: '#cccccc', 
                        6: '#ff0000', 7: '#cccccc', 8: '#cccccc', 9: '#00ff00', 10: '#cccccc', 
                        11: '#cccccc', 12: '#0000ff', 13: '#ff0000', 14: '#233156', 15: '#233156', 
                        16: '#ffd700', 17: '#ffffff', 18: '#ffcc00'
                      }
                      const defaultSunpathSettings = {
                        showSky: true, showCompass: true, showMonths: true, showAnalemma: false, 
                        showHourlySun: true, showText: true, sunSize: 1.2, 
                        sunpathThickness: 2, compassThickness: 1, sunpathDashSize: 1, showGrid: true, showAxes: true
                      }
                      useEditorStore.getState().setEnvironment({ 
                        visibleMonths: [6, 9, 12], 
                        monthDates: { ...useEditorStore.getState().monthDates, 6: 21, 9: 21, 12: 21 }, 
                        activeMonth: 6,
                        uiTheme: 'light',
                        globalTextSize: 2,
                        monthColorsLight: defaultMonthColors,
                        monthColorsDark: {
                          1: '#cccccc', 2: '#cccccc', 3: '#cccccc', 4: '#cccccc', 5: '#cccccc', 
                          6: '#ff0000', 7: '#cccccc', 8: '#cccccc', 9: '#00ff00', 10: '#cccccc', 
                          11: '#cccccc', 12: '#0000ff', 13: '#ff0000', 14: '#ffffff', 15: '#999999', 
                          16: '#ffd700', 17: '#000000', 18: '#ffcc00'
                        }
                      })
                      useEditorStore.getState().setSunpathSettings(defaultSunpathSettings)
                    }} 
                    style={{ fontSize: '0.75rem', padding: '4px 8px', borderRadius: '4px', border: `1px solid ${borderCol}`, background: inputBg, color: textMain, cursor: 'pointer', fontWeight: 'bold', marginLeft: 'auto' }}
                  >
                    Default
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* H2: Location & Context */}
          <H2Header id="location" title="Location & Context" icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path>
              <path d="M2 12h20"></path>
            </svg>
          } />
          {activeH2 === 'location' && (
            <div style={{ background: isLight ? '#f9fafb' : '#1a1a1a', padding: '15px' }}>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>Paste Address / Lat, Lng</span>
                  <input 
                    type="text" 
                    placeholder="e.g. 40.701, -73.948 or 'Hanoi' then press Enter"
                    onChange={(e) => {
                      const val = e.target.value
                      const parts = val.split(',')
                      if (parts.length === 2) {
                        const lat = Math.max(-90, Math.min(90, parseFloat(parts[0].trim())))
                        const lng = Math.max(-180, Math.min(180, parseFloat(parts[1].trim())))
                        if (!isNaN(lat) && !isNaN(lng)) {
                          setEnvironment({ latitude: lat, longitude: lng })
                        }
                      }
                    }}
                    onKeyDown={async (e) => {
                      if (e.key === 'Enter') {
                        const val = e.currentTarget.value.trim();
                        if (!val) return;
                        
                        // Prevent searching if it's already a valid Lat, Lng
                        const parts = val.split(',');
                        if (parts.length === 2 && !isNaN(parseFloat(parts[0])) && !isNaN(parseFloat(parts[1]))) {
                          return;
                        }

                        setCustomAlert({ title: 'Searching...', message: `Looking up location for "${val}"` });
                        try {
                          // Try Mapbox API first if token exists
                          const mapboxToken = useEditorStore.getState().mapboxToken;
                          if (mapboxToken) {
                            const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(val)}.json?access_token=${mapboxToken}&limit=1`);
                            const data = await res.json();
                            if (data.features && data.features.length > 0) {
                              const [lng, lat] = data.features[0].center;
                              setEnvironment({ latitude: lat, longitude: lng });
                              setCustomAlert({ title: 'Location Found', message: data.features[0].place_name });
                              setTimeout(() => setCustomAlert(null), 4000);
                              return;
                            }
                          }
                          
                          // Fallback to Nominatim
                          const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(val)}&format=json&limit=1`);
                          const data = await res.json();
                          if (data && data.length > 0) {
                            const lat = parseFloat(data[0].lat);
                            const lng = parseFloat(data[0].lon);
                            setEnvironment({ latitude: lat, longitude: lng });
                            setCustomAlert({ title: 'Location Found', message: data[0].display_name });
                            setTimeout(() => setCustomAlert(null), 4000);
                          } else {
                            setCustomAlert({ title: 'Not Found', message: 'Could not find the specified location.' });
                            setTimeout(() => setCustomAlert(null), 3000);
                          }
                        } catch (err) {
                          console.error(err);
                          setCustomAlert({ title: 'Error', message: 'Failed to search location.' });
                          setTimeout(() => setCustomAlert(null), 3000);
                        }
                      }
                    }}
                    style={{ width: '100%', padding: '8px', background: inputBg, color: textMain, border: `1px solid ${inputBorder}`, borderRadius: '4px' }} 
                  />
                  <div style={{ fontSize: '0.75rem', color: textMuted, marginTop: '-2px' }}>Type an address and press Enter to search</div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>Latitude</span>
                  <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                    <button onClick={() => setEnvironment({ latitude: Math.max(-90, (latitude || 0) - 0.0005) })} style={{ width: '24px', height: '24px', borderRadius: '4px', border: `1px solid ${borderCol}`, background: bgPanel, color: textMain, cursor: 'pointer' }}>-</button>
                    <input type="number" step="0.0001" value={latitude} onChange={(e) => setEnvironment({ latitude: Math.max(-90, Math.min(90, parseFloat(e.target.value))) })} style={{ width: '80px', padding: '4px', background: inputBg, color: textMain, border: `1px solid ${inputBorder}`, borderRadius: '4px', textAlign: 'center' }} />
                    <button onClick={() => setEnvironment({ latitude: Math.min(90, (latitude || 0) + 0.0005) })} style={{ width: '24px', height: '24px', borderRadius: '4px', border: `1px solid ${borderCol}`, background: bgPanel, color: textMain, cursor: 'pointer' }}>+</button>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>Longitude</span>
                  <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                    <button onClick={() => setEnvironment({ longitude: Math.max(-180, (longitude || 0) - 0.0005) })} style={{ width: '24px', height: '24px', borderRadius: '4px', border: `1px solid ${borderCol}`, background: bgPanel, color: textMain, cursor: 'pointer' }}>-</button>
                    <input type="number" step="0.0001" value={longitude} onChange={(e) => setEnvironment({ longitude: Math.max(-180, Math.min(180, parseFloat(e.target.value))) })} style={{ width: '80px', padding: '4px', background: inputBg, color: textMain, border: `1px solid ${inputBorder}`, borderRadius: '4px', textAlign: 'center' }} />
                    <button onClick={() => setEnvironment({ longitude: Math.min(180, (longitude || 0) + 0.0005) })} style={{ width: '24px', height: '24px', borderRadius: '4px', border: `1px solid ${borderCol}`, background: bgPanel, color: textMain, cursor: 'pointer' }}>+</button>
                  </div>
                </div>
              </div>

              <div style={{ borderTop: `1px solid ${borderCol}`, paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Diagram Radius ({scaleRingUnit})</span>
                    <span style={{ fontSize: '0.85rem' }}>{scaleRingUnit === 'ft' ? Math.round(mapRadius * 3.28084) : mapRadius}{scaleRingUnit}</span>
                  </div>
                  <input 
                    type="range" 
                    min={scaleRingUnit === 'ft' ? Math.round(20 * 3.28084) : 20} 
                    max={scaleRingUnit === 'ft' ? Math.round(5000 * 3.28084) : 5000} 
                    step={scaleRingUnit === 'ft' ? 50 : 20} 
                    value={scaleRingUnit === 'ft' ? Math.round(mapRadius * 3.28084) : mapRadius} 
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setMapRadius(scaleRingUnit === 'ft' ? Math.round(v / 3.28084) : v);
                    }} 
                    style={{ width: '100%' }}
                  />
                </div>

                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', fontWeight: 'bold' }}>
                  <input 
                    type="checkbox" 
                    checked={showMapBackground} 
                    onChange={(e) => setShowMapBackground(e.target.checked)}
                  />
                  <span style={{ marginLeft: '8px', fontSize: '0.9rem' }}>Enable Context Map</span>
                </label>
                
                {showMapBackground && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Map Style</span>
                      <select 
                        value={mapStyle} 
                        onChange={(e) => setMapStyle(e.target.value)}
                        style={{ padding: '6px', background: inputBg, color: textMain, border: `1px solid ${inputBorder}`, borderRadius: '4px' }}
                      >
                        <option value="satellite-v9">Satellite</option>
                        <option value="satellite-streets-v12">Satellite + Streets</option>
                        <option value="light-v11">Light Map</option>
                        <option value="dark-v11">Dark Map</option>
                        <option value="streets-v12">Streets (Standard)</option>
                      </select>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Opacity</span>
                        <span style={{ fontSize: '0.85rem' }}>{Math.round(mapOpacity * 100)}%</span>
                      </div>
                      <input 
                        type="range" min="0.1" max="1" step="0.1" 
                        value={mapOpacity} onChange={(e) => setMapOpacity(Number(e.target.value))} 
                        style={{ width: '100%' }}
                      />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Zoom Level</span>
                        <span style={{ fontSize: '0.85rem' }}>{mapZoom}</span>
                      </div>
                      <input 
                        type="range" min="10" max="22" step="1" 
                        value={mapZoom} onChange={(e) => setMapZoom(Number(e.target.value))} 
                        style={{ width: '100%' }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Distance Rings Section */}
              <div style={{ borderTop: `1px solid ${borderCol}`, paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', fontWeight: 'bold' }}>
                  <input 
                    type="checkbox" 
                    checked={showScaleRings} 
                    onChange={(e) => setShowScaleRings(e.target.checked)}
                  />
                  <span style={{ marginLeft: '8px', fontSize: '0.9rem' }}>Enable Distance Rings</span>
                </label>
                
                {showScaleRings && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Number of Rings</span>
                          <span style={{ fontSize: '0.85rem' }}>{scaleRingCount}</span>
                        </div>
                        <input 
                          type="range" min="1" max="20" step="1" 
                          value={scaleRingCount} onChange={(e) => setScaleRingCount(Number(e.target.value))} 
                          style={{ width: '100%' }}
                        />
                      </div>
                    </div>
                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', fontWeight: 'bold', marginTop: '15px' }}>
                      <input 
                        type="checkbox" 
                        checked={sunpathSettings.showGrid} 
                        onChange={(e) => setSunpathSettings({ showGrid: e.target.checked })}
                      />
                      <span style={{ marginLeft: '8px', fontSize: '0.9rem' }}>Enable Grid</span>
                    </label>
                    {sunpathSettings.showGrid && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', marginTop: '15px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Grid Cell Size ({scaleRingUnit})</span>
                            <span style={{ fontSize: '0.85rem' }}>{scaleRingUnit === 'ft' ? Math.round(gridSize * 3.28084) : Math.round(gridSize)}{scaleRingUnit}</span>
                          </div>
                          <input 
                            type="range" min="1" max={scaleRingUnit === 'ft' ? 60 : 20} step="1" 
                            value={scaleRingUnit === 'ft' ? Math.round(gridSize * 3.28084) : Math.round(gridSize)} 
                            onChange={(e) => {
                              const v = Number(e.target.value);
                              setEnvironment({ gridSize: scaleRingUnit === 'ft' ? v / 3.28084 : v });
                            }} 
                            style={{ width: '100%' }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* H2: Import */}
          <H2Header id="import" title="Import" icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
          } />
          {activeH2 === 'import' && (
            <div style={{ background: isLight ? '#f9fafb' : '#1a1a1a', padding: '10px' }}>
              <div style={{ display: 'flex', marginBottom: '15px', borderBottom: `1px solid ${borderCol}` }}>
                {['import3d', 'materials'].map(tab => (
                  <div 
                    key={tab} onClick={() => setImportTab(tab as any)}
                    style={{ 
                      flex: 1, textAlign: 'center', padding: '8px 5px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: importTab === tab ? 'bold' : 'normal',
                      borderBottom: importTab === tab ? '2px solid #3b82f6' : 'none', color: importTab === tab ? '#3b82f6' : textMuted
                    }}
                  >
                    {tab === 'import3d' ? 'Import 3D' : 'Custom Material'}
                  </div>
                ))}
              </div>

              {importTab === 'import3d' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '1rem', color: textMain }}>ADD BASIC SHAPES</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    {(() => {
                      const selectedObj = objects.find(o => selectedIds.includes(o.id));
                      const selectedUrl = selectedObj?.url || '';
                      const shapeActive = (shape: string) => selectedUrl === shape || placingUrl === shape
                        ? { background: '#3b82f6', color: '#fff', border: 'none', padding: '8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 'bold' as const }
                        : { background: inputBg, color: textMain, border: `1px solid ${inputBorder}`, padding: '8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 'bold' as const };
                      return (
                        <>
                          <button onClick={() => setPlacingUrl('BOX')} style={shapeActive('BOX')}>Box</button>
                          <button onClick={() => setPlacingUrl('CYLINDER')} style={shapeActive('CYLINDER')}>Cylinder</button>
                          <button onClick={() => setPlacingUrl('CONE')} style={shapeActive('CONE')}>Cone</button>
                          <button onClick={() => setPlacingUrl('SPHERE')} style={shapeActive('SPHERE')}>Sphere</button>
                          <button onClick={() => setPlacingUrl('PYRAMID')} style={{...shapeActive('PYRAMID'), gridColumn: '1 / -1'}}>Pyramid</button>
                        </>
                      );
                    })()}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '1rem', color: textMain }}>IMPORT CUSTOM 3D</div>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: textMuted }}>
                    Import custom 3D files (.glb, .gltf) up to 5MB. Large files may cause performance issues.
                  </p>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <label style={{ 
                        background: '#3b82f6', color: '#fff', border: 'none', padding: '12px', borderRadius: '4px', 
                        cursor: 'pointer', fontSize: '0.9rem', fontWeight: 'bold', textAlign: 'center', display: 'block' 
                      }}>
                      + Choose 3D File
                      <input 
                        type="file" 
                        accept=".glb,.gltf"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          if (file.size > 5 * 1024 * 1024) {
                            useEditorStore.getState().setCustomAlert({ title: 'Error', message: "File size exceeds 5MB limit. Please choose a smaller file." });
                            e.target.value = '';
                            return;
                          }
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            const dataUrl = event.target?.result;
                            if (typeof dataUrl === 'string') {
                              setPlacingUrl(dataUrl);
                            }
                          };
                          reader.readAsDataURL(file);
                          e.target.value = '';
                        }}
                      />
                    </label>
                  </div>
                </div>
              )}

              {importTab === 'materials' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {(() => {
                    const activeObj = objects.find(o => selectedIds.includes(o.id) && (o.url.startsWith('data:') || o.url.startsWith('blob:') || ['BOX', 'CYLINDER', 'CONE', 'SPHERE', 'PYRAMID'].includes(o.url) || o.url.toLowerCase().endsWith('.glb') || o.url.toLowerCase().endsWith('.gltf')));
                    if (!activeObj) {
                      return <div style={{ fontSize: '0.85rem', color: textMuted }}>Please select a custom imported 3D object to edit its materials.</div>
                    }
                    return <CustomMaterialEditor obj={activeObj} />
                  })()}
                </div>
              )}
            </div>
          )}

          {/* H2: Sun Diagram */}
          <H2Header id="sundiagram" title="Sun Diagram" icon="/SunDiagram-logo.svg" />
          {activeH2 === 'sundiagram' && (
            <div style={{ background: isLight ? '#f9fafb' : '#1a1a1a', padding: '10px' }}>
              
              {/* Sun Diagram Tabs */}
              <div style={{ display: 'flex', marginBottom: '15px', borderBottom: `1px solid ${borderCol}` }}>
                {['create', 'shadow', 'style'].map(tab => (
                  <div 
                    key={tab} onClick={() => setSunTab(tab as any)}
                    style={{ 
                      flex: 1, textAlign: 'center', padding: '8px 5px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: sunTab === tab ? 'bold' : 'normal',
                      borderBottom: sunTab === tab ? '2px solid #3b82f6' : 'none', color: sunTab === tab ? '#3b82f6' : textMuted
                    }}
                  >
                    {tab === 'create' ? '3D Sun path' : tab === 'shadow' ? 'Shadow' : 'Style'}
                  </div>
                ))}
              </div>

              {/* CREATE SUN PATH TAB */}
              {sunTab === 'create' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', padding: '5px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', background: bgPanel, padding: '10px', borderRadius: '4px', border: `1px solid ${borderCol}` }}>
                    <input 
                      type="checkbox" 
                      checked={showSunDiagramLayer} 
                      onChange={(e) => useEditorStore.getState().setLayerVisibility('sunDiagram', e.target.checked)} 
                    />
                    <span style={{ marginLeft: '8px', fontWeight: 'bold' }}>Enable Show Sun path</span>
                  </label>

                  <div style={{ padding: '10px', background: bgPanel, borderRadius: '6px', border: `1px solid ${borderCol}`, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>Scale Sun path</span>
                      <span style={{ fontSize: '0.9rem' }}>{sunpathSettings?.sunpathScale?.toFixed(1) ?? 1.0}</span>
                    </div>
                    <input 
                      type="range" min="0.1" max="10" step="0.1" 
                      value={sunpathSettings?.sunpathScale ?? 1.0} 
                      onChange={(e) => setSunpathSettings({ sunpathScale: parseFloat(e.target.value) })} 
                      style={{ width: '100%' }} 
                    />
                  </div>

                  <div style={{ padding: '10px', background: bgPanel, borderRadius: '6px', border: `1px solid ${borderCol}`, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.9rem' }}>Time Zone</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        {timezoneMode === 'auto' && <span style={{ fontSize: '0.8rem', color: textMuted, fontWeight: 'bold' }}>UTC {Math.round(longitude/15) >= 0 ? '+'+Math.round(longitude/15) : Math.round(longitude/15)}</span>}
                        <select value={timezoneMode} onChange={(e) => setEnvironment({ timezoneMode: e.target.value as 'auto' | 'manual' })} style={{ padding: '4px', background: inputBg, color: textMain, border: `1px solid ${inputBorder}`, borderRadius: '4px' }}>
                          <option value="auto">Auto</option>
                          <option value="manual">Manual</option>
                        </select>
                      </div>
                    </div>
                    {timezoneMode === 'manual' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <span style={{ fontSize: '0.9rem' }}>Time zone</span>
                        <select 
                          value={utcOffset} 
                          onChange={(e) => setEnvironment({ utcOffset: parseFloat(e.target.value) })} 
                          style={{ width: '100%', padding: '6px', background: inputBg, color: textMain, border: `1px solid ${inputBorder}`, borderRadius: '4px', fontSize: '0.8rem' }}
                        >
                          {TIMEZONES.map(tz => (
                            <option key={tz.offset} value={tz.offset}>{tz.label}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.9rem' }}>DST (Daylight Saving)</span>
                      <select value={dstMode} onChange={(e) => setEnvironment({ dstMode: e.target.value as 'auto' | 'on' | 'off' })} style={{ padding: '4px', background: inputBg, color: textMain, border: `1px solid ${inputBorder}`, borderRadius: '4px' }}>
                        <option value="auto">Auto</option>
                        <option value="on">On (manual)</option>
                        <option value="off">Off (manual)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                      <span style={{ fontSize: '0.9rem' }}>True North (Offset North)</span>
                      <span style={{ color: textMuted, fontSize: '0.9rem' }}>{northOffset}°</span>
                    </div>
                    <input type="range" min="-180" max="180" value={northOffset} onChange={(e) => setEnvironment({ northOffset: parseInt(e.target.value) })} style={{ width: '100%' }} />
                    <div style={{ fontSize: '0.75rem', color: textMuted, marginTop: '4px', fontStyle: 'italic' }}>
                      * Rotate the compass to match your project's True North.
                    </div>
                  </div>
                </div>
              )}

              {/* SHADOW ANALYSIS TAB */}
              {sunTab === 'shadow' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', padding: '5px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', background: bgPanel, padding: '10px', borderRadius: '4px', border: `1px solid ${borderCol}` }}>
                    <input type="checkbox" checked={shadowsEnabled} onChange={(e) => setEnvironment({ shadowsEnabled: e.target.checked })} />
                    <span style={{ marginLeft: '8px', fontWeight: 'bold' }}>Enable Environment Shadows</span>
                  </label>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: bgPanel, padding: '10px', borderRadius: '4px', border: `1px solid ${borderCol}` }}>
                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                      <input type="checkbox" checked={showHUD} onChange={(e) => setEnvironment({ showHUD: e.target.checked })} />
                      <span style={{ marginLeft: '8px', fontSize: '0.9rem', color: showHUD ? '#3b82f6' : 'inherit' }}>Show On-Screen Info (Notes)</span>
                    </label>
                    {showHUD && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2px' }}>
                        {['top-left', 'top-center', 'top-right', 'middle-left', 'middle-center', 'middle-right', 'bottom-left', 'bottom-center', 'bottom-right'].map(pos => (
                          <div 
                            key={pos}
                            onClick={() => setEnvironment({ hudPosition: pos as any })}
                            style={{ 
                              width: '12px', height: '10px', 
                              background: hudPosition === pos ? '#3b82f6' : (isLight ? '#d1d5db' : '#555'),
                              border: `1px solid ${hudPosition === pos ? '#2563eb' : (isLight ? '#9ca3af' : '#444')}`,
                              cursor: 'pointer', borderRadius: '2px'
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  <hr style={{ border: 'none', borderTop: `1px solid ${borderCol}`, margin: '0 5px' }} />

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '5px' }}>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => {
                      const pairedMonth: Record<number, number> = { 1:11, 2:10, 3:9, 4:8, 5:7, 7:5, 8:4, 9:3, 10:2, 11:1 }
                      const pair = pairedMonth[m]
                      const isVisible = visibleMonths.includes(m)
                      
                      const isActive = activeMonth === m
                      const dayOfYear = getDayOfYear(m, monthDates[m] || 21)
                      const isDst = isDstActive(dayOfYear, latitude || 21.0285, dstMode)
                      const baseUtc = timezoneMode === 'auto' ? (Math.round(longitude/15) >= 0 ? '+'+Math.round(longitude/15) : Math.round(longitude/15)) : (utcOffset >= 0 ? '+'+utcOffset : utcOffset)
                      
                      return (
                        <div key={m} style={{ background: bgPanel, border: `1px solid ${isActive ? '#3b82f6' : borderCol}`, borderRadius: '6px', padding: '10px', opacity: isVisible ? 1 : 0.6 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: isVisible ? '10px' : '0' }}>
                            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', fontWeight: isActive ? 'bold' : 'normal' }}>
                              <input 
                                type="checkbox" 
                                checked={isVisible} 
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    let next = [...visibleMonths]
                                    if (pair && next.includes(pair)) {
                                      next = next.filter(x => x !== pair)
                                    }
                                    next.push(m)
                                    setEnvironment({ visibleMonths: next.sort((a,b)=>a-b), activeMonth: m })
                                  } else {
                                    const next = visibleMonths.filter(x => x !== m)
                                    setEnvironment({ visibleMonths: next, activeMonth: next.length > 0 ? next[0] : 6 })
                                  }
                                }} 
                              />
                              <span style={{ marginLeft: '10px' }}>{monthNames[m-1]} {(!isVisible && pair) && `(Same path as ${monthNames[pair-1].substring(0,3)})`}</span>
                            </label>
                            {isVisible && (
                              <span style={{ fontSize: '0.75rem', color: isDst ? '#3b82f6' : textMuted, fontWeight: isDst ? 'bold' : 'normal' }}>
                                UTC {baseUtc} {isDst && '(DST)'}
                              </span>
                            )}
                          </div>
                          
                          {isVisible && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                              {([6, 9, 12].includes(m) || isPro) ? (
                                <>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <span style={{ fontSize: '0.8rem', color: textMuted }}>Day:</span>
                                    <input type="number" min="1" max="31" value={monthDates[m] || 21} onChange={(e) => setEnvironment({ monthDates: { ...monthDates, [m]: parseInt(e.target.value) }, activeMonth: m })} style={{ width: '50px', padding: '4px', background: inputBg, color: textMain, border: `1px solid ${inputBorder}`, borderRadius: '4px', fontSize: '0.85rem' }} />
                                    {m === 6 && (monthDates[m]===21) && <span style={{ fontSize: '0.7rem', background: '#fef08a', color: '#854d0e', padding: '2px 6px', borderRadius: '4px' }}>Summer Solstice</span>}
                                    {m === 12 && (monthDates[m]===21) && <span style={{ fontSize: '0.7rem', background: '#bae6fd', color: '#0369a1', padding: '2px 6px', borderRadius: '4px' }}>Winter Solstice</span>}
                                    {m === 9 && (monthDates[m]===21) && <span style={{ fontSize: '0.7rem', background: '#ffedd5', color: '#c2410c', padding: '2px 6px', borderRadius: '4px' }}>Autumn Equinox</span>}
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <span style={{ fontSize: '0.8rem', color: textMuted }}>Time:</span>
                                    <input 
                                      type="range" min="0" max="24" step="0.5" 
                                      value={isActive ? timeOfDay : 12} 
                                      onChange={(e) => setEnvironment({ timeOfDay: parseFloat(e.target.value), activeMonth: m })}
                                      style={{ flex: 1 }} 
                                    />
                                    <span style={{ fontSize: '0.85rem', width: '40px', textAlign: 'right' }}>
                                      {isActive ? `${Math.floor(timeOfDay).toString().padStart(2, '0')}:${(timeOfDay % 1 === 0.5 ? '30' : '00')}` : '12:00'}
                                    </span>
                                  </div>
                                </>
                              ) : (
                                <div onClick={() => setIsAuthModalOpen(true)} style={{ background: isLight ? 'linear-gradient(135deg, #fffbeb, #fef3c7)' : 'linear-gradient(135deg, #422006, #78350f)', border: `1px solid ${isLight ? '#fde68a' : '#92400e'}`, borderRadius: '4px', padding: '8px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span style={{ fontSize: '0.75rem', color: isLight ? '#d97706' : '#fbbf24', fontWeight: 'bold' }}>Custom Date & Time</span>
                                  <span style={{ fontSize: '0.5rem', background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: 'white', padding: '2px 4px', borderRadius: '3px', fontWeight: 'bold' }}>PRO</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* DIAGRAM STYLE TAB */}
              {sunTab === 'style' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', padding: '5px' }}>
                  <div style={{ background: bgPanel, borderRadius: '6px', padding: '10px', border: `1px solid ${borderCol}` }}>
                    <div onClick={() => setShowSunPathComponents(!showSunPathComponents)} style={{ fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '10px', color: '#3b82f6', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                      <span style={{ display: 'inline-block', marginRight: '5px' }}>{showSunPathComponents ? '▼' : '▶'}</span> Sun Path Components
                    </div>
                    {showSunPathComponents && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingLeft: '5px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                          <input type="checkbox" checked={sunpathSettings.showText} onChange={(e) => setSunpathSettings({ showText: e.target.checked })} />
                          <span style={{ marginLeft: '8px', fontSize: '0.9rem' }}>Text Labels</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                          <input type="checkbox" checked={sunpathSettings.showHourlySun} onChange={(e) => setSunpathSettings({ showHourlySun: e.target.checked })} />
                          <span style={{ marginLeft: '8px', fontSize: '0.9rem' }}>Hourly Sun Position</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                          <input type="checkbox" checked={sunpathSettings.showSky} onChange={(e) => setSunpathSettings({ showSky: e.target.checked })} />
                          <span style={{ marginLeft: '8px', fontSize: '0.9rem' }}>Sky Dome</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                          <input type="checkbox" checked={sunpathSettings.showCompass} onChange={(e) => setSunpathSettings({ showCompass: e.target.checked })} />
                          <span style={{ marginLeft: '8px', fontSize: '0.9rem' }}>Compass</span>
                        </label>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', marginTop: '10px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                            <span style={{ fontSize: '0.8rem', color: textMuted }}>Sun Size:</span>
                            <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>{sunpathSettings?.sunSize ?? 2}</span>
                          </div>
                          <input type="range" min="0.1" max="10" step="0.1" value={sunpathSettings?.sunSize ?? 2} onChange={(e) => setSunpathSettings({ sunSize: parseFloat(e.target.value) })} style={{ width: '100%' }} />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                            <span style={{ fontSize: '0.8rem', color: textMuted }}>Sun Path Line Thickness:</span>
                            <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>{sunpathSettings?.sunpathThickness ?? 1}</span>
                          </div>
                          <input type="range" min="0.1" max="10" step="0.1" value={sunpathSettings?.sunpathThickness ?? 1} onChange={(e) => setSunpathSettings({ sunpathThickness: parseFloat(e.target.value) })} style={{ width: '100%' }} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                            <span style={{ fontSize: '0.8rem', color: textMuted }}>Compass Line Thickness:</span>
                            <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>{sunpathSettings?.compassThickness ?? 1}</span>
                          </div>
                          <input type="range" min="0.1" max="10" step="0.1" value={sunpathSettings?.compassThickness ?? 1} onChange={(e) => setSunpathSettings({ compassThickness: parseFloat(e.target.value) })} style={{ width: '100%' }} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                            <span style={{ fontSize: '0.8rem', color: textMuted }}>Sun Path Dash Size:</span>
                            <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>{sunpathSettings?.sunpathDashSize ?? 2}</span>
                          </div>
                          <input type="range" min="0.1" max="10" step="0.1" value={sunpathSettings?.sunpathDashSize ?? 2} onChange={(e) => setSunpathSettings({ sunpathDashSize: parseFloat(e.target.value) })} style={{ width: '100%' }} />
                        </div>
                      </div>
                    )}
                  </div>

                  <div style={{ background: bgPanel, borderRadius: '6px', padding: '10px', border: `1px solid ${borderCol}` }}>
                    <div 
                      onClick={() => setShowObjectColors(!showObjectColors)}
                      style={{ fontWeight: 'bold', fontSize: '0.85rem', marginBottom: showObjectColors ? '10px' : '0', color: '#3b82f6', display: 'flex', alignItems: 'center', cursor: 'pointer', justifyContent: 'space-between' }}
                    >
                      <div>
                        <span style={{ display: 'inline-block', marginRight: '5px', transform: showObjectColors ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}>▶</span> 
                        Sun Path Colors
                      </div>
                      {!isPro && <span style={{ fontSize: '0.5rem', background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: 'white', padding: '2px 4px', borderRadius: '3px' }}>PRO</span>}
                    </div>
                    {showObjectColors && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingLeft: '15px', position: 'relative' }}>
                        {!isPro && (
                           <div onClick={(e) => { e.stopPropagation(); setIsAuthModalOpen(true); }} style={{ position: 'absolute', inset: 0, zIndex: 10, cursor: 'pointer', background: 'rgba(0,0,0,0.01)' }} />
                        )}
                        {[
                          { id: 13, label: 'Sun Color' },
                          { id: 14, label: 'Text Color' },
                          { id: 15, label: 'Compass Color' },
                          { id: 16, label: 'Sky Dome Color' },
                          { id: 18, label: 'Hourly Sun Color' }
                        ].map(obj => (
                          <div key={obj.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: isPro ? 1 : 0.5 }}>
                            <span style={{ fontSize: '0.8rem', color: textMain }}>{obj.label}</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                              <input 
                                type="color" 
                                value={monthColors[obj.id] || '#ffffff'}
                                onChange={(e) => setMonthColor(obj.id, e.target.value)}
                                disabled={!isPro}
                                style={{ width: '24px', height: '24px', padding: '0', border: 'none', borderRadius: '4px', cursor: isPro ? 'pointer' : 'default' }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div style={{ background: bgPanel, padding: '10px', borderRadius: '6px', border: `1px solid ${borderCol}` }}>
                    <div 
                      onClick={() => setShowMonthColors(!showMonthColors)}
                      style={{ fontWeight: 'bold', fontSize: '0.9rem', marginBottom: showMonthColors ? '10px' : '0', color: '#3b82f6', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                    >
                      <div>
                        <span style={{ display: 'inline-block', marginRight: '5px', transform: showMonthColors ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}>▶</span> 
                        Month Colors
                      </div>
                      {!isPro && <span style={{ fontSize: '0.5rem', background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: 'white', padding: '2px 4px', borderRadius: '3px' }}>PRO</span>}
                    </div>
                    {showMonthColors && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingLeft: '15px', position: 'relative' }}>
                        {!isPro && (
                           <div onClick={(e) => { e.stopPropagation(); setIsAuthModalOpen(true); }} style={{ position: 'absolute', inset: 0, zIndex: 10, cursor: 'pointer', background: 'rgba(0,0,0,0.01)' }} />
                        )}
                        {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: isPro ? 1 : 0.5 }}>
                            <span style={{ fontSize: '0.8rem', color: textMain }}>{m}</span>
                            <input 
                              type="color" 
                              value={monthColors[i + 1] || '#ffffff'}
                              onChange={(e) => setMonthColor(i + 1, e.target.value)}
                              disabled={!isPro}
                              style={{ width: '24px', height: '24px', padding: '0', border: 'none', borderRadius: '4px', cursor: isPro ? 'pointer' : 'default' }}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* H2: Dynamic Symbols */}
          <H2Header id="symbols" title="Dynamic Symbols" icon="/dynamic-symbols-logo.svg" onToggle={() => setSymbolTab('library')} />
          {activeH2 === 'symbols' && (
            <div style={{ background: isLight ? '#f9fafb' : '#1a1a1a', padding: '10px' }}>
              
              <div style={{ display: 'flex', marginBottom: '15px', borderBottom: `1px solid ${borderCol}` }}>
                {['library', 'properties'].map(tab => (
                  <div 
                    key={tab} onClick={() => setSymbolTab(tab as any)}
                    style={{ 
                      flex: 1, textAlign: 'center', padding: '8px 5px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: symbolTab === tab ? 'bold' : 'normal',
                      borderBottom: symbolTab === tab ? '2px solid #3b82f6' : 'none', color: symbolTab === tab ? '#3b82f6' : textMuted
                    }}
                  >
                    {tab === 'library' ? 'Symbols Library' : 'Properties'}
                  </div>
                ))}
              </div>

              {symbolTab === 'library' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <input 
                    type="text" 
                    placeholder="Search symbol name..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: `1px solid ${inputBorder}`, background: inputBg, color: textMain, fontSize: '0.85rem' }}
                  />
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gridAutoRows: 'max-content', gap: '10px', paddingRight: '5px' }}>
                    {filteredModels.map((modelName) => (
                      <LibraryItem 
                        key={modelName} 
                        modelName={modelName}
                        hasSelection={selectedIds.length > 0}
                        onAdd={(name) => {
                          const url = getModelUrl(name)
                          if (url.toUpperCase().includes('SUNPATH')) {
                            useEditorStore.getState().addObject(url, [0, 0, 0])
                          } else {
                            setPlacingUrl(url)
                          }
                        }}
                        onReplace={(name) => {
                          if (selectedIds.length > 0) replaceObjectUrl(selectedIds, getModelUrl(name))
                        }}
                        onProClick={() => setIsAuthModalOpen(true)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {symbolTab === 'properties' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '5px' }}>
                  {selectedIds.length === 0 ? (
                    <div style={{ textAlign: 'center', color: textMuted, padding: '20px 0' }}>Select an object to edit properties</div>
                  ) : isSunPathSelected ? (
                    <div style={{ textAlign: 'center', color: textMuted, padding: '20px 0' }}>
                      Sun Path properties are managed in the Sun Diagram tab.
                    </div>
                  ) : (
                    <>
                      <div style={{ fontSize: '0.75rem', color: textMuted, marginBottom: '5px', padding: '8px', background: isLight ? '#e5e7eb' : '#374151', borderRadius: '4px' }}>
                        Tip: Switch to the <b>Library</b> tab and click <b>Replace</b> to change the object.
                      </div>
                      <div>
                        <div style={{ fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '10px' }}>COLOR PALETTE</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                          {recentColors.map(c => (
                            <div 
                              key={c} 
                              onClick={() => { setSelectedColor(c); updateObjectProperties(selectedIds, { color: c }) }}
                              style={{ width: '28px', height: '28px', background: c, borderRadius: '50%', cursor: 'pointer', border: selectedColor === c ? '2px solid #3b82f6' : `2px solid ${borderCol}` }}
                            />
                          ))}
                          <div style={{ 
                            position: 'relative', 
                            width: '28px', 
                            height: '28px', 
                            borderRadius: '50%', 
                            background: 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)',
                            overflow: 'hidden',
                            cursor: 'pointer'
                          }}>
                            <input 
                              type="color" 
                              value={selectedColor} 
                              onChange={(e) => {
                                setSelectedColor(e.target.value)
                                updateObjectProperties(selectedIds, { color: e.target.value }, false)
                              }}
                              onBlur={() => {
                                addRecentColor(selectedColor)
                                updateObjectProperties(selectedIds, { color: selectedColor }, true)
                              }}
                              style={{ 
                                position: 'absolute', 
                                top: '-50%', left: '-50%', 
                                width: '200%', height: '200%', 
                                opacity: 0, 
                                cursor: 'pointer' 
                              }}
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <div style={{ fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '10px' }}>OPACITY</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <input 
                            type="range" min="0" max="1" step="0.1" 
                            value={selectedOpacity}
                            onChange={(e) => { const v = parseFloat(e.target.value); setSelectedOpacity(v); updateObjectProperties(selectedIds, { opacity: v }, false) }}
                            onMouseUp={(e) => { const v = parseFloat((e.target as any).value); useEditorStore.getState().updateObjectProperties(selectedIds, { opacity: v }, true) }}
                            style={{ flex: 1 }}
                          />
                          <span style={{ fontSize: '0.85rem', width: '40px' }}>{Math.round(selectedOpacity * 100)}%</span>
                        </div>
                      </div>

                      <div>
                        <div style={{ fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '10px' }}>ANIMATION (DYNAMIC SYMBOLS)</div>
                        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', marginBottom: '10px' }}>
                          <input 
                            type="checkbox" 
                            checked={objects.find(o => o.id === selectedIds[0])?.isAnimated ?? false} 
                            onChange={(e) => updateObjectProperties(selectedIds, { isAnimated: e.target.checked })}
                          />
                          <span style={{ marginLeft: '8px', fontSize: '0.9rem' }}>Enable Animation</span>
                        </label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '0.8rem', color: textMuted }}>Speed:</span>
                          {(() => {
                            const speedMap = [0.25, 0.5, 1, 2, 4];
                            const currentSpeed = objects.find(o => o.id === selectedIds[0])?.animationSpeed ?? 1;
                            let speedIndex = speedMap.indexOf(currentSpeed);
                            if (speedIndex === -1) speedIndex = 2; // Fallback to 1x if exact match not found

                            return (
                              <>
                                <input 
                                  type="range" min="0" max="4" step="1" 
                                  value={speedIndex} 
                                  onChange={(e) => updateObjectProperties(selectedIds, { animationSpeed: speedMap[parseInt(e.target.value)] })}
                                  style={{ flex: 1 }}
                                />
                                <span style={{ fontSize: '0.85rem', width: '36px' }}>{currentSpeed}x</span>
                              </>
                            )
                          })()}
                        </div>
                      </div>

                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* H2: Export */}
          <H2Header id="export" title="Export" icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
          } />
          {activeH2 === 'export' && (
            <div style={{ background: isLight ? '#f9fafb' : '#1a1a1a', padding: '15px' }}>
              <div style={{ fontWeight: 'bold', fontSize: '1rem', marginBottom: '15px' }}>EXPORT SETTINGS</div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '20px' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '5px' }}>Aspect Ratio</div>
                  <div style={{ display: 'flex', gap: '5px', marginBottom: '15px' }}>
                    {(() => {
                      const ratio = Math.round((exportWidth / exportHeight) * 100) / 100;
                      const is1to1 = Math.abs(ratio - 1) < 0.05;
                      const is16to9 = Math.abs(ratio - 16/9) < 0.05;
                      const is9to16 = Math.abs(ratio - 9/16) < 0.05;
                      const activeStyle = { flex: 1, padding: '4px', fontSize: '0.75rem', background: '#3b82f6', color: '#fff', border: '1px solid #3b82f6', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' as const };
                      const defaultStyle = { flex: 1, padding: '4px', fontSize: '0.75rem', background: inputBg, color: textMain, border: `1px solid ${inputBorder}`, borderRadius: '4px', cursor: 'pointer' };
                      return (
                        <>
                          <button onClick={() => setExportResolution(exportWidth, exportWidth)} style={is1to1 ? activeStyle : defaultStyle}>1:1</button>
                          <button onClick={() => setExportResolution(exportWidth, Math.round(exportWidth * 9 / 16))} style={is16to9 ? activeStyle : defaultStyle}>16:9</button>
                          <button onClick={() => setExportResolution(exportWidth, Math.round(exportWidth * 16 / 9))} style={is9to16 ? activeStyle : defaultStyle}>9:16</button>
                        </>
                      );
                    })()}
                  </div>

                  <div style={{ fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '5px' }}>Resolution</div>
                  <div style={{ display: 'flex', gap: '5px', marginBottom: '10px' }}>
                    {(() => {
                      const resActive = { flex: 1, padding: '4px', fontSize: '0.7rem', background: '#3b82f6', color: '#fff', border: '1px solid #3b82f6', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' as const };
                      const resDef = { flex: 1, padding: '4px', fontSize: '0.7rem', background: inputBg, color: textMain, border: `1px solid ${inputBorder}`, borderRadius: '4px', cursor: 'pointer' };
                      return (
                        <>
                          <button onClick={() => setExportResolution(1920, 1080)} style={exportWidth === 1920 ? resActive : resDef}>FHD</button>
                          <button onClick={() => setExportResolution(2560, 1440)} style={exportWidth === 2560 ? resActive : resDef}>2K</button>
                          <button onClick={() => setExportResolution(3200, 1800)} style={exportWidth === 3200 ? resActive : resDef}>3K</button>
                          <button onClick={() => setExportResolution(3840, 2160)} style={exportWidth === 3840 ? resActive : resDef}>4K</button>
                          <button onClick={() => setExportResolution(5120, 2880)} style={exportWidth === 5120 ? resActive : resDef}>5K</button>
                        </>
                      );
                    })()}
                  </div>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <input 
                      type="number" 
                      value={exportWidth} 
                      onChange={(e) => {
                        const newW = parseInt(e.target.value) || 1920;
                        if (isAspectRatioLocked) {
                          setExportResolution(newW, Math.round(newW / (exportWidth / exportHeight)));
                        } else {
                          setExportResolution(newW, exportHeight);
                        }
                      }} 
                      style={{ flex: 1, padding: '6px', background: inputBg, color: textMain, border: `1px solid ${inputBorder}`, borderRadius: '4px' }} 
                    />
                    
                    <button 
                      onClick={() => setIsAspectRatioLocked(!isAspectRatioLocked)}
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '0 2px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      title={isAspectRatioLocked ? "Unlock Aspect Ratio" : "Lock Aspect Ratio"}
                    >
                      {isAspectRatioLocked ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                        </svg>
                      ) : (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                          <path d="M7 11V7a5 5 0 0 1 9.9-1"></path>
                        </svg>
                      )}
                    </button>
                    
                    <input 
                      type="number" 
                      value={exportHeight} 
                      onChange={(e) => {
                        const newH = parseInt(e.target.value) || 1080;
                        if (isAspectRatioLocked) {
                          setExportResolution(Math.round(newH * (exportWidth / exportHeight)), newH);
                        } else {
                          setExportResolution(exportWidth, newH);
                        }
                      }} 
                      style={{ flex: 1, padding: '6px', background: inputBg, color: textMain, border: `1px solid ${inputBorder}`, borderRadius: '4px' }} 
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: bgPanel, padding: '10px', borderRadius: '4px', border: `1px solid ${borderCol}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                      <input type="checkbox" checked={showHUD} onChange={(e) => setEnvironment({ showHUD: e.target.checked })} />
                      <span style={{ marginLeft: '8px', fontSize: '0.85rem', color: showHUD ? '#3b82f6' : 'inherit' }}>Include On-Screen Info (Notes)</span>
                    </label>
                    {showHUD && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2px' }}>
                        {['top-left', 'top-center', 'top-right', 'middle-left', 'middle-center', 'middle-right', 'bottom-left', 'bottom-center', 'bottom-right'].map(pos => (
                          <div 
                            key={pos}
                            onClick={() => setEnvironment({ hudPosition: pos as any })}
                            style={{ 
                              width: '12px', height: '10px', 
                              background: hudPosition === pos ? '#3b82f6' : (isLight ? '#d1d5db' : '#555'),
                              border: `1px solid ${hudPosition === pos ? '#2563eb' : (isLight ? '#9ca3af' : '#444')}`,
                              cursor: 'pointer', borderRadius: '2px'
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                  {showHUD && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '0.75rem', width: '35px' }}>Scale</span>
                      <input 
                        type="range" 
                        min="0.5" max="3" step="0.1" 
                        value={hudScale || 1} 
                        onChange={(e) => setEnvironment({ hudScale: parseFloat(e.target.value) })}
                        style={{ flex: 1 }}
                      />
                      <span style={{ fontSize: '0.75rem', width: '30px', textAlign: 'right' }}>{(hudScale || 1).toFixed(1)}x</span>
                    </div>
                  )}
                </div>
                
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '5px' }}>Export Format</div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    {(['JPG', 'PDF', 'VIDEO'] as const).map(fmt => (
                      <button 
                        key={fmt}
                        onClick={() => {
                          setExportFormat(fmt);
                        }}
                        style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px', flex: 1, padding: '6px', fontSize: '0.85rem', background: exportFormat === fmt ? '#3b82f6' : bgPanel, color: exportFormat === fmt ? '#fff' : textMain, border: exportFormat === fmt ? 'none' : `1px solid ${borderCol}`, borderRadius: '4px', cursor: 'pointer' }}
                      >
                        {fmt}
                        {fmt === 'VIDEO' && !isPro && <span style={{ fontSize: '0.5rem', background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: 'white', padding: '2px 4px', borderRadius: '3px' }}>PRO</span>}
                      </button>
                    ))}
                  </div>
                  {(exportFormat === 'JPG' || exportFormat === 'PDF') && (
                    <div style={{ marginTop: '15px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Quality (Compression)</span>
                        <span style={{ fontSize: '0.85rem', color: textMuted }}>{exportQuality}%</span>
                      </div>
                      <input 
                        type="range" min="10" max="100" step="5"
                        value={exportQuality} 
                        onChange={e => setExportQuality(parseInt(e.target.value))} 
                        style={{ width: '100%', cursor: 'pointer' }}
                      />
                    </div>
                  )}
                </div>
              </div>

              {exportFormat === 'PDF' && (
                <div style={{ marginTop: '15px', marginBottom: '15px' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '5px' }}>PDF Export Mode</div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => setPdfExportMode('SINGLE')} style={{ flex: 1, padding: '6px', fontSize: '0.85rem', background: pdfExportMode === 'SINGLE' ? '#3b82f6' : bgPanel, color: pdfExportMode === 'SINGLE' ? '#fff' : textMain, border: pdfExportMode === 'SINGLE' ? 'none' : `1px solid ${borderCol}`, borderRadius: '4px', cursor: 'pointer' }}>Single Page</button>
                    <button onClick={() => setPdfExportMode('MULTI')} style={{ flex: 1, padding: '6px', fontSize: '0.85rem', background: pdfExportMode === 'MULTI' ? '#3b82f6' : bgPanel, color: pdfExportMode === 'MULTI' ? '#fff' : textMain, border: pdfExportMode === 'MULTI' ? 'none' : `1px solid ${borderCol}`, borderRadius: '4px', cursor: 'pointer' }}>
                      Multi Page
                      {!isPro && <span style={{ marginLeft: '6px', fontSize: '0.5rem', background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: 'white', padding: '2px 4px', borderRadius: '3px' }}>PRO</span>}
                    </button>
                  </div>
                </div>
              )}

              {(exportFormat === 'VIDEO' || (exportFormat === 'PDF' && pdfExportMode === 'MULTI')) && (
                <div style={{ position: 'relative', marginTop: exportFormat === 'VIDEO' ? '15px' : '0' }}>
                  {!isPro && (
                     <div onClick={(e) => { e.stopPropagation(); setIsAuthModalOpen(true); }} style={{ position: 'absolute', inset: -5, zIndex: 10, cursor: 'pointer', background: 'rgba(0,0,0,0.01)' }} />
                  )}
                  <div style={{ opacity: isPro ? 1 : 0.5 }}>
                    <div style={{ fontWeight: 'bold', fontSize: '1rem', marginBottom: '15px' }}>BATCH EXPORT SHADOWS</div>
                    <p style={{ fontSize: '0.85rem', color: textMuted, marginBottom: '20px' }}>
                      Select months to export shadow study {exportFormat === 'VIDEO' ? 'videos' : 'images'}.
                    </p>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {visibleMonths.map(m => {
                    const dayOfYear = getDayOfYear(m, monthDates[m] || 21)
                    const isDst = isDstActive(dayOfYear, latitude || 21.0285, dstMode)
                    const baseUtc = timezoneMode === 'auto' ? (Math.round((longitude || 105)/15)) : utcOffset
                    const actualUtc = baseUtc + (isDst ? 1 : 0)
                    const utcString = actualUtc >= 0 ? `+${actualUtc}` : `${actualUtc}`
                    const settings = exportSettings[m] || { checked: false, start: 6, end: 18 }

                    return (
                      <div key={m} style={{ background: bgPanel, border: `1px solid ${borderCol}`, borderRadius: '6px', padding: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                          <label style={{ display: 'flex', alignItems: 'center', fontWeight: 'bold', cursor: 'pointer' }}>
                            <input 
                              type="radio" 
                              name="exportMonthGroup"
                              value={m}
                              checked={settings.checked} 
                              onClick={() => {
                                setExportSettings(p => {
                                  const next = { ...p };
                                  visibleMonths.forEach(km => {
                                    next[km] = { ...(p[km] || { start: 6, end: 18 }), checked: km === m };
                                  });
                                  return next;
                                });
                              }}
                              onChange={() => {}} 
                              disabled={!isPro} 
                            />
                            <span style={{ marginLeft: '8px' }}>{monthNames[m-1]}</span>
                          </label>
                          <span style={{ fontSize: '0.8rem', color: '#3b82f6' }}>Day: {monthDates[m] || 21} | UTC {utcString} {isDst && '(DST)'}</span>
                        </div>
                        {(exportFormat === 'VIDEO' || (exportFormat === 'PDF' && pdfExportMode === 'MULTI')) && (
                          <div style={{ display: 'flex', gap: '15px', alignItems: 'center', opacity: settings.checked ? 1 : 0.5, pointerEvents: settings.checked ? 'auto' : 'none' }}>
                            <span style={{ fontSize: '0.85rem' }}>Start (h): <input type="number" value={settings.start} onChange={e => setExportSettings(p => ({ ...p, [m]: { ...settings, start: parseInt(e.target.value) || 6 } }))} disabled={!isPro} style={{ width: '40px', padding: '2px 4px', background: inputBg, color: textMain, border: `1px solid ${inputBorder}`, borderRadius: '4px' }} /></span>
                            <span style={{ fontSize: '0.85rem' }}>End (h): <input type="number" value={settings.end} onChange={e => setExportSettings(p => ({ ...p, [m]: { ...settings, end: parseInt(e.target.value) || 18 } }))} disabled={!isPro} style={{ width: '40px', padding: '2px 4px', background: inputBg, color: textMain, border: `1px solid ${inputBorder}`, borderRadius: '4px' }} /></span>
                          </div>
                        )}
                      </div>
                    )
                  })}
                    </div>
                  </div>
                </div>
              )}

              <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                <button 
                  onClick={async () => {
                    if (exportFormat === 'VIDEO' && !isPro) {
                      setIsAuthModalOpen(true);
                      return;
                    }
                    
                    const isMultiSelected = (exportFormat === 'VIDEO' || (exportFormat === 'PDF' && pdfExportMode === 'MULTI'))
                    if (isMultiSelected && !visibleMonths.some(m => exportSettings[m]?.checked)) {
                      alert('Please select a month to export.');
                      return;
                    }
                    
                    let safariTab: Window | null = null;
                    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
                    if (isSafari && (exportFormat === 'JPG' || exportFormat === 'PDF')) {
                      safariTab = window.open('', '_blank');
                      if (safariTab) {
                        safariTab.document.write('<html><head><title>Exporting...</title><style>body{margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#111;flex-direction:column;font-family:sans-serif;color:white}h2{opacity:0.8}</style></head><body><h2>Processing Export... Please wait</h2></body></html>');
                      }
                    }
                    
                    const drawHUDOnCanvas = (targetCtx: any, canvasW?: number, canvasH?: number) => {
                      if (!showHUD) return;
                      const store = useEditorStore.getState();
                      const actualW = canvasW || exportWidth;
                      const actualH = canvasH || exportHeight;
                      const scale = (actualH / 1080) * (store.hudScale || 1);
                      const padding = 15 * scale;
                      const lineH = 22 * scale;
                      
                      const numItems = 10 + store.legendItems.length;
                      const rectW = 260 * scale;
                      const rectH = (numItems * lineH) + (padding * 2) + (10 * scale);
                      
                      let hx = 20 * scale;
                      let hy = actualH - rectH - 20 * scale;
                      
                      const [vert, horz] = (store.hudPosition || 'bottom-left').split('-');
                      if (vert === 'top') hy = 20 * scale;
                      else if (vert === 'middle') hy = (actualH - rectH) / 2;
                      
                      if (horz === 'left') hx = 20 * scale;
                      else if (horz === 'right') hx = actualW - rectW - 20 * scale;
                      else if (horz === 'center') hx = (actualW - rectW) / 2;

                      targetCtx.fillStyle = isLight ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)';
                      targetCtx.beginPath();
                      if (targetCtx.roundRect) targetCtx.roundRect(hx, hy, rectW, rectH, 8 * scale);
                      else targetCtx.rect(hx, hy, rectW, rectH);
                      targetCtx.fill();
                      
                      const textColor = isLight ? '#000' : '#fff';
                      targetCtx.fillStyle = textColor;
                      targetCtx.textBaseline = 'top';
                      
                      let currentY = hy + padding;
                      let startX = hx + padding;
                      
                      targetCtx.font = `bold ${14 * scale}px Quicksand, sans-serif`;
                      targetCtx.fillText('ARCHI DIAGRAM', startX, currentY);
                      currentY += lineH;
                      
                      targetCtx.font = `${13 * scale}px Quicksand, sans-serif`;
                      targetCtx.fillText(`Location: ${store.latitude?.toFixed(4)}, ${store.longitude?.toFixed(4)}`, startX, currentY); currentY += lineH;
                      targetCtx.fillText(`Day: ${store.monthDates[store.activeMonth] || 21} ${monthNames[store.activeMonth - 1]}`, startX, currentY); currentY += lineH;
                      
                      const baseUtc = store.timezoneMode === 'auto' ? (Math.round((store.longitude || 105)/15)) : store.utcOffset;
                      const dayOfYear = getDayOfYear(store.activeMonth || 6, store.monthDates[store.activeMonth] || 21);
                      const isDst = isDstActive(dayOfYear, store.latitude || 21.0285, store.dstMode);
                      const actualUtc = baseUtc + (isDst ? 1 : 0);
                      const utcVal = actualUtc >= 0 ? `+${actualUtc}` : `${actualUtc}`;
                      const tzModeStr = store.timezoneMode === 'auto' ? 'Auto' : 'Manual';
                      const dstModeStr = store.dstMode === 'auto' ? 'Auto' : 'Manual';
                      const timeStr = `${Math.floor(store.timeOfDay || 12)}:${((store.timeOfDay || 12) % 1) >= 0.5 ? '30' : '00'}`;
                      
                      targetCtx.fillText(`Time: ${timeStr} (UTC${utcVal}) (${tzModeStr})`, startX, currentY); currentY += lineH;
                      targetCtx.fillText(`DST: ${isDst ? 'On' : 'Off'} (${dstModeStr})`, startX, currentY); currentY += lineH;
                      
                      currentY += 5 * scale;
                      targetCtx.strokeStyle = isLight ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.2)';
                      targetCtx.lineWidth = 1;
                      targetCtx.beginPath();
                      targetCtx.moveTo(startX, currentY);
                      targetCtx.lineTo(hx + rectW - padding, currentY);
                      targetCtx.stroke();
                      currentY += 10 * scale;
                      
                      targetCtx.font = `bold ${13 * scale}px Quicksand, sans-serif`;
                      targetCtx.fillText('NOTES', startX, currentY); currentY += lineH;
                      
                      targetCtx.font = `${13 * scale}px Quicksand, sans-serif`;
                      
                      const drawIconText = (drawIcon: (x: any, y: any, s: any) => void, text: any) => {
                        drawIcon(startX, currentY, 20 * scale);
                        targetCtx.fillStyle = textColor;
                        targetCtx.fillText(text, startX + 30 * scale, currentY + 2 * scale);
                        currentY += lineH;
                      };
                      
                      drawIconText((x, y, s) => {
                        targetCtx.fillStyle = '#fbbf24';
                        targetCtx.beginPath(); targetCtx.arc(x + s/2, y + s/2, 6 * scale, 0, Math.PI * 2); targetCtx.fill();
                      }, 'Sun hours');
                      
                      drawIconText((x, y, s) => {
                        targetCtx.fillStyle = '#ef4444';
                        targetCtx.beginPath(); targetCtx.arc(x + s/2, y + s/2, 6 * scale, 0, Math.PI * 2); targetCtx.fill();
                      }, 'Sun');
                      
                      drawIconText((x, y, s) => {
                        targetCtx.strokeStyle = '#f87171';
                        targetCtx.lineWidth = 2 * scale;
                        targetCtx.setLineDash([4 * scale, 4 * scale]);
                        targetCtx.beginPath(); targetCtx.moveTo(x, y + s/2); targetCtx.lineTo(x + s, y + s/2); targetCtx.stroke();
                        targetCtx.setLineDash([]);
                        targetCtx.fillStyle = '#fde047';
                        targetCtx.beginPath(); targetCtx.arc(x + s/2, y + s/2, 5 * scale, 0, Math.PI * 2); targetCtx.fill();
                      }, 'Sun path');
                      
                      drawIconText((x, y, s) => {
                        const cy = y + s/2;
                        const cx = x + s/2;
                        targetCtx.strokeStyle = isLight ? '#1e3a8a' : '#60a5fa';
                        targetCtx.fillStyle = isLight ? '#1e3a8a' : '#60a5fa';
                        targetCtx.lineWidth = 1.5 * scale;
                        targetCtx.font = `bold ${10 * scale}px Quicksand, sans-serif`;
                        targetCtx.textAlign = 'center';
                        targetCtx.fillText('N', cx, cy - 8 * scale);
                        targetCtx.textAlign = 'left';
                        targetCtx.beginPath();
                        targetCtx.moveTo(cx - 10 * scale, cy + 4 * scale);
                        targetCtx.quadraticCurveTo(cx, cy - 4 * scale, cx + 10 * scale, cy + 4 * scale);
                        targetCtx.stroke();
                        targetCtx.beginPath(); targetCtx.moveTo(cx, cy); targetCtx.lineTo(cx, cy + 4 * scale); targetCtx.stroke();
                      }, 'Compass');
                      
                      store.legendItems.forEach(item => {
                        const obj = store.objects.find(o => o.id === item.targetId);
                        const color = obj ? obj.color : '#9ca3af';
                        drawIconText((x, y, s) => {
                           targetCtx.fillStyle = color;
                           targetCtx.beginPath(); targetCtx.arc(x + s/2, y + s/2, 6 * scale, 0, Math.PI * 2); targetCtx.fill();
                        }, item.name);
                      });
                    };

                    const processExportImage = () => {
                      const canvas = document.querySelector('canvas') as HTMLCanvasElement | null;
                      if (!canvas) return null;
                      
                      const store = useEditorStore.getState();
                      const gl = store.glRenderer;
                      const scene = store.glScene;
                      const camera = store.glCamera;
                      
                      if (!gl || !scene || !camera) {
                        const fb = document.createElement('canvas');
                        fb.width = exportWidth; fb.height = exportHeight;
                        const fbCtx = fb.getContext('2d');
                        if (!fbCtx) return null;
                        fbCtx.drawImage(canvas, 0, 0, exportWidth, exportHeight);
                        drawHUDOnCanvas(fbCtx);
                        return fb.toDataURL('image/png', 1.0);
                      }
                      
                      // Save originals
                      const origPixelRatio = gl.getPixelRatio();
                      const origAspect = camera.aspect;
                      const origFov = camera.fov;
                      const cssW = canvas.clientWidth || (canvas.width / origPixelRatio);
                      const cssH = canvas.clientHeight || (canvas.height / origPixelRatio);
                      
                      // Clamp to GPU max texture size or PDF Multi-page RAM limits
                      const maxSize = gl.capabilities.maxTextureSize;
                      let safeW = exportWidth;
                      let safeH = exportHeight;
                      
                      if (exportFormat === 'PDF' && pdfExportMode === 'MULTI') {
                        const MAX_PDF_MULTI_DIM = 1920;
                        if (safeW > MAX_PDF_MULTI_DIM || safeH > MAX_PDF_MULTI_DIM) {
                          const ms = MAX_PDF_MULTI_DIM / Math.max(safeW, safeH);
                          safeW = Math.floor(safeW * ms);
                          safeH = Math.floor(safeH * ms);
                        }
                      }
                      
                      if (safeW > maxSize || safeH > maxSize) {
                        const cs = maxSize / Math.max(safeW, safeH);
                        safeW = Math.floor(safeW * cs);
                        safeH = Math.floor(safeH * cs);
                      }
                      
                      // Upscaling Trick for High-Res Line Thickness:
                      // WebGL lines are strictly 1px. To make lines thicker in 4K/5K, 
                      // we render the 3D scene at a max of 2K, then upscale it to 4K/5K via 2D Canvas.
                      let renderW = safeW;
                      let renderH = safeH;
                      const MAX_RENDER_DIM = 2560; // 2K Standard
                      if (Math.max(renderW, renderH) > MAX_RENDER_DIM) {
                        const scaleDown = MAX_RENDER_DIM / Math.max(renderW, renderH);
                        renderW = Math.floor(renderW * scaleDown);
                        renderH = Math.floor(renderH * scaleDown);
                      }
                      
                      const exportAspect = renderW / renderH;
                      const tempCssW = cssW;
                      const tempCssH = cssW / exportAspect;
                      const exportPixelRatio = renderW / tempCssW;
                      
                      // Perfect WYSIWYG FOV calculation:
                      const scaleX = cssW / safeW;
                      const scaleY = cssH / safeH;
                      const renderScale = Math.min(scaleX, scaleY);
                      const cropBoxH = safeH * renderScale;
                      
                      const vFovRad = origFov * Math.PI / 180;
                      const cropFovRad = 2 * Math.atan((cropBoxH / cssH) * Math.tan(vFovRad / 2));
                      const cropFovDeg = cropFovRad * 180 / Math.PI;
                      
                      camera.aspect = exportAspect;
                      camera.fov = cropFovDeg;
                      camera.updateProjectionMatrix();
                      gl.setPixelRatio(exportPixelRatio);
                      gl.setSize(tempCssW, tempCssH, false);
                      
                      const restoreRenderer = () => {
                        camera.aspect = origAspect;
                        camera.fov = origFov;
                        camera.updateProjectionMatrix();
                        gl.setPixelRatio(origPixelRatio);
                        gl.setSize(cssW, cssH, false);
                        gl.render(scene, camera);
                      };
                      
                      const restorePhases: { material: any, phase: number }[] = [];
                      try {
                        // Force all SVG animations to be fully drawn synchronously
                        scene.traverse((child: any) => {
                          if (child.isMesh && child.material && child.material.userData && child.material.userData.uClipPhase) {
                            restorePhases.push({ material: child.material, phase: child.material.userData.uClipPhase.value });
                            child.material.userData.uClipPhase.value = 0; // 0 means draw fully 100%
                          }
                        });
                        
                        scene.updateMatrixWorld(true);
                        gl.render(scene, camera);
                        
                        // Copy to a 2D canvas of the EXACT target resolution (safeW x safeH)
                        const cropCanvas = document.createElement('canvas');
                        cropCanvas.width = safeW;
                        cropCanvas.height = safeH;
                        const ctx = cropCanvas.getContext('2d');
                        if (!ctx) return null;
                        // Fill solid background for JPEG compression
                        const isDark = useEditorStore.getState().uiTheme === 'dark';
                        ctx.fillStyle = isDark ? '#111827' : '#ffffff';
                        ctx.fillRect(0, 0, safeW, safeH);
                        
                        // Use high quality image smoothing to upscale the 2K 3D render to 4K/5K
                        ctx.imageSmoothingEnabled = true;
                        ctx.imageSmoothingQuality = 'high';
                        ctx.drawImage(canvas, 0, 0, renderW, renderH, 0, 0, safeW, safeH);
                        
                        // Draw HUD vector text natively at 4K/5K resolution so it stays razor sharp
                        drawHUDOnCanvas(ctx, safeW, safeH);
                        
                        // Export as JPEG with chosen quality to reduce file size
                        return cropCanvas.toDataURL('image/jpeg', exportQuality / 100);
                      } finally {
                        restorePhases.forEach(({ material, phase }) => {
                          if (material.userData && material.userData.uClipPhase) {
                            material.userData.uClipPhase.value = phase;
                          }
                        });
                        restoreRenderer();
                      }
                    };

                    if (exportFormat === 'JPG') {
                      useEditorStore.getState().setIsExporting(true);
                      await new Promise(r => setTimeout(r, 100));
                      const dataUrl = processExportImage();
                      useEditorStore.getState().setIsExporting(false);
                      if (dataUrl) {
                        if (safariTab) {
                          safariTab.document.write(`<html><head><title>Export Image</title><style>body{margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#111;flex-direction:column;font-family:sans-serif;color:white}img{max-width:95%;max-height:80vh;object-fit:contain}p{margin-top:20px;font-size:14px;opacity:0.7}</style></head><body><img src="${dataUrl}" /><p>Long press (iPad) or right-click to save image</p></body></html>`);
                          safariTab.document.close();
                        } else {
                          const res = await fetch(dataUrl);
                          const blob = await res.blob();
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.style.display = 'none';
                          a.href = url;
                          a.download = `archidiagram_export_${Date.now()}.jpg`;
                          a.target = '_blank';
                          document.body.appendChild(a);
                          a.click();
                          setTimeout(() => {
                            document.body.removeChild(a);
                            URL.revokeObjectURL(url);
                          }, 100);
                        }
                      } else if (safariTab) { safariTab.close(); }
                    } else if (exportFormat === 'PDF') {
                          const isMultiPageSelected = exportFormat === 'PDF' && pdfExportMode === 'MULTI' && visibleMonths.some(m => exportSettings[m]?.checked);
                          if (isMultiPageSelected && !isPro) {
                            if (safariTab) safariTab.close();
                            setIsAuthModalOpen(true);
                            return;
                          }
                          
                          if (isMultiPageSelected) {
                            const { jsPDF } = await import('jspdf');
                            const orientation = exportWidth > exportHeight ? 'landscape' : 'portrait';
                            const ptW = exportWidth * 0.75;
                            const ptH = exportHeight * 0.75;
                            const doc = new jsPDF({ orientation, unit: 'pt', format: [ptW, ptH] });
                            
                            useEditorStore.getState().setIsExporting(true);
                            let isFirstPage = true;
                            
                            const store = useEditorStore.getState();
                            const originalMonth = store.activeMonth;
                            const originalTime = store.timeOfDay;
                            
                            const selectedMonth = visibleMonths.find(m => exportSettings[m]?.checked);
                            if (selectedMonth) {
                              const settings = exportSettings[selectedMonth] || { start: 6, end: 18 };
                              store.setEnvironment({ activeMonth: selectedMonth });
                              
                              for (let h = settings.start; h <= settings.end; h += 1) {
                                store.setEnvironment({ timeOfDay: h });
                                // Wait for shadows/sun to update
                                await new Promise(r => setTimeout(r, 250));
                                
                                const dataUrl = processExportImage();
                                if (dataUrl) {
                                  if (!isFirstPage) {
                                    doc.addPage([ptW, ptH], orientation);
                                  }
                                  doc.addImage(dataUrl, 'JPEG', 0, 0, ptW, ptH, undefined, 'NONE');
                                  isFirstPage = false;
                                }
                              }
                            }
                            
                            // Restore original state
                            store.setEnvironment({ activeMonth: originalMonth, timeOfDay: originalTime });
                            useEditorStore.getState().setIsExporting(false);
                            
                            if (!isFirstPage) {
                              const blob = doc.output('blob');
                              const url = URL.createObjectURL(blob);
                              if (safariTab) {
                                safariTab.location.href = url;
                              } else {
                                const a = document.createElement('a');
                                a.style.display = 'none';
                                a.href = url;
                                a.download = `archidiagram_multipage_${Date.now()}.pdf`;
                                a.target = '_blank';
                                document.body.appendChild(a);
                                a.click();
                                setTimeout(() => {
                                  document.body.removeChild(a);
                                  URL.revokeObjectURL(url);
                                }, 100);
                              }
                            } else if (safariTab) {
                              safariTab.close();
                            }
                          } else {
                            useEditorStore.getState().setIsExporting(true);
                            await new Promise(r => setTimeout(r, 100));
                            const dataUrl = processExportImage();
                            useEditorStore.getState().setIsExporting(false);
                            if (dataUrl) {
                              const { jsPDF } = await import('jspdf');
                              const orientation = exportWidth > exportHeight ? 'landscape' : 'portrait';
                              const doc = new jsPDF({ orientation, unit: 'pt', format: [exportWidth * 0.75, exportHeight * 0.75] });
                              doc.addImage(dataUrl, 'JPEG', 0, 0, exportWidth * 0.75, exportHeight * 0.75, undefined, 'NONE');
                              const blob = doc.output('blob');
                              const url = URL.createObjectURL(blob);
                              if (safariTab) {
                                safariTab.location.href = url;
                              } else {
                                const a = document.createElement('a');
                                a.style.display = 'none';
                                a.href = url;
                                a.download = `archidiagram_export_${Date.now()}.pdf`;
                                a.target = '_blank';
                                document.body.appendChild(a);
                                a.click();
                                setTimeout(() => {
                                  document.body.removeChild(a);
                                  URL.revokeObjectURL(url);
                                }, 100);
                              }
                            } else if (safariTab) { safariTab.close(); }
                          }
                    } else if (exportFormat === 'VIDEO') {
                      const canvas = document.querySelector('canvas') as HTMLCanvasElement | null;
                      if (!canvas) return;
                      // Save originals
                      const store = useEditorStore.getState();
                      const gl = store.glRenderer;
                      const scene = store.glScene;
                      const camera = store.glCamera;
                      if (!gl || !scene || !camera) return;
                      
                      const origPixelRatio = gl.getPixelRatio();
                      const origAspect = camera.aspect;
                      const origFov = camera.fov;
                      const cssW = canvas.clientWidth || (canvas.width / origPixelRatio);
                      const cssH = canvas.clientHeight || (canvas.height / origPixelRatio);
                      
                      let safeW = exportWidth;
                      let safeH = exportHeight;
                      
                      // Upscaling Trick for High-Res Video
                      let renderW = safeW;
                      let renderH = safeH;
                      const MAX_RENDER_DIM = 2560; // 2K Standard
                      if (Math.max(renderW, renderH) > MAX_RENDER_DIM) {
                        const scaleDown = MAX_RENDER_DIM / Math.max(renderW, renderH);
                        renderW = Math.floor(renderW * scaleDown);
                        renderH = Math.floor(renderH * scaleDown);
                      }
                      
                      const exportAspect = renderW / renderH;
                      const tempCssW = cssW;
                      const tempCssH = cssW / exportAspect;
                      const exportPixelRatio = renderW / tempCssW;
                      
                      const scaleX = cssW / safeW;
                      const scaleY = cssH / safeH;
                      const renderScale = Math.min(scaleX, scaleY);
                      const cropBoxH = safeH * renderScale;
                      
                      const vFovRad = origFov * Math.PI / 180;
                      const cropFovRad = 2 * Math.atan((cropBoxH / cssH) * Math.tan(vFovRad / 2));
                      const cropFovDeg = cropFovRad * 180 / Math.PI;
                      
                      camera.aspect = exportAspect;
                      camera.fov = cropFovDeg;
                      camera.updateProjectionMatrix();
                      gl.setPixelRatio(exportPixelRatio);
                      gl.setSize(tempCssW, tempCssH, false);
                      
                      const restoreRenderer = () => {
                        camera.aspect = origAspect;
                        camera.fov = origFov;
                        camera.updateProjectionMatrix();
                        gl.setPixelRatio(origPixelRatio);
                        gl.setSize(cssW, cssH, false);
                        gl.render(scene, camera);
                      };
                      
                      let isCancelled = false;
                      const overlay = document.createElement('div');
                      overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.85);display:flex;flex-direction:column;justify-content:center;align-items:center;color:white;font-family:sans-serif;backdrop-filter:blur(5px);';
                      overlay.innerHTML = `
                        <h2 style="font-weight:bold;margin-bottom:20px;">Exporting Video... Please do not interact with the page</h2>
                        <div style="width:300px;height:10px;background:#333;border-radius:5px;overflow:hidden;">
                          <div id="export-progress-bar" style="width:0%;height:100%;background:#3b82f6;transition:width 0.2s;"></div>
                        </div>
                        <div id="export-progress-text" style="margin-top:10px;font-size:1.2rem;font-weight:bold;margin-bottom:20px;">0%</div>
                        <button id="cancel-export-btn" style="padding: 8px 24px; background: #ef4444; color: white; border: none; border-radius: 4px; font-weight: bold; cursor: pointer; transition: background 0.2s;">Cancel Export</button>
                      `;
                      document.body.appendChild(overlay);

                      const cancelBtn = document.getElementById('cancel-export-btn');
                      if (cancelBtn) {
                        cancelBtn.onclick = () => {
                          isCancelled = true;
                          cancelBtn.innerText = 'Cancelling...';
                          cancelBtn.style.background = '#6b7280';
                          cancelBtn.style.cursor = 'wait';
                        };
                      }
                      
                      const updateProgress = (pct: number) => {
                        const bar = document.getElementById('export-progress-bar');
                        const txt = document.getElementById('export-progress-text');
                        if (bar) bar.style.width = `${pct}%`;
                        if (txt) txt.innerText = `${Math.round(pct)}%`;
                      };

                      const vidCanvas = document.createElement('canvas');
                      vidCanvas.width = exportWidth;
                      vidCanvas.height = exportHeight;
                      const vctx = vidCanvas.getContext('2d', { alpha: false });
                      
                      if (vctx) {
                        vctx.imageSmoothingEnabled = true;
                        vctx.imageSmoothingQuality = 'high';
                        vctx.fillStyle = '#000';
                        vctx.fillRect(0, 0, exportWidth, exportHeight);
                      }
                      
                      const stream = vidCanvas.captureStream(30);
                      let mimeType = 'video/webm;codecs=vp9';
                      if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = 'video/webm'; 
                      if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = 'video/mp4'; 
                      
                      // Increase bitrate to 35 Mbps for crisp quality
                      const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 35000000 });
                      const chunks: Blob[] = [];
                      recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
                      recorder.onstop = () => {
                        restoreRenderer(); // Restore camera/canvas on stop
                        if (!isCancelled) {
                          const blob = new Blob(chunks, { type: mimeType });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.style.display = 'none';
                          a.href = url;
                          a.download = `archidiagram_shadows_${Date.now()}.${mimeType === 'video/mp4' ? 'mp4' : 'webm'}`;
                          document.body.appendChild(a);
                          a.click();
                          setTimeout(() => {
                            document.body.removeChild(a);
                            URL.revokeObjectURL(url);
                          }, 100);
                        }
                        if (document.body.contains(overlay)) {
                          document.body.removeChild(overlay);
                        }
                      };
                      
                      recorder.start();
                      
                      let recording = true;
                      const drawLoop = () => {
                        if (!recording) return;
                        if (vctx && canvas) {
                          vctx.drawImage(canvas, 0, 0, renderW, renderH, 0, 0, exportWidth, exportHeight);
                          
                          if (showHUD) {
                            drawHUDOnCanvas(vctx, exportWidth, exportHeight);
                          }
                        }
                        requestAnimationFrame(drawLoop);
                      };
                      drawLoop();
                      
                      const originalTime = useEditorStore.getState().timeOfDay;
                      const originalMonth = useEditorStore.getState().activeMonth;
                      
                      let totalFrames = 0;
                      for (const m of visibleMonths) {
                        if (exportSettings[m]?.checked) {
                          totalFrames += Math.max(1, exportSettings[m].end - exportSettings[m].start + 1);
                        }
                      }
                      let currentFrame = 0;

                      for (const m of visibleMonths) {
                        if (isCancelled) break;
                        const settings = exportSettings[m];
                        if (!settings || !settings.checked) continue;
                        
                        setEnvironment({ activeMonth: m });
                        await new Promise(r => setTimeout(r, 200)); 
                        
                        for (let h = settings.start; h <= settings.end; h += 1) {
                          if (isCancelled) break;
                          setEnvironment({ timeOfDay: h });
                          await new Promise(r => setTimeout(r, 500)); 
                          currentFrame++;
                          updateProgress((currentFrame / totalFrames) * 100);
                        }
                      }
                      
                      recording = false;
                      recorder.stop();
                      setEnvironment({ timeOfDay: originalTime, activeMonth: originalMonth });
                    }
                  }}
                  style={{ flex: 1, padding: '10px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  {exportFormat === 'VIDEO' && !isPro ? (
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      Export {exportFormat}
                      <span style={{ fontSize: '0.6rem', background: 'linear-gradient(135deg, #f59e0b, #d97706)', padding: '2px 6px', borderRadius: '4px' }}>PRO</span>
                    </span>
                  ) : (
                    `Export ${exportFormat}`
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Info & Credits Accordion */}
          <H2Header id="info" title="About & Credits" icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
          } />
          {activeH2 === 'info' && (
            <div style={{ padding: '15px', borderBottom: `1px solid ${borderCol}`, fontSize: '0.85rem', color: textMuted, lineHeight: '1.5' }}>
              <div style={{ marginBottom: '15px', color: textMain }}>
                <strong style={{ fontSize: '1rem' }}>ARCHI DIAGRAM</strong><br/>
                <span style={{ fontSize: '0.8rem' }}>Built with passion by Nam Nguyen (Febhouse)</span>
              </div>
              
              <div style={{ marginBottom: '20px', padding: '10px', background: isLight ? '#f3f4f6' : '#262626', borderRadius: '6px' }}>
                <p style={{ marginBottom: '8px' }}>
                  Hi, I'm Nam Nguyen—an architect and Verified SketchUp Developer. Many users have asked for <strong>Sun Diagram</strong> and <strong>Dynamic Symbols</strong> outside of SketchUp.
                </p>
                <p style={{ marginBottom: '8px' }}>
                  To make these tools accessible to everyone, we at Febhouse realized that building a Web App is the fastest and most optimal solution. Without the limitations of traditional plugins, our web version delivers more automated features and lightning-fast updates.
                </p>
                <p style={{ fontStyle: 'italic', fontWeight: 'bold', color: textMain, margin: 0 }}>
                  Rest assured, the original SketchUp plugins will never be abandoned. Thank you for supporting our journey!
                </p>
              </div>
              
              <p style={{ marginBottom: '5px', fontWeight: 'bold', color: textMain }}>Open Source Credits:</p>
              <ul style={{ paddingLeft: '15px', display: 'flex', flexDirection: 'column', gap: '8px', margin: 0 }}>
                <li>
                  <strong style={{ color: textMain }}>React</strong> (MIT)<br/>
                  <a href="https://react.dev/" target="_blank" style={{ color: '#3b82f6', textDecoration: 'none' }}>react.dev</a>
                </li>
                <li>
                  <strong style={{ color: textMain }}>Three.js</strong> (MIT)<br/>
                  <a href="https://threejs.org/" target="_blank" style={{ color: '#3b82f6', textDecoration: 'none' }}>threejs.org</a>
                </li>
                <li>
                  <strong style={{ color: textMain }}>React Three Fiber / Drei</strong> (MIT)<br/>
                  <a href="https://github.com/pmndrs" target="_blank" style={{ color: '#3b82f6', textDecoration: 'none' }}>github.com/pmndrs</a>
                </li>
                <li>
                  <strong style={{ color: textMain }}>Zustand</strong> (MIT)<br/>
                  <a href="https://github.com/pmndrs/zustand" target="_blank" style={{ color: '#3b82f6', textDecoration: 'none' }}>github.com/pmndrs/zustand</a>
                </li>
                <li>
                  <strong style={{ color: textMain }}>jsPDF</strong> (MIT)<br/>
                  <a href="https://github.com/parallax/jsPDF" target="_blank" style={{ color: '#3b82f6', textDecoration: 'none' }}>github.com/parallax/jsPDF</a>
                </li>
              </ul>
            </div>
          )}

        </div>

      </div>

      {/* Main 3D Canvas */}
      <div id="studio-main-container" style={{ flex: 1, position: 'relative', background: bgMain, overflow: 'hidden', order: isMobile ? 1 : 2 }}>
        <Scene />
        
        {/* Footer (Centered in Scene) */}
        {activeH2 !== 'export' && (
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: isMobile ? '10px 15px 30px' : '10px 15px', borderTop: `1px solid ${borderCol}`, fontSize: '0.75rem', color: textMuted, display: 'flex', flexWrap: 'wrap', gap: '10px', background: bgPanel, alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
            <div>© 2026 Febhouse Studio</div>
            <div>|</div>
            <a href="https://febhouse.com/privacy-policy/" target="_blank" rel="noreferrer" style={{ color: textMuted, textDecoration: 'none' }}>Privacy Policy</a>
            <div>|</div>
            <a href="https://febhouse.com/terms-of-use/" target="_blank" rel="noreferrer" style={{ color: textMuted, textDecoration: 'none' }}>Terms of Use</a>
            <div>|</div>
            <a href="https://febhouse.com/refund-policy/" target="_blank" rel="noreferrer" style={{ color: textMuted, textDecoration: 'none' }}>Refund Policy</a>
            <div>|</div>
            <a href="https://febhouse.com/legal-notice/" target="_blank" rel="noreferrer" style={{ color: textMuted, textDecoration: 'none' }}>Legal Notice</a>
          </div>
        )}
        
        {/* Crop Overlay and HUD Logic */}
        {(() => {
          let hudContent = null;
          if (showHUD) {
            const container = typeof document !== 'undefined' ? document.getElementById('studio-main-container') : null;
            const windowW = container ? container.clientWidth : (typeof window !== 'undefined' ? window.innerWidth : 1920);
            const windowH = container ? container.clientHeight : (typeof window !== 'undefined' ? window.innerHeight : 1080);
            const scaleX = windowW / (exportWidth || 1920);
            const scaleY = windowH / (exportHeight || 1080);
            const renderScale = Math.min(scaleX, scaleY);
            const renderHeight = (exportHeight || 1080) * renderScale;

            const currentHeight = (activeH2 === 'export') ? renderHeight : windowH;
            const totalScale = (currentHeight / 1080) * (hudScale || 1);

            const posStyles: any = {}
            const [vert, horz] = (hudPosition || 'bottom-left').split('-')
            
            const offsetMargin = (activeH2 === 'export') ? 20 * totalScale : 20;
            const bottomMargin = (activeH2 === 'export') ? 20 * totalScale : (isMobile ? 90 : 60);

            if (vert === 'top') posStyles.top = `${offsetMargin}px`
            else if (vert === 'bottom') posStyles.bottom = `${bottomMargin}px`
            else if (vert === 'middle') { posStyles.top = '50%'; posStyles.transform = 'translateY(-50%)' }

            if (horz === 'left') posStyles.left = `${offsetMargin}px`
            else if (horz === 'right') posStyles.right = `${offsetMargin}px`
            else if (horz === 'center') { 
              posStyles.left = '50%'; 
              if (posStyles.transform) posStyles.transform = 'translate(-50%, -50%)';
              else posStyles.transform = 'translateX(-50%)';
            }

            if (posStyles.transform) {
              posStyles.transform = `${posStyles.transform} scale(${totalScale})`;
            } else {
              posStyles.transform = `scale(${totalScale})`;
            }
            
            let tOriginX = 'left';
            if (horz === 'right') tOriginX = 'right';
            else if (horz === 'center') tOriginX = 'center';
            
            let tOriginY = 'bottom';
            if (vert === 'top') tOriginY = 'top';
            else if (vert === 'middle') tOriginY = 'center';
            
            posStyles.transformOrigin = `${tOriginX} ${tOriginY}`;
            
            hudContent = (
              <div style={{ 
                position: 'absolute', ...posStyles, pointerEvents: 'auto',
                background: isLight ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
                color: isLight ? '#000' : '#fff',
                borderRadius: '8px', overflow: 'hidden',
                zIndex: 10, display: 'flex', flexDirection: 'column'
              }}>
                <div 
                  style={{ padding: '6px 15px', background: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.1)', fontSize: '0.75rem', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', borderBottom: isNotesExpanded ? `1px solid ${isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'}` : 'none' }}
                  onClick={() => setIsNotesExpanded(!isNotesExpanded)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ fontSize: '0.65rem' }}>{isNotesExpanded ? '▼' : '▶'}</span>
                    NOTES
                  </div>
                </div>
                
                {isNotesExpanded && (
                  <div style={{ padding: '10px 15px', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <div><strong>ARCHI DIAGRAM</strong></div>
                    <div>Location: {latitude?.toFixed(4)}, {longitude?.toFixed(4)}</div>
                    <div>Day: {monthDates[activeMonth] || 21} {monthNames[activeMonth - 1]}</div>
                    {(() => {
                      const baseUtc = timezoneMode === 'auto' ? (Math.round((longitude || 105)/15)) : utcOffset
                      const dayOfYear = getDayOfYear(activeMonth || 6, monthDates[activeMonth] || 21)
                      const isDst = isDstActive(dayOfYear, latitude || 21.0285, dstMode)
                      const actualUtc = baseUtc + (isDst ? 1 : 0)
                      const utcVal = actualUtc >= 0 ? `+${actualUtc}` : `${actualUtc}`
                      const tzModeStr = timezoneMode === 'auto' ? 'Auto' : 'Manual'
                      const dstModeStr = dstMode === 'auto' ? 'Auto' : 'Manual'
                      const timeStr = `${Math.floor(timeOfDay || 12)}:${((timeOfDay || 12) % 1) >= 0.5 ? '30' : '00'}`
                      return (
                        <>
                          <div>Time: {timeStr} (UTC{utcVal}) ({tzModeStr})</div>
                          <div>DST: {isDst ? 'On' : 'Off'} ({dstModeStr})</div>
                        </>
                      )
                    })()}
                    
                    {/* Legend inside HUD */}
                    <div style={{ marginTop: '5px', paddingTop: '5px', borderTop: `1px solid ${isLight ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.2)'}`, display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9em' }}>
                    <div style={{ width: '30px', display: 'flex', justifyContent: 'center' }}>
                      <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#fbbf24' }}></div>
                    </div>
                    Sun hours
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9em' }}>
                    <div style={{ width: '30px', display: 'flex', justifyContent: 'center' }}>
                      <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ef4444' }}></div>
                    </div>
                    Sun
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9em' }}>
                    <div style={{ width: '30px', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ position: 'absolute', width: '100%', borderBottom: '2px dashed #f87171' }}></div>
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#fde047', zIndex: 1 }}></div>
                    </div>
                    Sun path
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9em' }}>
                    <div style={{ width: '30px', height: '16px', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start' }}>
                      <div style={{ fontSize: '10px', fontWeight: 'bold', color: isLight ? '#1e3a8a' : '#60a5fa', lineHeight: 1 }}>N</div>
                      <svg width="30" height="8" viewBox="0 0 30 8" style={{ marginTop: '1px' }}>
                        <path d="M 0 8 Q 15 0 30 8" fill="none" stroke={isLight ? '#1e3a8a' : '#60a5fa'} strokeWidth="1.5" />
                        <line x1="15" y1="4" x2="15" y2="8" stroke={isLight ? '#1e3a8a' : '#60a5fa'} strokeWidth="1.5" />
                      </svg>
                    </div>
                    Compass
                  </div>
                  
                  {legendItems.map((item) => (
                    <div 
                      key={item.id} 
                      style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9em', justifyContent: 'space-between', cursor: 'pointer' }}
                      onClick={() => {
                        if (item.targetId) useEditorStore.getState().setSelectedIds([item.targetId])
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                        <div style={{ width: '30px', display: 'flex', justifyContent: 'center' }}>
                          {item.iconUrl && (() => {
                            const obj = objects.find(o => o.id === item.targetId)
                            const isSvg = item.iconUrl.toLowerCase().endsWith('.svg')
                            if (isSvg) {
                              return (
                                <div style={{
                                  width: '16px', height: '16px',
                                  WebkitMaskImage: `url(${item.iconUrl})`,
                                  WebkitMaskSize: 'contain',
                                  WebkitMaskRepeat: 'no-repeat',
                                  WebkitMaskPosition: 'center',
                                  backgroundColor: obj ? obj.color : '#9ca3af',
                                }} />
                              )
                            } else {
                              const pngUrl = item.iconUrl.replace('.glb', '.png')
                              return (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center', width: '100%' }}>
                                  <img src={pngUrl} style={{ width: '16px', height: '16px', objectFit: 'contain' }} alt="icon" />
                                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: obj ? obj.color : '#9ca3af', flexShrink: 0 }} />
                                </div>
                              )
                            }
                          })()}
                        </div>
                        <input 
                          value={item.name}
                          onChange={(e) => useEditorStore.getState().updateLegendItemName(item.id, e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          style={{ 
                            background: 'transparent', border: 'none', color: isLight ? '#111827' : '#fff', 
                            fontSize: '0.9em', flex: 1, outline: 'none', minWidth: '50px' 
                          }}
                        />
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); useEditorStore.getState().removeLegendItem(item.id) }} style={{ background: 'transparent', border: 'none', color: isLight ? '#999' : '#666', cursor: 'pointer', fontSize: '0.7rem' }}>✕</button>
                    </div>
                  ))}

                  {/* Add Symbol Button */}
                  <div style={{ marginTop: '5px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <div 
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px', cursor: 'pointer', borderRadius: '4px', background: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.1)', color: isLight ? '#666' : '#aaa' }}
                      onClick={() => setShowAddSymbolMenu(!showAddSymbolMenu)}
                      title="Add Symbol to Notes"
                    >
                      <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>+</span>
                    </div>
                    
                    {showAddSymbolMenu && (
                      <div style={{ padding: '8px', background: isLight ? '#f9fafb' : '#1f2937', borderRadius: '4px', border: `1px solid ${isLight ? '#e5e7eb' : '#374151'}`, display: 'flex', flexDirection: 'column', gap: '5px', maxHeight: '150px', overflowY: 'auto' }}>
                        {(() => {
                          const availableObjects = objects.filter(obj => !legendItems.some(item => item.targetId === obj.id))
                          if (availableObjects.length === 0) {
                            return <div style={{ fontSize: '0.8em', color: isLight ? '#9ca3af' : '#6b7280', textAlign: 'center', padding: '10px 0' }}>No new symbols to add.</div>
                          }
                          return availableObjects.map(obj => {
                            const libraryModelName = LIBRARY_MODELS.find(name => obj.url.includes(name))
                            const displayName = libraryModelName || 'Symbol'
                            const isSvg = obj.url.toLowerCase().endsWith('.svg')
                            return (
                              <div 
                                key={obj.id}
                                style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '4px', borderRadius: '4px' }}
                                onClick={() => {
                                  useEditorStore.getState().addLegendItem({
                                    id: Date.now().toString(),
                                    name: displayName,
                                    iconUrl: obj.url,
                                    targetId: obj.id
                                  })
                                  setShowAddSymbolMenu(false)
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = isLight ? '#e5e7eb' : '#374151'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                              >
                                <div style={{ width: '20px', display: 'flex', justifyContent: 'center' }}>
                                  {isSvg ? (
                                    <div style={{
                                      width: '16px', height: '16px',
                                      WebkitMaskImage: `url(${obj.url})`,
                                      WebkitMaskSize: 'contain',
                                      WebkitMaskRepeat: 'no-repeat',
                                      WebkitMaskPosition: 'center',
                                      backgroundColor: obj.color || '#9ca3af',
                                    }} />
                                  ) : (
                                    <img src={obj.url.replace('.glb', '.png')} style={{ width: '16px', height: '16px', objectFit: 'contain' }} alt="icon" />
                                  )}
                                </div>
                                <span style={{ fontSize: '0.85em' }}>{displayName}</span>
                              </div>
                            )
                          })
                        })()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )
          }

          return (
            <>
              {/* Crop Overlay */}
              {activeH2 === 'export' && (
                <div style={{ position: 'absolute', inset: 0, zIndex: 5, pointerEvents: 'none' }}>
                  <svg width="100%" height="100%" viewBox={`0 0 ${exportWidth} ${exportHeight}`} preserveAspectRatio="xMidYMid meet">
                    <path 
                      d={`M-99999,-99999 H99999 V99999 H-99999 Z M0,0 H${exportWidth} V${exportHeight} H0 Z`} 
                      fill="rgba(0,0,0,0.65)" 
                      fillRule="evenodd" 
                    />
                    <rect x="0" y="0" width={exportWidth} height={exportHeight} fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="2" strokeDasharray="10" vectorEffect="non-scaling-stroke" />
                  </svg>
                  
                  {/* WYSIWYG Export HUD via HTML instead of foreignObject for Safari/Mobile compatibility */}
                  {showHUD && hudContent && (() => {
                    const container = typeof document !== 'undefined' ? document.getElementById('studio-main-container') : null;
                    const windowW = container ? container.clientWidth : (typeof window !== 'undefined' ? window.innerWidth : 1920);
                    const windowH = container ? container.clientHeight : (typeof window !== 'undefined' ? window.innerHeight : 1080);
                    const scaleX = windowW / (exportWidth || 1920);
                    const scaleY = windowH / (exportHeight || 1080);
                    const renderScale = Math.min(scaleX, scaleY);
                    const renderW = (exportWidth || 1920) * renderScale;
                    const renderH = (exportHeight || 1080) * renderScale;
                    
                    return (
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ width: renderW, height: renderH, position: 'relative' }}>
                          {hudContent}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Free-floating HUD for non-export modes */}
              {showHUD && activeH2 !== 'export' && hudContent && (
                <div style={{ position: 'absolute', inset: 0, zIndex: 10, pointerEvents: 'none' }}>
                  {hudContent}
                </div>
              )}
            </>
          )
        })()}
        {/* Removed floating mobile menu toggle */}

        {/* TOOLBAR Overlay (Centered at top) */}
        <div style={{ position: 'absolute', top: isMobile ? '10px' : '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 10, display: isMobile && (showMobileMenu || showGlobalMenu) ? 'none' : 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '10px', background: bgPanel, padding: '8px', borderRadius: '8px', border: `1px solid ${borderCol}`, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', width: isMobile ? '90%' : 'auto' }}>
          
          <div style={{ display: 'flex', gap: '5px', borderRight: `1px solid ${borderCol}`, paddingRight: '10px' }}>
            {['move', 'rotate', 'scale', 'pan', 'orbit'].map((mode) => {
              const actualMode = mode === 'move' ? 'translate' : mode
              return (
                <button
                  key={mode} onClick={() => setTransformMode(actualMode as any)}
                  style={{
                    padding: '6px 12px', fontSize: '0.85rem',
                    background: transformMode === actualMode ? '#3b82f6' : 'transparent',
                    color: transformMode === actualMode ? '#fff' : textMain, 
                    border: `1px solid ${transformMode === actualMode ? '#3b82f6' : borderCol}`, borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold'
                  }}
                >
                  {mode.toUpperCase()}
                </button>
              )
            })}
          </div>

          <div style={{ display: 'flex', gap: '5px' }}>
            <button
              onClick={() => {
                const state = useEditorStore.getState();
                if (state.selectedIds.length > 0) {
                  state.removeObjects(state.selectedIds);
                }
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = isLight ? '#f3f4f6' : '#374151'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              style={{ padding: '6px 12px', background: 'transparent', border: `1px solid ${borderCol}`, borderRadius: '4px', cursor: 'pointer', color: '#ef4444', opacity: selectedIds.length > 0 ? 1 : 0.5 }}
              title="Delete Selected"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
            <button
              onClick={() => undo()}
              onMouseEnter={(e) => e.currentTarget.style.background = isLight ? '#f3f4f6' : '#374151'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              style={{ padding: '6px 12px', background: 'transparent', border: `1px solid ${borderCol}`, borderRadius: '4px', cursor: 'pointer', color: textMain }}
              title="Undo"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 14 4 9 9 4"></polyline>
                <path d="M20 20v-7a4 4 0 0 0-4-4H4"></path>
              </svg>
            </button>
            <button
              onClick={() => redo()}
              onMouseEnter={(e) => e.currentTarget.style.background = isLight ? '#f3f4f6' : '#374151'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              style={{ padding: '6px 12px', background: 'transparent', border: `1px solid ${borderCol}`, borderRadius: '4px', cursor: 'pointer', color: textMain }}
              title="Redo"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 14 20 9 15 4"></polyline>
                <path d="M4 20v-7a4 4 0 0 1 4-4h12"></path>
              </svg>
            </button>
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('zoom-all'))}
              onMouseEnter={(e) => e.currentTarget.style.background = isLight ? '#f3f4f6' : '#374151'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              style={{ padding: '6px 12px', fontSize: '0.85rem', background: 'transparent', color: textMain, border: `1px solid ${borderCol}`, borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
            >ZOOM ALL</button>
          </div>
        </div>

        {/* Context Menu */}
        {contextMenu && (
          <div 
            style={{
              position: 'fixed',
              top: contextMenu.y,
              left: contextMenu.x,
              background: bgPanel,
              border: `1px solid ${borderCol}`,
              borderRadius: '6px',
              padding: '5px',
              zIndex: 100,
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              display: 'flex',
              flexDirection: 'column',
              minWidth: '160px'
            }}
          >
            {contextMenu.type === 'sundiagram' && (
              <>
                <div style={{ fontSize: '0.75rem', fontWeight: 'bold', padding: '4px 10px', color: textMuted, borderBottom: `1px solid ${borderCol}`, marginBottom: '4px' }}>SUN DIAGRAM</div>
                <button 
                  onClick={() => { setActiveH2('sundiagram'); setSunTab('create'); setContextMenu(null) }}
                  style={{ textAlign: 'left', padding: '8px 10px', background: 'transparent', border: 'none', color: textMain, cursor: 'pointer', fontSize: '0.85rem' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = isLight ? '#f3f4f6' : '#374151'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >Create new Sun path</button>
                <button 
                  onClick={() => { setActiveH2('sundiagram'); setSunTab('shadow'); setContextMenu(null) }}
                  style={{ textAlign: 'left', padding: '8px 10px', background: 'transparent', border: 'none', color: textMain, cursor: 'pointer', fontSize: '0.85rem' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = isLight ? '#f3f4f6' : '#374151'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >Shadow Analysis</button>
                <button 
                  onClick={() => { setActiveH2('sundiagram'); setSunTab('style'); setContextMenu(null) }}
                  style={{ textAlign: 'left', padding: '8px 10px', background: 'transparent', border: 'none', color: textMain, cursor: 'pointer', fontSize: '0.85rem' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = isLight ? '#f3f4f6' : '#374151'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >Style</button>
              </>
            )}
            {contextMenu.type === 'symbols' && (
              <>
                <div style={{ fontSize: '0.75rem', fontWeight: 'bold', padding: '4px 10px', color: textMuted, borderBottom: `1px solid ${borderCol}`, marginBottom: '4px' }}>DYNAMIC SYMBOLS</div>
                <button 
                  onClick={() => { setActiveH2('symbols'); setSymbolTab('properties'); setContextMenu(null) }}
                  style={{ textAlign: 'left', padding: '8px 10px', background: 'transparent', border: 'none', color: textMain, cursor: 'pointer', fontSize: '0.85rem' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = isLight ? '#f3f4f6' : '#374151'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >Properties</button>
                <button 
                  onClick={() => { setActiveH2('symbols'); setSymbolTab('library'); setContextMenu(null) }}
                  style={{ textAlign: 'left', padding: '8px 10px', background: 'transparent', border: 'none', color: textMain, cursor: 'pointer', fontSize: '0.85rem' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = isLight ? '#f3f4f6' : '#374151'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >Symbol Change (keep Position, Size & Rotation)</button>
                {(() => {
                  const existingNote = legendItems.find(i => i.targetId === contextMenu.targetId)
                  if (existingNote) {
                    return (
                      <button 
                        onClick={async () => {
                          const name = await useEditorStore.getState().showPrompt('Edit Note', 'Edit note name:', existingNote.name)
                          if (name && contextMenu.targetId) {
                            useEditorStore.getState().updateLegendItemName(existingNote.id, name)
                          }
                          setContextMenu(null) 
                        }}
                        style={{ textAlign: 'left', padding: '8px 10px', background: 'transparent', border: 'none', color: textMain, cursor: 'pointer', fontSize: '0.85rem' }}
                        onMouseEnter={(e) => e.currentTarget.style.background = isLight ? '#f3f4f6' : '#374151'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >Edit note text</button>
                    )
                  }
                  return (
                    <button 
                      onClick={async () => {
                        const name = await useEditorStore.getState().showPrompt('Note Name', 'Note name for this symbol:')
                        if (name && contextMenu.targetId) {
                          const obj = useEditorStore.getState().objects.find(o => o.id === contextMenu.targetId)
                          if (obj) {
                            useEditorStore.getState().addLegendItem({ id: Date.now().toString(), name, iconUrl: obj.url, targetId: obj.id })
                          }
                        }
                        setContextMenu(null) 
                      }}
                      style={{ textAlign: 'left', padding: '8px 10px', background: 'transparent', border: 'none', color: textMain, cursor: 'pointer', fontSize: '0.85rem' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = isLight ? '#f3f4f6' : '#374151'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >Add to note</button>
                  )
                })()}
              </>
            )}
          </div>
        )}

        {/* Right Side Panels: Layers and Legend */}
        <div style={{ position: 'absolute', bottom: isMobile ? '100px' : '60px', right: '10px', display: 'flex', flexDirection: 'column-reverse', gap: '15px', zIndex: 10 }}>
          {/* Views Panel */}
          <div style={{ background: bgPanel, border: `1px solid ${borderCol}`, borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', overflow: 'hidden', width: isMobile ? '180px' : '220px' }}>
            <div 
              style={{ padding: '8px 12px', background: isLight ? '#f3f4f6' : '#374151', fontSize: '0.8rem', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
              onClick={() => setIsViewsExpanded(!isViewsExpanded)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ fontSize: '0.7rem' }}>{isViewsExpanded ? '▼' : '▶'}</span>
                VIEWS
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); window.dispatchEvent(new CustomEvent('save-view')) }}
                style={{ background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '4px', padding: '2px 8px', fontSize: '0.7rem', cursor: 'pointer' }}
              >+ Save</button>
            </div>
            {isViewsExpanded && (
            <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
              {savedViews.length === 0 && (
                <div style={{ fontSize: '0.75rem', color: textMuted, textAlign: 'center', padding: '10px 0' }}>No saved views</div>
              )}
              {savedViews.map((view) => (
                <div key={view.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                  <div 
                    title="Click to load this view"
                    onClick={() => window.dispatchEvent(new CustomEvent('load-view', { detail: view }))}
                    style={{ cursor: 'pointer', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                  >
                    {view.name}
                  </div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button 
                      title="Rename view"
                      onClick={async () => {
                        const newName = await useEditorStore.getState().showPrompt("Rename View", "Enter new name for view:", view.name);
                        if (newName) useEditorStore.getState().updateSavedViewName(view.id, newName);
                      }}
                      style={{ background: 'transparent', color: textMain, border: 'none', cursor: 'pointer', padding: '2px 4px', fontSize: '0.7rem' }}
                    >
                      ✏️
                    </button>
                    <button 
                      title="Delete view"
                      onClick={() => useEditorStore.getState().removeSavedView(view.id)}
                      style={{ background: 'transparent', color: '#ef4444', border: 'none', cursor: 'pointer', padding: '2px 4px', fontSize: '0.7rem' }}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
            )}
          </div>
        </div>

      </div>
    </div>
    </>
  )
}
