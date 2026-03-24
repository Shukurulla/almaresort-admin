"use client";

import { forwardRef, ChangeEvent } from "react";
import { Input } from "./input";

function formatPhone(value: string): string {
  // Strip everything except digits
  const digits = value.replace(/\D/g, "");

  // Ensure starts with 7 (Kazakhstan)
  const d = digits.startsWith("7") ? digits : digits.startsWith("8") ? "7" + digits.slice(1) : "7" + digits;

  let result = "+7";
  if (d.length > 1) result += " (" + d.slice(1, 4);
  if (d.length >= 4) result += ") " + d.slice(4, 7);
  if (d.length >= 7) result += "-" + d.slice(7, 9);
  if (d.length >= 9) result += "-" + d.slice(9, 11);

  return result;
}

// Returns raw +7XXXXXXXXXX for API
export function toRawPhone(formatted: string): string {
  const digits = formatted.replace(/\D/g, "");
  return "+" + digits;
}

interface PhoneInputProps {
  value: string;
  onChange: (formatted: string) => void;
  placeholder?: string;
  id?: string;
}

export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ value, onChange, placeholder, id }, ref) => {
    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      // If user cleared everything, reset
      if (raw.length <= 2) {
        onChange("+7");
        return;
      }
      onChange(formatPhone(raw));
    };

    return (
      <Input
        ref={ref}
        id={id}
        type="tel"
        value={value || "+7"}
        onChange={handleChange}
        placeholder={placeholder || "+7 (700) 123-45-67"}
        maxLength={18}
      />
    );
  }
);

PhoneInput.displayName = "PhoneInput";
