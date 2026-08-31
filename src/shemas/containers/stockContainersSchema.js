import z from "zod";

export const createStockContainerSchema = z.object({
  container_id: z.coerce.number().min(1, "Component ID not provided"),

  location_id: z.coerce.number().min(1, "Location ID not provided"),

  quantity_base: z.coerce.number().min(0, "Quantity cannot be negative"),
  unit: z.string().min(1, "Unit Container is required"),

  total_purchase_price: z.coerce
    .number()
    .min(0, "Average price cannot be negative"),

  wholesale_price: z.coerce
    .number()
    .min(0, "Wholesale price cannot be negative")
    .default(0),

  consumer_price: z.coerce.number().min(0, "Consumer price cannot be negative"),
});

export const deleteStockContainerSchema = z.object({
  id_stock: z.coerce.number().min(1, "Id is required"),
  id: z.coerce.number().min(1, "Id is required"),
});

export const updateStockContainerSchema = z.object({
  stock_id: z.coerce.number().min(1, "Stock ID not provided"),
  container_id: z.coerce.number().min(1, "Component ID not provided"),

  location_id: z.coerce.number().min(1, "Location ID not provided"),

  quantity_base: z.coerce.number().min(0, "Quantity cannot be negative"),
  unit: z.string().min(1, "Unit Container is required"),

  total_purchase_price: z.coerce
    .number()
    .min(0, "Average price cannot be negative"),

  wholesale_price: z.coerce
    .number()
    .min(0, "Wholesale price cannot be negative")
    .default(0),

  consumer_price: z.coerce.number().min(0, "Consumer price cannot be negative"),
});

export const registerLossStockContainerSchema = z.object({
  stock_id: z.coerce.number().min(1, "Stock ID not provided"),
  container_id: z.coerce.number().min(1, "Component ID not provided"),

  location_id: z.coerce.number().min(1, "Location ID not provided"),

  quantity_base: z.coerce.number().min(0, "Quantity cannot be negative"),

  reason: z
    .string()
    .trim()
    .min(5, "Reason must contain at least 5 characters")
    .max(500, "Reason is too long"),
});

export const retrieveStockContainerSchema = z.object({
  id_stock: z.coerce.number().min(1, "Stock ID not provided"),
  id: z.coerce.number().min(1, "location ID not provided"),
  container: z.coerce.number().min(1, "container ID not provided"),
});

export const ListStockContainerSchema = z.object({
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(10),
  name: z.string().optional(),
  id: z.string().optional(),
  type_container: z.coerce.number().optional(),
});

export const ListContainerMovementSchema = z.object({
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(10),
  id: z.coerce.number().optional(),
  movement_type: z.string().optional(),
  container_id: z.coerce.number().optional(),
});
// StockService.addStock()

// StockService.registerLoss()

// StockService.adjustStock()

// StockService.transferStock()
