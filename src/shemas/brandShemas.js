import z from 'zod'

export const brandSchema = z.object({
  name: z.string().min(2, 'Name must have at least 2 characters'),
  weight: z.boolean()
})

export const updateBrandSchema = z.object({
  name: z.string().min(2).optional(),
  weight: z.boolean().optional()
})
