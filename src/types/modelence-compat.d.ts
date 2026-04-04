declare module 'modelence' {
  export class AuthError extends Error {
    constructor(message: string);
  }

  export function time(input: string): number;
}

declare module 'modelence/server' {
  export type ObjectId = string;
  export type UserInfo = {
    id: string;
    email?: string;
    handle?: string;
  };

  export type Module = Record<string, unknown>;

  export function startApp(input: Record<string, unknown>): void;
  export function getConfig(path: string): unknown;
  export function dbUsers(): unknown;

  export const Store: Record<string, unknown>;
  export const schema: Record<string, unknown>;
}
