import replace from 'rollup-plugin-replace';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import globals from 'rollup-plugin-node-globals';
import builtins from 'rollup-plugin-node-builtins';
import autoExternal from 'rollup-plugin-auto-external';
import json from 'rollup-plugin-json';

export default {
  input: "index",
  output: {
    extend: true,
    file: "build/servers.js",
    format: "cjs"
  },
  plugins: [
    autoExternal(),
    json({
      exclude: [ "node_modules/*" ]
    }),
    resolve({
      preferBuiltins: true
    }),
    commonjs({
      ignore: [ "conditional-runtime-dependency" ]
    }),
    globals(),
    builtins()
  ],
  external: [
    "https",
    "http",
    "fs",
    "crypto",
    "bcrypt",
    "better-sqlite3"
  ]
};
