import { z } from 'zod'

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email('Adresse e-mail invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
})

export const registerSchema = z.object({
  email: z.string().email('Adresse e-mail invalide'),
  username: z.string().min(3, 'Le nom d\'utilisateur doit contenir au moins 3 caractères'),
  first_name: z.string().min(1, 'Prénom requis'),
  last_name: z.string().min(1, 'Nom requis'),
  phone: z.string().optional(),
  password: z.string()
    .min(12, 'Le mot de passe doit contenir au moins 12 caractères')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/, 'Le mot de passe doit contenir majuscule, minuscule, chiffre et caractère spécial'),
  password_confirm: z.string(),
}).refine((data) => data.password === data.password_confirm, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['password_confirm'],
})

export const voucherLoginSchema = z.object({
  code: z.string().length(8, 'Le code invité doit contenir exactement 8 caractères'),
})

export const forgotPasswordSchema = z.object({
  email: z.string().email('Adresse e-mail invalide'),
})

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token requis'),
  password: z.string().min(12, 'Le mot de passe doit contenir au moins 12 caractères'),
  password_confirm: z.string(),
}).refine((data) => data.password === data.password_confirm, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['password_confirm'],
})

// Profile schemas
export const profileUpdateSchema = z.object({
  first_name: z.string().min(1, 'Prénom requis'),
  last_name: z.string().min(1, 'Nom requis'),
  username: z.string().min(3, 'Le nom d\'utilisateur doit contenir au moins 3 caractères'),
  email: z.string().email('Adresse e-mail invalide'),
  phone: z.string().optional(),
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Mot de passe actuel requis'),
  newPassword: z.string().min(12, 'Le nouveau mot de passe doit contenir au moins 12 caractères'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
})

// Device schemas
export const deviceSchema = z.object({
  name: z.string().min(1, 'Nom requis'),
  mac_address: z.string().regex(/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/, 'Format d\'adresse MAC invalide'),
})

// Voucher schemas
export const voucherCreateSchema = z.object({
  plan: z.string().min(1, 'Plan requis'),
  valid_from: z.string().min(1, 'Date de début requise'),
  valid_until: z.string().min(1, 'Date de fin requise'),
  max_uses: z.number().min(1, 'Doit être au moins 1'),
})

// Task schemas
export const taskSchema = z.object({
  title: z.string().min(1, 'Titre requis'),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  status: z.enum(['todo', 'in-progress', 'review', 'done']),
  assignee: z.string().optional(),
  dueDate: z.string().optional(),
  labels: z.array(z.string()).optional(),
})

// Note schemas
export const noteSchema = z.object({
  title: z.string().min(1, 'Titre requis'),
  content: z.string().min(1, 'Contenu requis'),
  category: z.string().min(1, 'Catégorie requise'),
  color: z.string().optional(),
  isPinned: z.boolean().optional(),
  isFavorite: z.boolean().optional(),
})

// Contact schemas
export const contactSchema = z.object({
  name: z.string().min(1, 'Nom requis'),
  email: z.string().email('Adresse e-mail invalide'),
  phone: z.string().min(1, 'Téléphone requis'),
  company: z.string().min(1, 'Entreprise requise'),
  role: z.string().min(1, 'Rôle requis'),
  category: z.enum(['client', 'fournisseur', 'interne', 'support']),
})

// Event schemas
export const eventSchema = z.object({
  title: z.string().min(1, 'Titre requis'),
  date: z.string().min(1, 'Date requise'),
  time: z.string().min(1, 'Heure requise'),
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