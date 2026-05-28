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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string
          created_at: string
          entity: string | null
          entity_id: string | null
          id: string
          meta: Json
          municipality_id: string | null
          user_email: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          entity?: string | null
          entity_id?: string | null
          id?: string
          meta?: Json
          municipality_id?: string | null
          user_email?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          entity?: string | null
          entity_id?: string | null
          id?: string
          meta?: Json
          municipality_id?: string | null
          user_email?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_municipality_id_fkey"
            columns: ["municipality_id"]
            isOneToOne: false
            referencedRelation: "municipalities"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_reports: {
        Row: {
          body: Json
          created_at: string
          created_by: string | null
          id: string
          municipality_id: string | null
          period: string | null
          title: string
          updated_at: string
        }
        Insert: {
          body?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          municipality_id?: string | null
          period?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          body?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          municipality_id?: string | null
          period?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "analytics_reports_municipality_id_fkey"
            columns: ["municipality_id"]
            isOneToOne: false
            referencedRelation: "municipalities"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          audience: string
          color: Database["public"]["Enums"]["banner_color"]
          created_at: string
          cta_label: string | null
          cta_to: string | null
          description: string
          enabled: boolean
          id: string
          image_url: string | null
          municipality_id: string | null
          order_index: number
          tags: string[]
          title: string
          updated_at: string
        }
        Insert: {
          audience?: string
          color?: Database["public"]["Enums"]["banner_color"]
          created_at?: string
          cta_label?: string | null
          cta_to?: string | null
          description: string
          enabled?: boolean
          id?: string
          image_url?: string | null
          municipality_id?: string | null
          order_index?: number
          tags?: string[]
          title: string
          updated_at?: string
        }
        Update: {
          audience?: string
          color?: Database["public"]["Enums"]["banner_color"]
          created_at?: string
          cta_label?: string | null
          cta_to?: string | null
          description?: string
          enabled?: boolean
          id?: string
          image_url?: string | null
          municipality_id?: string | null
          order_index?: number
          tags?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_municipality_id_fkey"
            columns: ["municipality_id"]
            isOneToOne: false
            referencedRelation: "municipalities"
            referencedColumns: ["id"]
          },
        ]
      }
      businesses: {
        Row: {
          address: string | null
          created_at: string
          cuit: string | null
          enabled: boolean
          id: string
          municipality_id: string | null
          name: string
          owner_id: string | null
          photo_url: string | null
          price: number | null
          schedule: string | null
          tax_amount: number | null
          tax_expires_at: string | null
          type: string | null
          updated_at: string
          zone: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          cuit?: string | null
          enabled?: boolean
          id?: string
          municipality_id?: string | null
          name: string
          owner_id?: string | null
          photo_url?: string | null
          price?: number | null
          schedule?: string | null
          tax_amount?: number | null
          tax_expires_at?: string | null
          type?: string | null
          updated_at?: string
          zone?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          cuit?: string | null
          enabled?: boolean
          id?: string
          municipality_id?: string | null
          name?: string
          owner_id?: string | null
          photo_url?: string | null
          price?: number | null
          schedule?: string | null
          tax_amount?: number | null
          tax_expires_at?: string | null
          type?: string | null
          updated_at?: string
          zone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "businesses_municipality_id_fkey"
            columns: ["municipality_id"]
            isOneToOne: false
            referencedRelation: "municipalities"
            referencedColumns: ["id"]
          },
        ]
      }
      claim_canned_responses: {
        Row: {
          body: string
          created_at: string
          enabled: boolean
          id: string
          label: string
        }
        Insert: {
          body: string
          created_at?: string
          enabled?: boolean
          id?: string
          label: string
        }
        Update: {
          body?: string
          created_at?: string
          enabled?: boolean
          id?: string
          label?: string
        }
        Relationships: []
      }
      claims: {
        Row: {
          address: string | null
          area: string | null
          category: string
          created_at: string
          description: string | null
          evidence_photos: string[] | null
          id: string
          municipality_id: string | null
          rating: number | null
          resolution_note: string | null
          resolution_photos: string[] | null
          resolved_at: string | null
          resolved_by: string | null
          status: Database["public"]["Enums"]["claim_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          area?: string | null
          category: string
          created_at?: string
          description?: string | null
          evidence_photos?: string[] | null
          id?: string
          municipality_id?: string | null
          rating?: number | null
          resolution_note?: string | null
          resolution_photos?: string[] | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["claim_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          area?: string | null
          category?: string
          created_at?: string
          description?: string | null
          evidence_photos?: string[] | null
          id?: string
          municipality_id?: string | null
          rating?: number | null
          resolution_note?: string | null
          resolution_photos?: string[] | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["claim_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "claims_municipality_id_fkey"
            columns: ["municipality_id"]
            isOneToOne: false
            referencedRelation: "municipalities"
            referencedColumns: ["id"]
          },
        ]
      }
      content_items: {
        Row: {
          area: string
          created_at: string
          created_by: string | null
          days: string | null
          description: string | null
          id: string
          kind: string
          municipality_id: string | null
          photo_url: string | null
          price: number | null
          published: boolean
          schedule: string | null
          title: string
          updated_at: string
        }
        Insert: {
          area: string
          created_at?: string
          created_by?: string | null
          days?: string | null
          description?: string | null
          id?: string
          kind: string
          municipality_id?: string | null
          photo_url?: string | null
          price?: number | null
          published?: boolean
          schedule?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          area?: string
          created_at?: string
          created_by?: string | null
          days?: string | null
          description?: string | null
          id?: string
          kind?: string
          municipality_id?: string | null
          photo_url?: string | null
          price?: number | null
          published?: boolean
          schedule?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      internal_announcements: {
        Row: {
          created_at: string
          id: string
          message: string
          municipality_id: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          municipality_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          municipality_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "internal_announcements_municipality_id_fkey"
            columns: ["municipality_id"]
            isOneToOne: false
            referencedRelation: "municipalities"
            referencedColumns: ["id"]
          },
        ]
      }
      isa_metrics: {
        Row: {
          asistentes_eventos: number | null
          created_at: string
          eventos_cultura: number | null
          eventos_deporte: number | null
          id: string
          municipality_id: string | null
          notes: string | null
          period: string
          poblacion: number | null
          reclamos_pendientes: number | null
          reclamos_resueltos: number | null
          updated_at: string
          updated_by: string | null
          vecinos_activos: number | null
        }
        Insert: {
          asistentes_eventos?: number | null
          created_at?: string
          eventos_cultura?: number | null
          eventos_deporte?: number | null
          id?: string
          municipality_id?: string | null
          notes?: string | null
          period: string
          poblacion?: number | null
          reclamos_pendientes?: number | null
          reclamos_resueltos?: number | null
          updated_at?: string
          updated_by?: string | null
          vecinos_activos?: number | null
        }
        Update: {
          asistentes_eventos?: number | null
          created_at?: string
          eventos_cultura?: number | null
          eventos_deporte?: number | null
          id?: string
          municipality_id?: string | null
          notes?: string | null
          period?: string
          poblacion?: number | null
          reclamos_pendientes?: number | null
          reclamos_resueltos?: number | null
          updated_at?: string
          updated_by?: string | null
          vecinos_activos?: number | null
        }
        Relationships: []
      }
      municipal_invitations: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          area: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string | null
          invited_by_email: string | null
          municipality_id: string | null
          role: Database["public"]["Enums"]["app_role"]
          status: string
          token: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          area?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          invited_by_email?: string | null
          municipality_id?: string | null
          role: Database["public"]["Enums"]["app_role"]
          status?: string
          token?: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          area?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          invited_by_email?: string | null
          municipality_id?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          status?: string
          token?: string
          updated_at?: string
        }
        Relationships: []
      }
      municipal_settings: {
        Row: {
          contact_email: string | null
          created_at: string
          emergency_phone: string | null
          id: string
          mayor_name: string | null
          municipality_id: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          contact_email?: string | null
          created_at?: string
          emergency_phone?: string | null
          id?: string
          mayor_name?: string | null
          municipality_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          contact_email?: string | null
          created_at?: string
          emergency_phone?: string | null
          id?: string
          mayor_name?: string | null
          municipality_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "municipal_settings_municipality_id_fkey"
            columns: ["municipality_id"]
            isOneToOne: false
            referencedRelation: "municipalities"
            referencedColumns: ["id"]
          },
        ]
      }
      municipalities: {
        Row: {
          created_at: string
          enabled: boolean
          id: string
          is_default: boolean
          name: string
          province: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          id?: string
          is_default?: boolean
          name: string
          province?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          id?: string
          is_default?: boolean
          name?: string
          province?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      notification_reads: {
        Row: {
          notification_id: string
          read_at: string
          user_id: string
        }
        Insert: {
          notification_id: string
          read_at?: string
          user_id: string
        }
        Update: {
          notification_id?: string
          read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_reads_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          audience: string
          body: string
          created_at: string
          id: string
          link: string | null
          municipality_id: string | null
          source_id: string | null
          source_type: string | null
          title: string
          user_id: string | null
        }
        Insert: {
          audience?: string
          body?: string
          created_at?: string
          id?: string
          link?: string | null
          municipality_id?: string | null
          source_id?: string | null
          source_type?: string | null
          title: string
          user_id?: string | null
        }
        Update: {
          audience?: string
          body?: string
          created_at?: string
          id?: string
          link?: string | null
          municipality_id?: string | null
          source_id?: string | null
          source_type?: string | null
          title?: string
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          created_at: string
          cuit: string | null
          dni: string | null
          email: string | null
          full_name: string | null
          id: string
          municipality_id: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          created_at?: string
          cuit?: string | null
          dni?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          municipality_id?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          created_at?: string
          cuit?: string | null
          dni?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          municipality_id?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_municipality_id_fkey"
            columns: ["municipality_id"]
            isOneToOne: false
            referencedRelation: "municipalities"
            referencedColumns: ["id"]
          },
        ]
      }
      registrations: {
        Row: {
          companions: string[]
          created_at: string
          event_date: string | null
          event_id: string
          event_place: string | null
          event_title: string
          event_type: string | null
          guest_city: string | null
          guest_country: string | null
          guest_email: string | null
          guest_name: string | null
          id: string
          municipality_id: string | null
          people_count: number
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          companions?: string[]
          created_at?: string
          event_date?: string | null
          event_id: string
          event_place?: string | null
          event_title: string
          event_type?: string | null
          guest_city?: string | null
          guest_country?: string | null
          guest_email?: string | null
          guest_name?: string | null
          id?: string
          municipality_id?: string | null
          people_count?: number
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          companions?: string[]
          created_at?: string
          event_date?: string | null
          event_id?: string
          event_place?: string | null
          event_title?: string
          event_type?: string | null
          guest_city?: string | null
          guest_country?: string | null
          guest_email?: string | null
          guest_name?: string | null
          id?: string
          municipality_id?: string | null
          people_count?: number
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      staff_announcements: {
        Row: {
          body: string
          created_at: string
          created_by: string | null
          id: string
          municipality_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          body: string
          created_at?: string
          created_by?: string | null
          id?: string
          municipality_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          created_by?: string | null
          id?: string
          municipality_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      tourism_items: {
        Row: {
          business_id: string | null
          category: string
          created_at: string
          created_by: string | null
          description: string | null
          featured: boolean
          id: string
          lat: number | null
          lng: number | null
          location: string | null
          municipality_id: string | null
          photo_url: string | null
          published: boolean
          title: string
          updated_at: string
        }
        Insert: {
          business_id?: string | null
          category: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          featured?: boolean
          id?: string
          lat?: number | null
          lng?: number | null
          location?: string | null
          municipality_id?: string | null
          photo_url?: string | null
          published?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          business_id?: string | null
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          featured?: boolean
          id?: string
          lat?: number | null
          lng?: number | null
          location?: string | null
          municipality_id?: string | null
          photo_url?: string | null
          published?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tourism_items_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      tourist_favorites: {
        Row: {
          created_at: string
          id: string
          municipality_id: string | null
          place_id: string
          place_name: string
          place_photo_url: string | null
          place_type: string | null
          place_zone: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          municipality_id?: string | null
          place_id: string
          place_name: string
          place_photo_url?: string | null
          place_type?: string | null
          place_zone?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          municipality_id?: string | null
          place_id?: string
          place_name?: string
          place_photo_url?: string | null
          place_type?: string | null
          place_zone?: string | null
          user_id?: string
        }
        Relationships: []
      }
      tourist_leads: {
        Row: {
          created_at: string
          email: string | null
          id: string
          meta: Json | null
          municipality_id: string | null
          name: string
          origin: string
          source: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          meta?: Json | null
          municipality_id?: string | null
          name: string
          origin: string
          source?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          meta?: Json | null
          municipality_id?: string | null
          name?: string
          origin?: string
          source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tourist_leads_municipality_id_fkey"
            columns: ["municipality_id"]
            isOneToOne: false
            referencedRelation: "municipalities"
            referencedColumns: ["id"]
          },
        ]
      }
      tourist_ratings: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          municipality_id: string | null
          rating: number
          user_id: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          municipality_id?: string | null
          rating: number
          user_id?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          municipality_id?: string | null
          rating?: number
          user_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          active: boolean
          area: string | null
          created_at: string
          id: string
          municipality_id: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          active?: boolean
          area?: string | null
          created_at?: string
          id?: string
          municipality_id?: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          active?: boolean
          area?: string | null
          created_at?: string
          id?: string
          municipality_id?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_municipality_id_fkey"
            columns: ["municipality_id"]
            isOneToOne: false
            referencedRelation: "municipalities"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      profiles_public: {
        Row: {
          created_at: string | null
          full_name: string | null
          id: string | null
        }
        Insert: {
          created_at?: string | null
          full_name?: string | null
          id?: string | null
        }
        Update: {
          created_at?: string | null
          full_name?: string | null
          id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      current_user_area: { Args: never; Returns: string }
      default_municipality_id: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "tourist"
        | "resident"
        | "admin"
        | "area_manager"
        | "isa_consultant"
        | "merchant"
        | "isa_super_admin"
        | "tourism_chief"
        | "mayor"
      banner_color: "navy" | "red" | "emerald"
      claim_status: "Pendiente" | "En curso" | "Cerrado"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
      app_role: [
        "tourist",
        "resident",
        "admin",
        "area_manager",
        "isa_consultant",
        "merchant",
        "isa_super_admin",
        "tourism_chief",
        "mayor",
      ],
      banner_color: ["navy", "red", "emerald"],
      claim_status: ["Pendiente", "En curso", "Cerrado"],
    },
  },
} as const
