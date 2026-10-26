import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../../src/app';
import { dashboardService } from '../../src/services/dashboard.service';
import { userService } from '../../src/services/user.service';
import { agentUser, authHeader, publicUser, reporterUser } from '../fixtures';

vi.mock('../../src/services/dashboard.service', () => ({
  dashboardService: { getSummary: vi.fn() },
}));

vi.mock('../../src/services/user.service', () => ({
  userService: { listStaff: vi.fn() },
}));

const app = createApp();
const dashboard = vi.mocked(dashboardService);
const users = vi.mocked(userService);

const summary = {
  generatedAt: new Date(),
  scope: 'GLOBAL' as const,
  kpis: {
    totalIncidents: 10,
    openIncidents: 4,
    unassignedIncidents: 1,
    inProgressIncidents: 2,
    slaAtRisk: 1,
    slaBreached: 1,
    resolvedLast7Days: 5,
    averageResolutionHours: 6.5,
    slaComplianceRate: 80,
  },
  statusDistribution: [{ status: 'NEW' as const, count: 1 }],
  priorityDistribution: [{ priority: 'HIGH' as const, count: 2 }],
  categoryDistribution: [{ category: 'ACCESS' as const, count: 2 }],
  trend: [{ date: '2026-03-01', created: 1, resolved: 0 }],
  recentIncidents: [],
};

beforeEach(() => {
  vi.resetAllMocks();
});

describe('API de dashboard y usuarios', () => {
  it('requiere autenticación para el dashboard', async () => {
    const response = await request(app).get('/api/dashboard');

    expect(response.status).toBe(401);
    expect(dashboard.getSummary).not.toHaveBeenCalled();
  });

  it('retorna el resumen según el usuario autenticado', async () => {
    dashboard.getSummary.mockResolvedValue(summary);

    const response = await request(app)
      .get('/api/dashboard')
      .set('Authorization', authHeader(agentUser));

    expect(response.status).toBe(200);
    expect(response.body.kpis.totalIncidents).toBe(10);
    expect(dashboard.getSummary).toHaveBeenCalledWith(
      expect.objectContaining({ id: agentUser.id, role: 'AGENT' }),
    );
  });

  it('permite a un reportante consultar el resumen de sus propios casos', async () => {
    dashboard.getSummary.mockResolvedValue({ ...summary, scope: 'OWN' });

    const response = await request(app)
      .get('/api/dashboard')
      .set('Authorization', authHeader(reporterUser));

    expect(response.status).toBe(200);
    expect(response.body.scope).toBe('OWN');
  });

  it('lista el personal disponible para asignación', async () => {
    users.listStaff.mockResolvedValue([publicUser(agentUser)]);

    const response = await request(app)
      .get('/api/users/agents')
      .set('Authorization', authHeader(agentUser));

    expect(response.status).toBe(200);
    expect(response.body.users).toHaveLength(1);
    expect(response.body.users[0].id).toBe(agentUser.id);
  });
});
