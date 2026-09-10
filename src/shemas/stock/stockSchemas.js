import z from 'zod'

// Bounded numeric guards: reject NaN / Infinity / negatives / absurd magnitudes
// so nothing overflows NUMERIC columns or the price math.
const id = z.coerce.number().int().positive()
const qty = z.coerce.number().finite().nonnegative().max(10000000)
const qtyPos = z.coerce.number().finite().positive().max(10000000)
const price = z.coerce.number().finite().nonnegative().max(100000000)

export const createStockSchema = z.object({
  component_id: id,
  location_id: id,
  quantity_base: qty,
  unit: z.string().min(1, 'Unit is required'),
  total_purchase_price: price,
  wholesale_price: price.default(0),
  consumer_price: price
})

export const deleteStockSchema = z.object({
  id_stock: id,
  id
})

export const updateStockSchema = z.object({
  stock_id: id,
  component_id: id,
  location_id: id,
  quantity_base: qtyPos,
  unit: z.string().min(1, 'Unit is required'),
  total_purchase_price: price,
  wholesale_price: price.default(0),
  consumer_price: price
})

export const registerLossStockSchema = z.object({
  stock_id: id,
  component_id: id,
  location_id: id,
  quantity_base: qtyPos,
  unit: z.string().min(1, 'Unit is required'),
  reason: z
    .string()
    .trim()
    .min(1, 'Reason must contain at least 5 characters')
    .max(500, 'Reason is too long')
})

// Adjustment has its own schema: it ADDS to stock, so cap it hard — an
// unbounded adjustment lets a user fabricate sellable inventory.
export const registerAdjustmentStockSchema = registerLossStockSchema

export const retrieveStockSchema = z.object({
  id_stock: id,
  id
})

export const ListStockSchema = z.object({
  page: z.coerce.number().int().positive().max(100000).default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  name: z.string().optional(),
  id: z.string().optional(),
  type_component: z.coerce.number().optional()
})

export const ListStockMovementSchema = z.object({
  page: z.coerce.number().int().positive().max(100000).default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  id: z.coerce.number().optional(),
  movement_type: z.string().optional(),
  component_id: z.coerce.number().optional()
})
