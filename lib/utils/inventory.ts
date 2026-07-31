export const STOCK_IN_MOVEMENT_TYPES = ['receipt', 'opening_balance', 'production'] as const
export const STOCK_OUT_MOVEMENT_TYPES = ['issue', 'transfer', 'return', 'sale', 'allocation', 'consumption'] as const
export const RESERVATION_MOVEMENT_TYPES = ['reservation', 'release'] as const
export const DAMAGE_MOVEMENT_TYPES = ['damage'] as const
export const SIGNED_MOVEMENT_TYPES = ['adjustment', 'correction'] as const

/**
 * Resolves the effective signed on-hand delta for a movement. Mirrors the
 * direction logic implemented in the `adjust_stock_atomic` SQL function so the
 * behaviour is unit-testable on the client side.
 */
export function resolveMovementDelta(movementType: string, quantityChange: number): number {
  const qty = Number(quantityChange)
  if (STOCK_IN_MOVEMENT_TYPES.includes(movementType as (typeof STOCK_IN_MOVEMENT_TYPES)[number])) {
    return Math.abs(qty)
  }
  if (STOCK_OUT_MOVEMENT_TYPES.includes(movementType as (typeof STOCK_OUT_MOVEMENT_TYPES)[number])) {
    return -Math.abs(qty)
  }
  if (SIGNED_MOVEMENT_TYPES.includes(movementType as (typeof SIGNED_MOVEMENT_TYPES)[number])) {
    return qty
  }
  // damage / reservation / release affect reserved/damaged buckets, not on-hand
  return 0
}

/**
 * Resolves the signed quantity recorded on the stock movement row (mirrors the
 * SQL function's `v_movement_qty`).
 */
export function resolveMovementQuantity(movementType: string, quantityChange: number): number {
  const qty = Number(quantityChange)
  if (SIGNED_MOVEMENT_TYPES.includes(movementType as (typeof SIGNED_MOVEMENT_TYPES)[number])) {
    return qty
  }
  const onHand = resolveMovementDelta(movementType, qty)
  if (movementType === 'reservation') return Math.abs(qty)
  if (movementType === 'release') return -Math.abs(qty)
  if (movementType === 'damage') return Math.abs(qty)
  return onHand
}