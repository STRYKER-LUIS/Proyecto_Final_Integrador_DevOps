import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../../src/app';
import { incidentService } from '../../src/services/incident.service';
import { DomainError } from '../../src/domain/errors';
import { AppError } from '../../src/utils/AppError';
import {
  agentUser,
  authHeader,
  makeIncident,
  makeIncidentDetail,
  reporterUser,
} from '../fixtures';

vi.mock('../../src/services/incident.service', () => ({
  incidentService: {
    list: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    assign: vi.fn(),
    changeStatus: vi.fn(),
    addComment: vi.fn(),
  },
}));

const app = createApp();
const service = vi.mocked(incidentService);

beforeEach(() => {
  vi.resetAllMocks();
});

describe('API de incidentes', () => {
  it('rechaza peticiones sin token de acceso', async () => {
    const response = await request(app).get('/api/incidents');

    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({
      error: { code: 'UNAUTHORIZED' },
    });
  });

  it('lista incidentes aplicando paginación y filtros validados', async () => {
    service.list.mockResolvedValue({
      items: [makeIncident()],
      pagination: { page: 2, pageSize: 5, total: 11, totalPages: 3 },
    });

    const response = await request(app)
      .get('/api/incidents?page=2&pageSize=5&status=ASSIGNED&priority=HIGH&search=VPN')
      .set('Authorization', authHeader(agentUser));

    expect(response.status).toBe(200);
    expect(response.headers['x-request-id']).toBeTypeOf('string');
    expect(response.body).toMatchObject({
      items: [{ ticketNumber: 'INC-000001' }],
      pagination: { page: 2, totalPages: 3 },
    });
    expect(service.list).toHaveBeenCalledWith(
      expect.objectContaining({ id: agentUser.id }),
      expect.objectContaining({
        page: 2,
        pageSize: 5,
        status: 'ASSIGNED',
        priority: 'HIGH',
        search: 'VPN',
        sort: 'newest',
      }),
    );
  });

  it('rechaza filtros inválidos y parámetros desconocidos con 422', async () => {
    const response = await request(app)
      .get('/api/incidents?pageSize=500&status=UNKNOWN&extra=valor')
      .set('Authorization', authHeader(agentUser));

    expect(response.status).toBe(422);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(response.body.error.details).toBeInstanceOf(Array);
    expect(service.list).not.toHaveBeenCalled();
  });

  it('crea un incidente con un DTO válido', async () => {
    service.create.mockResolvedValue(makeIncidentDetail());

    const payload = {
      title: 'Fallo de acceso al ERP',
      description: 'El sistema no permite iniciar sesión desde la red corporativa.',
      category: 'ACCESS',
      impact: 'CRITICAL',
      urgency: 'HIGH',
    };

    const response = await request(app)
      .post('/api/incidents')
      .set('Authorization', authHeader(reporterUser))
      .send(payload);

    expect(response.status).toBe(201);
    expect(response.body.ticketNumber).toBe('INC-000001');
    expect(service.create).toHaveBeenCalledWith(
      expect.objectContaining({ id: reporterUser.id }),
      payload,
    );
  });

  it('rechaza payloads incompletos o con campos desconocidos', async () => {
    const response = await request(app)
      .post('/api/incidents')
      .set('Authorization', authHeader(reporterUser))
      .send({
        title: 'Corto',
        description: 'Muy corto',
        category: 'ACCESS',
        impact: 'HIGH',
        urgency: 'HIGH',
        priority: 'CRITICAL',
      });

    expect(response.status).toBe(422);
    expect(response.body.error.details.length).toBeGreaterThanOrEqual(1);
    expect(service.create).not.toHaveBeenCalled();
  });

  it('impide que un reportante cambie el estado de un incidente', async () => {
    const response = await request(app)
      .patch('/api/incidents/1/status')
      .set('Authorization', authHeader(reporterUser))
      .send({ status: 'IN_PROGRESS' });

    expect(response.status).toBe(403);
    expect(service.changeStatus).not.toHaveBeenCalled();
  });

  it('permite que un agente cambie el estado y devuelve el detalle', async () => {
    service.changeStatus.mockResolvedValue(
      makeIncidentDetail({ status: 'IN_PROGRESS', allowedTransitions: ['ON_HOLD', 'RESOLVED'] }),
    );

    const response = await request(app)
      .patch('/api/incidents/1/status')
      .set('Authorization', authHeader(agentUser))
      .send({ status: 'IN_PROGRESS', note: 'Inicio de atención' });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('IN_PROGRESS');
    expect(service.changeStatus).toHaveBeenCalledWith(
      expect.objectContaining({ id: agentUser.id }),
      1,
      { status: 'IN_PROGRESS', note: 'Inicio de atención' },
    );
  });

  it('traduce errores de dominio a respuestas 409', async () => {
    service.changeStatus.mockRejectedValue(
      new DomainError('INVALID_STATUS_TRANSITION', 'Transición no permitida'),
    );

    const response = await request(app)
      .patch('/api/incidents/1/status')
      .set('Authorization', authHeader(agentUser))
      .send({ status: 'CLOSED' });

    expect(response.status).toBe(409);
    expect(response.body.error).toMatchObject({
      code: 'INVALID_STATUS_TRANSITION',
      message: 'Transición no permitida',
    });
  });

  it('traduce errores de negocio sin exponer detalles internos', async () => {
    service.getById.mockRejectedValue(
      AppError.notFound('Incidente no encontrado', 'INCIDENT_NOT_FOUND'),
    );

    const response = await request(app)
      .get('/api/incidents/999')
      .set('Authorization', authHeader(agentUser));

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('INCIDENT_NOT_FOUND');
  });

  it('oculta errores internos y responde 500 sin stack trace', async () => {
    service.list.mockRejectedValue(new Error('password=super-secreto db=produccion'));

    const response = await request(app)
      .get('/api/incidents')
      .set('Authorization', authHeader(agentUser));

    expect(response.status).toBe(500);
    expect(response.body.error.code).toBe('INTERNAL_SERVER_ERROR');
    expect(JSON.stringify(response.body)).not.toContain('super-secreto');
    expect(response.body.error.requestId).toBe(response.headers['x-request-id']);
  });

  it('valida el identificador de ruta', async () => {
    const response = await request(app)
      .get('/api/incidents/not-a-number')
      .set('Authorization', authHeader(agentUser));

    expect(response.status).toBe(422);
    expect(service.getById).not.toHaveBeenCalled();
  });

  it('valida comentarios y evita contenido vacío', async () => {
    const response = await request(app)
      .post('/api/incidents/1/comments')
      .set('Authorization', authHeader(agentUser))
      .send({ content: '   ' });

    expect(response.status).toBe(422);
    expect(service.addComment).not.toHaveBeenCalled();
  });

  it('devuelve 404 consistente para rutas inexistentes', async () => {
    const response = await request(app).get('/api/no-existe');

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
  });
});
