import z from "zod";

//for Register
export const userSchema = z.object({
  name: z.string().min(1, "The name is required"),
  lastname: z.string().min(1, "The lastname is required"),
  email: z.string().email("Invalid Email"),
  password: z.string().min(6, "Minimum 6 characters"),
  location_id: z.number().nullable().optional(),
  role: z.enum(["admin", "owner", "client"]),
});

//for login
export const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password is required"),
});
