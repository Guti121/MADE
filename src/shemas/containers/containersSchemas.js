import z from "zod";

export const createContainerSchemas = z.object({
  name: z.string().min(2, "Name is required"),
  type_container: z.coerce.number().min(1, "type Container is required"),
  capacity: z.coerce.number().min(1, "Capacity Container is required"),
  unit: z.string().min(1, "Unit Container is required"),
});
export const DeleteContainerSchemas = z.object({
  id: z.coerce.number().min(1, "id is required"),
});

export const updateContainerSchemas = z.object({
  id: z.coerce.number().min(1, "id is required"),
  name: z.string().optional(),
  type_container: z.number().optional(),
  capacity: z.number().min(1, "Capacity Container is required").optional(),
  unit: z.string().min(1, "Unit Container is required").optional(),
});

export const ListContainerSchema = z.object({
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(10),
  name: z.string().optional(),
  capacity: z.coerce.number().optional(),
  type_container: z.string().optional(),
});
