const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = {
    entry: {
        background: './src/background/background.ts',
        newtab: './src/newtab/newtab.ts',
        popup: './src/popup/popup.ts',
        content: './src/content/content.ts'
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader'],
            },
            {
                test: /\.(png|jpg|jpeg|gif|svg)$/i,
                type: 'asset/resource',
            },
        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
        alias: {
            '@': path.resolve(__dirname, 'src'),
        },
    },
    plugins: [
        new CleanWebpackPlugin({
            cleanStaleWebpackAssets: false,
        }),
        new CopyPlugin({
            patterns: [
                {
                    from: path.resolve(__dirname, 'public/manifest.json'),
                    to: path.resolve(__dirname, 'dist'),
                },
                {
                    from: path.resolve(__dirname, 'public/icons'),
                    to: path.resolve(__dirname, 'dist/icons'),
                    noErrorOnMissing: true, // Esto evitará el error si la carpeta no existe
                    globOptions: {
                        ignore: ['**/.gitkeep'] // Ignora archivos .gitkeep
                    }
                },
                {
                    from: path.resolve(__dirname, 'src/styles'),
                    to: path.resolve(__dirname, 'dist/styles')
                },
            ],
        }),
        new HtmlWebpackPlugin({
            template: './src/newtab/newtab.html',
            filename: 'newtab.html',
            chunks: ['newtab'],
        }),
        new HtmlWebpackPlugin({
            template: './src/popup/popup.html',
            filename: 'popup.html',
            chunks: ['popup'],
        }),
    ],
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, 'dist'),
    },
};
