// Test-only: lets `node --experimental-strip-types` resolve the extensionless imports Metro/TypeScript use.
import { register } from "node:module";
register("./resolve-hook.mjs", import.meta.url);
