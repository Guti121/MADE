import z from "zod";

// A quantity override for one formula line. Only the quantity can change, and it
// is validated (>= the formula's quantity) in the service, not here.
const lineOverrideSchema = z.object({
  formula_component_id: z.coerce.number().positive(),

  quantity_used: z.coerce.number().positive(),
});

// Optional container the user attaches to the sale item (charged in full).
const saleContainerSchema = z.object({
  container_id: z.coerce.number().positive(),

  quantity_used: z.coerce.number().positive(),
});

const saleItemSchema = z.object({
  formula_id: z.coerce.number().positive(),

  // Number of identical finished units produced from the formula.
  quantity: z.coerce.number().positive().default(1),

  // Chosen essence component (validated as type ESSENCE in the service).
  essence_component_id: z.coerce.number().positive(),

  // Essence amount per finished unit. Defaults to the formula's essence quantity;
  // must be >= it (checked in the service).
  essence_quantity_used: z.coerce.number().positive().optional(),

  // Only increases: quantity per finished unit, >= the formula line quantity.
  line_overrides: z.array(lineOverrideSchema).default([]),

  discount: z.coerce.number().min(0).default(0),

  tax: z.coerce.number().min(0).default(0),

  sales_container: saleContainerSchema.optional(),
});

export const createSaleSchema = z.object({
  location_id: z.coerce.number().positive(),

  client_id: z.coerce.number().positive().optional(),

  is_wholesale: z.boolean().default(false),

  sales_items: z.array(saleItemSchema).min(1, "At least one item is required"),
});

export const getSaleSchema = z.object({
  id: z.coerce.number().positive(),

  page: z.coerce.number().positive().optional(),

  limit: z.coerce.number().positive().optional(),

  start_date: z.string().date().optional(),

  end_date: z.string().date().optional(),

  client_id: z.coerce.number().positive().optional(),
});

export const retrieveSaleSchema = z.object({
  id: z.coerce.number().positive(),
  id_sale: z.coerce.number().positive(),
});
