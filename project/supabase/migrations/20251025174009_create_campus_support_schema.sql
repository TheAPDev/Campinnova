/*
  # Campus Support Platform Schema

  ## Overview
  This migration creates the complete database schema for a mental health and campus support platform
  with authentication, counselling services, group communities, and booking functionality.

  ## New Tables

  ### 1. `profiles`
  - `id` (uuid, primary key) - References auth.users
  - `name` (text) - User's full name
  - `email` (text, unique) - University email
  - `created_at` (timestamptz) - Account creation timestamp
  
  ### 2. `counsellors`
  - `id` (uuid, primary key) - Auto-generated ID
  - `user_id` (uuid) - References profiles.id
  - `name` (text) - Counsellor name
  - `email` (text) - Contact email
  - `phone` (text) - Contact phone
  - `year` (text) - Academic year/experience
  - `cause` (text, optional) - Specialization/cause
  - `assistance_types` (text array) - Types: Emotional, Career
  - `people_connected` (integer) - Count of connections
  - `reviews` (text array) - User reviews
  - `available_slots` (text array) - Time slots
  - `status` (text) - pending, approved, rejected
  - `created_at` (timestamptz) - Application timestamp

  ### 3. `groups`
  - `id` (uuid, primary key) - Auto-generated ID
  - `name` (text) - Group name
  - `type` (text) - Friends, Study Group, UniClubs
  - `icon` (text) - Icon identifier or initials
  - `creator_id` (uuid) - References profiles.id
  - `member_count` (integer) - Number of members
  - `created_at` (timestamptz) - Creation timestamp

  ### 4. `group_members`
  - `id` (uuid, primary key) - Auto-generated ID
  - `group_id` (uuid) - References groups.id
  - `user_id` (uuid) - References profiles.id
  - `joined_at` (timestamptz) - Join timestamp

  ### 5. `bookings`
  - `id` (uuid, primary key) - Auto-generated ID
  - `counsellor_id` (uuid) - References counsellors.id
  - `user_id` (uuid) - References profiles.id
  - `slot` (text) - Booked time slot
  - `status` (text) - pending, confirmed, completed, cancelled
  - `created_at` (timestamptz) - Booking timestamp

  ## Security
  - Enable RLS on all tables
  - Users can read/update their own profile
  - Users can view approved counsellors
  - Users can apply to be counsellors and view their applications
  - Users can create groups and view groups they're members of
  - Users can join groups and manage memberships
  - Users can create bookings and view their own bookings

  ## Notes
  1. Demo data will be seeded for counsellors to showcase functionality
  2. Authentication handled via Supabase Auth with email/password
  3. All timestamps use timezone-aware format
  4. Array fields used for flexible data storage (assistance types, reviews, slots)
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create counsellors table
CREATE TABLE IF NOT EXISTS counsellors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  year text NOT NULL,
  cause text DEFAULT '',
  assistance_types text[] DEFAULT '{}',
  people_connected integer DEFAULT 0,
  reviews text[] DEFAULT '{}',
  available_slots text[] DEFAULT '{}',
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE counsellors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved counsellors"
  ON counsellors FOR SELECT
  TO authenticated
  USING (status = 'approved');

CREATE POLICY "Users can view own applications"
  ON counsellors FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can apply to be counsellors"
  ON counsellors FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own applications"
  ON counsellors FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create groups table
CREATE TABLE IF NOT EXISTS groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL,
  icon text DEFAULT '',
  creator_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  member_count integer DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

-- Create group_members table (must be created before groups RLS policies reference it)
CREATE TABLE IF NOT EXISTS group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES groups(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at timestamptz DEFAULT now(),
  UNIQUE(group_id, user_id)
);

-- Now enable RLS on groups
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view groups they are members of"
  ON groups FOR SELECT
  TO authenticated
  USING (
    creator_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = groups.id
      AND group_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create groups"
  ON groups FOR INSERT
  TO authenticated
  WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Group creators can update their groups"
  ON groups FOR UPDATE
  TO authenticated
  USING (creator_id = auth.uid())
  WITH CHECK (creator_id = auth.uid());

-- Enable RLS on group_members
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view memberships of their groups"
  ON group_members FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM groups
      WHERE groups.id = group_members.group_id
      AND (groups.creator_id = auth.uid() OR EXISTS (
        SELECT 1 FROM group_members gm2
        WHERE gm2.group_id = groups.id
        AND gm2.user_id = auth.uid()
      ))
    )
  );

CREATE POLICY "Users can join groups"
  ON group_members FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can leave groups"
  ON group_members FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  counsellor_id uuid REFERENCES counsellors(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  slot text NOT NULL,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Counsellors can view their bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM counsellors
      WHERE counsellors.id = bookings.counsellor_id
      AND counsellors.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create bookings"
  ON bookings FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own bookings"
  ON bookings FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Insert demo counsellors
INSERT INTO counsellors (name, email, phone, year, cause, assistance_types, people_connected, reviews, available_slots, status)
VALUES
  (
    'Dr. Sarah Mitchell',
    'sarah.mitchell@university.edu',
    '+1-555-0101',
    'Senior Counsellor - 8 years',
    'Anxiety, Depression, Academic Stress',
    ARRAY['Emotional', 'Career'],
    127,
    ARRAY['Extremely helpful and understanding!', 'Dr. Mitchell helped me through a difficult time.', 'Professional and caring approach.'],
    ARRAY['Mon 10:00-11:00', 'Mon 14:00-15:00', 'Wed 10:00-11:00', 'Wed 14:00-15:00', 'Fri 10:00-11:00'],
    'approved'
  ),
  (
    'James Rodriguez',
    'james.rodriguez@university.edu',
    '+1-555-0102',
    'Peer Counsellor - 2 years',
    'Career Guidance, Study Skills',
    ARRAY['Career'],
    83,
    ARRAY['Great advice for career planning!', 'Helped me find my path.', 'Very knowledgeable about industry trends.'],
    ARRAY['Tue 13:00-14:00', 'Tue 15:00-16:00', 'Thu 13:00-14:00', 'Thu 15:00-16:00'],
    'approved'
  ),
  (
    'Dr. Emily Chen',
    'emily.chen@university.edu',
    '+1-555-0103',
    'Clinical Psychologist - 10 years',
    'Trauma, Relationship Issues, Self-Esteem',
    ARRAY['Emotional'],
    201,
    ARRAY['Life-changing sessions.', 'Dr. Chen is incredibly empathetic.', 'The best counsellor I have worked with.', 'Highly recommend!'],
    ARRAY['Mon 11:00-12:00', 'Tue 11:00-12:00', 'Wed 11:00-12:00', 'Thu 11:00-12:00', 'Fri 11:00-12:00'],
    'approved'
  ),
  (
    'Michael Thompson',
    'michael.thompson@university.edu',
    '+1-555-0104',
    'Career Advisor - 5 years',
    'Internships, Resume Building, Interview Prep',
    ARRAY['Career'],
    156,
    ARRAY['Helped me land my dream internship!', 'Excellent resume feedback.', 'Very practical advice.'],
    ARRAY['Mon 09:00-10:00', 'Wed 09:00-10:00', 'Wed 16:00-17:00', 'Fri 09:00-10:00', 'Fri 16:00-17:00'],
    'approved'
  )
ON CONFLICT DO NOTHING;