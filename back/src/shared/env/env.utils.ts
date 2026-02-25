import { z } from 'zod';

export const parseEnv = <T extends z.ZodTypeAny>(schema: T): z.infer<T> => {
  const result = schema.safeParse(process.env);

  if (!result.success) {
    const details = result.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join('; ');
    throw new Error(`Invalid environment configuration: ${details}`);
  }

  return result.data;
};

export const env = <T>(name: string): T | undefined => {
  const value = process.env[name];

  if (value === undefined) {
    return undefined;
  }

  // Preserve raw values for zod.coerce transforms when needed.
  return value as T;
};
