'use client'

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react'
import { atom, useAtom } from 'jotai'

// OAuth状态类型定义
export interface OAuthState {
  isAuthenticated: boolean
  user: User | null
  tokens: OAuthTokens | null
  loading: boolean
  error: string | null
  currentModule: string | null
  permissions: string[]
}

export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  walletAddress?: string
}

export interface OAuthTokens {
  accessToken: string
  refreshToken: string
  expiresAt: number
  tokenType: string
}

export interface OAuthContextType extends OAuthState {
  login: (module: string, provider?: string) => Promise<void>
  logout: () => void
  refreshToken: () => Promise<void>
  setCurrentModule: (module: string) => void
  checkPermission: (permission: string) => boolean
  requestPermission: (permission: string) => Promise<boolean>
}

// OAuth Actions
type OAuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; tokens: OAuthTokens; module: string } }
  | { type: 'LOGIN_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'REFRESH_TOKEN'; payload: OAuthTokens }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_CURRENT_MODULE'; payload: string }
  | { type: 'SET_PERMISSIONS'; payload: string[] }

// OAuth Reducer
function oauthReducer(state: OAuthState, action: OAuthAction): OAuthState {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, loading: true, error: null }
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
        tokens: action.payload.tokens,
        currentModule: action.payload.module,
        loading: false,
        error: null
      }
    case 'LOGIN_FAILURE':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        tokens: null,
        loading: false,
        error: action.payload
      }
    case 'LOGOUT':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        tokens: null,
        currentModule: null,
        permissions: [],
        error: null
      }
    case 'REFRESH_TOKEN':
      return {
        ...state,
        tokens: action.payload,
        error: null
      }
    case 'SET_LOADING':
      return { ...state, loading: action.payload }
    case 'SET_ERROR':
      return { ...state, error: action.payload }
    case 'SET_CURRENT_MODULE':
      return { ...state, currentModule: action.payload }
    case 'SET_PERMISSIONS':
      return { ...state, permissions: action.payload }
    default:
      return state
  }
}

// 初始状态
const initialState: OAuthState = {
  isAuthenticated: false,
  user: null,
  tokens: null,
  loading: false,
  error: null,
  currentModule: null,
  permissions: []
}

// Context
const OAuthContext = createContext<OAuthContextType | undefined>(undefined)

// Jotai atoms for global state
export const oauthStateAtom = atom<OAuthState>(initialState)
export const currentModuleAtom = atom<string | null>(null)
export const userPermissionsAtom = atom<string[]>([])

// OAuth Provider Component
interface OAuthProviderProps {
  children: ReactNode
}

