import { isDef } from '../_internal/isDef';
import { isNil } from '../_internal/isNil';
import type { Decode } from './types';

export function pipe<A, B>(ab: Decode<A, B>): Decode<A, B>;

export function pipe<A, B, C>(ab: Decode<A, B>, bc: Decode<B, C>): Decode<A, C>;

export function pipe<A, B, C, D>(
  ab: Decode<A, B>,
  bc: Decode<B, C>,
  cd: Decode<C, D>,
): Decode<A, D>;

export function pipe<A, B, C, D, E>(
  ab: Decode<A, B>,
  bc: Decode<B, C>,
  cd: Decode<C, D>,
  de: Decode<D, E>,
): Decode<A, E>;

export function pipe<A, B, C, D, E, F>(
  ab: Decode<A, B>,
  bc: Decode<B, C>,
  cd: Decode<C, D>,
  de: Decode<D, E>,
  ef: Decode<E, F>,
): Decode<A, F>;

export function pipe<A, B, C, D, E, F, G>(
  ab: Decode<A, B>,
  bc: Decode<B, C>,
  cd: Decode<C, D>,
  de: Decode<D, E>,
  ef: Decode<E, F>,
  fg: Decode<F, G>,
): Decode<A, G>;

export function pipe<A, B, C, D, E, F, G, H>(
  ab: Decode<A, B>,
  bc: Decode<B, C>,
  cd: Decode<C, D>,
  de: Decode<D, E>,
  ef: Decode<E, F>,
  fg: Decode<F, G>,
  gh: Decode<G, H>,
): Decode<A, H>;

export function pipe<A, B, C, D, E, F, G, H, I>(
  ab: Decode<A, B>,
  bc: Decode<B, C>,
  cd: Decode<C, D>,
  de: Decode<D, E>,
  ef: Decode<E, F>,
  fg: Decode<F, G>,
  gh: Decode<G, H>,
  hi: Decode<H, I>,
): Decode<A, I>;

export function pipe<A, B, C, D, E, F, G, H, I, J>(
  ab: Decode<A, B>,
  bc: Decode<B, C>,
  cd: Decode<C, D>,
  de: Decode<D, E>,
  ef: Decode<E, F>,
  fg: Decode<F, G>,
  gh: Decode<G, H>,
  hi: Decode<H, I>,
  ij: Decode<I, J>,
): Decode<A, J>;

export function pipe<A, B, C, D, E, F, G, H, I, J, K>(
  ab: Decode<A, B>,
  bc: Decode<B, C>,
  cd: Decode<C, D>,
  de: Decode<D, E>,
  ef: Decode<E, F>,
  fg: Decode<F, G>,
  gh: Decode<G, H>,
  hi: Decode<H, I>,
  ij: Decode<I, J>,
  jk: Decode<J, K>,
): Decode<A, K>;

export function pipe<A, B>(
  ...decodes: Array<Decode<unknown, unknown>>
): Decode<A, B> {
  return (input) => {
    let output: unknown = input;

    for (const decode of decodes) {
      output = decode(output);

      if (isNil(output)) {
        return undefined;
      }
    }

    return output as B;
  };
}

export function mapItems<A, B>(ab: Decode<A, B>): Decode<A[], B[]>;

export function mapItems<A, B, C>(
  ab: Decode<A, B>,
  bc: Decode<B, C>,
): Decode<A[], C[]>;

export function mapItems<A, B, C, D>(
  ab: Decode<A, B>,
  bc: Decode<B, C>,
  cd: Decode<C, D>,
): Decode<A[], D[]>;

export function mapItems<A, B, C, D, E>(
  ab: Decode<A, B>,
  bc: Decode<B, C>,
  cd: Decode<C, D>,
  de: Decode<D, E>,
): Decode<A[], E[]>;

export function mapItems<A, B, C, D, E, F>(
  ab: Decode<A, B>,
  bc: Decode<B, C>,
  cd: Decode<C, D>,
  de: Decode<D, E>,
  ef: Decode<E, F>,
): Decode<A[], F[]>;

export function mapItems<A, B, C, D, E, F, G>(
  ab: Decode<A, B>,
  bc: Decode<B, C>,
  cd: Decode<C, D>,
  de: Decode<D, E>,
  ef: Decode<E, F>,
  fg: Decode<F, G>,
): Decode<A[], G[]>;

export function mapItems<A, B, C, D, E, F, G, H>(
  ab: Decode<A, B>,
  bc: Decode<B, C>,
  cd: Decode<C, D>,
  de: Decode<D, E>,
  ef: Decode<E, F>,
  fg: Decode<F, G>,
  gh: Decode<G, H>,
): Decode<A[], H[]>;

export function mapItems<A, B, C, D, E, F, G, H, I>(
  ab: Decode<A, B>,
  bc: Decode<B, C>,
  cd: Decode<C, D>,
  de: Decode<D, E>,
  ef: Decode<E, F>,
  fg: Decode<F, G>,
  gh: Decode<G, H>,
  hi: Decode<H, I>,
): Decode<A[], I[]>;

export function mapItems<A, B, C, D, E, F, G, H, I, J>(
  ab: Decode<A, B>,
  bc: Decode<B, C>,
  cd: Decode<C, D>,
  de: Decode<D, E>,
  ef: Decode<E, F>,
  fg: Decode<F, G>,
  gh: Decode<G, H>,
  hi: Decode<H, I>,
  ij: Decode<I, J>,
): Decode<A[], J[]>;

export function mapItems<A, B, C, D, E, F, G, H, I, J, K>(
  ab: Decode<A, B>,
  bc: Decode<B, C>,
  cd: Decode<C, D>,
  de: Decode<D, E>,
  ef: Decode<E, F>,
  fg: Decode<F, G>,
  gh: Decode<G, H>,
  hi: Decode<H, I>,
  ij: Decode<I, J>,
  jk: Decode<J, K>,
): Decode<A[], K[]>;

export function mapItems<A, B>(
  ...decodes: Array<Decode<unknown, unknown>>
): Decode<A[], B[]> {
  return (input) => {
    const values: B[] = [];

    for (const item of input) {
      let output: unknown = item;

      for (const decode of decodes) {
        output = decode(output);

        if (isNil(output)) {
          output = undefined;
          break;
        }
      }

      if (isDef(output)) {
        values.push(output as B);
      }
    }

    return values;
  };
}
