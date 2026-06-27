import type { ValidationResult } from "./types";

export interface Validator<TPlan> {
  validate(plan: TPlan): ValidationResult;
}
