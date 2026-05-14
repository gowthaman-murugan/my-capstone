import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { validateData, getErrorFields } from './validate';

const personSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  age: z.number().int().positive('Age must be positive'),
});

describe('validateData', () => {
  it('should return success with parsed data for valid input', () => {
    const result = validateData(personSchema, { name: 'Alice', age: 30 });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ name: 'Alice', age: 30 });
    }
  });

  it('should return field errors for schema violations', () => {
    const result = validateData(personSchema, { name: '', age: -5 });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.length).toBeGreaterThan(0);
      const fields = result.errors.map(e => e.field);
      expect(fields).toContain('name');
    }
  });

  it('should return errors for missing required fields', () => {
    const result = validateData(personSchema, {});

    expect(result.success).toBe(false);
    if (!result.success) {
      const fields = result.errors.map(e => e.field);
      expect(fields).toContain('name');
      expect(fields).toContain('age');
    }
  });

  it('should return the first message per field when multiple errors exist', () => {
    const result = validateData(personSchema, { name: '', age: 'not-a-number' });

    expect(result.success).toBe(false);
    if (!result.success) {
      const nameError = result.errors.find(e => e.field === 'name');
      expect(nameError).toBeDefined();
      expect(typeof nameError!.message).toBe('string');
    }
  });

  it('should return a generic unknown error for non-Zod exceptions', () => {
    // Simulate a schema whose parse() throws an unexpected (non-Zod) error
    const brokenSchema = {
      parse: () => {
        throw new Error('unexpected internal failure');
      },
    } as unknown as z.ZodSchema;

    const result = validateData(brokenSchema, {});

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toEqual({ field: 'unknown', message: 'Validation failed' });
    }
  });
});

describe('getErrorFields', () => {
  it('should convert a validation errors array into a key-value record', () => {
    const errors = [
      { field: 'name', message: 'Name is required' },
      { field: 'email', message: 'Invalid email format' },
    ];

    const result = getErrorFields(errors);

    expect(result).toEqual({
      name: 'Name is required',
      email: 'Invalid email format',
    });
  });

  it('should return an empty record for an empty errors array', () => {
    const result = getErrorFields([]);

    expect(result).toEqual({});
  });

  it('should overwrite earlier entries when the same field appears twice', () => {
    const errors = [
      { field: 'name', message: 'First message' },
      { field: 'name', message: 'Second message' },
    ];

    const result = getErrorFields(errors);

    expect(result.name).toBe('Second message');
    expect(Object.keys(result)).toHaveLength(1);
  });
});
