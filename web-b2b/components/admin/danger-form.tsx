"use client";

import type { ReactNode } from "react";

type DangerFormProps = {
  action: (formData: FormData) => Promise<void>;
  confirmMessage: string;
  submitLabel?: string;
  className?: string;
  children?: ReactNode;
};

export function DangerForm({ action, confirmMessage, submitLabel = "Delete", className, children }: DangerFormProps) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm(confirmMessage)) e.preventDefault();
      }}
      className={className}
    >
      {children}
      <button type="submit" className="btn-danger">
        {submitLabel}
      </button>
    </form>
  );
}
