export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = 'admin' | 'operator' | 'viewer';
export type ImportStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'completed_with_errors';
export type RowImportStatus = 'pending' | 'imported' | 'failed' | 'skipped' | 'duplicate';
export type DuplicateConfidence = 'exact_duplicate' | 'probable_duplicate' | 'possible_duplicate';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          email: string;
          role: UserRole;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          email: string;
          role?: UserRole;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          email?: string;
          role?: UserRole;
          created_at?: string;
          updated_at?: string;
        };
      };
      imports: {
        Row: {
          id: string;
          file_name: string;
          file_size: number;
          status: ImportStatus;
          total_rows: number;
          successful_rows: number;
          failed_rows: number;
          duplicate_rows: number;
          mapping_config: Json;
          started_at: string;
          completed_at: string | null;
          imported_by: string;
        };
        Insert: {
          id?: string;
          file_name: string;
          file_size: number;
          status?: ImportStatus;
          total_rows?: number;
          successful_rows?: number;
          failed_rows?: number;
          duplicate_rows?: number;
          mapping_config?: Json;
          started_at?: string;
          completed_at?: string | null;
          imported_by: string;
        };
        Update: {
          id?: string;
          file_name?: string;
          file_size?: number;
          status?: ImportStatus;
          total_rows?: number;
          successful_rows?: number;
          failed_rows?: number;
          duplicate_rows?: number;
          mapping_config?: Json;
          started_at?: string;
          completed_at?: string | null;
          imported_by?: string;
        };
      };
      registrations: {
        Row: {
          id: string;
          source: string;
          source_import_id: string | null;
          source_row_number: number | null;
          registered_at: string;
          parent_first_name: string;
          parent_last_name: string;
          primary_email: string;
          secondary_email: string | null;
          phone: string;
          postal_address: string | null;
          postal_code: string | null;
          has_large_family_certificate: boolean;
          large_family_certificate_number: string | null;
          large_family_certificate_issued_at: string | null;
          county: string;
          city: string;
          comments: string | null;
          privacy_policy_accepted: boolean;
          family_details: string | null;
          notification_email: string | null;
          internal_notes: string | null;
          created_at: string;
          updated_at: string;
          created_by: string | null;
          updated_by: string | null;
        };
        Insert: {
          id?: string;
          source?: string;
          source_import_id?: string | null;
          source_row_number?: number | null;
          registered_at?: string;
          parent_first_name: string;
          parent_last_name: string;
          primary_email: string;
          secondary_email?: string | null;
          phone: string;
          postal_address?: string | null;
          postal_code?: string | null;
          has_large_family_certificate?: boolean;
          large_family_certificate_number?: string | null;
          large_family_certificate_issued_at?: string | null;
          county: string;
          city: string;
          comments?: string | null;
          privacy_policy_accepted?: boolean;
          family_details?: string | null;
          notification_email?: string | null;
          internal_notes?: string | null;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
          updated_by?: string | null;
        };
        Update: {
          id?: string;
          source?: string;
          source_import_id?: string | null;
          source_row_number?: number | null;
          registered_at?: string;
          parent_first_name?: string;
          parent_last_name?: string;
          primary_email?: string;
          secondary_email?: string | null;
          phone?: string;
          postal_address?: string | null;
          postal_code?: string | null;
          has_large_family_certificate?: boolean;
          large_family_certificate_number?: string | null;
          large_family_certificate_issued_at?: string | null;
          county?: string;
          city?: string;
          comments?: string | null;
          privacy_policy_accepted?: boolean;
          family_details?: string | null;
          notification_email?: string | null;
          internal_notes?: string | null;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
          updated_by?: string | null;
        };
      };
      children: {
        Row: {
          id: string;
          registration_id: string;
          first_name: string;
          last_name: string;
          email: string | null;
          cnp: string;
          age: number | null;
          birth_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          registration_id: string;
          first_name: string;
          last_name: string;
          email?: string | null;
          cnp: string;
          age?: number | null;
          birth_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          registration_id?: string;
          first_name?: string;
          last_name?: string;
          email?: string | null;
          cnp?: string;
          age?: number | null;
          birth_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      import_rows: {
        Row: {
          id: string;
          import_id: string;
          row_number: number;
          status: RowImportStatus;
          raw_data: Json;
          normalized_data: Json | null;
          validation_errors: Json | null;
          duplicate_match_id: string | null;
          duplicate_confidence: DuplicateConfidence | null;
          registration_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          import_id: string;
          row_number: number;
          status?: RowImportStatus;
          raw_data: Json;
          normalized_data?: Json | null;
          validation_errors?: Json | null;
          duplicate_match_id?: string | null;
          duplicate_confidence?: DuplicateConfidence | null;
          registration_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          import_id?: string;
          row_number?: number;
          status?: RowImportStatus;
          raw_data?: Json;
          normalized_data?: Json | null;
          validation_errors?: Json | null;
          duplicate_match_id?: string | null;
          duplicate_confidence?: DuplicateConfidence | null;
          registration_id?: string | null;
          created_at?: string;
        };
      };
      audit_logs: {
        Row: {
          id: string;
          user_id: string | null;
          action: string;
          entity_type: string;
          entity_id: string | null;
          metadata: Json;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          action: string;
          entity_type: string;
          entity_id?: string | null;
          metadata?: Json;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          action?: string;
          entity_type?: string;
          entity_id?: string | null;
          metadata?: Json;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
      };
    };
  };
}