export function OAuthProvider({ children }: OAuthProviderProps) {
  const [state, dispatch] = useReducer(oauthReducer, initialState)
  const [oauthState, setOAuthState] = useAtom(oauthStateAtom)
  const [currentModule, setCurrentModule] = useAtom(currentModuleAtom)
  const [permissions, setPermissions] = useAtom(userPermissionsAtom)

  // 同步状态到Jotai
  useEffect(() => {
    setOAuthState(state)
    setCurrentModule(state.currentModule)
    setPermissions(state.permissions)
  }, [state, setOAuthState, setCurrentModule, setPermissions])

  // 检查本地存储的token
  useEffect(() => {
    const checkStoredAuth = async () => {
      try {
        const storedTokens = localStorage.getItem('oauth_tokens')
        const storedUser = localStorage.getItem('oauth_user')
        const storedModule = localStorage.getItem('current_module')

        if (storedTokens && storedUser) {
          const tokens = JSON.parse(storedTokens)
          const user = JSON.parse(storedUser)
          
          // 检查token是否过期
          if (tokens.expiresAt > Date.now()) {
            dispatch({
              type: 'LOGIN_SUCCESS',
              payload: {
                user,
                tokens,
                module: storedModule || 'swap'
              }
            })
          } else {
            // Token过期，尝试刷新
            await refreshToken()
          }
        }
      } catch (error) {
        console.error('检查存储的认证信息失败:', error)
        localStorage.removeItem('oauth_tokens')
        localStorage.removeItem('oauth_user')
        localStorage.removeItem('current_module')
      }
    }

    checkStoredAuth()
  }, [])

  // 登录方法
  const login = async (module: string, provider: string = 'default') => {
    try {
      dispatch({ type: 'LOGIN_START' })
      
      // 调用MCP服务进行OAuth授权
      const response = await fetch('/api/oauth/authorize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          module,
          provider,
          redirectUri: window.location.origin + '/auth/callback'
        })
      })

      if (!response.ok) {
        throw new Error('OAuth授权失败')
      }

      const { authUrl, state: authState } = await response.json()
      
      // 存储认证状态
      sessionStorage.setItem('oauth_state', authState)
      sessionStorage.setItem('target_module', module)
      
      // 重定向到OAuth提供商
      window.location.href = authUrl
      
    } catch (error) {
      dispatch({
        type: 'LOGIN_FAILURE',
        payload: error instanceof Error ? error.message : '登录失败'
      })
    }
  }

  // 登出方法
  const logout = () => {
    dispatch({ type: 'LOGOUT' })
    localStorage.removeItem('oauth_tokens')
    localStorage.removeItem('oauth_user')
    localStorage.removeItem('current_module')
  }

  // 刷新token
  const refreshToken = async () => {
    try {
      const storedTokens = localStorage.getItem('oauth_tokens')
      if (!storedTokens) {
        throw new Error('没有可刷新的token')
      }

      const tokens = JSON.parse(storedTokens)
      const response = await fetch('/api/oauth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refreshToken: tokens.refreshToken
        })
      })

      if (!response.ok) {
        throw new Error('Token刷新失败')
      }

      const newTokens = await response.json()
      
      // 更新本地存储
      localStorage.setItem('oauth_tokens', JSON.stringify(newTokens))
      
      dispatch({ type: 'REFRESH_TOKEN', payload: newTokens })
    } catch (error) {
      console.error('Token刷新失败:', error)
      logout()
    }
  }

  // 设置当前模块
  const setCurrentModuleHandler = (module: string) => {
    dispatch({ type: 'SET_CURRENT_MODULE', payload: module })
    localStorage.setItem('current_module', module)
  }

  // 检查权限
  const checkPermission = (permission: string): boolean => {
    return state.permissions.includes(permission)
  }

  // 请求权限
  const requestPermission = async (permission: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/oauth/permissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${state.tokens?.accessToken}`
        },
        body: JSON.stringify({
          permission,
          module: state.currentModule
        })
      })

      if (response.ok) {
        const { granted } = await response.json()
        if (granted) {
          const newPermissions = [...state.permissions, permission]
          dispatch({ type: 'SET_PERMISSIONS', payload: newPermissions })
        }
        return granted
      }
      return false
    } catch (error) {
      console.error('权限请求失败:', error)
      return false
    }
  }

  const contextValue: OAuthContextType = {
    ...state,
    login,
    logout,
    refreshToken,
    setCurrentModule: setCurrentModuleHandler,
    checkPermission,
    requestPermission
  }

  return (
    <OAuthContext.Provider value={contextValue}>
      {children}
    </OAuthContext.Provider>
  )
}

// Hook to use OAuth context
export function useOAuth(): OAuthContextType {
  const context = useContext(OAuthContext)
  if (context === undefined) {
    throw new Error('useOAuth must be used within an OAuthProvider')
  }
  return context
}

// Hook for module-specific OAuth
export function useModuleOAuth(module: string) {
  const oauth = useOAuth()
  
  return {
    ...oauth,
    isModuleAuthenticated: oauth.isAuthenticated && oauth.currentModule === module,
    loginToModule: () => oauth.login(module),
    hasModulePermission: (permission: string) => 
      oauth.checkPermission(`${module}:${permission}`)
  }
}
