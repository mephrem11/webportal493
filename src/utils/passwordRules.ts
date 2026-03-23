export type PasswordRuleState = {
  hasLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasDigit: boolean;
  hasSpecial: boolean;
};

export const PASSWORD_RULE_TEXTS = {
  hasLength: "Length: 5 to 10 characters",
  hasUppercase: "Uppercase letter: At least 1 (A-Z)",
  hasLowercase: "Lowercase letter: At least 1 (a-z)",
  hasDigit: "Number: At least 1 digit (0-9)",
  hasSpecial: "Special character: At least 1 symbol (! @ # $ % & *)",
} as const;

const SPECIAL_REGEX = /[!@#$%&*]/;

export function getPasswordRuleState(password: string): PasswordRuleState {
  return {
    hasLength: password.length >= 5 && password.length <= 10,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasDigit: /[0-9]/.test(password),
    hasSpecial: SPECIAL_REGEX.test(password),
  };
}

export function isPasswordCompliant(password: string): boolean {
  const state = getPasswordRuleState(password);
  return Object.values(state).every(Boolean);
}
