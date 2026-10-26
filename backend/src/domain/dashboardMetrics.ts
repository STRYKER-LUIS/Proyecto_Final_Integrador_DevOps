export interface ResolutionSample {
  createdAt: Date;
  resolvedAt: Date | null;
  slaDueAt: Date;
}

export interface ResolutionMetrics {
  resolvedCount: number;
  averageResolutionHours: number | null;
  slaComplianceRate: number | null;
}

export interface TrendSample {
  createdAt: Date;
  resolvedAt: Date | null;
}

export interface TrendPoint {
  date: string;
  created: number;
  resolved: number;
}

export function computeResolutionMetrics(samples: ResolutionSample[]): ResolutionMetrics {
  const completed = samples.filter(
    (sample): sample is ResolutionSample & { resolvedAt: Date } => sample.resolvedAt !== null,
  );

  if (completed.length === 0) {
    return {
      resolvedCount: 0,
      averageResolutionHours: null,
      slaComplianceRate: null,
    };
  }

  const totalHours = completed.reduce(
    (sum, sample) =>
      sum + Math.max(0, sample.resolvedAt.getTime() - sample.createdAt.getTime()) / 3_600_000,
    0,
  );
  const onTime = completed.filter(
    (sample) => sample.resolvedAt.getTime() <= sample.slaDueAt.getTime(),
  ).length;

  return {
    resolvedCount: completed.length,
    averageResolutionHours: Math.round((totalHours / completed.length) * 10) / 10,
    slaComplianceRate: Math.round((onTime / completed.length) * 1000) / 10,
  };
}

export function buildDailyTrend(
  samples: TrendSample[],
  now: Date = new Date(),
  days = 14,
): TrendPoint[] {
  const safeDays = Math.max(1, Math.floor(days));
  const end = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );

  const points: TrendPoint[] = [];
  const byDate = new Map<string, TrendPoint>();

  for (let offset = safeDays - 1; offset >= 0; offset -= 1) {
    const day = new Date(end);
    day.setUTCDate(end.getUTCDate() - offset);
    const key = toDateKey(day);
    const point: TrendPoint = { date: key, created: 0, resolved: 0 };
    points.push(point);
    byDate.set(key, point);
  }

  for (const sample of samples) {
    const createdPoint = byDate.get(toDateKey(sample.createdAt));
    if (createdPoint) createdPoint.created += 1;

    if (sample.resolvedAt) {
      const resolvedPoint = byDate.get(toDateKey(sample.resolvedAt));
      if (resolvedPoint) resolvedPoint.resolved += 1;
    }
  }

  return points;
}

function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}
