// 模块接口定义
export interface ModuleConfig {
  id: string
  name: string
  description: string
  version: string
  icon?: string
  category: 'swap' | 'defi' | 'nft' | 'wallet' | 'other'
  permissions: string[]
  oauthProviders: string[]
  routes: ModuleRoute[]
  components: ModuleComponents
  hooks: ModuleHooks
  services: ModuleServices
  dependencies?: string[]
  enabled: boolean
}

export interface ModuleRoute {
  path: string
  component: React.ComponentType<any>
  exact?: boolean
  protected?: boolean
  permissions?: string[]
}

export interface ModuleComponents {
  [key: string]: React.ComponentType<any>
}

export interface ModuleHooks {
  [key: string]: (...args: any[]) => any
}

export interface ModuleServices {
  [key: string]: {
    name: string
    methods: string[]
    baseUrl?: string
  }
}

// 模块注册表
class ModuleRegistry {
  private modules: Map<string, ModuleConfig> = new Map()
  private moduleInstances: Map<string, any> = new Map()

  // 注册模块
  registerModule(moduleConfig: ModuleConfig) {
    if (!moduleConfig) {
      console.error('模块配置不能为空')
      return
    }
    
    if (!moduleConfig.id) {
      console.error('模块ID不能为空')
      return
    }
    
    this.modules.set(moduleConfig.id, moduleConfig)
    console.log(`模块 ${moduleConfig.id} 已注册`)
  }

  // 获取模块配置
  getModule(id: string): ModuleConfig | undefined {
    return this.modules.get(id)
  }

  // 获取所有模块
  getAllModules(): ModuleConfig[] {
    return Array.from(this.modules.values())
  }

  // 获取按分类的模块
  getModulesByCategory(category: string): ModuleConfig[] {
    return Array.from(this.modules.values()).filter(
      module => module.category === category
    )
  }

  // 获取启用的模块
  getEnabledModules(): ModuleConfig[] {
    return Array.from(this.modules.values()).filter(module => module.enabled)
  }

  // 启用/禁用模块
  toggleModule(id: string, enabled: boolean) {
    const module = this.modules.get(id)
    if (module) {
      module.enabled = enabled
      this.modules.set(id, module)
    }
  }

  // 获取模块组件
  getModuleComponent(moduleId: string, componentName: string) {
    const module = this.modules.get(moduleId)
    return module?.components[componentName]
  }

  // 获取模块Hook
  getModuleHook(moduleId: string, hookName: string) {
    const module = this.modules.get(moduleId)
    return module?.hooks[hookName]
  }

  // 获取模块服务
  getModuleService(moduleId: string, serviceName: string) {
    const module = this.modules.get(moduleId)
    return module?.services[serviceName]
  }

  // 检查模块依赖
  checkDependencies(moduleId: string): { satisfied: boolean; missing: string[] } {
    const module = this.modules.get(moduleId)
    if (!module || !module.dependencies) {
      return { satisfied: true, missing: [] }
    }

    const missing = module.dependencies.filter(
      dep => !this.modules.has(dep) || !this.modules.get(dep)?.enabled
    )

    return {
      satisfied: missing.length === 0,
      missing
    }
  }

  // 获取模块路由
  getModuleRoutes(moduleId: string): ModuleRoute[] {
    const module = this.modules.get(moduleId)
    return module?.routes || []
  }

  // 获取所有路由
  getAllRoutes(): Array<ModuleRoute & { moduleId: string }> {
    const allRoutes: Array<ModuleRoute & { moduleId: string }> = []
    
    this.modules.forEach((module, moduleId) => {
      if (module.enabled) {
        module.routes.forEach(route => {
          allRoutes.push({ ...route, moduleId })
        })
      }
    })

    return allRoutes
  }

  // 验证模块配置
  validateModule(moduleConfig: ModuleConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!moduleConfig.id) errors.push('模块ID不能为空')
    if (!moduleConfig.name) errors.push('模块名称不能为空')
    if (!moduleConfig.description) errors.push('模块描述不能为空')
    if (!moduleConfig.version) errors.push('模块版本不能为空')
    if (!moduleConfig.category) errors.push('模块分类不能为空')
    if (!Array.isArray(moduleConfig.permissions)) errors.push('权限配置必须是数组')
    if (!Array.isArray(moduleConfig.routes)) errors.push('路由配置必须是数组')
    if (!moduleConfig.components) errors.push('组件配置不能为空')
    if (!moduleConfig.hooks) errors.push('Hooks配置不能为空')
    if (!moduleConfig.services) errors.push('服务配置不能为空')

    return {
      valid: errors.length === 0,
      errors
    }
  }

  // 清理模块
  unregisterModule(id: string) {
    this.modules.delete(id)
    this.moduleInstances.delete(id)
    console.log(`模块 ${id} 已注销`)
  }
}

// 创建全局实例
export const moduleRegistry = new ModuleRegistry()

// 模块注册装饰器
export function RegisterModule(config: Omit<ModuleConfig, 'enabled'>) {
  return function <T extends { new (...args: any[]): any }>(constructor: T) {
    const moduleConfig: ModuleConfig = {
      ...config,
      enabled: true
    }

    // 验证模块配置
    const validation = moduleRegistry.validateModule(moduleConfig)
    if (!validation.valid) {
      console.error(`模块 ${config.id} 配置无效:`, validation.errors)
      return constructor
    }

    // 注册模块
    moduleRegistry.registerModule(moduleConfig)

    return constructor
  }
}

// 模块工厂函数
export function createModule(config: ModuleConfig) {
  const validation = moduleRegistry.validateModule(config)
  if (!validation.valid) {
    throw new Error(`模块配置无效: ${validation.errors.join(', ')}`)
  }

  moduleRegistry.registerModule(config)
  return config
}

// 动态加载模块
export async function loadModule(moduleId: string, modulePath: string) {
  try {
    const module = await import(modulePath)
    if (module.default && typeof module.default === 'function') {
      // 如果模块有默认导出且是函数，调用它
      const moduleConfig = module.default()
      moduleRegistry.registerModule(moduleConfig)
    } else if (module.moduleConfig) {
      // 如果模块有moduleConfig属性
      moduleRegistry.registerModule(module.moduleConfig)
    } else {
      throw new Error('模块格式不正确')
    }
  } catch (error) {
    console.error(`加载模块 ${moduleId} 失败:`, error)
    throw error
  }
}
