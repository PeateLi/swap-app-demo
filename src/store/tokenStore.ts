import { atom } from 'jotai'

// 代币列表状态
export const tokenListAtom = atom<any[]>([])

// 选中的源代币
export const selectedFromTokenAtom = atom<any>(null)

// 选中的目标代币
export const selectedToTokenAtom = atom<any>(null)

// 兑换数量
export const exchangeAmountAtom = atom<number>(0)

// 兑换方案
export const exchangePlansAtom = atom<any[]>([])

// 选中的兑换方案
export const selectedPlanAtom = atom<any>(null)

// 兑换确认状态
export const exchangeConfirmAtom = atom<boolean>(false)

// 加载状态
export const loadingAtom = atom<boolean>(false)

// 错误状态
export const errorAtom = atom<string | null>(null)

// 数据源信息
export const dataSourceAtom = atom<string>('')

// 搜索历史
export const searchHistoryAtom = atom<string[]>([])

// 用户钱包地址
export const userWalletAtom = atom<string>('')
