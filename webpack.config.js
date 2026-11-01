const fs = require('fs')
const path = require('path')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')

function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) return {}
  const result = {}
  const text = fs.readFileSync(filePath, 'utf8')
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq <= 0) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    result[key] = value
  }
  return result
}

function portFromUrl(url, fallback) {
  try {
    const port = Number(new URL(url).port)
    return port || fallback
  } catch (error) {
    return fallback
  }
}

module.exports = (env, argv) => {
  const mode = argv.mode || 'development'
  const envFile = mode === 'production' ? '.env.production.local' : '.env.development'
  const vars = loadEnv(path.resolve(__dirname, envFile))
  const mainUrl = vars.REACT_APP_MAIN_URL || 'http://localhost:3001/'
  const port = portFromUrl(mainUrl, 3001)
  const definitions = {
    'process.env.NODE_ENV': JSON.stringify(mode),
  }

  for (const [key, value] of Object.entries(vars)) {
    if (key.startsWith('REACT_APP_')) {
      definitions[`process.env.${key}`] = JSON.stringify(value)
    }
  }

  return {
    entry: './src/index.js',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'bundle.js',
      publicPath: '/',
      clean: true,
    },
    module: {
      rules: [
        {
          test: /\.jsx?$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: [
                ['@babel/preset-env', { targets: 'defaults' }],
                ['@babel/preset-react', { runtime: 'automatic' }],
              ],
            },
          },
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader'],
        },
        {
          test: /\.(woff2?|ttf|eot)$/,
          type: 'asset/resource',
        },
      ],
    },
    resolve: {
      extensions: ['.js', '.jsx'],
      alias: {
        components: path.resolve(__dirname, 'src/components'),
      },
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: './public/index.html',
      }),
      new webpack.DefinePlugin(definitions),
    ],
    devServer: {
      static: {
        directory: path.resolve(__dirname, 'public'),
      },
      host: 'localhost',
      port,
      hot: true,
      historyApiFallback: true,
      proxy: {
        '/api': 'http://localhost:4000',
      },
    },
  }
}
