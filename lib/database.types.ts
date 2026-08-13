/**
 * Types de la base de données Supabase partagée ("340-hub").
 *
 * PORTÉE : uniquement les objets `arena_*` appartenant à L'ARÈNE. Les tables des
 * autres modules de 340-hub ne sont volontairement pas décrites ici.
 *
 * ⚠️ CES TYPES SONT ÉCRITS À LA MAIN.
 * Ils décrivent la migration `supabase/migrations/20260813120000_arena_database_foundation.sql`,
 * qui n'a pas encore été appliquée à l'instance distante : ils n'ont donc PAS été
 * générés par `supabase gen types`. Ils doivent être régénérés une fois la
 * migration appliquée — procédure dans `supabase/README.md`.
 */

// -----------------------------------------------------------------------------
// Unions de statuts (miroir des CHECK constraints de la migration)
// -----------------------------------------------------------------------------

export type ArenaRegistrationStatus = "closed" | "open" | "paused" | "full";

export type ArenaEventStatus =
  | "draft"
  | "registration"
  | "draw"
  | "live"
  | "completed"
  | "cancelled";

export type ArenaTeamStatus =
  | "draft"
  | "pending"
  | "confirmed"
  | "waitlist"
  | "withdrawn"
  | "disqualified";

export type ArenaPlayerRole = "player" | "goalkeeper";

export type ArenaPlayerStatus =
  | "invited"
  | "pending"
  | "confirmed"
  | "withdrawn"
  | "disqualified";

export type ArenaInviteStatus =
  | "pending"
  | "sent"
  | "opened"
  | "completed"
  | "expired"
  | "cancelled";

export type ArenaPaymentStatus =
  | "pending"
  | "processing"
  | "paid"
  | "failed"
  | "refunded"
  | "cancelled";

export type ArenaMealOrderStatus =
  | "draft"
  | "submitted"
  | "paid"
  | "cancelled"
  | "fulfilled";

export type ArenaMealPaymentStatus = "unpaid" | "pending" | "paid" | "refunded";

export type ArenaMatchPhase =
  | "group"
  | "round_of_16"
  | "quarter_final"
  | "semi_final"
  | "third_place"
  | "final";

export type ArenaMatchStatus =
  | "scheduled"
  | "ready"
  | "live"
  | "finished"
  | "cancelled";

export type ArenaMatchEventType =
  | "goal"
  | "own_goal"
  | "yellow_card"
  | "red_card"
  | "two_minute"
  | "assist"
  | "penalty_goal"
  | "penalty_missed"
  | "score_correction";

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// -----------------------------------------------------------------------------
// Schéma
// -----------------------------------------------------------------------------

