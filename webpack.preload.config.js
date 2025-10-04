const path = require('path');

module.exports = {
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  entry: './electron/preload.cjs',
  target: 'electron-preload',
  output: {
    path: path.join(__dirname, 'electron', 'dist'),
    filename: 'preload.js',
  },
  node: {
    __dirname: false,
    __filename: false,
  },
  externals: {
    electron: 'commonjs electron',
  },
};
