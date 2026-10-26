import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Pagination } from './Pagination';

function renderPagination(overrides: Partial<Parameters<typeof Pagination>[0]> = {}) {
  const onPageChange = vi.fn();

  render(
    <Pagination
      page={2}
      pageSize={10}
      total={45}
      totalPages={5}
      onPageChange={onPageChange}
      {...overrides}
    />,
  );

  return { onPageChange };
}

describe('Pagination', () => {
  it('muestra el rango de resultados y la página actual', () => {
    renderPagination();

    const summary = screen.getByText(/Mostrando/);
    expect(summary.textContent).toContain('11');
    expect(summary.textContent).toContain('20');
    expect(summary.textContent).toContain('45');
    expect(screen.getByRole('button', { name: 'Página 2' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('navega a la página seleccionada', () => {
    const { onPageChange } = renderPagination();

    fireEvent.click(screen.getByRole('button', { name: 'Página 3' }));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it('navega con los botones anterior y siguiente', () => {
    const { onPageChange } = renderPagination();

    fireEvent.click(screen.getByRole('button', { name: 'Página anterior' }));
    fireEvent.click(screen.getByRole('button', { name: 'Página siguiente' }));

    expect(onPageChange).toHaveBeenNthCalledWith(1, 1);
    expect(onPageChange).toHaveBeenNthCalledWith(2, 3);
  });

  it('deshabilita los botones de navegación en los extremos', () => {
    const { rerender } = render(
      <Pagination
        page={1}
        pageSize={10}
        total={45}
        totalPages={5}
        onPageChange={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: 'Página anterior' })).toBeDisabled();

    rerender(
      <Pagination
        page={5}
        pageSize={10}
        total={45}
        totalPages={5}
        onPageChange={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: 'Página siguiente' })).toBeDisabled();
  });

  it('no navega cuando está deshabilitada', () => {
    const { onPageChange } = renderPagination({ disabled: true });

    fireEvent.click(screen.getByRole('button', { name: 'Página 3' }));
    expect(onPageChange).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Página 3' })).toBeDisabled();
  });

  it('muestra "Sin resultados" cuando el total es cero', () => {
    renderPagination({ total: 0, totalPages: 0, page: 1 });

    expect(screen.getByText('Sin resultados')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Página anterior' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Página siguiente' })).toBeDisabled();
  });

  it('muestra elipsis para muchas páginas', () => {
    renderPagination({ page: 10, totalPages: 20, total: 200 });

    expect(screen.getAllByText('…')).toHaveLength(2);
  });
});
