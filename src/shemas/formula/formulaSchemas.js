import { z } from "zod";

const lineSchema = z.object({
  component_id: z.coerce.number().int().positive(),

  quantity: z.coerce.number().positive(),

  unit: z.string().min(1),
});

const essenceSchema = z.object({
  quantity: z.coerce.number().positive(),

  unit: z.string().min(1),
});

export const previewFormulaSchema = z.object({
  essence: essenceSchema,

  components: z.array(lineSchema).default([]),
});

export const createFormulaSchema = z.object({
  name: z.string().min(1),

  container_id: z.coerce.number().int().positive().optional(),

  wholesale_price: z.coerce.number().nonnegative().optional(),

  consumer_price: z.coerce.number().nonnegative().optional(),

  essence: essenceSchema,

  components: z.array(lineSchema).default([]),
});

export const deleteFormulaSchema = z.object({
  id_formula: z.coerce.number().min(1, "Id is required"),
});

export const ListFormulaSchema = z.object({
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(10),
  name: z.string().optional(),
  quantity: z.string().optional(),
});

export const ListFormulaSchemalocation = z.object({
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(10),
  name: z.string().optional(),
  quantity: z.string().optional(),
  id: z.string().optional(),
});
//FORMULA COMPONENTS

export const retrieveFormulaComponentsSchema = z.object({
  id: z.coerce.number(),
});
