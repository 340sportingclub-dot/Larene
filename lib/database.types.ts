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

/** Côté d'un match de phase finale. */
export type ArenaKnockoutSide = "home" | "away";

/**
 * Origine abstraite d'un côté de match de phase finale.
 * `group_position` = « 1er du groupe A » ; `match_winner` / `match_loser`
 * pointent vers un autre match du tableau.
 */
export type ArenaKnockoutSourceType =
  | "group_position"
  | "match_winner"
  | "match_loser";

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
          /** Étiquette du tableau final (QF1, SF1, FINAL…). NULL en poules. */
          bracket_code: string | null;
          /** NULL tant que le qualifié n'est pas connu. Jamais NULL en poules. */
          home_team_id: string | null;
          away_team_id: string | null;
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
          bracket_code?: string | null;
          home_team_id?: string | null;
          away_team_id?: string | null;
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

      arena_knockout_slots: {
        Row: {
          id: string;
          event_id: string;
          match_id: string;
          side: ArenaKnockoutSide;
          source_type: ArenaKnockoutSourceType;
          /** Renseigné si et seulement si source_type = 'group_position'. */
          source_group_id: string | null;
          source_position: number | null;
          /** Renseigné si et seulement si source_type = 'match_winner' | 'match_loser'. */
          source_match_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          match_id: string;
          side: ArenaKnockoutSide;
          source_type: ArenaKnockoutSourceType;
          source_group_id?: string | null;
          source_position?: number | null;
          source_match_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["arena_knockout_slots"]["Insert"]
        >;
        Relationships: [
          {
            foreignKeyName: "arena_knockout_slots_match_fk";
            columns: ["match_id", "event_id"];
            referencedRelation: "arena_matches";
            referencedColumns: ["id", "event_id"];
          },
          {
            foreignKeyName: "arena_knockout_slots_source_group_fk";
            columns: ["source_group_id", "event_id"];
            referencedRelation: "arena_groups";
            referencedColumns: ["id", "event_id"];
          },
          {
            foreignKeyName: "arena_knockout_slots_source_match_fk";
            columns: ["source_match_id", "event_id"];
            referencedRelation: "arena_matches";
            referencedColumns: ["id", "event_id"];
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
        Row: ArenaLiveStandingsRow;
        Relationships: [];
      };

      /** TABLEAU OFFICIEL — uniquement les équipes réellement enregistrées. */
      arena_knockout_bracket: {
        Row: ArenaKnockoutBracketRow;
        Relationships: [];
      };

      /** TABLEAU FINAL, PROJECTION LIVE — non définitif. */
      arena_live_knockout_projection: {
        Row: ArenaKnockoutProjectionRow;
        Relationships: [];
      };

      /** Qualifiés d'après le classement OFFICIEL — source du bouton de validation. */
      arena_knockout_qualifiers: {
        Row: ArenaKnockoutProjectionRow;
        Relationships: [];
      };
    };

    Functions: {
      arena_group_standings_core: {
        Args: { p_include_live?: boolean };
        Returns: ArenaLiveStandingsRow[];
      };
      arena_knockout_projection_core: {
        Args: { p_include_live?: boolean };
        Returns: ArenaKnockoutProjectionRow[];
      };
      arena_knockout_slot_label: {
        Args: {
          p_source_type: string;
          p_group_name: string | null;
          p_source_position: number | null;
          p_source_bracket_code: string | null;
        };
        Returns: string | null;
      };
      arena_discipline_weight: {
        Args: { p_event_type: string };
        Returns: number;
      };
      /**
       * Écriture — réservée au `service_role`, EXECUTE révoqué pour anon et
       * authenticated. Crée les 8 matchs du tableau et leurs 16 slots.
       */
      arena_create_knockout_bracket: {
        Args: { p_event_id: string };
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
// Tableau à élimination directe
// -----------------------------------------------------------------------------

/** Colonnes communes au tableau officiel et à la projection. */
export type ArenaKnockoutMatchBase = {
  event_id: string;
  match_id: string;
  /** QF1, QF2, QF3, QF4, SF1, SF2, THIRD_PLACE, FINAL. */
  bracket_code: string | null;
  phase: ArenaMatchPhase;
  match_number: number;
  court_number: number;
  scheduled_at: string | null;
  status: ArenaMatchStatus;
  /** Libellé abstrait de l'origine : « A1 », « B2 », « Vainqueur QF1 ». */
  home_slot_label: string | null;
  away_slot_label: string | null;
  home_team_name: string | null;
  away_team_name: string | null;
  home_score: number;
  away_score: number;
  home_extra_time_score: number | null;
  away_extra_time_score: number | null;
  winner_team_id: string | null;
  /** Les deux côtés portent une équipe. */
  is_fully_resolved: boolean;
};

/**
 * TABLEAU OFFICIEL (`arena_knockout_bracket`).
 * Les équipes sont NULL tant que les qualifiés n'ont pas été validés ;
 * l'affichage repose alors sur les seuls libellés de slot.
 */
export type ArenaKnockoutBracketRow = ArenaKnockoutMatchBase & {
  home_team_id: string | null;
  away_team_id: string | null;
  knockout_published: boolean;
};

/**
 * PROJECTION (`arena_live_knockout_projection` d'après le classement LIVE,
 * `arena_knockout_qualifiers` d'après le classement OFFICIEL).
 *
 * `home_team_id` vaut l'équipe officielle si elle existe, sinon l'équipe
 * projetée. `home_is_projected` à `true` signifie NON DÉFINITIF : l'interface
 * doit afficher « PROJECTION LIVE — NON DÉFINITIVE ».
 */
export type ArenaKnockoutProjectionRow = ArenaKnockoutMatchBase & {
  home_team_id: string | null;
  away_team_id: string | null;
  home_is_projected: boolean;
  away_is_projected: boolean;
};

// -----------------------------------------------------------------------------
// Raccourcis
// -----------------------------------------------------------------------------

export type ArenaTables = Database["public"]["Tables"];
export type ArenaRow<T extends keyof ArenaTables> = ArenaTables[T]["Row"];
export type ArenaInsert<T extends keyof ArenaTables> = ArenaTables[T]["Insert"];
export type ArenaUpdate<T extends keyof ArenaTables> = ArenaTables[T]["Update"];
