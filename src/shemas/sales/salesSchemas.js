import z from "zod";

const saleComponentSchema = z.object({
  component_id: z.coerce.number().positive(),

  quantity_used: z.coerce.number().positive(),

  unit_price: z.coerce.number().nonnegative(),
});

const saleContainerSchema = z.object({
  container_id: z.coerce.number().positive(),

  quantity_used: z.coerce.number().positive(),

  unit_price: z.coerce.number().nonnegative(),
});

const saleItemSchema = z.object({
  formula_id: z.coerce.number().positive(),

  quantity: z.coerce.number().positive(),

  discount: z.coerce.number().min(0).default(0),

  tax: z.coerce.number().min(0).default(0),

  sales_components: z.array(saleComponentSchema).default([]),

  sales_container: saleContainerSchema,
});

export const createSaleSchema = z.object({
  location_id: z.coerce.number().positive(),

  formula_name_snapshot: z.string().min(5),

  client_id: z.coerce.number().positive(),

  is_wholesale: z.boolean().default(false),

  sales_items: z.array(saleItemSchema).min(1, "At least one item is required"),
});

export const getSaleSchema = z.object({
  id: z.coerce.number().positive(),

  page: z.coerce.number().positive().optional(),
  limit: z.coerce.number().positive().optional(),
  name: z.string().min(5).optional(),

  client_id: z.coerce.number().positive().optional(),
});

export const retrieveSaleSchema = z.object({
  id: z.coerce.number().positive(),
  id_sale: z.coerce.number().positive(),
});
