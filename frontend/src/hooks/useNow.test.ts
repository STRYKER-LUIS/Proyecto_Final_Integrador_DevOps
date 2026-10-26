import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useNow } from './useNow';

describe('useNow', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('devuelve la fecha actual y la actualiza en el intervalo indicado', () => {
    vi.setSystemTime(new Date('2026-10-24T12:00:00'));

    const { result } = renderHook(() => useNow(1_000));
    expect(result.current).toEqual(new Date('2026-10-24T12:00:00'));

    act(() => {
      vi.advanceTimersByTime(1_000);
    });
    expect(result.current).toEqual(new Date('2026-10-24T12:00:01'));

    act(() => {
      vi.advanceTimersByTime(2_000);
    });
    expect(result.current).toEqual(new Date('2026-10-24T12:00:03'));
  });

  it('limpia el intervalo al desmontarse', () => {
    const clearInterval = vi.spyOn(window, 'clearInterval');
    const { unmount } = renderHook(() => useNow(1_000));

    unmount();

    expect(clearInterval).toHaveBeenCalled();
  });
});
