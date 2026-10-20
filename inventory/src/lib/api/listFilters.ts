/** Filters every list page can send (the API ignores what a list doesn't support). */
export interface ListFilters {
  search?: string;
  /** Trading days, YYYY-MM-DD (06:00 → 06:00) */
  from?: string;
  to?: string;
  method?: 'cash' | 'mpesa' | 'card' | 'cheque' | 'house' | 'other';
  verification_status?: 'pending' | 'verified' | 'unverified' | 'failed';
}
