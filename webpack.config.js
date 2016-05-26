var webpack = require('webpack');

module.exports = {
  output: {
    library: 'RMIClient',
    libraryTarget: 'umd',
  },

  module: {
    loaders: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel',
        query: {
          presets: ['es2015'],
        },
      },
    ],
  },

  node: {
    Buffer: false,
  },

  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
    }),
  ],
};
