import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import globals from 'rollup-plugin-node-globals';
import builtins from 'rollup-plugin-node-builtins';

export default {
  input: "index",
  output: {
    extend: true,
    file: "build/servers.js",
    format: "cjs"
  },
  plugins: [
    resolve({
      main: true,
      jsnext: true,
      browser: true
    }),
    commonjs(),
    globals(),
    builtins()
  ],
  external: [
    "http",
    "https",
    "fs"
  ]
};
