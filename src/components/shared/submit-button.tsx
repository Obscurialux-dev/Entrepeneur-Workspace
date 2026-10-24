"use client";

import * as React from "react";
import { useFormStatus } from "react-dom";
import { Button, type ButtonProps } from "@/components/ui/button";

interface SubmitButtonProps extends Omit<ButtonProps, "type" | "children"> {
  children: React.ReactNode;
  pendingLabel?: string;
}

/**
 * Submit button that reflects the enclosing form's pending state.
 * Must be rendered inside a `<form>` that uses a Server Action.
 */
export function SubmitButton({
  children,
  pendingLabel,
  disabled,
  ...props
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending || disabled} aria-busy={pending} {...props}>
      {pending ? (pendingLabel ?? "Menyimpan…") : children}
    </Button>
  );
}
