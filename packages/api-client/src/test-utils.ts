import { vi } from "vitest";
import type { ShapersClient } from "./client";

export type TableResult = { data: unknown; error: unknown };

// A minimal stand-in for supabase-js's PostgrestFilterBuilder: every
// chain method (select/eq/in/order/is/or/limit/upsert/insert...) returns
// the same proxy, and awaiting it (or calling .maybeSingle()/.single())
// resolves to the canned { data, error } — same shape real supabase-js
// queries resolve to. Doesn't validate which filters were called with
// what; these tests are about the JS-side joining/fallback logic that
// runs on the result, not about asserting query construction.
function chainable(result: TableResult) {
  const proxy: object = new Proxy(
    {},
    {
      get(_target, prop) {
        if (prop === "then") {
          return (resolve: (value: TableResult) => void) => resolve(result);
        }
        if (prop === "maybeSingle" || prop === "single") {
          return () => Promise.resolve(result);
        }
        return () => proxy;
      },
    }
  );
  return proxy;
}

// Mocks client.from(table) to return a chainable query resolving to
// responses[table] — good enough for the api-client functions, which
// each query a given table at most once per call. Throws if a function
// under test queries a table the test didn't anticipate, so a missing
// mock fails loudly instead of silently returning undefined.
export function mockClientFromTables(responses: Record<string, TableResult>): ShapersClient {
  return {
    from: vi.fn((table: string) => {
      const result = responses[table];
      if (result === undefined) {
        throw new Error(`unexpected table: ${table}`);
      }
      return chainable(result);
    }),
  } as unknown as ShapersClient;
}

export function ok<T>(data: T): TableResult {
  return { data, error: null };
}
