let path = require("path");
let glob = require("globby");
let Remarkable = require("@danprince/remarkable-core");
let CopyPlugin = require("copy-webpack-plugin");
let MiniCssExtractPlugin = require("mini-css-extract-plugin");
let TerserJSPlugin = require("terser-webpack-plugin");
let OptimizeCSSAssetsPlugin = require("optimize-css-assets-webpack-plugin");
let { CleanWebpackPlugin } = require("clean-webpack-plugin");
let { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer");

let isEnvDevelopment = process.env.NODE_ENV === "development";

let config = {
  mode: isEnvDevelopment ? "development" : "production",

  devtool: isEnvDevelopment ? "eval" : "source-map",

  entry: {
    "page" : "./pages/page",
  },

  resolve: {
    extensions: [".js", ".jsx", ".json", ".ts", ".tsx"]
  },

  resolveLoader: {
    modules: [
      "packages/remarkable-loaders",
      "node_modules",
    ],
  },

  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        use: "ts-loader",
      },
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader,
          "css-loader",
        ]
      },
      {
        test: /\.(png|jpeg|jpg|gif)$/,
        use: [
          {
            loader: "file-loader",
            options: {
              name: isEnvDevelopment
                ? "media/[name].[ext]"
                : "media/[name].[contenthash].[ext]",
            },
          },
        ],
      },
    ]
  },

  plugins: [
    new CleanWebpackPlugin(),

    new CopyPlugin([
      { from: path.resolve("public"), to: path.resolve("build") }
    ]),

    new MiniCssExtractPlugin({
      filename: isEnvDevelopment
        ? "css/[name].css"
        : "css/[name].[contenthash].css",
    }),

    ...glob
      .sync("./pages/**/*.md")
      .map(Remarkable.createHtmlPlugin),

    ...(process.env.ANALYZE == null ? [] : [new BundleAnalyzerPlugin()]),
  ],

  optimization: {
    minimizer: [
      new TerserJSPlugin({}),
      new OptimizeCSSAssetsPlugin({})
    ],
  },

  output: {
    path: path.resolve("build"),
    publicPath: "/",

    filename: isEnvDevelopment
      ? "js/[name].js"
      : "js/[name].[contenthash].js",

    chunkFilename: isEnvDevelopment
      ? "js/[name].chunk.js"
      : "js/[name].[contenthash].chunk.js",
  },

  devServer: {
    stats: "minimal",
    contentBase: path.resolve("public"),
    watchContentBase: true,
    overlay: true,
    compress: true,
  },
};

module.exports = config;
