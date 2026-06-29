import { z } from "zod";

export const createFormulaSchema = z.object({
  name: z.string().min(1),

  quantity: z.coerce.number().positive(),

  container_id: z.coerce.number().optional(),

  components: z
    .array(
      z.object({
        component_id: z.coerce.number(),

        quantity: z.coerce.number().positive(),

        unit: z.string().min(1),
      }),
    )
    .min(1, "At least one component is required"),
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
