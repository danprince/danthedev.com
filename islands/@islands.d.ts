/**
 * Normally third party modules will be resolved through an import map and at
 * build time they'll also be installed in node_modules (hopefully with some
 * types).
 *
 * However, there are some modules that I only really care about loading at
 * runtime. They shouldn't become part of the global import map. This
 * declaration stops TypeScript from freaking out about the ones that come
 * from esm.sh.
 */
declare module "https://esm.sh/*" {
  const mod: any;
  export = mod;
}

/**
 * Globally declared helper types for islands so that they don't need to import
 * these types themselves (often a bit messy inside JSDoc).
 */
declare namespace Islands {
  export type Preact<P = {}> = import("preact").FunctionComponent<P>;
}
