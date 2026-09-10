import { useState } from 'react'
import { useEditorStore } from '../store/useEditorStore'
import { R2_BASE_URL } from '../config/library'

interface LibraryItemProps {
  modelName: string
  onAdd: (modelName: string) => void
  onReplace: (modelName: string) => void
  hasSelection: boolean
}

export default function LibraryItem({ modelName, onAdd, onReplace, hasSelection }: LibraryItemProps) {
  const [isHovered, setIsHovered] = useState(false)
  const uiTheme = useEditorStore(state => state.uiTheme)
  const isLight = uiTheme === 'light'

  const pngUrl = `${R2_BASE_URL}/${modelName}.png`
  const gifUrl = `${R2_BASE_URL}/${modelName}.gif`

  return (
    <div 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: isLight ? '#ffffff' : '#2a2a2a',
        borderRadius: '8px',
        border: isHovered ? '1px solid #3b82f6' : (isLight ? '1px solid #e5e7eb' : '1px solid #444'),
        transition: 'all 0.2s',
        display: 'flex',
        flexDirection: 'column',
        height: 'auto', // Đảm bảo height phụ thuộc vào content
        boxSizing: 'border-box',
        overflow: 'hidden' // Bật lại overflow hidden để bo góc ảnh
      }}
    >
      <div style={{ 
        width: '100%', 
        aspectRatio: '1 / 1', 
        background: '#f3f4f6', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: '2px',
        boxSizing: 'border-box',
        flexShrink: 0
      }}>
        <img 
          src={isHovered ? gifUrl : pngUrl} 
          alt={modelName}
          style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
          onError={(e) => { e.currentTarget.style.display = 'none' }}
        />
      </div>
      <div style={{ padding: '8px' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: isLight ? '#111827' : '#fff', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
          {modelName}
        </div>
        
        {/* Container cho các nút (cố định chiều cao) */}
        <div style={{ display: 'flex', gap: '5px', marginTop: '6px', height: '24px' }}>
          {isHovered ? (
            <>
              <button 
                onClick={(e) => { e.stopPropagation(); onAdd(modelName); }}
                style={{ flex: 1, padding: '4px', fontSize: '0.7rem', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                + ADD
              </button>
              {hasSelection && (
                <button 
                  onClick={(e) => { e.stopPropagation(); onReplace(modelName); }}
                  style={{ flex: 1, padding: '4px', fontSize: '0.7rem', background: isLight ? '#e5e7eb' : '#444', color: isLight ? '#111827' : '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                  REPLACE
                </button>
              )}
            </>
          ) : (
            <div style={{ width: '100%', height: '100%' }}></div> // Placeholder để giữ chiều cao
          )}
        </div>
      </div>
    </div>
  )
}

