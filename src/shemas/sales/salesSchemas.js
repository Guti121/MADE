import z from 'zod'

// How a sale was paid. Kept in sync with the chk_sales_payment_method
// CHECK constraint on the sales table.
export const PAYMENT_METHODS = [
  'EFECTIVO',
  'TRANSFERENCIA',
  'TARJETA',
  'ADDI',
  'SISTECREDITO'
]

// Shared numeric guards: reject NaN / Infinity / negatives / absurd magnitudes
// at the edge so nothing poisons the NUMERIC columns or overflows the money math.
const unitCount = z.coerce.number().int().positive().max(100000)
const amount = z.coerce.number().finite().positive().max(10000000) // grams / ml
const money = z.coerce.number().finite().nonnegative().max(100000000)

// A quantity override for one formula line. Only the quantity can change, and it
// is validated (>= the formula's quantity) in the service, not here.
const lineOverrideSchema = z.object({
  formula_component_id: z.coerce.number().int().positive(),

  quantity_used: amount
})

// Optional container the user attaches to the sale item (charged in full).
const saleContainerSchema = z.object({
  container_id: z.coerce.number().int().positive(),

  quantity_used: unitCount
})

const saleItemSchema = z.object({
  formula_id: z.coerce.number().int().positive(),

  // Number of identical finished units produced from the formula.
  quantity: unitCount.default(1),

  // Chosen essence component (validated as type ESSENCE in the service).
  essence_component_id: z.coerce.number().int().positive(),

  // Essence amount per finished unit. Defaults to the formula's essence quantity;
  // must be >= it (checked in the service).
  essence_quantity_used: amount.optional(),

  // Only increases: quantity per finished unit, >= the formula line quantity.
  line_overrides: z.array(lineOverrideSchema).max(100).default([]),

  discount: money.default(0),

  tax: money.default(0),

  sales_container: saleContainerSchema.optional()
})

export const createSaleSchema = z.object({
  location_id: z.coerce.number().int().positive(),

  client_id: z.coerce.number().int().positive().optional(),

  is_wholesale: z.boolean().default(false),

  payment_method: z.enum(PAYMENT_METHODS).default('EFECTIVO'),

  sales_items: z.array(saleItemSchema).min(1, 'At least one item is required').max(200)
})

export const getSaleSchema = z.object({
  id: z.coerce.number().int().positive(),

  page: z.coerce.number().int().positive().max(100000).optional(),

  limit: z.coerce.number().int().positive().max(100).optional(),

  start_date: z.string().date().optional(),

  end_date: z.string().date().optional(),

  client_id: z.coerce.number().int().positive().optional(),

  payment_method: z.enum(PAYMENT_METHODS).optional()
})

export const retrieveSaleSchema = z.object({
  id: z.coerce.number().int().positive(),
  id_sale: z.coerce.number().int().positive()
})
