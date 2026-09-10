import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface PlacedModel {
  id: string
  url: string
  position: [number, number, number]
  rotation: [number, number, number]
  scale: [number, number, number]
  color?: string
  opacity?: number
  isAnimated?: boolean
  animationSpeed?: number
  castShadow?: boolean
}

export interface SunpathSettings {
  showSky: boolean
  showCompass: boolean
  showMonths: boolean
  showAnalemma: boolean
  showHourlySun: boolean
  showText: boolean
  sunSize: number
  textSize: number
  sunpathThickness: number
  compassThickness: number
  sunpathDashSize: number
  showGrid: boolean
  showAxes: boolean
}

interface EditorState {
  transformMode: 'translate' | 'rotate' | 'scale' | 'pan' | 'orbit'
  setTransformMode: (mode: 'translate' | 'rotate' | 'scale' | 'pan' | 'orbit') => void
  
  // Environment & Shadows
  latitude: number
  longitude: number
  activeMonth: number
  monthDates: Record<number, number>
  visibleMonths: number[]
  monthColorsLight: Record<number, string>
  monthColorsDark: Record<number, string>
  setMonthColor: (month: number, color: string) => void
  timeOfDay: number 
  northOffset: number
  shadowsEnabled: boolean
  timezoneMode: 'auto' | 'manual'
  utcOffset: number
  dstMode: 'auto' | 'off' | 'on'
  showHUD: boolean
  hudPosition: 'top-left' | 'top-center' | 'top-right' | 'middle-left' | 'middle-center' | 'middle-right' | 'bottom-left' | 'bottom-center' | 'bottom-right'
  uiTheme: 'light' | 'dark'
  setEnvironment: (env: Partial<Pick<EditorState, 'latitude' | 'longitude' | 'activeMonth' | 'monthDates' | 'visibleMonths' | 'monthColorsLight' | 'monthColorsDark' | 'timeOfDay' | 'northOffset' | 'shadowsEnabled' | 'timezoneMode' | 'utcOffset' | 'dstMode' | 'showHUD' | 'hudPosition' | 'uiTheme'>>) => void
  toggleShadow: (ids: string[], castShadow: boolean) => void

  // Sunpath Settings
  sunpathSettings: SunpathSettings
  setSunpathSettings: (settings: Partial<EditorState['sunpathSettings']>) => void

  recentColors: string[]
  addRecentColor: (color: string) => void

  legendItems: { id: string, name: string, iconUrl?: string, targetId?: string }[]
  addLegendItem: (item: { id: string, name: string, iconUrl?: string, targetId?: string }) => void
  removeLegendItem: (id: string) => void

  showSunDiagramLayer: boolean
  showDynamicSymbolsLayer: boolean
  setLayerVisibility: (layer: 'sunDiagram' | 'dynamicSymbols', visible: boolean) => void

  contextMenu: { x: number, y: number, type: 'sundiagram' | 'symbols', targetId?: string } | null
  setContextMenu: (menu: { x: number, y: number, type: 'sundiagram' | 'symbols', targetId?: string } | null) => void

  objects: PlacedModel[]
  past: PlacedModel[][]
  future: PlacedModel[][]
  
  placingUrl: string | null
  setPlacingUrl: (url: string | null) => void

  addObject: (url: string, position?: [number, number, number]) => void
  updateObjectTransform: (id: string, position: [number, number, number], rotation: [number, number, number], scale: [number, number, number]) => void
  updateObjectTransforms: (updates: { id: string, position: [number, number, number], rotation: [number, number, number], scale: [number, number, number] }[], commitHistory?: boolean) => void
  replaceObjectUrl: (ids: string[], newUrl: string) => void
  updateObjectColor: (ids: string[], color: string) => void
  updateObjectOpacity: (ids: string[], opacity: number) => void
  toggleAnimation: (ids: string[], isAnimated: boolean) => void
  updateAnimationSpeed: (ids: string[], speed: number) => void
  
  undo: () => void
  redo: () => void
  
  selectedIds: string[]
  setSelectedIds: (ids: string[]) => void
  setObjects: (objects: PlacedModel[]) => void
  removeObjects: (ids: string[]) => void
  duplicateObjects: (ids: string[]) => void
}

