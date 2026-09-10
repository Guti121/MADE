import z from 'zod'

// for Register. `role` is NOT accepted from the client — it is forced to
// "owner" server-side in UserModel.createUser.
export const userSchema = z.object({
  name: z.string().min(1, 'The name is required'),
  lastname: z.string().min(1, 'The lastname is required'),
  email: z.string().email('Invalid Email'),
  password: z.string().min(10, 'Minimum 10 characters')
})

// for login
export const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required')
})
