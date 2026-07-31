import { describe, it, expect } from 'vitest'
import { resolveMovementDelta, resolveMovementQuantity } from '@/lib/utils/inventory'

describe('resolveMovementDelta', () => {
  it('stock-in types always add positive', () => {
    for (const t of ['receipt', 'opening_balance', 'production']) {
      expect(resolveMovementDelta(t, 10)).toBe(10)
      expect(resolveMovementDelta(t, -10)).toBe(10)
    }
  })

  it('stock-out types always subtract', () => {
    for (const t of ['issue', 'transfer', 'return', 'sale', 'allocation', 'consumption']) {
      expect(resolveMovementDelta(t, 10)).toBe(-10)
      expect(resolveMovementDelta(t, -10)).toBe(-10)
    }
  })

  it('adjustment and correction preserve the signed change', () => {
    expect(resolveMovementDelta('adjustment', 5)).toBe(5)
    expect(resolveMovementDelta('adjustment', -5)).toBe(-5)
    expect(resolveMovementDelta('correction', -3)).toBe(-3)
  })

  it('damage, reservation and release do not change on-hand', () => {
    expect(resolveMovementDelta('damage', 4)).toBe(0)
    expect(resolveMovementDelta('reservation', 4)).toBe(0)
    expect(resolveMovementDelta('release', 4)).toBe(0)
  })
})

describe('resolveMovementQuantity', () => {
  it('mirrors the SQL movement quantity', () => {
    expect(resolveMovementQuantity('receipt', 10)).toBe(10)
    expect(resolveMovementQuantity('issue', 10)).toBe(-10)
    expect(resolveMovementQuantity('adjustment', -5)).toBe(-5)
    expect(resolveMovementQuantity('damage', 3)).toBe(3)
    expect(resolveMovementQuantity('reservation', 3)).toBe(3)
    expect(resolveMovementQuantity('release', 3)).toBe(-3)
  })
})
