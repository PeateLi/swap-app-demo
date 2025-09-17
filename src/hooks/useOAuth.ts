'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAtom } from 'jotai'
import { oauthStateAtom, currentModuleAtom, userPermissionsAtom } from '../providers/OAuthProvider'

// 基础OAuth Hook
export function useOAuth() {
  const [oauthState] = useAtom(oauthStateAtom)
  const [currentModule] = useAtom(currentModuleAtom)
  const [permissions] = useAtom(userPermissionsAtom)

  return {
    ...oauthState,
    currentModule,
    permissions
  }
}

// 模块特定的OAuth Hook
export function useModuleOAuth(moduleName: string) {
  const oauth = useOAuth()
  const [isModuleLoading, setIsModuleLoading] = useState(false)
  const [moduleError, setModuleError] = useState<string | null>(null)

  const isModuleAuthenticated = oauth.isAuthenticated && oauth.currentModule === moduleName

  const loginToModule = useCallback(async (provider?: string) => {
    setIsModuleLoading(true)
    setModuleError(null)
    
    try {
      // 这里会触发OAuth流程
      const response = await fetch('/api/oauth/authorize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          module: moduleName,
          provider: provider || 'default',
          redirectUri: window.location.origin + '/auth/callback'
        })
      })

      if (!response.ok) {
        throw new Error('OAuth授权失败')
      }

      const { authUrl } = await response.json()
      window.location.href = authUrl
    } catch (error) {
      setModuleError(error instanceof Error ? error.message : '登录失败')
    } finally {
      setIsModuleLoading(false)
    }
  }, [moduleName])

  const logoutFromModule = useCallback(() => {
    if (oauth.currentModule === moduleName) {
      oauth.logout()
    }
  }, [moduleName, oauth])

  const hasModulePermission = useCallback((permission: string) => {
    return oauth.permissions.includes(`${moduleName}:${permission}`) || 
           oauth.permissions.includes(permission)
  }, [moduleName, oauth.permissions])

  const requestModulePermission = useCallback(async (permission: string) => {
    try {
      const response = await fetch('/api/oauth/permissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${oauth.tokens?.accessToken}`
        },
        body: JSON.stringify({
          permission: `${moduleName}:${permission}`,
          module: moduleName
        })
      })

      if (response.ok) {
        const { granted } = await response.json()
        return granted
      }
      return false
    } catch (error) {
      console.error('权限请求失败:', error)
      return false
    }
  }, [moduleName, oauth.tokens])

  return {
    ...oauth,
    isModuleAuthenticated,
    isModuleLoading,
    moduleError,
    loginToModule,
    logoutFromModule,
    hasModulePermission,
    requestModulePermission
  }
}

// MCP服务调用Hook
export function useMCPService() {
  const oauth = useOAuth()
  const [isCalling, setIsCalling] = useState(false)
  const [callError, setCallError] = useState<string | null>(null)

  const callMCPService = useCallback(async (
    serviceName: string, 
    method: string, 
    params: any = {},
    module?: string
  ) => {
    if (!oauth.isAuthenticated) {
      throw new Error('用户未认证')
    }

    setIsCalling(true)
    setCallError(null)

    try {
      const response = await fetch('/api/mcp/call', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${oauth.tokens?.accessToken}`
        },
        body: JSON.stringify({
          service: serviceName,
          method,
          params,
          module: module || oauth.currentModule
        })
      })

      if (!response.ok) {
        throw new Error(`MCP服务调用失败: ${response.statusText}`)
      }

      const result = await response.json()
      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'MCP服务调用失败'
      setCallError(errorMessage)
      throw error
    } finally {
      setIsCalling(false)
    }
  }, [oauth.isAuthenticated, oauth.tokens, oauth.currentModule])

  return {
    callMCPService,
    isCalling,
    callError
  }
}

// 权限管理Hook
export function usePermissions() {
  const oauth = useOAuth()
  const [permissions, setPermissions] = useAtom(userPermissionsAtom)

  const checkPermission = useCallback((permission: string) => {
    return permissions.includes(permission)
  }, [permissions])

  const requestPermission = useCallback(async (permission: string) => {
    try {
      const response = await fetch('/api/oauth/permissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${oauth.tokens?.accessToken}`
        },
        body: JSON.stringify({
          permission,
          module: oauth.currentModule
        })
      })

      if (response.ok) {
        const { granted } = await response.json()
        if (granted) {
          setPermissions(prev => [...prev, permission])
        }
        return granted
      }
      return false
    } catch (error) {
      console.error('权限请求失败:', error)
      return false
    }
  }, [oauth.tokens, oauth.currentModule, setPermissions])

  const revokePermission = useCallback(async (permission: string) => {
    try {
      const response = await fetch('/api/oauth/permissions', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${oauth.tokens?.accessToken}`
        },
        body: JSON.stringify({
          permission,
          module: oauth.currentModule
        })
      })

      if (response.ok) {
        setPermissions(prev => prev.filter(p => p !== permission))
        return true
      }
      return false
    } catch (error) {
      console.error('权限撤销失败:', error)
      return false
    }
  }, [oauth.tokens, oauth.currentModule, setPermissions])

  return {
    permissions,
    checkPermission,
    requestPermission,
    revokePermission
  }
}

// 自动刷新token Hook
export function useTokenRefresh() {
  const oauth = useOAuth()

  useEffect(() => {
    if (!oauth.tokens) return

    const timeUntilExpiry = oauth.tokens.expiresAt - Date.now()
    const refreshThreshold = 5 * 60 * 1000 // 5分钟前刷新

    if (timeUntilExpiry < refreshThreshold) {
      oauth.refreshToken()
    }

    const interval = setInterval(() => {
      if (oauth.tokens) {
        const timeUntilExpiry = oauth.tokens.expiresAt - Date.now()
        if (timeUntilExpiry < refreshThreshold) {
          oauth.refreshToken()
        }
      }
    }, 60000) // 每分钟检查一次

    return () => clearInterval(interval)
  }, [oauth.tokens, oauth.refreshToken])
}
