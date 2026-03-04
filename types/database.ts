
export interface Major {
  id: string;
  name: string;
  short_name: string;
  created_at: string;
}

export interface Class {
  id: string;
  major_id: string;
  name: string;
  display_name: string;
  theme_id: string;
  created_at: string;
  major?: Major;
}

export interface User {
  id: string;
  name: string;
  username: string;
  role: 'ADMIN' | 'USER';
  is_unlocked: boolean;
  class_id?: string;
  absent_no?: number;
  is_super_admin?: boolean;
  created_at: string;
  class?: Class;
}
