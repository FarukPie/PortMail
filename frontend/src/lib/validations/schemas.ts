import { z } from 'zod';

// Ship validation schema
export const shipSchema = z.object({
    name: z.string().min(2, 'Ship name must be at least 2 characters'),
    imo_number: z.string().optional(),
    default_email: z.string().email('Invalid email address'),
    vessel_type: z.string().optional(),
    flag_country: z.string().optional(),
    notes: z.string().optional(),
});

export type ShipFormData = z.infer<typeof shipSchema>;

// Schedule job validation schema
export const scheduleJobSchema = z.object({
    ship_id: z.string().optional(),
    ship_name: z.string().min(2, 'Ship name is required'),
    target_email: z.string().email('Invalid email address'),
    subject: z.string().min(1, 'Subject is required').max(200, 'Subject is too long'),
    message: z.string().optional(),
    scheduled_date: z.date({ message: 'Please select a date' }),
    scheduled_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
    timezone: z.string().min(1, 'Timezone is required'),
});

export type ScheduleJobFormData = z.infer<typeof scheduleJobSchema>;

// Login validation schema
export const loginSchema = z.object({
    email: z.string().email('Please enter a valid email'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

// Signup validation schema
export const signupSchema = z.object({
    email: z.string().email('Please enter a valid email'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
    fullName: z.string().min(2, 'Full name is required'),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
});

export type SignupFormData = z.infer<typeof signupSchema>;
