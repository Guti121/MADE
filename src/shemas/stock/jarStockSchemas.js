import z from "zod";

export const transferToJarSchema = z.object({
  component_id: z.coerce.number().min(1, "Component ID not provided"),

  location_id: z.coerce.number().min(1, "Location ID not provided"),

  quantity: z.coerce.number().positive("Quantity must be greater than 0"),
});

export const retrieveJarStockSchema = z.object({
  component_id: z.coerce.number().min(1, "Component ID not provided"),
  id: z.coerce.number().min(1, "location ID not provided"),
});

export const ListJarStockSchema = z.object({
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(10),
  name: z.string().optional(),
  id: z.string().optional(),
});

export const ListJarMovementSchema = z.object({
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(10),
  id: z.coerce.number().optional(),
  movement_type: z.string().optional(),
  component_id: z.coerce.number().optional(),
});
