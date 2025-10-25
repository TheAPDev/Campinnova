import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yvvggswbkmqznlquompi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2dmdnc3dia21xem5scXVvbXBpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0MTQ3ODcsImV4cCI6MjA3Njk5MDc4N30.Ra7N8D4tpZYf-ggT3HXNrryUlBbSYk6Q2FQ_pqbgM4Q';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  name: string;
  email: string;
  created_at: string;
};

export type Counsellor = {
  id: string;
  user_id: string | null;
  name: string;
  email: string;
  phone: string;
  year: string;
  cause: string;
  assistance_types: string[];
  people_connected: number;
  reviews: string[];
  available_slots: string[];
  status: string;
  created_at: string;
};

export type Group = {
  id: string;
  name: string;
  type: string;
  icon: string;
  creator_id: string;
  member_count: number;
  created_at: string;
};

export type Booking = {
  id: string;
  counsellor_id: string;
  user_id: string;
  slot: string;
  status: string;
  created_at: string;
};
