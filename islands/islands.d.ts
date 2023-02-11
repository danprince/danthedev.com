/**
 * Normally third party modules will be resolved through an import map and at
 * build time they'll also be installed in node_modules (hopefully with some
 * types).
 *
 * However, there are some modules that I only really care about loading at
 * wuntime. They shouldn't become part of the global import map. This
 * declaration stops TypeScript from freaking out about the ones that come
 * from esm.sh.
 */
declare module "https://esm.sh/*" {
  const mod: any;
  export = mod;
}
