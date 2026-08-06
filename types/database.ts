export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string; email: string; first_name: string; last_name: string
          phone: string | null; hair_type: string | null; city: string | null
          account_type: 'customer' | 'owner'; is_admin: boolean
          avatar_url: string | null; created_at: string
        }
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at'>
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      salons: {
        Row: {
          id: string; owner_id: string; name: string; slug: string
          description: string | null; emoji: string; address: string | null
          area: string; city: string; postcode: string | null
          phone: string | null; email: string | null; instagram: string | null
          website: string | null; images: string[] | null
          price_from: number; plan: string; listing_status: string
          is_active: boolean; is_open: boolean; is_verified: boolean
          is_featured: boolean; featured_until: string | null
          rating: number; review_count: number; total_bookings: number
          service_types: string[]; tags: string[]
          years_active: number; accepts_online_bookings: boolean
          created_at: string; updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['salons']['Row']> & { name: string; slug: string; owner_id: string }
        Update: Partial<Database['public']['Tables']['salons']['Row']>
      }
      services: {
        Row: {
          id: string; salon_id: string; name: string; description: string | null
          emoji: string; price: number; duration_minutes: number
          category: string; is_active: boolean; sort_order: number
        }
        Insert: Omit<Database['public']['Tables']['services']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['services']['Row']>
      }
      salon_opening_hours: {
        Row: {
          id: string; salon_id: string; day_of_week: number
          open_time: string | null; close_time: string | null; is_closed: boolean
        }
        Insert: Omit<Database['public']['Tables']['salon_opening_hours']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['salon_opening_hours']['Row']>
      }
      bookings: {
        Row: {
          id: string; salon_id: string; customer_id: string
          service_id: string | null; booking_date: string; time_slot: string
          status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'
          reference: string; deposit_amount: number; deposit_paid: boolean
          notes: string | null; created_at: string
        }
        Insert: Omit<Database['public']['Tables']['bookings']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['bookings']['Row']>
      }
      products: {
        Row: {
          id: string; name: string; brand: string; category: string
          description: string | null; ingredients: string | null
          how_to_use: string | null; price: number; original_price: number | null
          images: string[]; stock_count: number; is_active: boolean
          rating: number; review_count: number; badge: string | null
          badge_type: string | null; tags: string[]
        }
        Insert: Partial<Database['public']['Tables']['products']['Row']> & { name: string; brand: string; price: number }
        Update: Partial<Database['public']['Tables']['products']['Row']>
      }
      orders: {
        Row: {
          id: string; customer_id: string; reference: string
          status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
          total: number; delivery_cost: number; full_name: string
          address: string; city: string; postcode: string
          stripe_session_id: string | null; created_at: string
        }
        Insert: Omit<Database['public']['Tables']['orders']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['orders']['Row']>
      }
      reviews: {
        Row: {
          id: string; reviewer_id: string; salon_id: string
          rating: number; review_text: string; service_booked: string | null
          hair_type: string | null; is_verified: boolean; created_at: string
        }
        Insert: Omit<Database['public']['Tables']['reviews']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['reviews']['Row']>
      }
      events: {
        Row: {
          id: string; organiser_id: string; title: string; emoji: string
          description: string | null; event_type: string; event_date: string
          time_start: string; time_end: string; venue: string; city: string
          price: number; is_free: boolean; capacity: number; rsvp_count: number
          image_url: string | null; is_active: boolean; created_at: string
        }
        Insert: Partial<Database['public']['Tables']['events']['Row']> & { title: string; organiser_id: string }
        Update: Partial<Database['public']['Tables']['events']['Row']>
      }
      notifications: {
        Row: {
          id: string; user_id: string; type: string
          title: string; body: string | null; link: string | null
          is_read: boolean; created_at: string
        }
        Insert: Omit<Database['public']['Tables']['notifications']['Row'], 'id' | 'created_at' | 'is_read'>
        Update: Partial<Database['public']['Tables']['notifications']['Row']>
      }
      saved_salons: {
        Row: { id: string; user_id: string; salon_id: string; created_at: string }
        Insert: Omit<Database['public']['Tables']['saved_salons']['Row'], 'id' | 'created_at'>
        Update: never
      }
      enquiries: {
        Row: {
          id: string; salon_id: string; sender_id: string | null
          name: string; email: string; phone: string | null
          subject: string | null; message: string
          status: 'unread' | 'read' | 'replied' | 'archived'; created_at: string
        }
        Insert: Omit<Database['public']['Tables']['enquiries']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['enquiries']['Row']>
      }
      audit_logs: {
        Row: {
          id: string; user_id: string; action: string
          entity_type: string; entity_id: string; created_at: string
        }
        Insert: Omit<Database['public']['Tables']['audit_logs']['Row'], 'id' | 'created_at'>
        Update: never
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
  }
}

// Convenience types
export type Profile    = Database['public']['Tables']['profiles']['Row']
export type Salon      = Database['public']['Tables']['salons']['Row']
export type Service    = Database['public']['Tables']['services']['Row']
export type Booking    = Database['public']['Tables']['bookings']['Row']
export type Product    = Database['public']['Tables']['products']['Row']
export type Order      = Database['public']['Tables']['orders']['Row']
export type Review     = Database['public']['Tables']['reviews']['Row']
export type Event      = Database['public']['Tables']['events']['Row']
export type Notification = Database['public']['Tables']['notifications']['Row']
export type Enquiry    = Database['public']['Tables']['enquiries']['Row']
