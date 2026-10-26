import type {
  ActivityAction,
  Category,
  Impact,
  IncidentStatus,
  Priority,
  PublicUser,
  SlaState,
  SortOption,
  Urgency,
} from './domain';

export interface Incident {
  id: number;
  ticketNumber: string;
  title: string;
  description: string;
  category: Category;
  impact: Impact;
  urgency: Urgency;
  priority: Priority;
  status: IncidentStatus;
  reporter: PublicUser;
  assignee: PublicUser | null;
  slaDueAt: string;
  slaStatus: SlaState;
  firstResponseAt: string | null;
  resolvedAt: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  content: string;
  isInternal: boolean;
  createdAt: string;
  author: PublicUser;
}

export interface Activity {
  id: string;
  action: ActivityAction;
  detail: string | null;
  fromStatus: IncidentStatus | null;
  toStatus: IncidentStatus | null;
  createdAt: string;
  actor: PublicUser | null;
}

export interface IncidentDetail extends Incident {
  comments: Comment[];
  activities: Activity[];
  allowedTransitions: IncidentStatus[];
}

export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface PaginatedIncidents {
  items: Incident[];
  pagination: Pagination;
}

export interface IncidentFilters {
  page: number;
  pageSize: number;
  search: string;
  status?: IncidentStatus;
  priority?: Priority;
  category?: Category;
  assigneeId?: string;
  unassigned: boolean;
  mine: boolean;
  sort: SortOption;
}

export interface IncidentListParams {
  page: number;
  pageSize: number;
  search?: string;
  status?: IncidentStatus;
  priority?: Priority;
  category?: Category;
  assigneeId?: string;
  unassigned?: boolean;
  mine?: boolean;
  sort: SortOption;
}

export interface CreateIncidentPayload {
  title: string;
  description: string;
  category: Category;
  impact: Impact;
  urgency: Urgency;
}

export type UpdateIncidentPayload = Partial<CreateIncidentPayload>;

export interface ChangeStatusPayload {
  status: IncidentStatus;
  note?: string;
}

export interface AssignIncidentPayload {
  assigneeId: string;
  note?: string;
}

export interface CreateCommentPayload {
  content: string;
  isInternal: boolean;
}

export interface CreateCommentResult {
  comment: Comment;
}
