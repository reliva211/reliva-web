"use client";

import { useState, useEffect, useCallback } from "react";

interface UsernameValidation {
  available: boolean;
  message: string;
  isValidating: boolean;
}

export function useUsernameValidation(username: string) {
  const [validation, setValidation] = useState<UsernameValidation>({
    available: false,
    message: "",
    isValidating: false
  });

  // Simple debounce implementation
  const debounce = useCallback((func: Function, delay: number) => {
    let timeoutId: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(null, args), delay);
    };
  }, []);

  // Validation function
  const validateUsername = useCallback(async (usernameToValidate: string) => {
    if (!usernameToValidate || usernameToValidate.length < 3) {
      setValidation({
        available: false,
        message: usernameToValidate.length > 0 ? "Username must be at least 3 characters" : "",
        isValidating: false
      });
      return;
    }

    setValidation(prev => ({ ...prev, isValidating: true }));

    try {
      const response = await fetch("/api/validate-username", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username: usernameToValidate }),
      });

      const result = await response.json();
      
      setValidation({
        available: result.available,
        message: result.message,
        isValidating: false
      });
    } catch (error) {
      setValidation({
        available: false,
        message: "Error checking username availability",
        isValidating: false
      });
    }
  }, []);

  // Create debounced version of validation function
  const debouncedValidate = useCallback(
    debounce(validateUsername, 500),
    [validateUsername, debounce]
  );

  useEffect(() => {
    debouncedValidate(username);
  }, [username, debouncedValidate]);

  return validation;
}