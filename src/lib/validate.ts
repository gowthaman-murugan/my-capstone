import { z, ZodError } from 'zod';

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: ValidationError[];
}

export function validateData<T>(schema: z.ZodSchema, data: unknown): ValidationResult<T> {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof ZodError) {
      const errors = error.flatten().fieldErrors;
      const formattedErrors: ValidationError[] = [];

      for (const [field, messages] of Object.entries(errors)) {
        if (messages && messages.length > 0) {
          formattedErrors.push({
            field,
            message: messages[0],
          });
        }
      }

      return {
        success: false,
        errors: formattedErrors,
      };
    }

    return {
      success: false,
      errors: [
        {
          field: 'unknown',
          message: 'Validation failed',
        },
      ],
    };
  }
}

export function getErrorFields(errors: ValidationError[]): Record<string, string> {
  return errors.reduce(
    (acc, error) => {
      acc[error.field] = error.message;
      return acc;
    },
    {} as Record<string, string>
  );
}
