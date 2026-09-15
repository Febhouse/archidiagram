import { useState } from 'react'
import { useEditorStore, PRO_MODELS } from '../store/useEditorStore'

interface LibraryItemProps {
  modelName: string
  onAdd: (modelName: string) => void
  onReplace: (modelName: string) => void
  hasSelection: boolean
  onProClick?: () => void
}

export default function LibraryItem({ modelName, onAdd, onReplace, hasSelection, onProClick }: LibraryItemProps) {
  const [isHovered, setIsHovered] = useState(false)
  const uiTheme = useEditorStore(state => state.uiTheme)
  const isUserPro = useEditorStore(state => state.isPro)
  const isLight = uiTheme === 'light'

  const svgUrl = `/images/dynamicsymbols/${modelName}.svg`
  const isArrow = modelName.toUpperCase().includes('ARROW') || modelName.toUpperCase().includes('WIND')
  const isCircle = modelName.toUpperCase().includes('CIRCLE') || modelName.toUpperCase().includes('NOISE') || modelName.toUpperCase().includes('STORM')

  const isProItem = PRO_MODELS.includes(modelName.toUpperCase())

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: isLight ? '#ffffff' : '#2a2a2a',
        borderRadius: '8px',
        border: isHovered ? ((isProItem && !isUserPro) ? '1px solid #f59e0b' : '1px solid #3b82f6') : (isLight ? '1px solid #e5e7eb' : '1px solid #444'),
        transition: 'all 0.2s',
        display: 'block',
        boxSizing: 'border-box',
        overflow: 'hidden'
      }}
    >
      <div style={{
        width: '100%',
        paddingTop: '100%',
        background: 'transparent',
        flexShrink: 0,
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2px',
          boxSizing: 'border-box'
        }}>
          {isProItem && (
            <div style={{ position: 'absolute', top: '4px', right: '4px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: 'white', fontSize: '0.5rem', fontWeight: 'bold', padding: '2px 4px', borderRadius: '4px', zIndex: 10 }}>
              PRO
            </div>
          )}
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
              backgroundColor: (isProItem && !isUserPro) ? (isLight ? '#d97706' : '#fbbf24') : (isLight ? 'rgb(35, 49, 86)' : '#ffffff'),
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
      </div>
      <div style={{ padding: '8px' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: isLight ? '#111827' : '#fff', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
          {modelName.replace(/^Feb_/i, '')}
        </div>

        {/* Button container (fixed height) */}
        <div style={{ display: 'flex', gap: '5px', marginTop: '6px', height: '24px' }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (isProItem && !isUserPro) { onProClick?.(); return; }
              onAdd(modelName);
            }}
            style={{
              flex: 1, padding: hasSelection ? '3px' : '4px', fontSize: '0.7rem',
              background: (isProItem && !isUserPro)
                ? (isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)')
                : (hasSelection ? 'transparent' : '#3b82f6'),
              color: (isProItem && !isUserPro)
                ? (isLight ? '#999' : '#666')
                : (hasSelection ? (isLight ? '#2563eb' : '#60a5fa') : '#fff'),
              border: (isProItem && !isUserPro)
                ? '1px solid ' + (isLight ? '#ddd' : '#444')
                : (hasSelection ? '1px solid ' + (isLight ? '#3b82f6' : '#60a5fa') : 'none'),
              borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold',
              opacity: (isProItem && !isUserPro) ? 0.6 : 1
            }}
          >
            {(isProItem && !isUserPro) ? 'PRO' : 'ADD'}
          </button>
          {hasSelection && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (isProItem && !isUserPro) { onProClick?.(); return; }
                onReplace(modelName);
              }}
              style={{
                flex: 1,
                padding: (isProItem && !isUserPro) ? '3px' : '4px',
                fontSize: '0.7rem',
                background: (isProItem && !isUserPro)
                  ? 'transparent'
                  : '#3b82f6',
                color: (isProItem && !isUserPro)
                  ? (isLight ? '#999' : '#666')
                  : '#fff',
                border: (isProItem && !isUserPro)
                  ? '1px solid ' + (isLight ? '#ddd' : '#444')
                  : 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold',
                opacity: (isProItem && !isUserPro) ? 0.6 : 1
              }}
            >
              REPLACE
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
