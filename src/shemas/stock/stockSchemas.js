import z from "zod";

export const createStockSchema = z.object({
  component_id: z.coerce.number().min(1, "Component ID not provided"),

  location_id: z.coerce.number().min(1, "Location ID not provided"),

  quantity_base: z.coerce.number().min(0, "Quantity cannot be negative"),

  unit: z.string().min(1, "Unit is required"),

  total_purchase_price: z.coerce
    .number()
    .min(0, "Average price cannot be negative"),

  wholesale_price: z.coerce
    .number()
    .min(0, "Wholesale price cannot be negative")
    .default(0),

  consumer_price: z.coerce.number().min(0, "Consumer price cannot be negative"),
});

export const deleteStockSchema = z.object({
  id_stock: z.coerce.number().min(1, "Id is required"),
  id: z.coerce.number().min(1, "Id is required"),
});

export const updateStockSchema = z.object({
  stock_id: z.coerce.number().min(1, "Stock ID not provided"),
  component_id: z.coerce.number().min(1, "Component ID not provided"),

  location_id: z.coerce.number().min(1, "Location ID not provided"),

  quantity_base: z.coerce.number().min(0, "Quantity cannot be negative"),

  unit: z.string().min(1, "Unit is required"),

  total_purchase_price: z.coerce
    .number()
    .min(0, "Average price cannot be negative"),

  wholesale_price: z.coerce
    .number()
    .min(0, "Wholesale price cannot be negative")
    .default(0),

  consumer_price: z.coerce.number().min(0, "Consumer price cannot be negative"),
});

export const registerLossStockSchema = z.object({
  stock_id: z.coerce.number().min(1, "Stock ID not provided"),
  component_id: z.coerce.number().min(1, "Component ID not provided"),

  location_id: z.coerce.number().min(1, "Location ID not provided"),

  quantity_base: z.coerce.number().min(0, "Quantity cannot be negative"),

  unit: z.string().min(1, "Unit is required"),

  reason: z
    .string()
    .trim()
    .min(5, "Reason must contain at least 5 characters")
    .max(500, "Reason is too long"),
});

export const retrieveStockSchema = z.object({
  id_stock: z.coerce.number().min(1, "Stock ID not provided"),
  id: z.coerce.number().min(1, "location ID not provided"),
});
// StockService.addStock()

// StockService.registerLoss()

// StockService.adjustStock()

// StockService.transferStock()
