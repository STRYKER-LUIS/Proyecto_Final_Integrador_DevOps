import type {
  IncidentDetailResponse,
  IncidentResponse,
} from '../src/utils/serializers';
import type { AuthUser, PublicUser } from '../src/types/auth';
import { signAccessToken } from '../src/utils/jwt';

export const agentUser: AuthUser = {
  id: '11111111-1111-4111-8111-111111111111',
  email: 'agente@incidenthub.dev',
  name: 'Agente de Prueba',
  role: 'AGENT',
};

export const adminUser: AuthUser = {
  id: '22222222-2222-4222-8222-222222222222',
  email: 'admin@incidenthub.dev',
  name: 'Admin de Prueba',
  role: 'ADMIN',
};

export const reporterUser: AuthUser = {
  id: '33333333-3333-4333-8333-333333333333',
  email: 'reportante@incidenthub.dev',
  name: 'Reportante de Prueba',
  role: 'REPORTER',
};

export function authHeader(user: AuthUser): string {
  return `Bearer ${signAccessToken(user)}`;
}

export function publicUser(user: AuthUser): PublicUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
}

const createdAt = new Date('2026-03-01T12:00:00.000Z');
const slaDueAt = new Date('2026-03-01T20:00:00.000Z');

export function makeIncident(overrides: Partial<IncidentResponse> = {}): IncidentResponse {
  return {
    id: 1,
    ticketNumber: 'INC-000001',
    title: 'No puedo acceder a la VPN',
    description: 'El cliente VPN muestra un error de autenticación desde esta mañana.',
    category: 'ACCESS',
    impact: 'HIGH',
    urgency: 'HIGH',
    priority: 'HIGH',
    status: 'ASSIGNED',
    reporter: publicUser(reporterUser),
    assignee: publicUser(agentUser),
    slaDueAt,
    slaStatus: 'ON_TRACK',
    firstResponseAt: createdAt,
    resolvedAt: null,
    closedAt: null,
    createdAt,
    updatedAt: createdAt,
    ...overrides,
  };
}

export function makeIncidentDetail(
  overrides: Partial<IncidentDetailResponse> = {},
): IncidentDetailResponse {
  return {
    ...makeIncident(),
    comments: [
      {
        id: '44444444-4444-4444-8444-444444444444',
        content: 'Estamos revisando el caso.',
        author: publicUser(agentUser),
        isInternal: false,
        createdAt,
      },
    ],
    activities: [
      {
        id: '55555555-5555-4555-8555-555555555555',
        action: 'CREATED',
        detail: 'Incidente registrado',
        actor: publicUser(reporterUser),
        fromStatus: null,
        toStatus: null,
        createdAt,
      },
    ],
    allowedTransitions: ['IN_PROGRESS', 'ON_HOLD', 'CANCELLED'],
    ...overrides,
  };
}
