import z from 'zod'

// type_components is a global, seed-managed catalog: only listing is exposed.
export const ListTypeComponentSchema = z.object({
  page: z.coerce.number().int().positive().max(100000).default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  name: z.string().optional()
})
