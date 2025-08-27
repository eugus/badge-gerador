"use client";

import { ToastProvider } from '@/components/ui/toast';
import { Toaster } from '@/components/ui/sonner';
import React from 'react';

export function ClientToastWrapper({ children }: { children: React.ReactNode }) {
  // Nenhum hook que altera HTML no primeiro render
  return (
    <ToastProvider>
      {children}
      <Toaster position="top-right" />
    </ToastProvider>
  );
}
