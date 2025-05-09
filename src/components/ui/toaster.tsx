import React from "react";
import { ToastProvider } from "./toast";
import { useToast } from "./use-toast";

export function Toaster() {
  // No need to access toasts array, our implementation uses a single toast state
  return (
    <ToastProvider />
  );
}
