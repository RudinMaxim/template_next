import { renderHook, act } from '@testing-library/react';

import { useCaptcha } from '../useCaptcha';

describe('useCaptcha', () => {
  it('should initialize with default values', () => {
    const { result } = renderHook(() => useCaptcha());
    
    expect(result.current.token).toBe('');
    expect(result.current.status).toBe('idle');
    expect(result.current.isVisible).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should handle success correctly', () => {
    const onSuccess = jest.fn();
    const { result } = renderHook(() => useCaptcha({ onSuccess }));

    act(() => {
      result.current.handleSuccess('test-token');
    });

    expect(result.current.token).toBe('test-token');
    expect(result.current.status).toBe('success');
    expect(result.current.error).toBeNull();
    expect(onSuccess).toHaveBeenCalledWith('test-token');
  });

  it('should handle error correctly', () => {
    const onError = jest.fn();
    const { result } = renderHook(() => useCaptcha({ onError }));

    act(() => {
      result.current.handleError('test-error');
    });

    expect(result.current.status).toBe('error');
    expect(result.current.error).toBe('test-error');
    expect(onError).toHaveBeenCalledWith('test-error');
  });

  it('should handle visibility change', () => {
    const onVisibilityChange = jest.fn();
    const { result } = renderHook(() => useCaptcha({ onVisibilityChange }));

    act(() => {
      result.current.handleVisibilityChange(true);
    });

    expect(result.current.isVisible).toBe(true);
    expect(onVisibilityChange).toHaveBeenCalledWith(true);
  });
});

