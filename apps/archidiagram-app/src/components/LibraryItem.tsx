import { useState } from 'react'
import { useEditorStore } from '../store/useEditorStore'

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

  const svgUrl = `/images/dynamicsymbols/${modelName}.svg`
  const isArrow = modelName.toUpperCase().includes('ARROW') || modelName.toUpperCase().includes('WIND')
  const isCircle = modelName.toUpperCase().includes('CIRCLE') || modelName.toUpperCase().includes('NOISE') || modelName.toUpperCase().includes('STORM')

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
        height: 'auto', // Ensure height depends on content
        boxSizing: 'border-box',
        overflow: 'hidden' // Re-enable overflow hidden for rounded corners
      }}
    >
      <div style={{ 
        width: '100%', 
        aspectRatio: '1 / 1', 
        background: 'transparent', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: '2px',
        boxSizing: 'border-box',
        flexShrink: 0,
        position: 'relative',
        overflow: 'hidden'
      }}>
        <style>{`
          @keyframes previewArrowAnim {
            0% { clip-path: polygon(100% 0, 100% 0, 100% 100%, 100% 100%); }
            40% { clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%); }
            50% { clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%); }
            90% { clip-path: polygon(0 0, 0 0, 0 100%, 0 100%); }
            100% { clip-path: polygon(0 0, 0 0, 0 100%, 0 100%); }
          }
          @keyframes previewCircleAnim {
            0% { clip-path: circle(0% at 50% 50%); opacity: 1; }
            40% { clip-path: circle(100% at 50% 50%); opacity: 1; }
            50% { clip-path: circle(100% at 50% 50%); opacity: 1; }
            90% { clip-path: circle(100% at 50% 50%); opacity: 1; }
            100% { clip-path: circle(100% at 50% 50%); opacity: 1; }
          }
          @keyframes previewInnerHoleAnim {
            0% { width: 0; height: 0; opacity: 0; }
            49.99% { width: 0; height: 0; opacity: 0; }
            50% { width: 0; height: 0; opacity: 1; }
            90% { width: 150%; height: 150%; opacity: 1; }
            100% { width: 150%; height: 150%; opacity: 1; }
          }
        `}</style>
        <div 
          style={{ 
            width: '100%', 
            height: '100%', 
            WebkitMaskImage: `url(${svgUrl})`,
            WebkitMaskSize: 'contain',
            WebkitMaskRepeat: 'no-repeat',
            WebkitMaskPosition: 'center',
            backgroundColor: isLight ? 'rgb(35, 49, 86)' : '#ffffff',
            transform: isArrow ? 'rotate(45deg)' : 'none',
            animation: isHovered ? (isArrow ? 'previewArrowAnim 1s infinite linear' : isCircle ? 'previewCircleAnim 1s infinite linear' : 'none') : 'none'
          }}
        />
        {isCircle && (
          <div 
            style={{
              position: 'absolute',
              background: isLight ? '#ffffff' : '#2a2a2a',
              borderRadius: '50%',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              animation: isHovered ? 'previewInnerHoleAnim 1s infinite linear' : 'none'
            }}
          />
        )}
      </div>
      <div style={{ padding: '8px' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: isLight ? '#111827' : '#fff', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
          {modelName.replace(/^Feb_/i, '')}
        </div>
        
        {/* Button container (fixed height) */}
        <div style={{ display: 'flex', gap: '5px', marginTop: '6px', height: '24px' }}>
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
        </div>
      </div>
    </div>
  )
}
