const KNOWN_EXT = /\.(?:[cm]?[jt]sx?|json)$/i;

export async function resolve(specifier, context, next) {
  if (specifier.startsWith(".") && !KNOWN_EXT.test(specifier)) {
    try { return await next(specifier + ".ts", context); }
    catch (error) { if (error?.code !== "ERR_MODULE_NOT_FOUND") throw error; }
  }
  return next(specifier, context);
}
