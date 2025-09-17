import { ModuleConfig } from '../../core/ModuleRegistry'

// 测试模块配置
export const testModuleConfig: ModuleConfig = {
  id: 'test',
  name: '测试模块',
  description: '用于测试的简单模块',
  version: '1.0.0',
  icon: '🧪',
  category: 'other',
  permissions: ['read:test'],
  oauthProviders: ['default'],
  routes: [],
  components: {},
  hooks: {},
  services: {
    testService: {
      name: 'test',
      methods: ['testMethod']
    }
  },
  dependencies: [],
  enabled: true
}
