declare module 'modelence' {
  export class AuthError extends Error {
    constructor(message: string);
  }

  export interface TimeHelper {
    (input: string): number;
    days(value: number): number;
    hours(value: number): number;
    minutes(value: number): number;
  }

  export const time: TimeHelper;
}

declare module 'modelence/server' {
  export class ObjectId {
    constructor(value?: string);
    toString(): string;
  }

  export type UserInfo = {
    id: string;
    email?: string;
    handle?: string;
  };

  export class Module {
    constructor(name: string, definition: Record<string, unknown>);
  }

  export class Store<TDoc extends Record<string, unknown> = Record<string, unknown>> {
    constructor(name: string, options: Record<string, unknown>);
    fetch(
      filter?: Record<string, unknown>,
      options?: Record<string, unknown>
    ): Promise<Array<TDoc & { _id: ObjectId }>>;
    requireOne(filter: Record<string, unknown>): Promise<TDoc & { _id: ObjectId }>;
    insertOne(doc: Record<string, unknown>): Promise<{ insertedId: ObjectId }>;
    updateOne(
      filter: Record<string, unknown>,
      update: Record<string, unknown>
    ): Promise<{ modifiedCount: number }>;
    deleteOne(filter: Record<string, unknown>): Promise<{ deletedCount: number }>;
  }

  export type SchemaField = {
    optional(): SchemaField;
  };

  export interface SchemaBuilder {
    string(): SchemaField;
    number(): SchemaField;
    boolean(): SchemaField;
    date(): SchemaField;
    objectId(): SchemaField;
    array(item: SchemaField): SchemaField;
  }

  export function startApp(input: Record<string, unknown>): void;
  export function getConfig(path: string): unknown;

  export const dbUsers: Store;
  export const schema: SchemaBuilder;
}
