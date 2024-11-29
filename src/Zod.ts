import { z } from "zod";

// Schema for User Signup validation
export const UserSchema = z.object({
  email: z.string().email(),
  user: z.string(),
  password: z.string().min(8).max(50),
});

// Schema for User Signin validation
export const SigninSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(50),
});
