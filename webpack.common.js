/* eslint-disable @typescript-eslint/no-var-requires */
/*
Copyright IBM Corporation 2020

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

const path = require('path');
const Dotenv = require('dotenv-webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');

module.exports = () => {
    return {
        entry: {
            app: path.resolve(__dirname, 'src', 'index.tsx'),
        },
        module: {
            rules: [
                {
                    test: /\.(tsx|ts|jsx)?$/,
                    include: [path.resolve(__dirname, 'src')],
                    use: [
                        {
                            loader: 'ts-loader',
                            options: { experimentalWatchApi: true },
                        },
                    ],
                },
                {
                    test: /\.(svg|jpg|jpeg|png|gif|ttf|eot|woff|woff2)$/i,
                    include: [path.resolve(__dirname, 'src')],
                    type: 'asset/resource',
                },
            ],
        },
        output: {
            filename: '[name].bundle.js',
            path: path.resolve(__dirname, 'dist'),
        },
        plugins: [
            new HtmlWebpackPlugin({
                template: path.resolve(__dirname, 'src', 'index.html'),
                favicon: path.resolve(__dirname, 'src', 'app', 'assets', 'favicon.ico'),
            }),
            new Dotenv({ systemvars: true, silent: true }),
        ],
        resolve: {
            extensions: ['.js', '.ts', '.tsx', '.jsx'],
            plugins: [
                new TsconfigPathsPlugin({ configFile: path.resolve(__dirname, 'tsconfig.json') }),
            ],
            symlinks: true,
            cacheWithContext: false,
        },
    };
};
