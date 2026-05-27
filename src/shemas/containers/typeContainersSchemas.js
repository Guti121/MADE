import z from "zod";

export const createTypeContainerSchema = z.object({
  name: z.string().min(2, "Name is required"),
  description: z.string().optional(),
});

export const deleteTypeContainerSchema = z.object({
  idType: z.coerce.number().min(1, "ID is required"),
});

export const ListTypeContainerSchema = z.object({
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(10),
  name: z.string().optional(),
});

export const updateTypeContainerSchema = z.object({
  id: z.coerce.number().min(1, "ID is required"),
  name: z.string().min(2, "Name is required"),
});
