import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { IncidentFiltersBar } from './IncidentFiltersBar';
import { DEFAULT_INCIDENT_FILTERS } from '../../lib/filters';
import type { IncidentFilters, PublicUser } from '../../types';

const AGENTS: PublicUser[] = [
  {
    id: 'agent-1',
    name: 'Diego Agente',
    email: 'diego@incidenthub.dev',
    role: 'AGENT',
  },
  {
    id: 'agent-2',
    name: 'Laura Soporte',
    email: 'laura@incidenthub.dev',
    role: 'AGENT',
  },
];

function renderFilters(
  filters: Partial<IncidentFilters> = {},
  showAssigneeFilter = true,
) {
  const onChange = vi.fn();
  const onClear = vi.fn();

  render(
    <IncidentFiltersBar
      filters={{ ...DEFAULT_INCIDENT_FILTERS, ...filters }}
      onChange={onChange}
      onClear={onClear}
      agents={AGENTS}
      showAssigneeFilter={showAssigneeFilter}
    />,
  );

  return { onChange, onClear };
}

describe('IncidentFiltersBar', () => {
  it('emite los cambios de búsqueda inmediatamente', () => {
    const { onChange } = renderFilters();

    fireEvent.change(screen.getByRole('searchbox', { name: 'Buscar incidentes' }), {
      target: { value: 'vpn' },
    });

    expect(onChange).toHaveBeenCalledWith({ search: 'vpn' });
  });

  it('limpia la búsqueda con el botón de la X', () => {
    const { onChange } = renderFilters({ search: 'vpn' });

    fireEvent.click(screen.getByRole('button', { name: 'Limpiar búsqueda' }));

    expect(onChange).toHaveBeenCalledWith({ search: '' });
  });

  it('aplica los filtros rápidos de asignación', () => {
    const { onChange } = renderFilters();

    fireEvent.click(screen.getByRole('button', { name: 'Sin asignar' }));
    expect(onChange).toHaveBeenCalledWith({
      unassigned: true,
      mine: false,
      assigneeId: undefined,
    });

    fireEvent.click(screen.getByRole('button', { name: 'Mis asignados' }));
    expect(onChange).toHaveBeenCalledWith({
      mine: true,
      unassigned: false,
      assigneeId: undefined,
    });
  });

  it('muestra el contador de filtros activos y permite limpiarlos', () => {
    const { onClear } = renderFilters({ search: 'vpn', status: 'NEW' });

    expect(screen.getByRole('button', { name: /Filtros/ }).textContent).toContain('2');

    fireEvent.click(screen.getByRole('button', { name: /Limpiar filtros/ }));
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it('oculta los filtros de responsable para reportantes', () => {
    renderFilters({}, false);

    expect(screen.queryByRole('button', { name: 'Mis asignados' })).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Filtrar por responsable')).not.toBeInTheDocument();
  });

  it('permite filtrar por un responsable concreto', () => {
    const { onChange } = renderFilters();

    fireEvent.change(screen.getByLabelText('Filtrar por responsable'), {
      target: { value: 'agent-2' },
    });

    expect(onChange).toHaveBeenCalledWith({
      assigneeId: 'agent-2',
      unassigned: false,
      mine: false,
    });
  });

  it('cambia el tamaño de página y vuelve a la primera página', () => {
    const { onChange } = renderFilters({ page: 3 });

    fireEvent.change(screen.getByLabelText('Incidentes por página'), {
      target: { value: '50' },
    });

    expect(onChange).toHaveBeenCalledWith({ pageSize: 50, page: 1 });
  });
});
