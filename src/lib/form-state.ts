export type FormState =
  | {
      errors?: Partial<Record<string, string[]>>;
      message?: string;
      success?: boolean;
      values?: Record<string, string>;
    }
  | undefined;
