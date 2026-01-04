export type JobStatus = 'pending' | 'processing' | 'sent' | 'failed' | 'cancelled';

export type UserRole = 'admin' | 'operator' | 'viewer';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Ship {
  id: string;
  name: string;
  imo_number: string | null;
  default_email: string;
  vessel_type: string | null;
  flag_country: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ScheduledJob {
  id: string;
  user_id: string;
  ship_id: string | null;
  ship_name: string;
  target_email: string;
  subject: string;
  message: string | null;
  file_path: string;
  file_name: string;
  file_size: number | null;
  scheduled_time: string;
  timezone: string;
  status: JobStatus;
  sent_at: string | null;
  error_log: string | null;
  retry_count: number;
  created_at: string;
  updated_at: string;
}

// Extended types with relations
export interface ScheduledJobWithShip extends ScheduledJob {
  ship?: Ship;
}

// Form types
export interface CreateShipInput {
  name: string;
  imo_number?: string;
  default_email: string;
  vessel_type?: string;
  flag_country?: string;
  notes?: string;
}

export interface CreateJobInput {
  ship_id?: string;
  ship_name: string;
  target_email: string;
  subject: string;
  message?: string;
  file: File;
  scheduled_time: Date;
  timezone: string;
}

// Stats types
export interface DashboardStats {
  pending: number;
  sentToday: number;
  failed: number;
}

// API response types
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

// Port types (Liman bazlı email sistemi)
export interface Port {
  id: string;
  name: string;
  email_subject: string;
  email_body: string;
  recipient_email: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface PortAttachment {
  id: string;
  port_id: string;
  file_path: string;
  file_name: string;
  file_size: number | null;
  file_type: string | null;
  created_at: string;
}

export interface PortWithAttachments extends Port {
  attachments: PortAttachment[];
}

export interface CreatePortInput {
  name: string;
  email_subject: string;
  email_body: string;
  recipient_email?: string;
}
