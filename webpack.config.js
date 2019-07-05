let path = require("path");
let glob = require("globby");
let { CleanWebpackPlugin } = require("clean-webpack-plugin");
let MiniCssExtractPlugin = require("mini-css-extract-plugin");
let CopyPlugin = require("copy-webpack-plugin");
let Remarkable = require("@danprince/remarkable-site");
let { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer");

let isEnvDevelopment = process.env.NODE_ENV === "development";

let paths = {
  build: path.resolve("build"),
  public: path.resolve("public"),
  content: path.resolve("content"),
};

module.exports = {
  mode: isEnvDevelopment ? "development" : "production",

  devtool: isEnvDevelopment ? "eval" : "source-map",

  entry: {
    "common": "./src/common",
  },

  resolve: {
    extensions: [".js", ".jsx", ".json", ".ts", ".tsx"]
  },

  resolveLoader: {
    modules: [
      "packages",
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
      { from: paths.public, to: paths.build }
    ]),

    new MiniCssExtractPlugin({
      filename: isEnvDevelopment
        ? "css/[name].css"
        : "css/[name].[contenthash].css",
    }),

    ...glob
      .sync("./content/**/*.md")
      .map(Remarkable.createHtmlPlugin),

    ...(process.env.ANALYZE == null ? [] : [new BundleAnalyzerPlugin()]),
  ],

  output: {
    path: paths.build,
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
    contentBase: paths.public,
    watchContentBase: true,
    overlay: true,
    compress: true,
  },
};
