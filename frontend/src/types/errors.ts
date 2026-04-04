export interface ProblemDetail {
  type: string;
  title: string;
  status: number;
  detail?: string;
  instance?: string;
  violations?: FieldViolation[];
}

export interface FieldViolation {
  field: string;
  message: string;
}

export interface AppError {
  status: number;
  title: string;
  detail: string;
  violations: FieldViolation[];
}
