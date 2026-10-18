export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      blog_posts: {
        Row: {
          author_id: string | null
          category: string | null
          content_en: string | null
          content_es: string | null
          created_at: string
          excerpt_en: string | null
          excerpt_es: string | null
          id: string
          image_url: string | null
          meta_description: string | null
          meta_title: string | null
          published: boolean | null
          published_at: string | null
          slug: string
          title_en: string
          title_es: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          category?: string | null
          content_en?: string | null
          content_es?: string | null
          created_at?: string
          excerpt_en?: string | null
          excerpt_es?: string | null
          id?: string
          image_url?: string | null
          meta_description?: string | null
          meta_title?: string | null
          published?: boolean | null
          published_at?: string | null
          slug: string
          title_en: string
          title_es: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          category?: string | null
          content_en?: string | null
          content_es?: string | null
          created_at?: string
          excerpt_en?: string | null
          excerpt_es?: string | null
          id?: string
          image_url?: string | null
          meta_description?: string | null
          meta_title?: string | null
          published?: boolean | null
          published_at?: string | null
          slug?: string
          title_en?: string
          title_es?: string
          updated_at?: string
        }
        Relationships: []
      }
      bookings: {
        Row: {
          adults: number
          card_fee: number | null
          children: number
          created_at: string
          customer_email: string
          customer_name: string
          customer_phone: string | null
          dates: string[]
          document_number: string | null
          document_type: string | null
          id: string
          notes: string | null
          payment_currency: string | null
          payment_method: string
          payment_mode: string
          status: string
          total_amount: number
          tour_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          adults?: number
          card_fee?: number | null
          children?: number
          created_at?: string
          customer_email: string
          customer_name: string
          customer_phone?: string | null
          dates?: string[]
          document_number?: string | null
          document_type?: string | null
          id?: string
          notes?: string | null
          payment_currency?: string | null
          payment_method?: string
          payment_mode?: string
          status?: string
          total_amount?: number
          tour_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          adults?: number
          card_fee?: number | null
          children?: number
          created_at?: string
          customer_email?: string
          customer_name?: string
          customer_phone?: string | null
          dates?: string[]
          document_number?: string | null
          document_type?: string | null
          id?: string
          notes?: string | null
          payment_currency?: string | null
          payment_method?: string
          payment_mode?: string
          status?: string
          total_amount?: number
          tour_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_tour_id_fkey"
            columns: ["tour_id"]
            isOneToOne: false
            referencedRelation: "tours"
            referencedColumns: ["id"]
          },
        ]
      }
      corporate_requests: {
        Row: {
          company_name: string
          contact_person: string
          created_at: string
          email: string
          group_size: number | null
          id: string
          notes: string | null
          phone: string | null
          requested_dates: string | null
          status: string
          updated_at: string
        }
        Insert: {
          company_name: string
          contact_person: string
          created_at?: string
          email: string
          group_size?: number | null
          id?: string
          notes?: string | null
          phone?: string | null
          requested_dates?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          company_name?: string
          contact_person?: string
          created_at?: string
          email?: string
          group_size?: number | null
          id?: string
          notes?: string | null
          phone?: string | null
          requested_dates?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      exchange_rates: {
        Row: {
          currency_pair: string
          id: string
          rate: number
          updated_at: string | null
        }
        Insert: {
          currency_pair?: string
          id?: string
          rate: number
          updated_at?: string | null
        }
        Update: {
          currency_pair?: string
          id?: string
          rate?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          document_number: string | null
          document_type: string | null
          full_name: string | null
          id: string
          phone: string | null
          requires_password_change: boolean | null
          role: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          document_number?: string | null
          document_type?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          requires_password_change?: boolean | null
          role?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          document_number?: string | null
          document_type?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          requires_password_change?: boolean | null
          role?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      seasonal_config: {
        Row: {
          current_season: string
          id: string
          mode: string
          override_active: boolean | null
          updated_at: string
        }
        Insert: {
          current_season?: string
          id?: string
          mode?: string
          override_active?: boolean | null
          updated_at?: string
        }
        Update: {
          current_season?: string
          id?: string
          mode?: string
          override_active?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      tours: {
        Row: {
          base_price: number
          category: string
          child_price: number | null
          created_at: string
          current_bookings: number
          description_en: string | null
          description_es: string | null
          duration: string | null
          dynamic_pricing: boolean | null
          id: string
          image_url: string | null
          images: string[] | null
          included_items: Json | null
          is_season_featured: boolean | null
          itinerary: Json | null
          max_capacity: number
          premium: boolean | null
          requires_quote: boolean | null
          season: string
          slug: string
          title_en: string
          title_es: string
          updated_at: string
          video_url: string | null
          visible: boolean | null
        }
        Insert: {
          base_price?: number
          category?: string
          child_price?: number | null
          created_at?: string
          current_bookings?: number
          description_en?: string | null
          description_es?: string | null
          duration?: string | null
          dynamic_pricing?: boolean | null
          id?: string
          image_url?: string | null
          images?: string[] | null
          included_items?: Json | null
          is_season_featured?: boolean | null
          itinerary?: Json | null
          max_capacity?: number
          premium?: boolean | null
          requires_quote?: boolean | null
          season?: string
          slug: string
          title_en: string
          title_es: string
          updated_at?: string
          video_url?: string | null
          visible?: boolean | null
        }
        Update: {
          base_price?: number
          category?: string
          child_price?: number | null
          created_at?: string
          current_bookings?: number
          description_en?: string | null
          description_es?: string | null
          duration?: string | null
          dynamic_pricing?: boolean | null
          id?: string
          image_url?: string | null
          images?: string[] | null
          included_items?: Json | null
          is_season_featured?: boolean | null
          itinerary?: Json | null
          max_capacity?: number
          premium?: boolean | null
          requires_quote?: boolean | null
          season?: string
          slug?: string
          title_en?: string
          title_es?: string
          updated_at?: string
          video_url?: string | null
          visible?: boolean | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_booking_transaction: {
        Args: {
          p_adults: number
          p_children: number
          p_customer_email: string
          p_customer_name: string
          p_customer_phone: string
          p_dates: string[]
          p_document_number: string
          p_document_type: string
          p_notes: string
          p_payment_method: string
          p_payment_mode: string
          p_total_amount: number
          p_tour_id: string
          p_user_id: string
        }
        Returns: Json
      }
      get_customer_pending_bookings: {
        Args: { p_email: string }
        Returns: Json
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
