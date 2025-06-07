// Common types used across multiple services

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface FilterOptions {
  department?: string;
  role?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  status?: string;
  search?: string;
}

export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}