export type Database = {
  public: {
    Tables: {
      arena_events: {
        Row: {
          id: string;
          name: string;
          edition_name: string | null;
          event_date: string;
          venue_name: string;
          venue_address: string | null;
          city: string | null;
          doors_open_at: string | null;
          first_match_at: string | null;
          expected_end_at: string | null;
          minimum_age: number;
          max_teams: number | null;
          min_players_per_team: number;
          max_players_per_team: number;
          player_fee_cents: number;
          currency: string;
          court_count: number;
          registration_status: ArenaRegistrationStatus;
          event_status: ArenaEventStatus;
          groups_published: boolean;
          knockout_published: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          edition_name?: string | null;
          event_date: string;
          venue_name: string;
          venue_address?: string | null;
          city?: string | null;
          doors_open_at?: string | null;
          first_match_at?: string | null;
          expected_end_at?: string | null;
          minimum_age?: number;
          max_teams?: number | null;
          min_players_per_team: number;
          max_players_per_team: number;
          player_fee_cents: number;
          currency?: string;
          court_count?: number;
          registration_status?: ArenaRegistrationStatus;
          event_status?: ArenaEventStatus;
          groups_published?: boolean;
          knockout_published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["arena_events"]["Insert"]>;
        Relationships: [];
      };

      arena_teams: {
        Row: {
          id: string;
          event_id: string;
          name: string;
          city: string | null;
          primary_color: string | null;
          secondary_color: string | null;
          logo_url: string | null;
          captain_first_name: string;
          captain_last_name: string;
          captain_phone: string;
          captain_email: string | null;
          status: ArenaTeamStatus;
          reservation_expires_at: string | null;
          confirmed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          name: string;
          city?: string | null;
          primary_color?: string | null;
          secondary_color?: string | null;
          logo_url?: string | null;
          captain_first_name: string;
          captain_last_name: string;
          captain_phone: string;
          captain_email?: string | null;
          status?: ArenaTeamStatus;
          reservation_expires_at?: string | null;
          confirmed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["arena_teams"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "arena_teams_event_id_fkey";
            columns: ["event_id"];
            referencedRelation: "arena_events";
            referencedColumns: ["id"];
          },
        ];
      };

      arena_players: {
        Row: {
          id: string;
          team_id: string;
          first_name: string;
          last_name: string;
          date_of_birth: string | null;
          phone: string;
          email: string | null;
          shirt_number: number | null;
          role: ArenaPlayerRole;
          status: ArenaPlayerStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          first_name: string;
          last_name: string;
          date_of_birth?: string | null;
          phone: string;
          email?: string | null;
          shirt_number?: number | null;
          role?: ArenaPlayerRole;
          status?: ArenaPlayerStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["arena_players"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "arena_players_team_id_fkey";
            columns: ["team_id"];
            referencedRelation: "arena_teams";
            referencedColumns: ["id"];
          },
        ];
      };

      arena_player_invites: {
        Row: {
          id: string;
          player_id: string;
          phone: string;
          token_hash: string;
          status: ArenaInviteStatus;
          expires_at: string | null;
          sent_at: string | null;
          opened_at: string | null;
          completed_at: string | null;
          send_count: number;
          last_sent_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          player_id: string;
          phone: string;
          token_hash: string;
          status?: ArenaInviteStatus;
          expires_at?: string | null;
          sent_at?: string | null;
          opened_at?: string | null;
          completed_at?: string | null;
          send_count?: number;
          last_sent_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["arena_player_invites"]["Insert"]
        >;
        Relationships: [
          {
            foreignKeyName: "arena_player_invites_player_id_fkey";
            columns: ["player_id"];
            referencedRelation: "arena_players";
            referencedColumns: ["id"];
          },
        ];
      };

      arena_player_payments: {
        Row: {
          id: string;
          player_id: string;
          amount_cents: number;
          currency: string;
          status: ArenaPaymentStatus;
          payment_provider: string | null;
          provider_payment_id: string | null;
          checkout_reference: string | null;
          paid_at: string | null;
          refunded_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          player_id: string;
          amount_cents: number;
          currency?: string;
          status?: ArenaPaymentStatus;
          payment_provider?: string | null;
          provider_payment_id?: string | null;
          checkout_reference?: string | null;
          paid_at?: string | null;
          refunded_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["arena_player_payments"]["Insert"]
        >;
        Relationships: [
          {
            foreignKeyName: "arena_player_payments_player_id_fkey";
            columns: ["player_id"];
            referencedRelation: "arena_players";
            referencedColumns: ["id"];
          },
        ];
      };

      arena_meal_orders: {
        Row: {
          id: string;
          team_id: string;
          status: ArenaMealOrderStatus;
          total_cents: number;
          currency: string;
          payment_status: ArenaMealPaymentStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          status?: ArenaMealOrderStatus;
          total_cents?: number;
          currency?: string;
          payment_status?: ArenaMealPaymentStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["arena_meal_orders"]["Insert"]
        >;
        Relationships: [
          {
            foreignKeyName: "arena_meal_orders_team_id_fkey";
            columns: ["team_id"];
            referencedRelation: "arena_teams";
            referencedColumns: ["id"];
          },
        ];
      };

      arena_meal_order_items: {
        Row: {
          id: string;
          order_id: string;
          product_name: string;
          quantity: number;
          unit_price_cents: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_name: string;
          quantity: number;
          unit_price_cents: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["arena_meal_order_items"]["Insert"]
        >;
        Relationships: [
          {
            foreignKeyName: "arena_meal_order_items_order_id_fkey";
            columns: ["order_id"];
            referencedRelation: "arena_meal_orders";
            referencedColumns: ["id"];
          },
        ];
      };

      arena_groups: {
        Row: {
          id: string;
          event_id: string;
          name: string;
          display_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          name: string;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["arena_groups"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "arena_groups_event_id_fkey";
            columns: ["event_id"];
            referencedRelation: "arena_events";
            referencedColumns: ["id"];
          },
        ];
      };

      arena_group_teams: {
        Row: {
          id: string;
          event_id: string;
          group_id: string;
          team_id: string;
          draw_position: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          group_id: string;
          team_id: string;
          draw_position?: number | null;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["arena_group_teams"]["Insert"]
        >;
        Relationships: [
          {
            foreignKeyName: "arena_group_teams_group_fk";
            columns: ["group_id", "event_id"];
            referencedRelation: "arena_groups";
            referencedColumns: ["id", "event_id"];
          },
          {
            foreignKeyName: "arena_group_teams_team_fk";
            columns: ["team_id", "event_id"];
            referencedRelation: "arena_teams";
            referencedColumns: ["id", "event_id"];
          },
        ];
      };

      arena_matches: {
        Row: {
          id: string;
          event_id: string;
          group_id: string | null;
          match_number: number;
          phase: ArenaMatchPhase;
          court_number: number;
          home_team_id: string;
          away_team_id: string;
          scheduled_at: string | null;
          started_at: string | null;
          ended_at: string | null;
          status: ArenaMatchStatus;
          home_score: number;
          away_score: number;
          home_extra_time_score: number | null;
          away_extra_time_score: number | null;
          winner_team_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          group_id?: string | null;
          match_number: number;
          phase: ArenaMatchPhase;
          court_number?: number;
          home_team_id: string;
          away_team_id: string;
          scheduled_at?: string | null;
          started_at?: string | null;
          ended_at?: string | null;
          status?: ArenaMatchStatus;
          home_score?: number;
          away_score?: number;
          home_extra_time_score?: number | null;
          away_extra_time_score?: number | null;
          winner_team_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["arena_matches"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "arena_matches_event_id_fkey";
            columns: ["event_id"];
            referencedRelation: "arena_events";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "arena_matches_group_fk";
            columns: ["group_id", "event_id"];
            referencedRelation: "arena_groups";
            referencedColumns: ["id", "event_id"];
          },
          {
            foreignKeyName: "arena_matches_home_team_fk";
            columns: ["home_team_id", "event_id"];
            referencedRelation: "arena_teams";
            referencedColumns: ["id", "event_id"];
          },
          {
            foreignKeyName: "arena_matches_away_team_fk";
            columns: ["away_team_id", "event_id"];
            referencedRelation: "arena_teams";
            referencedColumns: ["id", "event_id"];
          },
          {
            foreignKeyName: "arena_matches_winner_team_fk";
            columns: ["winner_team_id", "event_id"];
            referencedRelation: "arena_teams";
            referencedColumns: ["id", "event_id"];
          },
        ];
      };

      arena_match_events: {
        Row: {
          id: string;
          match_id: string;
          team_id: string | null;
          player_id: string | null;
          event_type: ArenaMatchEventType;
          period: number | null;
          minute: number | null;
          second: number | null;
          sequence_number: number;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          match_id: string;
          team_id?: string | null;
          player_id?: string | null;
          event_type: ArenaMatchEventType;
          period?: number | null;
          minute?: number | null;
          second?: number | null;
          sequence_number: number;
          metadata?: Json;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["arena_match_events"]["Insert"]
        >;
        Relationships: [
          {
            foreignKeyName: "arena_match_events_match_id_fkey";
            columns: ["match_id"];
            referencedRelation: "arena_matches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "arena_match_events_team_id_fkey";
            columns: ["team_id"];
            referencedRelation: "arena_teams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "arena_match_events_player_id_fkey";
            columns: ["player_id"];
            referencedRelation: "arena_players";
            referencedColumns: ["id"];
          },
        ];
      };
    };

    Views: {
      /** Projection publique de arena_teams, sans aucune PII. */
      arena_public_teams: {
        Row: {
          id: string;
          event_id: string;
          name: string;
          city: string | null;
          primary_color: string | null;
          secondary_color: string | null;
          logo_url: string | null;
          status: ArenaTeamStatus;
          created_at: string;
        };
        Relationships: [];
      };

      /** CLASSEMENT OFFICIEL — matchs `finished` uniquement. */
      arena_group_standings: {
        Row: ArenaStandingsRow;
        Relationships: [];
      };

      /** CLASSEMENT PROVISOIRE EN DIRECT — matchs `finished` + `live`. */
      arena_live_group_standings: {
        Row: ArenaStandingsRow & {
          is_live: boolean;
          live_match_id: string | null;
        };
        Relationships: [];
      };
    };

    Functions: {
      arena_group_standings_core: {
        Args: { p_include_live?: boolean };
        Returns: (ArenaStandingsRow & {
          is_live: boolean;
          live_match_id: string | null;
        })[];
      };
      arena_discipline_weight: {
        Args: { p_event_type: string };
        Returns: number;
      };
    };

    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

// -----------------------------------------------------------------------------
// Classements
// -----------------------------------------------------------------------------

/** Colonnes communes aux deux classements (même hiérarchie de départage). */
export type ArenaStandingsRow = {
  event_id: string;
  group_id: string;
  group_name: string;
  group_display_order: number;
  team_id: string;
  team_name: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  points: number;
  /** Points de pénalité cumulés — croissant : moins = mieux classé. */
  discipline_points: number;
  /** Mini-championnat entre équipes à égalité de points ET de différence de buts. */
  head_to_head_points: number;
  head_to_head_goal_difference: number;
  head_to_head_goals_for: number;
  /** Position déterministe dans la poule, de 1 à N (jamais d'ex æquo). */
  rank: number;
};

/** Ligne du classement provisoire en direct. */
export type ArenaLiveStandingsRow = ArenaStandingsRow & {
  /** L'équipe dispute actuellement un match compté provisoirement. */
  is_live: boolean;
  live_match_id: string | null;
};

// -----------------------------------------------------------------------------
// Raccourcis
// -----------------------------------------------------------------------------

export type ArenaTables = Database["public"]["Tables"];
export type ArenaRow<T extends keyof ArenaTables> = ArenaTables[T]["Row"];
export type ArenaInsert<T extends keyof ArenaTables> = ArenaTables[T]["Insert"];
export type ArenaUpdate<T extends keyof ArenaTables> = ArenaTables[T]["Update"];
