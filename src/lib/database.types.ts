export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          nickname: string;
          taste_badges: string[];
          avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          nickname: string;
          taste_badges?: string[];
          avatar_url?: string | null;
          created_at?: string;
        };
        Update: {
          nickname?: string;
          taste_badges?: string[];
          avatar_url?: string | null;
        };
      };
      profile_private: {
        Row: {
          id: string;
          birthdate: string | null;
          gender: string | null;
          prefecture: string | null;
          city: string | null;
        };
        Insert: {
          id: string;
          birthdate?: string | null;
          gender?: string | null;
          prefecture?: string | null;
          city?: string | null;
        };
        Update: {
          gender?: string | null;
          prefecture?: string | null;
          city?: string | null;
        };
      };
      profile_admin_only: {
        Row: {
          id: string;
          full_name: string | null;
        };
        Insert: {
          id: string;
          full_name?: string | null;
        };
        Update: Record<string, never>;
      };
      condiments: {
        Row: {
          id: string;
          name: string;
          category: string;
          description: string;
          origin: string;
          recommended_dishes: string[];
          repeat_rating: number;
          purchase_location: string;
          taste_profile: Json;
          image_url: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          category: string;
          description: string;
          origin: string;
          recommended_dishes?: string[];
          repeat_rating: number;
          purchase_location: string;
          taste_profile: Json;
          image_url: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          name?: string;
          category?: string;
          description?: string;
          origin?: string;
          recommended_dishes?: string[];
          repeat_rating?: number;
          purchase_location?: string;
          taste_profile?: Json;
          image_url?: string;
        };
      };
      likes: {
        Row: { id: string; user_id: string; condiment_id: string; created_at: string };
        Insert: { id?: string; user_id: string; condiment_id: string; created_at?: string };
        Update: Record<string, never>;
      };
      bookmarks: {
        Row: { id: string; user_id: string; condiment_id: string; created_at: string };
        Insert: { id?: string; user_id: string; condiment_id: string; created_at?: string };
        Update: Record<string, never>;
      };
      comments: {
        Row: {
          id: string;
          condiment_id: string;
          user_id: string;
          parent_id: string | null;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          condiment_id: string;
          user_id: string;
          parent_id?: string | null;
          content: string;
          created_at?: string;
        };
        Update: { content?: string };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: 'like' | 'comment' | 'reply';
          actor_id: string;
          condiment_id: string | null;
          comment_id: string | null;
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: 'like' | 'comment' | 'reply';
          actor_id: string;
          condiment_id?: string | null;
          comment_id?: string | null;
          read?: boolean;
          created_at?: string;
        };
        Update: { read?: boolean };
      };
      inquiries: {
        Row: {
          id: string;
          name: string;
          email: string;
          subject: string;
          message: string;
          user_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          subject: string;
          message: string;
          user_id?: string | null;
          created_at?: string;
        };
        Update: Record<string, never>;
      };
    };
  };
}
