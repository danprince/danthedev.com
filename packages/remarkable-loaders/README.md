# Remarkable Loaders
Collection of useful loaders for transforming static site content. This module should be added to the `resolveLoader.modules` array in the site's webpack config.

### `raw-loader`
Just like [raw-loader](https://github.com/webpack-contrib/raw-loader) except it produces a commonjs module, making it friendlier to use in templates.

``` markdown
{{ require("!!raw-loader!./your-file.js") }}
```

### `link-loader`
Returns a formatted html link to the markdown file you are requiring.

``` markdown
{{ require("!!link-loader!./my-post.md") }}
```

