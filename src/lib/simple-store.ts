import { ChainConfig, getDefaultChain, getChainByName } from './chains'
import { createContext, useContext } from 'react'

// Simple store using React Context
export interface AppState {
  currentChain: ChainConfig
  theme: 'light' | 'dark' | 'system'
  sidebarOpen: boolean
}

export interface AppActions {
  switchChain: (chainName: string) => void
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  setSidebarOpen: (open: boolean) => void
}

export const AppStateContext = createContext<AppState | null>(null)
export const AppActionsContext = createContext<AppActions | null>(null)

export function useAppState() {
  const context = useContext(AppStateContext)
  if (!context) {
    throw new Error('useAppState must be used within AppProvider')
  }
  return context
}

export function useAppActions() {
  const context = useContext(AppActionsContext)
  if (!context) {
    throw new Error('useAppActions must be used within AppProvider')
  }
  return context
}

// Convenience hooks
export function useCurrentChain() {
  return useAppState().currentChain
}

export function useChainActions() {
  return { switchChain: useAppActions().switchChain }
}

export function useTheme() {
  const { theme } = useAppState()
  return theme
}

export function useThemeActions() {
  return { setTheme: useAppActions().setTheme }
}

export function useSidebar() {
  const { sidebarOpen } = useAppState()
  return sidebarOpen
}

export function useSidebarActions() {
  return { setSidebarOpen: useAppActions().setSidebarOpen }
}
