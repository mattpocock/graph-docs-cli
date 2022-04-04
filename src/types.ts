import { z } from 'zod';

export type DB = Record<string, DBEntry>;

export interface DBEntry {
  name: string;
  deps: string[];
  color?: string;
  body: string;
  meta: z.infer<typeof ModuleMetaObject>;
}

export const ModuleMetaObject = z.object({
  title: z.string().optional(),
  deps: z.array(z.string()).optional().default([]),
  group: z.string().optional(),
});

export const ConfigObject = z.object({
  groups: z
    .array(
      z.object({
        id: z.string(),
        color: z.string(),
      }),
    )
    .optional()
    .default([]),
});

export type Config = z.infer<typeof ConfigObject>;
