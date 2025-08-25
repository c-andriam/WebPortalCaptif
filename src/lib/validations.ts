import { z } from 'zod'

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email('error.invalidEmail'),
  password: z.string().min(1, 'error.required'),
})

export const registerSchema = z.object({
  email: z.string().email('error.invalidEmail'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  first_name: z.string().min(1, 'error.required'),
  last_name: z.string().min(1, 'error.required'),
  phone: z.string().optional(),
  password: z.string()
    .min(12, 'error.passwordTooShort')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/, 'Password must contain uppercase, lowercase, number and special character'),
  password_confirm: z.string(),
}).refine((data) => data.password === data.password_confirm, {
  message: 'error.passwordMismatch',
  path: ['password_confirm'],
})

export const voucherLoginSchema = z.object({
  code: z.string().length(8, 'Voucher code must be exactly 8 characters'),
})

export const forgotPasswordSchema = z.object({
  email: z.string().email('error.invalidEmail'),
})

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'error.required'),
  password: z.string().min(12, 'error.passwordTooShort'),
  password_confirm: z.string(),
}).refine((data) => data.password === data.password_confirm, {
  message: 'error.passwordMismatch',
  path: ['password_confirm'],
})

// Profile schemas
export const profileUpdateSchema = z.object({
  first_name: z.string().min(1, 'error.required'),
  last_name: z.string().min(1, 'error.required'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('error.invalidEmail'),
  phone: z.string().optional(),
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'error.required'),
  newPassword: z.string().min(12, 'error.passwordTooShort'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'error.passwordMismatch',
  path: ['confirmPassword'],
})

// Device schemas
export const deviceSchema = z.object({
  name: z.string().min(1, 'error.required'),
  mac_address: z.string().regex(/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/, 'Invalid MAC address format'),
})

// Voucher schemas
export const voucherCreateSchema = z.object({
  plan: z.string().min(1, 'error.required'),
  valid_from: z.string().min(1, 'error.required'),
  valid_until: z.string().min(1, 'error.required'),
  max_uses: z.number().min(1, 'Must be at least 1'),
})

// Task schemas
export const taskSchema = z.object({
  title: z.string().min(1, 'error.required'),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  status: z.enum(['todo', 'in-progress', 'review', 'done']),
  assignee: z.string().optional(),
  dueDate: z.string().optional(),
  labels: z.array(z.string()).optional(),
})

// Note schemas
export const noteSchema = z.object({
  title: z.string().min(1, 'error.required'),
  content: z.string().min(1, 'error.required'),
  category: z.string().min(1, 'error.required'),
  color: z.string().optional(),
  isPinned: z.boolean().optional(),
  isFavorite: z.boolean().optional(),
})

// Contact schemas
export const contactSchema = z.object({
  name: z.string().min(1, 'error.required'),
  email: z.string().email('error.invalidEmail'),
  phone: z.string().min(1, 'error.required'),
  company: z.string().min(1, 'error.required'),
  role: z.string().min(1, 'error.required'),
  category: z.enum(['client', 'fournisseur', 'interne', 'support']),
})

// Event schemas
export const eventSchema = z.object({
  title: z.string().min(1, 'error.required'),
  date: z.string().min(1, 'error.required'),
  time: z.string().min(1, 'error.required'),
  type: z.enum(['maintenance', 'meeting', 'deadline', 'reminder']),
  attendees: z.number().optional(),
})

export type LoginFormData = z.infer<typeof loginSchema>
export type RegisterFormData = z.infer<typeof registerSchema>
export type VoucherLoginFormData = z.infer<typeof voucherLoginSchema>
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>
export type ProfileUpdateFormData = z.infer<typeof profileUpdateSchema>
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>
export type DeviceFormData = z.infer<typeof deviceSchema>
export type VoucherCreateFormData = z.infer<typeof voucherCreateSchema>
export type TaskFormData = z.infer<typeof taskSchema>
export type NoteFormData = z.infer<typeof noteSchema>
export type ContactFormData = z.infer<typeof contactSchema>
export type EventFormData = z.infer<typeof eventSchema>