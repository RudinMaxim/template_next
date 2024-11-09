import { useCallback, useState } from 'react';

export interface CaptchaState {
  token: string;
  status: 'idle' | 'loading' | 'success' | 'error';
  isVisible: boolean;
  error: string | null;
}

export interface CaptchaCallbacks {
  onSuccess?: (token: string) => void;
  onError?: (error: string) => void;
  onVisibilityChange?: (visible: boolean) => void;
}


export const useCaptcha = (props: CaptchaCallbacks = {}) => {
  const [state, setState] = useState<CaptchaState>({
    token: '',
    status: 'idle',
    isVisible: false,
    error: null,
  });
  const [resetKey, setResetKey] = useState(0);

  const handleSuccess = useCallback(
    (token: string) => {
      setState((prev) => ({ ...prev, token, status: 'success', error: null }));
      props.onSuccess?.(token);
    },
    [props]
  );

  const handleError = useCallback(
    (error: string) => {
      setState((prev) => ({ ...prev, status: 'error', error }));
      props.onError?.(error);
    },
    [props]
  );

  const handleVisibilityChange = useCallback(
    (isVisible: boolean) => {
      setState((prev) => ({ ...prev, isVisible }));
      props.onVisibilityChange?.(isVisible);
    },
    [props]
  );

  const handleReset = useCallback(() => {
    setResetKey((prev) => prev + 1);
    setState({
      token: '',
      status: 'idle',
      isVisible: false,
      error: null,
    });
  }, []);

  return {
    ...state,
    resetKey,
    handleSuccess,
    handleError,
    handleVisibilityChange,
    handleReset,
  };
};
