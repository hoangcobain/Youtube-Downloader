'use client';

import { useState, useEffect } from 'react';

export type ToastVariant = 'default' | 'destructive' | 'success';

export interface ToastProps {
  title?: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
  open?: boolean;
}

interface ToastState {
  open: boolean;
  data: ToastProps | null;
}

let toastState: ToastState = {
  open: false,
  data: null,
};

let setToastState: (state: ToastState) => void = () => { };

export function useToast() {
  const [state, setState] = useState<ToastState>(toastState);

  // Update the global setter when the component mounts
  useEffect(() => {
    setToastState = (newState) => {
      toastState = newState;
      setState(newState);
    };

    return () => {
      setToastState = () => { };
    };
  }, []);

  useEffect(() => {
    if (state.open && state.data?.duration) {
      const timer = setTimeout(() => {
        setToastState({ ...state, open: false });
      }, state.data.duration);

      return () => clearTimeout(timer);
    }
  }, [state.open, state.data]);

  return {
    toastState: state,
    toast: toast,
  };
}

export const toast = (props: ToastProps) => {
  setToastState({
    open: props.open !== false,
    data: {
      ...props,
      duration: props.duration || 5000,
    },
  });

  return props;
};
