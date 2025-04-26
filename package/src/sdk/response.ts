import { AutumnError } from "./error";

type Success<T> = {
  data: T;
  error: null;
};

type Failure<E> = {
  data: null;
  error: E;
};

export type Result<T, E> = Success<T> | Failure<E>;
export type AutumnPromise<T> = Promise<Result<T, AutumnError>>;
