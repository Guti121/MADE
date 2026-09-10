import { z } from 'zod'

export const locationSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  address: z.string().min(5, 'Address is required')
})

export const deleteLocationSchema = z.object({
  id: z.number().min(1, 'ID is required ')
})

export const updateLocationSchema = z.object({
  id: z.number().min(1, 'ID is required'),
  name: z.string().min(2, 'Name is required'),
  address: z.string().min(5, 'Address is required')
})
export const retrieveLocationSchema = z.object({
  id: z.coerce.number().min(1, 'ID is required')
})
