import z from "zod";

export const createComponentSchemas = z.object({
  name: z.string().min(2, "Name is required"),
  type_component: z.coerce.number().min(1, "type component is required"),
});
export const DeleteComponentSchemas = z.object({
  id: z.coerce.number().min(1, "id is required"),
});

export const updateComponentSchemas = z.object({
  id: z.coerce.number().min(1, "id is required"),
  name: z.string().optional(),
  type_component: z.number().optional(),
});

export const ListComponentSchema = z.object({
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(10),
  name: z.string().optional(),
  type_component: z.string().optional(),
});
