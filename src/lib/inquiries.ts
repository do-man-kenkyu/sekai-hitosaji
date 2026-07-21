import { supabase } from './supabase';

export interface Inquiry {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  userId: string | null;
  createdAt: string;
}

function rowToInquiry(row: any): Inquiry {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    subject: row.subject,
    message: row.message,
    userId: row.user_id,
    createdAt: row.created_at,
  };
}

export async function insertInquiry(inquiry: {
  name: string;
  email: string;
  subject: string;
  message: string;
  userId?: string;
}): Promise<void> {
  const { error } = await supabase.from('inquiries').insert({
    name: inquiry.name,
    email: inquiry.email,
    subject: inquiry.subject,
    message: inquiry.message,
    user_id: inquiry.userId ?? null,
  });
  if (error) throw error;
}

export async function fetchInquiries(): Promise<Inquiry[]> {
  const { data, error } = await supabase
    .from('inquiries')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(rowToInquiry);
}
