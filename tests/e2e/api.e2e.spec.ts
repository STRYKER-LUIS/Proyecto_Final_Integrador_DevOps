import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../../backend/src/app';
import { REFRESH_COOKIE_NAME } from '../../backend/src/utils/cookies';

type Role = 'ADMIN' | 'AGENT' | 'REPORTER';
type IncidentStatus =
  | 'NEW'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'ON_HOLD'
  | 'RESOLVED'
  | 'CLOSED'
  | 'CANCELLED';
type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

interface PublicUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

interface AuthResponse {
  accessToken: string;
  expiresIn: number;
  user: PublicUser;
}

interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    requestId: string;
    details?: Array<{ field: string; message: string }>;
  };
}

interface Incident {
  id: number;
  ticketNumber: string;
  title: string;
  description: string;
  category: string;
  impact: string;
  urgency: string;
  priority: Priority;
  status: IncidentStatus;
  reporter: PublicUser;
  assignee: PublicUser | null;
  slaDueAt: string;
  slaStatus: string;
  firstResponseAt: string | null;
  resolvedAt: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Comment {
  id: string;
  content: string;
  isInternal: boolean;
  author: PublicUser;
}

interface Activity {
  id: string;
  action: string;
  detail: string | null;
  fromStatus: IncidentStatus | null;
  toStatus: IncidentStatus | null;
  actor: PublicUser | null;
}

interface IncidentDetail extends Incident {
  comments: Comment[];
  activities: Activity[];
  allowedTransitions: IncidentStatus[];
}

interface PaginatedIncidents {
  items: Incident[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

interface Dashboard {
  scope: 'GLOBAL' | 'OWN';
  kpis: {
    totalIncidents: number;
    openIncidents: number;
    unassignedIncidents: number;
    inProgressIncidents: number;
    slaAtRisk: number;
    slaBreached: number;
    resolvedLast7Days: number;
    averageResolutionHours: number | null;
    slaComplianceRate: number | null;
  };
  statusDistribution: Array<{ status: IncidentStatus; count: number }>;
  priorityDistribution: Array<{ priority: Priority; count: number }>;
  categoryDistribution: Array<{ category: string; count: number }>;
  trend: Array<{ date: string; created: number; resolved: number }>;
  recentIncidents: Incident[];
}

const app = createApp();

const CREDENTIALS = {
  admin: { email: 'admin@incidenthub.dev', password: 'Admin123!' },
  agent: { email: 'diego.agente@incidenthub.dev', password: 'Agent123!' },
  otherAgent: { email: 'camila.agente@incidenthub.dev', password: 'Agent123!' },
  reporter: { email: 'andres.usuario@incidenthub.dev', password: 'User123!' },
  otherReporter: { email: 'lucia.usuario@incidenthub.dev', password: 'User123!' },
} as const;

function setCookieHeader(response: request.Response): string {
  const header = response.headers['set-cookie'];
  const cookies = Array.isArray(header) ? header : header ? [header] : [];
  const refreshCookie = cookies.find((cookie) =>
    cookie.startsWith(`${REFRESH_COOKIE_NAME}=`),
  );

  if (!refreshCookie) {
    throw new Error('La respuesta no incluyó la cookie de refresco');
  }

  return refreshCookie;
}

function cookiePair(response: request.Response): string {
  return setCookieHeader(response).split(';')[0];
}

async function login(email: string, password: string): Promise<{
  accessToken: string;
  user: PublicUser;
  cookie: string;
  rawCookie: string;
}> {
  const response = await request(app)
    .post('/api/auth/login')
    .send({ email, password })
    .expect(200);

  const body = response.body as AuthResponse;

  return {
    accessToken: body.accessToken,
    user: body.user,
    cookie: cookiePair(response),
    rawCookie: setCookieHeader(response),
  };
}

function auth(token: string): { Authorization: string } {
  return { Authorization: `Bearer ${token}` };
}

function errorBody(response: request.Response): ApiErrorBody {
  return response.body as ApiErrorBody;
}

const uniqueTitle = (label: string): string =>
  `${label} ${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

async function createIncident(
  token: string,
  overrides: Partial<{
    title: string;
    description: string;
    category: string;
    impact: string;
    urgency: string;
  }> = {},
): Promise<IncidentDetail> {
  const response = await request(app)
    .post('/api/incidents')
    .set(auth(token))
    .send({
      title: uniqueTitle('Incidente E2E'),
      description: 'Descripción suficientemente larga para validar el flujo E2E completo.',
      category: 'SOFTWARE',
      impact: 'HIGH',
      urgency: 'MEDIUM',
      ...overrides,
    })
    .expect(201);

  return response.body as IncidentDetail;
}

describe('IT Incident Hub · E2E con PostgreSQL real', () => {
  it('expone health checks de liveness y readiness', async () => {
    const live = await request(app).get('/health/live').expect(200);
    expect(live.body).toMatchObject({ status: 'ok' });

    const ready = await request(app).get('/health/ready').expect(200);
    expect(ready.body).toMatchObject({
      status: 'ready',
      checks: { database: 'up' },
    });

    const apiReady = await request(app).get('/api/health/ready').expect(200);
    expect(apiReady.body).toMatchObject({ status: 'ready' });
  });

  it('autentica, consulta el perfil y rota el refresh token', async () => {
    const session = await login(CREDENTIALS.admin.email, CREDENTIALS.admin.password);

    expect(session.accessToken).toEqual(expect.any(String));
    expect(session.user).toMatchObject({
      email: CREDENTIALS.admin.email,
      role: 'ADMIN',
    });
    expect(session.rawCookie).toContain('HttpOnly');
    expect(session.rawCookie).toContain('SameSite=Lax');
    expect(session.rawCookie).toContain('Path=/api/auth');

    const me = await request(app)
      .get('/api/auth/me')
      .set(auth(session.accessToken))
      .expect(200);
    expect((me.body as { user: PublicUser }).user.email).toBe(CREDENTIALS.admin.email);

    const refreshed = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', session.cookie)
      .expect(200);
    const refreshedBody = refreshed.body as AuthResponse;
    expect(refreshedBody.accessToken).toEqual(expect.any(String));
    expect(refreshedBody.accessToken).not.toBe(session.accessToken);

    const rotatedCookie = cookiePair(refreshed);
    expect(rotatedCookie).not.toBe(session.cookie);

    // Reutilizar el refresh anterior debe revocar la sesión completa.
    const reuse = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', session.cookie)
      .expect(401);
    expect(errorBody(reuse).error.code).toBe('INVALID_REFRESH_SESSION');

    const afterRevocation = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', rotatedCookie)
      .expect(401);
    expect(errorBody(afterRevocation).error.code).toBe('INVALID_REFRESH_SESSION');
  });

  it('rechaza credenciales inválidas y refresh sin cookie', async () => {
    const invalid = await request(app)
      .post('/api/auth/login')
      .send({ email: CREDENTIALS.admin.email, password: 'ClaveIncorrecta!' })
      .expect(401);
    expect(errorBody(invalid).error.code).toBe('INVALID_CREDENTIALS');

    const missingCookie = await request(app).post('/api/auth/refresh').expect(401);
    expect(errorBody(missingCookie).error.code).toBe('REFRESH_TOKEN_MISSING');
  });

  it('cierra sesión de forma idempotente', async () => {
    const session = await login(CREDENTIALS.agent.email, CREDENTIALS.agent.password);

    await request(app)
      .post('/api/auth/logout')
      .set('Cookie', session.cookie)
      .expect(204);

    const afterLogout = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', session.cookie)
      .expect(401);
    expect(errorBody(afterLogout).error.code).toBe('INVALID_REFRESH_SESSION');

    await request(app).post('/api/auth/logout').expect(204);
    await request(app).post('/api/auth/logout').set('Cookie', 'ih_refresh=invalido').expect(204);
  });

  it('aplica el alcance del reportante y bloquea acciones de gestión', async () => {
    const reporter = await login(CREDENTIALS.reporter.email, CREDENTIALS.reporter.password);
    const admin = await login(CREDENTIALS.admin.email, CREDENTIALS.admin.password);

    const ownIncident = await createIncident(reporter.accessToken, {
      title: uniqueTitle('Incidente propio del reportante'),
    });
    const adminIncident = await createIncident(admin.accessToken, {
      title: uniqueTitle('Incidente creado por administración'),
    });

    const list = await request(app)
      .get('/api/incidents')
      .query({ pageSize: 100 })
      .set(auth(reporter.accessToken))
      .expect(200);
    const listBody = list.body as PaginatedIncidents;

    expect(listBody.items.length).toBeGreaterThan(0);
    expect(listBody.items.every((incident) => incident.reporter.id === reporter.user.id)).toBe(
      true,
    );
    expect(listBody.items.some((incident) => incident.id === ownIncident.id)).toBe(true);
    expect(listBody.items.some((incident) => incident.id === adminIncident.id)).toBe(false);

    const foreignIncident = await request(app)
      .get(`/api/incidents/${adminIncident.id}`)
      .set(auth(reporter.accessToken))
      .expect(404);
    expect(errorBody(foreignIncident).error.code).toBe('INCIDENT_NOT_FOUND');

    const forbiddenStatus = await request(app)
      .patch(`/api/incidents/${ownIncident.id}/status`)
      .set(auth(reporter.accessToken))
      .send({ status: 'IN_PROGRESS' })
      .expect(403);
    expect(errorBody(forbiddenStatus).error.code).toBe('FORBIDDEN');

    const forbiddenAssign = await request(app)
      .patch(`/api/incidents/${ownIncident.id}/assign`)
      .set(auth(reporter.accessToken))
      .send({ assigneeId: reporter.user.id })
      .expect(403);
    expect(errorBody(forbiddenAssign).error.code).toBe('FORBIDDEN');

    const forbiddenInternal = await request(app)
      .post(`/api/incidents/${ownIncident.id}/comments`)
      .set(auth(reporter.accessToken))
      .send({ content: 'Nota interna no permitida', isInternal: true })
      .expect(403);
    expect(errorBody(forbiddenInternal).error.code).toBe('FORBIDDEN');

    const publicComment = await request(app)
      .post(`/api/incidents/${ownIncident.id}/comments`)
      .set(auth(reporter.accessToken))
      .send({ content: 'Comentario público del reportante', isInternal: false })
      .expect(201);
    expect((publicComment.body as { comment: Comment }).comment.isInternal).toBe(false);

    const forbiddenPriority = await request(app)
      .patch(`/api/incidents/${ownIncident.id}`)
      .set(auth(reporter.accessToken))
      .send({ impact: 'CRITICAL', urgency: 'HIGH' })
      .expect(403);
    expect(errorBody(forbiddenPriority).error.code).toBe('FORBIDDEN');

    const editOwn = await request(app)
      .patch(`/api/incidents/${ownIncident.id}`)
      .set(auth(reporter.accessToken))
      .send({ title: uniqueTitle('Título editado por el reportante') })
      .expect(200);
    expect((editOwn.body as IncidentDetail).title).toContain('Título editado');

    const agent = await login(CREDENTIALS.agent.email, CREDENTIALS.agent.password);
    await request(app)
      .patch(`/api/incidents/${ownIncident.id}/status`)
      .set(auth(agent.accessToken))
      .send({ status: 'ASSIGNED' })
      .expect(200);

    const editAfterAssignment = await request(app)
      .patch(`/api/incidents/${ownIncident.id}`)
      .set(auth(reporter.accessToken))
      .send({ title: uniqueTitle('Edición tardía') })
      .expect(409);
    expect(errorBody(editAfterAssignment).error.code).toBe('INCIDENT_NOT_EDITABLE');
  });

  it('ejecuta el ciclo completo: creación, asignación, comentarios, resolución y cierre', async () => {
    const reporter = await login(CREDENTIALS.reporter.email, CREDENTIALS.reporter.password);
    const agent = await login(CREDENTIALS.agent.email, CREDENTIALS.agent.password);
    const admin = await login(CREDENTIALS.admin.email, CREDENTIALS.admin.password);

    const created = await createIncident(reporter.accessToken, {
      title: uniqueTitle('Fallo crítico de ciclo completo'),
      description:
        'El servicio principal no responde y afecta a toda la operación. Se requiere atención inmediata.',
      category: 'SOFTWARE',
      impact: 'CRITICAL',
      urgency: 'HIGH',
    });

    expect(created).toMatchObject({
      status: 'NEW',
      priority: 'CRITICAL',
      impact: 'CRITICAL',
      urgency: 'HIGH',
    });
    expect(created.ticketNumber).toMatch(/^INC-\d{6}$/);
    expect(created.assignee).toBeNull();
    expect(created.allowedTransitions).toEqual([]);
    expect(created.activities.some((activity) => activity.action === 'CREATED')).toBe(true);

    const agentDetail = await request(app)
      .get(`/api/incidents/${created.id}`)
      .set(auth(agent.accessToken))
      .expect(200);
    const agentDetailBody = agentDetail.body as IncidentDetail;
    expect(agentDetailBody.allowedTransitions).toEqual(
      expect.arrayContaining(['ASSIGNED', 'IN_PROGRESS', 'CANCELLED']),
    );

    const assigned = await request(app)
      .patch(`/api/incidents/${created.id}/assign`)
      .set(auth(agent.accessToken))
      .send({ assigneeId: agent.user.id, note: 'Tomando el caso' })
      .expect(200);
    const assignedBody = assigned.body as IncidentDetail;
    expect(assignedBody.status).toBe('ASSIGNED');
    expect(assignedBody.assignee?.id).toBe(agent.user.id);
    expect(assignedBody.firstResponseAt).toEqual(expect.any(String));
    expect(
      assignedBody.activities.some(
        (activity) =>
          activity.action === 'ASSIGNED' && activity.toStatus === 'ASSIGNED',
      ),
    ).toBe(true);

    const selfAssignForbidden = await request(app)
      .patch(`/api/incidents/${created.id}/assign`)
      .set(auth(agent.accessToken))
      .send({ assigneeId: admin.user.id })
      .expect(403);
    expect(errorBody(selfAssignForbidden).error.code).toBe('FORBIDDEN');

    const inProgress = await request(app)
      .patch(`/api/incidents/${created.id}/status`)
      .set(auth(agent.accessToken))
      .send({ status: 'IN_PROGRESS', note: 'Diagnóstico en curso' })
      .expect(200);
    expect((inProgress.body as IncidentDetail).status).toBe('IN_PROGRESS');

    const publicComment = await request(app)
      .post(`/api/incidents/${created.id}/comments`)
      .set(auth(reporter.accessToken))
      .send({ content: 'El problema continúa en la sede principal.' })
      .expect(201);
    expect((publicComment.body as { comment: Comment }).comment.isInternal).toBe(false);

    const internalComment = await request(app)
      .post(`/api/incidents/${created.id}/comments`)
      .set(auth(agent.accessToken))
      .send({ content: 'Nota interna: revisar logs del clúster.', isInternal: true })
      .expect(201);
    expect((internalComment.body as { comment: Comment }).comment.isInternal).toBe(true);

    const reporterView = await request(app)
      .get(`/api/incidents/${created.id}`)
      .set(auth(reporter.accessToken))
      .expect(200);
    const reporterViewBody = reporterView.body as IncidentDetail;
    expect(reporterViewBody.comments.some((comment) => comment.isInternal)).toBe(false);
    expect(
      reporterViewBody.comments.some((comment) =>
        comment.content.includes('Nota interna'),
      ),
    ).toBe(false);

    const agentView = await request(app)
      .get(`/api/incidents/${created.id}`)
      .set(auth(agent.accessToken))
      .expect(200);
    const agentViewBody = agentView.body as IncidentDetail;
    expect(agentViewBody.comments.some((comment) => comment.isInternal)).toBe(true);
    expect(
      agentViewBody.comments.some((comment) => comment.content.includes('Nota interna')),
    ).toBe(true);

    const resolved = await request(app)
      .patch(`/api/incidents/${created.id}/status`)
      .set(auth(agent.accessToken))
      .send({ status: 'RESOLVED', note: 'Servicio restablecido' })
      .expect(200);
    const resolvedBody = resolved.body as IncidentDetail;
    expect(resolvedBody.status).toBe('RESOLVED');
    expect(resolvedBody.resolvedAt).toEqual(expect.any(String));
    expect(resolvedBody.slaStatus).toBe('MET');

    const closed = await request(app)
      .patch(`/api/incidents/${created.id}/status`)
      .set(auth(agent.accessToken))
      .send({ status: 'CLOSED' })
      .expect(200);
    const closedBody = closed.body as IncidentDetail;
    expect(closedBody.status).toBe('CLOSED');
    expect(closedBody.closedAt).toEqual(expect.any(String));
    expect(closedBody.resolvedAt).toEqual(expect.any(String));

    const invalidTransition = await request(app)
      .patch(`/api/incidents/${created.id}/status`)
      .set(auth(agent.accessToken))
      .send({ status: 'RESOLVED' })
      .expect(409);
    expect(errorBody(invalidTransition).error.code).toBe('INVALID_STATUS_TRANSITION');

    const updatedPriority = await request(app)
      .patch(`/api/incidents/${created.id}`)
      .set(auth(agent.accessToken))
      .send({ impact: 'LOW', urgency: 'LOW' })
      .expect(200);
    const updatedPriorityBody = updatedPriority.body as IncidentDetail;
    expect(updatedPriorityBody.priority).toBe('LOW');
    expect(updatedPriorityBody.impact).toBe('LOW');
    expect(updatedPriorityBody.urgency).toBe('LOW');

    const expectedDueAt =
      new Date(updatedPriorityBody.createdAt).getTime() + 72 * 60 * 60 * 1000;
    expect(Math.abs(new Date(updatedPriorityBody.slaDueAt).getTime() - expectedDueAt)).toBeLessThan(
      60_000,
    );
  });

  it('valida payloads y no filtra detalles internos en errores', async () => {
    const admin = await login(CREDENTIALS.admin.email, CREDENTIALS.admin.password);

    const shortTitle = await request(app)
      .post('/api/incidents')
      .set(auth(admin.accessToken))
      .send({
        title: 'VPN',
        description: 'Descripción válida suficientemente larga.',
        category: 'NETWORK',
        impact: 'HIGH',
        urgency: 'HIGH',
      })
      .expect(422);
    const shortTitleBody = errorBody(shortTitle);
    expect(shortTitleBody.error.code).toBe('VALIDATION_ERROR');
    expect(shortTitleBody.error.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: 'title' }),
      ]),
    );

    const extraField = await request(app)
      .post('/api/incidents')
      .set(auth(admin.accessToken))
      .send({
        title: 'Incidente con campo extra',
        description: 'Descripción válida suficientemente larga.',
        category: 'NETWORK',
        impact: 'HIGH',
        urgency: 'HIGH',
        reporterId: '00000000-0000-0000-0000-000000000000',
      })
      .expect(422);
    expect(errorBody(extraField).error.code).toBe('VALIDATION_ERROR');

    const invalidQuery = await request(app)
      .get('/api/incidents')
      .query({ status: 'INVALIDO' })
      .set(auth(admin.accessToken))
      .expect(422);
    expect(errorBody(invalidQuery).error.code).toBe('VALIDATION_ERROR');

    const invalidPageSize = await request(app)
      .get('/api/incidents')
      .query({ pageSize: 101 })
      .set(auth(admin.accessToken))
      .expect(422);
    expect(errorBody(invalidPageSize).error.code).toBe('VALIDATION_ERROR');

    const invalidJson = await request(app)
      .post('/api/incidents')
      .set(auth(admin.accessToken))
      .set('Content-Type', 'application/json')
      .send('{"title":')
      .expect(400);
    expect(errorBody(invalidJson).error.code).toBe('INVALID_JSON');

    const unauthorized = await request(app).get('/api/incidents').expect(401);
    expect(errorBody(unauthorized).error.code).toBe('UNAUTHORIZED');

    const notFound = await request(app)
      .get('/api/ruta-inexistente')
      .set(auth(admin.accessToken))
      .expect(404);
    const notFoundBody = errorBody(notFound);
    expect(notFoundBody.error.code).toBe('NOT_FOUND');
    expect(notFoundBody.error.requestId).toEqual(expect.any(String));
    expect(notFoundBody.error.requestId.length).toBeGreaterThan(0);
    expect(notFoundBody).not.toHaveProperty('stack');
  });

  it('filtra, ordena y pagina incidentes sobre datos reales', async () => {
    const admin = await login(CREDENTIALS.admin.email, CREDENTIALS.admin.password);
    const agent = await login(CREDENTIALS.agent.email, CREDENTIALS.agent.password);
    const agents = await request(app)
      .get('/api/users/agents')
      .set(auth(admin.accessToken))
      .expect(200);
    const staff = (agents.body as { users: PublicUser[] }).users;
    const camila = staff.find((user) => user.email === CREDENTIALS.otherAgent.email);
    expect(camila).toBeDefined();

    const firstPage = await request(app)
      .get('/api/incidents')
      .query({ page: 1, pageSize: 5, sort: 'newest' })
      .set(auth(admin.accessToken))
      .expect(200);
    const firstPageBody = firstPage.body as PaginatedIncidents;
    expect(firstPageBody.items).toHaveLength(5);
    expect(firstPageBody.pagination).toMatchObject({
      page: 1,
      pageSize: 5,
      totalPages: Math.ceil(firstPageBody.pagination.total / 5),
    });
    expect(firstPageBody.pagination.total).toBeGreaterThanOrEqual(31);
    expect(firstPageBody.items.every((incident) => /^INC-\d{6}$/.test(incident.ticketNumber))).toBe(
      true,
    );

    const secondPage = await request(app)
      .get('/api/incidents')
      .query({ page: 2, pageSize: 5, sort: 'newest' })
      .set(auth(admin.accessToken))
      .expect(200);
    const secondPageBody = secondPage.body as PaginatedIncidents;
    const firstIds = new Set(firstPageBody.items.map((incident) => incident.id));
    expect(secondPageBody.items.every((incident) => !firstIds.has(incident.id))).toBe(true);

    const newIncidents = await request(app)
      .get('/api/incidents')
      .query({ status: 'NEW', pageSize: 100 })
      .set(auth(admin.accessToken))
      .expect(200);
    expect(
      (newIncidents.body as PaginatedIncidents).items.every(
        (incident) => incident.status === 'NEW',
      ),
    ).toBe(true);

    const criticalIncidents = await request(app)
      .get('/api/incidents')
      .query({ priority: 'CRITICAL', pageSize: 100 })
      .set(auth(admin.accessToken))
      .expect(200);
    expect(
      (criticalIncidents.body as PaginatedIncidents).items.every(
        (incident) => incident.priority === 'CRITICAL',
      ),
    ).toBe(true);

    const accessIncidents = await request(app)
      .get('/api/incidents')
      .query({ category: 'ACCESS', pageSize: 100 })
      .set(auth(admin.accessToken))
      .expect(200);
    expect(
      (accessIncidents.body as PaginatedIncidents).items.every(
        (incident) => incident.category === 'ACCESS',
      ),
    ).toBe(true);

    const unassigned = await request(app)
      .get('/api/incidents')
      .query({ unassigned: true, pageSize: 100 })
      .set(auth(admin.accessToken))
      .expect(200);
    expect(
      (unassigned.body as PaginatedIncidents).items.every(
        (incident) => incident.assignee === null,
      ),
    ).toBe(true);

    const mine = await request(app)
      .get('/api/incidents')
      .query({ mine: true, pageSize: 100 })
      .set(auth(agent.accessToken))
      .expect(200);
    const mineItems = (mine.body as PaginatedIncidents).items;
    expect(mineItems.length).toBeGreaterThan(0);
    expect(mineItems.every((incident) => incident.assignee?.id === agent.user.id)).toBe(true);

    const byAssignee = await request(app)
      .get('/api/incidents')
      .query({ assigneeId: camila?.id, pageSize: 100 })
      .set(auth(admin.accessToken))
      .expect(200);
    expect(
      (byAssignee.body as PaginatedIncidents).items.every(
        (incident) => incident.assignee?.id === camila?.id,
      ),
    ).toBe(true);

    const search = await request(app)
      .get('/api/incidents')
      .query({ search: 'VPN', pageSize: 100 })
      .set(auth(admin.accessToken))
      .expect(200);
    const searchItems = (search.body as PaginatedIncidents).items;
    expect(searchItems.length).toBeGreaterThan(0);
    expect(
      searchItems.every(
        (incident) =>
          incident.title.toLowerCase().includes('vpn') ||
          incident.description.toLowerCase().includes('vpn'),
      ),
    ).toBe(true);

    const ticketSearch = await request(app)
      .get('/api/incidents')
      .query({ search: 'INC-000001' })
      .set(auth(admin.accessToken))
      .expect(200);
    expect((ticketSearch.body as PaginatedIncidents).items.some((incident) => incident.id === 1)).toBe(
      true,
    );

    const sortedByPriority = await request(app)
      .get('/api/incidents')
      .query({ sort: 'priority', pageSize: 100 })
      .set(auth(admin.accessToken))
      .expect(200);
    const rank: Record<Priority, number> = {
      LOW: 1,
      MEDIUM: 2,
      HIGH: 3,
      CRITICAL: 4,
    };
    const priorities = (sortedByPriority.body as PaginatedIncidents).items.map(
      (incident) => rank[incident.priority],
    );
    expect(priorities).toEqual([...priorities].sort((left, right) => right - left));

    const conflictingFilters = await request(app)
      .get('/api/incidents')
      .query({ unassigned: true, assigneeId: camila?.id })
      .set(auth(admin.accessToken))
      .expect(422);
    expect(errorBody(conflictingFilters).error.code).toBe('VALIDATION_ERROR');
  });

  it('calcula el dashboard global y el alcance propio del reportante', async () => {
    const admin = await login(CREDENTIALS.admin.email, CREDENTIALS.admin.password);
    const reporter = await login(CREDENTIALS.reporter.email, CREDENTIALS.reporter.password);

    const globalDashboard = await request(app)
      .get('/api/dashboard')
      .set(auth(admin.accessToken))
      .expect(200);
    const globalBody = globalDashboard.body as Dashboard;

    expect(globalBody.scope).toBe('GLOBAL');
    expect(globalBody.kpis.totalIncidents).toBeGreaterThanOrEqual(31);
    expect(globalBody.kpis.openIncidents).toBeGreaterThanOrEqual(0);
    expect(globalBody.kpis.unassignedIncidents).toBeGreaterThanOrEqual(0);
    expect(globalBody.statusDistribution).toHaveLength(7);
    expect(globalBody.priorityDistribution).toHaveLength(4);
    expect(globalBody.categoryDistribution).toHaveLength(6);
    expect(globalBody.trend).toHaveLength(14);
    expect(globalBody.recentIncidents.length).toBeLessThanOrEqual(5);
    expect(globalBody.recentIncidents.length).toBeGreaterThan(0);

    const ownDashboard = await request(app)
      .get('/api/dashboard')
      .set(auth(reporter.accessToken))
      .expect(200);
    const ownBody = ownDashboard.body as Dashboard;

    expect(ownBody.scope).toBe('OWN');
    expect(
      ownBody.recentIncidents.every(
        (incident) => incident.reporter.id === reporter.user.id,
      ),
    ).toBe(true);
    expect(
      ownBody.statusDistribution.reduce((sum, item) => sum + item.count, 0),
    ).toBe(ownBody.kpis.totalIncidents);

    const ownList = await request(app)
      .get('/api/incidents')
      .query({ pageSize: 1 })
      .set(auth(reporter.accessToken))
      .expect(200);
    expect((ownList.body as PaginatedIncidents).pagination.total).toBe(
      ownBody.kpis.totalIncidents,
    );
  });
});
