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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      assets: {
        Row: {
          asset_name: string
          asset_tag: string
          assigned_to: string | null
          category: string
          category_match_confidence: string | null
          condition: Database["public"]["Enums"]["asset_condition"] | null
          created_at: string | null
          current_value: number | null
          custom_fields: Json | null
          department: string | null
          id: string
          image_urls: string[] | null
          location_id: string | null
          manufacturer: string | null
          model_number: string | null
          purchase_cost: number | null
          purchase_date: string | null
          qr_code_url: string | null
          serial_number: string | null
          status: Database["public"]["Enums"]["asset_status"] | null
          trade_category: string | null
          updated_at: string | null
          user_id: string
          visual_description: string | null
          warranty_expiration: string | null
        }
        Insert: {
          asset_name: string
          asset_tag: string
          assigned_to?: string | null
          category: string
          category_match_confidence?: string | null
          condition?: Database["public"]["Enums"]["asset_condition"] | null
          created_at?: string | null
          current_value?: number | null
          custom_fields?: Json | null
          department?: string | null
          id?: string
          image_urls?: string[] | null
          location_id?: string | null
          manufacturer?: string | null
          model_number?: string | null
          purchase_cost?: number | null
          purchase_date?: string | null
          qr_code_url?: string | null
          serial_number?: string | null
          status?: Database["public"]["Enums"]["asset_status"] | null
          trade_category?: string | null
          updated_at?: string | null
          user_id: string
          visual_description?: string | null
          warranty_expiration?: string | null
        }
        Update: {
          asset_name?: string
          asset_tag?: string
          assigned_to?: string | null
          category?: string
          category_match_confidence?: string | null
          condition?: Database["public"]["Enums"]["asset_condition"] | null
          created_at?: string | null
          current_value?: number | null
          custom_fields?: Json | null
          department?: string | null
          id?: string
          image_urls?: string[] | null
          location_id?: string | null
          manufacturer?: string | null
          model_number?: string | null
          purchase_cost?: number | null
          purchase_date?: string | null
          qr_code_url?: string | null
          serial_number?: string | null
          status?: Database["public"]["Enums"]["asset_status"] | null
          trade_category?: string | null
          updated_at?: string | null
          user_id?: string
          visual_description?: string | null
          warranty_expiration?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assets_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      checkouts: {
        Row: {
          asset_id: string
          checked_in_by: string | null
          checked_out_by: string
          checkin_date: string | null
          checkin_notes: string | null
          checkout_date: string | null
          checkout_notes: string | null
          created_at: string | null
          due_date: string | null
          id: string
          signature_url: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          asset_id: string
          checked_in_by?: string | null
          checked_out_by: string
          checkin_date?: string | null
          checkin_notes?: string | null
          checkout_date?: string | null
          checkout_notes?: string | null
          created_at?: string | null
          due_date?: string | null
          id?: string
          signature_url?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          asset_id?: string
          checked_in_by?: string | null
          checked_out_by?: string
          checkin_date?: string | null
          checkin_notes?: string | null
          checkout_date?: string | null
          checkout_notes?: string | null
          created_at?: string | null
          due_date?: string | null
          id?: string
          signature_url?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "checkouts_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          address: string | null
          created_at: string | null
          gps_coordinates: string | null
          id: string
          name: string
          notes: string | null
          parent_id: string | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          gps_coordinates?: string | null
          id?: string
          name: string
          notes?: string | null
          parent_id?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          gps_coordinates?: string | null
          id?: string
          name?: string
          notes?: string | null
          parent_id?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "locations_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance: {
        Row: {
          asset_id: string
          completed_date: string | null
          cost: number | null
          created_at: string | null
          id: string
          maintenance_type: string
          notes: string | null
          scheduled_date: string | null
          status: string | null
          technician: string | null
          updated_at: string | null
          vendor: string | null
          work_order_number: string | null
        }
        Insert: {
          asset_id: string
          completed_date?: string | null
          cost?: number | null
          created_at?: string | null
          id?: string
          maintenance_type: string
          notes?: string | null
          scheduled_date?: string | null
          status?: string | null
          technician?: string | null
          updated_at?: string | null
          vendor?: string | null
          work_order_number?: string | null
        }
        Update: {
          asset_id?: string
          completed_date?: string | null
          cost?: number | null
          created_at?: string | null
          id?: string
          maintenance_type?: string
          notes?: string | null
          scheduled_date?: string | null
          status?: string | null
          technician?: string | null
          updated_at?: string | null
          vendor?: string | null
          work_order_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          active: boolean | null
          created_at: string | null
          department: string | null
          full_name: string
          id: string
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          trade_category: string | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          department?: string | null
          full_name: string
          id: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          trade_category?: string | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          department?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          trade_category?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      asset_condition: "excellent" | "good" | "fair" | "poor"
      asset_status:
        | "active"
        | "in_maintenance"
        | "retired"
        | "lost"
        | "reserved"
      user_role: "admin" | "manager" | "engineer" | "viewer"
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
      asset_condition: ["excellent", "good", "fair", "poor"],
      asset_status: ["active", "in_maintenance", "retired", "lost", "reserved"],
      user_role: ["admin", "manager", "engineer", "viewer"],
    },
  },
} as const
