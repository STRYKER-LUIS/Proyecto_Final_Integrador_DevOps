import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  CategoryIcon,
  CategoryLabel,
  PriorityBadge,
  SlaBadge,
  StatusBadge,
} from './IncidentBadges';
import {
  CATEGORIES,
  INCIDENT_STATUSES,
  PRIORITIES,
  SLA_STATES,
} from '../../types';
import {
  CATEGORY_LABELS,
  PRIORITY_LABELS,
  SLA_LABELS,
  STATUS_LABELS,
} from '../../lib/labels';

describe('StatusBadge', () => {
  it.each(INCIDENT_STATUSES)('renderiza la etiqueta del estado %s', (status) => {
    render(<StatusBadge status={status} />);
    expect(screen.getByText(STATUS_LABELS[status])).toBeInTheDocument();
  });
});

describe('PriorityBadge', () => {
  it.each(PRIORITIES)('renderiza la etiqueta de la prioridad %s', (priority) => {
    render(<PriorityBadge priority={priority} />);
    expect(screen.getByText(PRIORITY_LABELS[priority])).toBeInTheDocument();
  });
});

describe('SlaBadge', () => {
  it.each(SLA_STATES)('renderiza la etiqueta del estado SLA %s', (state) => {
    render(<SlaBadge state={state} />);
    expect(screen.getByText(SLA_LABELS[state])).toBeInTheDocument();
  });
});

describe('CategoryLabel y CategoryIcon', () => {
  it.each(CATEGORIES)('renderiza la categoría %s', (category) => {
    const { container } = render(<CategoryLabel category={category} />);

    expect(screen.getByText(CATEGORY_LABELS[category])).toBeInTheDocument();
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renderiza el icono de la categoría como decorativo', () => {
    const { container } = render(<CategoryIcon category="NETWORK" />);
    const icon = container.querySelector('svg');

    expect(icon).toHaveAttribute('aria-hidden', 'true');
  });
});
