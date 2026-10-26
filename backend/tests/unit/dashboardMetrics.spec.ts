import { describe, expect, it } from 'vitest';
import {
  buildDailyTrend,
  computeResolutionMetrics,
  type ResolutionSample,
} from '../../src/domain/dashboardMetrics';

const now = new Date('2026-03-15T18:30:00.000Z');

describe('métricas del dashboard', () => {
  it('devuelve métricas nulas sin resoluciones', () => {
    expect(computeResolutionMetrics([])).toEqual({
      resolvedCount: 0,
      averageResolutionHours: null,
      slaComplianceRate: null,
    });
  });

  it('calcula promedio de resolución y cumplimiento SLA', () => {
    const samples: ResolutionSample[] = [
      {
        createdAt: new Date('2026-03-01T10:00:00.000Z'),
        resolvedAt: new Date('2026-03-01T14:00:00.000Z'),
        slaDueAt: new Date('2026-03-01T18:00:00.000Z'),
      },
      {
        createdAt: new Date('2026-03-02T10:00:00.000Z'),
        resolvedAt: new Date('2026-03-02T22:00:00.000Z'),
        slaDueAt: new Date('2026-03-02T18:00:00.000Z'),
      },
      {
        createdAt: new Date('2026-03-03T10:00:00.000Z'),
        resolvedAt: null,
        slaDueAt: new Date('2026-03-04T10:00:00.000Z'),
      },
    ];

    expect(computeResolutionMetrics(samples)).toEqual({
      resolvedCount: 2,
      averageResolutionHours: 8,
      slaComplianceRate: 50,
    });
  });

  it('no acepta tiempos de resolución negativos por datos inconsistentes', () => {
    const metrics = computeResolutionMetrics([
      {
        createdAt: new Date('2026-03-03T10:00:00.000Z'),
        resolvedAt: new Date('2026-03-03T09:00:00.000Z'),
        slaDueAt: new Date('2026-03-04T10:00:00.000Z'),
      },
    ]);

    expect(metrics.averageResolutionHours).toBe(0);
    expect(metrics.slaComplianceRate).toBe(100);
  });

  it('construye una serie diaria de 14 días con ceros y conteos', () => {
    const trend = buildDailyTrend(
      [
        {
          createdAt: new Date('2026-03-15T08:00:00.000Z'),
          resolvedAt: new Date('2026-03-15T10:00:00.000Z'),
        },
        {
          createdAt: new Date('2026-03-14T08:00:00.000Z'),
          resolvedAt: null,
        },
        {
          createdAt: new Date('2026-02-01T08:00:00.000Z'),
          resolvedAt: new Date('2026-03-14T12:00:00.000Z'),
        },
      ],
      now,
      14,
    );

    expect(trend).toHaveLength(14);
    expect(trend[0]?.date).toBe('2026-03-02');
    expect(trend[12]).toEqual({ date: '2026-03-14', created: 1, resolved: 1 });
    expect(trend[13]).toEqual({ date: '2026-03-15', created: 1, resolved: 1 });
  });

  it('siempre incluye al menos un día', () => {
    const trend = buildDailyTrend([], now, 0);
    expect(trend).toHaveLength(1);
    expect(trend[0]?.date).toBe('2026-03-15');
  });
});
