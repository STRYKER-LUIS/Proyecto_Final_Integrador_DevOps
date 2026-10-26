import { apiClient } from './http';
import type {
  AssignIncidentPayload,
  ChangeStatusPayload,
  CreateCommentPayload,
  CreateCommentResult,
  CreateIncidentPayload,
  IncidentDetail,
  IncidentListParams,
  PaginatedIncidents,
  UpdateIncidentPayload,
} from '../types';

export const incidentApi = {
  async list(params: IncidentListParams): Promise<PaginatedIncidents> {
    const { data } = await apiClient.get<PaginatedIncidents>('/incidents', { params });
    return data;
  },

  async getById(id: number): Promise<IncidentDetail> {
    const { data } = await apiClient.get<IncidentDetail>(`/incidents/${id}`);
    return data;
  },

  async create(payload: CreateIncidentPayload): Promise<IncidentDetail> {
    const { data } = await apiClient.post<IncidentDetail>('/incidents', payload);
    return data;
  },

  async update(id: number, payload: UpdateIncidentPayload): Promise<IncidentDetail> {
    const { data } = await apiClient.patch<IncidentDetail>(`/incidents/${id}`, payload);
    return data;
  },

  async changeStatus(id: number, payload: ChangeStatusPayload): Promise<IncidentDetail> {
    const { data } = await apiClient.patch<IncidentDetail>(`/incidents/${id}/status`, payload);
    return data;
  },

  async assign(id: number, payload: AssignIncidentPayload): Promise<IncidentDetail> {
    const { data } = await apiClient.patch<IncidentDetail>(`/incidents/${id}/assign`, payload);
    return data;
  },

  async addComment(id: number, payload: CreateCommentPayload): Promise<CreateCommentResult> {
    const { data } = await apiClient.post<CreateCommentResult>(`/incidents/${id}/comments`, payload);
    return data;
  },
};
