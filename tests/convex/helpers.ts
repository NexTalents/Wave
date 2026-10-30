import { convexTest } from "convex-test"
import schema from "../../convex/schema"

interface GlobImportMeta extends ImportMeta {
  glob<T = unknown>(pattern: string): Record<string, () => Promise<T>>
}

const modules = (import.meta as GlobImportMeta).glob("../../convex/**/*.{ts,tsx}")

export function makeTest() {
  return convexTest(schema, modules)
}

export function identity(key: string) {
  return {
    tokenIdentifier: `test|${key}`,
    subject: key,
    email: `${key}@wave.test`,
    name: key,
  }
}