export const useEditorStore = create<EditorState>()(
  persist(
    (set) => ({
  transformMode: 'translate',
  setTransformMode: (mode) => set({ transformMode: mode }),
  
  // Environment & Shadows default
  latitude: 21.0285, // Hanoi
  longitude: 105.8542,
  activeMonth: 6, // June
  monthDates: { 1: 21, 2: 21, 3: 21, 4: 21, 5: 21, 6: 21, 7: 21, 8: 21, 9: 21, 10: 21, 11: 21, 12: 21 },
  visibleMonths: [6, 9, 12], // Default check June, Sep, Dec
  monthColorsLight: {
    1: '#cccccc', 2: '#cccccc', 3: '#cccccc', 4: '#cccccc', 5: '#cccccc', 
    6: '#ff0000', 7: '#cccccc', 8: '#cccccc', 9: '#00ff00', 10: '#cccccc', 
    11: '#cccccc', 12: '#0000ff', 13: '#ff0000', 14: '#233156', 15: '#233156', 
    16: '#ffd700', 17: '#ffffff', 18: '#ffcc00'
  },
  monthColorsDark: {
    1: '#cccccc', 2: '#cccccc', 3: '#cccccc', 4: '#cccccc', 5: '#cccccc', 
    6: '#ff0000', 7: '#cccccc', 8: '#cccccc', 9: '#00ff00', 10: '#cccccc', 
    11: '#cccccc', 12: '#0000ff', 13: '#ff0000', 14: '#ffffff', 15: '#999999', 
    16: '#ffd700', 17: '#333333', 18: '#ffcc00'
  },
  timeOfDay: 12, // 12:00 PM
  northOffset: 0,
  shadowsEnabled: false,
  timezoneMode: 'auto',
  utcOffset: 7,
  dstMode: 'auto',
  showHUD: true,
  hudPosition: 'bottom-left',
  uiTheme: 'light',

  // Sunpath default
  sunpathSettings: {
    showSky: true,
    showCompass: true,
    showMonths: true,
    showAnalemma: false,
    showHourlySun: true,
    showText: true,
    sunSize: 1.2,
    textSize: 2,
    sunpathThickness: 2,
    compassThickness: 1,
    sunpathDashSize: 1,
    showGrid: true,
    showAxes: true
  },
  setSunpathSettings: (settings) => set((state) => ({
    sunpathSettings: { ...state.sunpathSettings, ...settings }
  })),

  setEnvironment: (env) => set((state) => ({ ...state, ...env })),
  setMonthColor: (month, color) => set((state) => {
    if (state.uiTheme === 'light') {
      return { monthColorsLight: { ...state.monthColorsLight, [month]: color } }
    } else {
      return { monthColorsDark: { ...state.monthColorsDark, [month]: color } }
    }
  }),

  recentColors: ['#ffffff', '#ff0000', '#00ff00', '#0000ff', '#ffff00'],
  addRecentColor: (color) => set((state) => ({
    recentColors: [color, ...state.recentColors.filter(c => c !== color)].slice(0, 10)
  })),

  legendItems: [],
  addLegendItem: (item) => set((state) => ({ legendItems: [...state.legendItems, item] })),
  removeLegendItem: (id) => set((state) => ({ legendItems: state.legendItems.filter(i => i.id !== id) })),

  showSunDiagramLayer: true,
  showDynamicSymbolsLayer: true,
  setLayerVisibility: (layer, visible) => set((state) => {
    if (layer === 'sunDiagram') return { showSunDiagramLayer: visible }
    if (layer === 'dynamicSymbols') return { showDynamicSymbolsLayer: visible }
    return state
  }),

  contextMenu: null,
  setContextMenu: (menu) => set({ contextMenu: menu }),
  
  objects: [],
  past: [],
  future: [],

  placingUrl: null,
  setPlacingUrl: (url) => set({ placingUrl: url, selectedIds: [] }),
  
  addObject: (url, position = [0, 0, 0]) => set((state) => {
    const isSunpath = url.toUpperCase().includes('SUNPATH')
    const newObject: PlacedModel = {
      id: Math.random().toString(36).substring(2, 9),
      url,
      position,
      rotation: [0, 0, 0],
      scale: isSunpath ? [0.1, 0.1, 0.1] : [1, 1, 1],
      color: isSunpath ? '#ffffff' : '#233156',
      opacity: isSunpath ? 1 : 0.7,
      castShadow: false,
      isAnimated: !isSunpath // Mặc định bật Enable Animation cho Dynamic Symbols
    }
    return {
      past: [...state.past, state.objects],
      future: [],
      objects: [...state.objects, newObject],
      selectedIds: [newObject.id]
    }
  }),
  
  updateObjectTransform: (id, position, rotation, scale) => set((state) => {
    const newObjects = state.objects.map(obj => 
      obj.id === id ? { ...obj, position, rotation, scale } : obj
    )
    return {
      past: [...state.past, state.objects],
      future: [],
      objects: newObjects
    }
  }),

  updateObjectTransforms: (updates, commitHistory = true) => set((state) => {
    const newObjects = state.objects.map(obj => {
      const update = updates.find(u => u.id === obj.id)
      return update ? { ...obj, position: update.position, rotation: update.rotation, scale: update.scale } : obj
    })
    
    if (!commitHistory) {
      return { objects: newObjects }
    }
    
    return {
      past: [...state.past, state.objects],
      future: [],
      objects: newObjects
    }
  }),

  replaceObjectUrl: (ids, newUrl) => set((state) => {
    const newObjects = state.objects.map(obj => 
      ids.includes(obj.id) ? { ...obj, url: newUrl } : obj
    )
    return {
      past: [...state.past, state.objects],
      future: [],
      objects: newObjects
    }
  }),

  updateObjectColor: (ids, color) => set((state) => {
    const newObjects = state.objects.map(obj => 
      ids.includes(obj.id) ? { ...obj, color } : obj
    )
    return {
      past: [...state.past, state.objects],
      future: [],
      objects: newObjects
    }
  }),

  updateObjectOpacity: (ids, opacity) => set((state) => {
    const newObjects = state.objects.map(obj => 
      ids.includes(obj.id) ? { ...obj, opacity } : obj
    )
    return {
      past: [...state.past, state.objects],
      future: [],
      objects: newObjects
    }
  }),

  toggleAnimation: (ids, isAnimated) => set((state) => {
    const newObjects = state.objects.map(obj => 
      ids.includes(obj.id) ? { ...obj, isAnimated, animationSpeed: obj.animationSpeed || 2 } : obj
    )
    return {
      past: [...state.past, state.objects],
      future: [],
      objects: newObjects
    }
  }),

  updateAnimationSpeed: (ids, speed) => set((state) => {
    const newObjects = state.objects.map(obj => 
      ids.includes(obj.id) ? { ...obj, animationSpeed: speed } : obj
    )
    return {
      past: [...state.past, state.objects],
      future: [],
      objects: newObjects
    }
  }),

  toggleShadow: (ids, castShadow) => set((state) => {
    const newObjects = state.objects.map(obj => 
      ids.includes(obj.id) ? { ...obj, castShadow } : obj
    )
    return {
      past: [...state.past, state.objects],
      future: [],
      objects: newObjects
    }
  }),
  
  undo: () => set((state) => {
    if (state.past.length === 0) return state
    const previous = state.past[state.past.length - 1]
    const newPast = state.past.slice(0, state.past.length - 1)
    return {
      past: newPast,
      future: [state.objects, ...state.future],
      objects: previous
    }
  }),
  
  redo: () => set((state) => {
    if (state.future.length === 0) return state
    const next = state.future[0]
    const newFuture = state.future.slice(1)
    return {
      past: [...state.past, state.objects],
      future: newFuture,
      objects: next
    }
  }),
  
  selectedIds: [],
  setSelectedIds: (ids) => set({ selectedIds: ids }),
  setObjects: (objects) => set((state) => ({ 
    objects,
    past: [...state.past, state.objects],
    future: [],
    selectedIds: []
  })),
  removeObjects: (ids) => set((state) => {
    const newObjects = state.objects.filter(obj => !ids.includes(obj.id))
    return {
      past: [...state.past, state.objects],
      future: [],
      objects: newObjects,
      selectedIds: state.selectedIds.filter(id => !ids.includes(id))
    }
  }),
  
  duplicateObjects: (ids) => set((state) => {
    const objectsToDuplicate = state.objects.filter(obj => ids.includes(obj.id))
    if (objectsToDuplicate.length === 0) return state

    const newObjects = objectsToDuplicate.map(obj => ({
      ...obj,
      id: Math.random().toString(36).substring(2, 9),
    }))

    return {
      past: [...state.past, state.objects],
      future: [],
      objects: [...state.objects, ...newObjects],
      // Vẫn giữ nguyên selectedIds để người dùng tiếp tục kéo object cũ (bản gốc),
      // bản sao sẽ nằm lại ở vị trí ban đầu.
    }
  })
}),
    {
      name: 'archidiagram-storage',
      partialize: (state) => ({ 
        objects: state.objects, 
        recentColors: state.recentColors,
        transformMode: state.transformMode,
        latitude: state.latitude,
        activeMonth: state.activeMonth,
        monthDates: state.monthDates,
        timeOfDay: state.timeOfDay,
        northOffset: state.northOffset,
        shadowsEnabled: state.shadowsEnabled,
        sunpathSettings: state.sunpathSettings,
        hudPosition: state.hudPosition
      }),
    }
  )
)

export function getMonthColor(month: number, latitude: number, monthColors: Record<number, string>) {
  const custom = monthColors[month];
  const oldDefaults: Record<number, string> = {
    1: '#aaaaaa', 2: '#aaaaaa', 3: '#ffcc00', 4: '#aaaaaa', 5: '#aaaaaa', 
    6: '#ff0000', 7: '#aaaaaa', 8: '#aaaaaa', 9: '#00ffcc', 10: '#aaaaaa', 
    11: '#aaaaaa', 12: '#0000ff'
  };
  
  if (custom && custom !== oldDefaults[month]) {
    return custom;
  }
  
  let diff = Math.abs(month - 6);
  if (diff > 6) diff = 12 - diff; 
  if (latitude < 0) diff = 6 - diff;
  
  const colors = ['#ff0000', '#ff8800', '#ffff00', '#00ff00', '#00ffff', '#0088ff', '#0000ff'];
  return colors[diff];
}
