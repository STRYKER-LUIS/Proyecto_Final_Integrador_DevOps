import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  CATEGORY_CHART_COLORS,
  PRIORITY_CHART_COLORS,
  STATUS_CHART_COLORS,
  TREND_COLORS,
} from '../../lib/chart';
import { formatNumber, formatShortDate } from '../../lib/format';
import {
  CATEGORY_LABELS,
  PRIORITY_LABELS,
  STATUS_LABELS,
} from '../../lib/labels';
import type {
  Category,
  IncidentStatus,
  Priority,
  TrendPoint,
} from '../../types';

const TOOLTIP_STYLE = {
  borderRadius: '12px',
  border: '1px solid #e2e8f0',
  boxShadow: '0 12px 32px rgba(15, 23, 42, 0.12)',
  fontSize: '12px',
  padding: '10px 12px',
};

export function TrendChart({ data }: { data: TrendPoint[] }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          <defs>
            <linearGradient id="createdGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={TREND_COLORS.created} stopOpacity={0.28} />
              <stop offset="100%" stopColor={TREND_COLORS.created} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="resolvedGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={TREND_COLORS.resolved} stopOpacity={0.24} />
              <stop offset="100%" stopColor={TREND_COLORS.resolved} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis
            dataKey="date"
            tickFormatter={(value) => formatShortDate(String(value))}
            tick={{ fontSize: 11, fill: '#64748b' }}
            axisLine={false}
            tickLine={false}
            minTickGap={24}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            axisLine={false}
            tickLine={false}
            width={36}
          />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            labelFormatter={(label) => formatShortDate(String(label))}
            formatter={(value, name) => [
              formatNumber(Number(value)),
              name === 'created' ? 'Creados' : 'Resueltos',
            ]}
          />
          <Legend
            iconType="circle"
            iconSize={8}
            formatter={(value) => (value === 'created' ? 'Creados' : 'Resueltos')}
            wrapperStyle={{ fontSize: 12, color: '#475569', paddingTop: 8 }}
          />
          <Area
            type="monotone"
            dataKey="created"
            stroke={TREND_COLORS.created}
            strokeWidth={2}
            fill="url(#createdGradient)"
            activeDot={{ r: 4, strokeWidth: 2, stroke: '#fff' }}
          />
          <Area
            type="monotone"
            dataKey="resolved"
            stroke={TREND_COLORS.resolved}
            strokeWidth={2}
            fill="url(#resolvedGradient)"
            activeDot={{ r: 4, strokeWidth: 2, stroke: '#fff' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function StatusDonut({
  data,
}: {
  data: Array<{ status: IncidentStatus; count: number }>;
}) {
  const filtered = data.filter((item) => item.count > 0);
  const total = data.reduce((sum, item) => sum + item.count, 0);

  if (filtered.length === 0) {
    return (
      <div className="flex h-56 items-center justify-center text-sm text-slate-400">
        Todavía no hay incidentes para distribuir.
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row lg:flex-col xl:flex-row">
      <div className="relative h-52 w-52 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={filtered}
              dataKey="count"
              nameKey="status"
              innerRadius={62}
              outerRadius={90}
              paddingAngle={2}
              stroke="none"
            >
              {filtered.map((entry) => (
                <Cell key={entry.status} fill={STATUS_CHART_COLORS[entry.status]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              formatter={(value, name) => [
                formatNumber(Number(value)),
                STATUS_LABELS[name as IncidentStatus] ?? String(name),
              ]}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total</span>
          <span className="text-2xl font-bold text-slate-900">{formatNumber(total)}</span>
        </div>
      </div>

      <ul className="grid w-full grid-cols-2 gap-x-4 gap-y-2 text-xs sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-1">
        {data.map((item) => (
          <li key={item.status} className="flex items-center justify-between gap-2">
            <span className="flex min-w-0 items-center gap-2 text-slate-600">
              <span
                className="size-2 shrink-0 rounded-full"
                style={{ backgroundColor: STATUS_CHART_COLORS[item.status] }}
              />
              <span className="truncate">{STATUS_LABELS[item.status]}</span>
            </span>
            <span className="font-semibold tabular-nums text-slate-900">{formatNumber(item.count)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function PriorityBars({
  data,
}: {
  data: Array<{ priority: Priority; count: number }>;
}) {
  const max = Math.max(1, ...data.map((item) => item.count));

  return (
    <div className="space-y-4">
      {data.map((item) => (
        <div key={item.priority}>
          <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
            <span className="flex items-center gap-2 font-medium text-slate-600">
              <span
                className="size-2 rounded-full"
                style={{ backgroundColor: PRIORITY_CHART_COLORS[item.priority] }}
              />
              {PRIORITY_LABELS[item.priority]}
            </span>
            <span className="font-semibold tabular-nums text-slate-900">{formatNumber(item.count)}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${(item.count / max) * 100}%`,
                backgroundColor: PRIORITY_CHART_COLORS[item.priority],
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function CategoryChart({
  data,
}: {
  data: Array<{ category: Category; count: number }>;
}) {
  const chartData = data.map((item) => ({
    name: CATEGORY_LABELS[item.category],
    count: item.count,
    category: item.category,
  }));
  const total = data.reduce((sum, item) => sum + item.count, 0);

  if (total === 0) {
    return (
      <div className="flex h-56 items-center justify-center text-sm text-slate-400">
        Sin incidentes activos por categoría.
      </div>
    );
  }

  return (
    <div className="h-60 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
          <XAxis type="number" hide allowDecimals={false} />
          <YAxis
            type="category"
            dataKey="name"
            width={82}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: '#64748b' }}
          />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            cursor={{ fill: '#f8fafc' }}
            formatter={(value) => [formatNumber(Number(value)), 'Incidentes']}
          />
          <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={16}>
            {chartData.map((entry) => (
              <Cell key={entry.category} fill={CATEGORY_CHART_COLORS[entry.category]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
