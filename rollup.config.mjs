import commonjs from "@rollup/plugin-commonjs";
import nodeResolve from "@rollup/plugin-node-resolve";
import terser from "@rollup/plugin-terser";
import typescript from "@rollup/plugin-typescript";
import path from "node:path";
import url from "node:url";
import { execSync } from "node:child_process";

const isWatching = !!process.env.ROLLUP_WATCH;
const sdPlugin = "com.eladavron.litra-glow-commander.sdPlugin";
const runtimePackageJson = {
  main: "plugin.js",
  dependencies: {
    "@elgato/streamdeck": "^2.0.0",
    litra: "^4.5.1"
  }
};

/** @type {import('rollup').RollupOptions} */
const config = {
  input: "src/plugin.ts",
  output: {
    file: `${sdPlugin}/bin/plugin.js`,
    format: "cjs",                  // CommonJS so __dirname works
    inlineDynamicImports: true,     // Prevent multiple chunks
    sourcemap: isWatching,
    exports: "auto",
    sourcemapPathTransform: (rel, mapPath) =>
      url.pathToFileURL(path.resolve(path.dirname(mapPath), rel)).href
  },
  external: [
    // Let Node load these normally (native / CJS friendly)
    "litra"
  ],
  plugins: [
    {
      name: "watch-externals",
      buildStart() {
        this.addWatchFile(`${sdPlugin}/manifest.json`);
      },
    },
    typescript({ sourceMap: isWatching }),
    nodeResolve({ preferBuiltins: true, exportConditions: ["node"] }),
    commonjs(),
    !isWatching && terser(),
    {
      name: "emit-package-json",
      generateBundle() {
        this.emitFile({
          fileName: "package.json",
          type: "asset",
          source: `${JSON.stringify(runtimePackageJson, null, 2)}\n`
        });
      }
    },
    {
      name: "npm-install-runtime-dependencies",
      writeBundle() {
        execSync("npm install --omit=dev", {
          cwd: `${sdPlugin}/bin`,
          stdio: "inherit"
        });
      }
    }
  ]
};

export default config;
