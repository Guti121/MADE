import z from "zod";

export const createTypeComponentSchema = z.object({
  name: z.string().min(2, "Name is required"),
});

export const deleteTypeComponentSchema = z.object({
  idType: z.coerce.number().min(1, "ID is required"),
});

export const ListTypeComponentSchema = z.object({
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(10),
  name: z.string().optional(),
});

export const updateTypeComponentSchema = z.object({
  id: z.coerce.number().min(1, "ID is required"),
  name: z.string().min(2, "Name is required"),
});
