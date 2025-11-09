#!/usr/bin/env node
const fs = require("node:fs/promises");
const path = require("node:path");
const { Linter } = require("eslint");
const rule = require("../eslint-rules/no-raw-colors.cjs");

const PROJECT_ROOT = path.resolve(__dirname, "..");
const SRC_DIR = path.join(PROJECT_ROOT, "src");
const VALID_EXTENSIONS = new Set([".js", ".jsx"]);

const linter = new Linter();
linter.defineRule("no-raw-colors", rule);
linter.defineRule("react-refresh/only-export-components", () => ({}));

const baseConfig = {
  env: {
    browser: true,
    es2021: true,
  },
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    ecmaFeatures: {
      jsx: true,
    },
  },
  rules: {
    "no-raw-colors": "error",
  },
};

async function collectFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];

  // eslint-disable-next-line no-restricted-syntax
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relative = path.relative(SRC_DIR, fullPath);

    if (entry.isDirectory()) {
      if (relative && relative.split(path.sep)[0] === "test") {
        continue;
      }
      files.push(...(await collectFiles(fullPath)));
      continue;
    }
    const extension = path.extname(entry.name);
    if (VALID_EXTENSIONS.has(extension)) {
      files.push(fullPath);
    }
  }

  return files;
}

async function run() {
  const files = await collectFiles(SRC_DIR);
  let hasErrors = false;

  // eslint-disable-next-line no-restricted-syntax
  for (const file of files) {
    const code = await fs.readFile(file, "utf8");
    const messages = linter.verify(code, baseConfig, { filename: file });
    if (messages.length > 0) {
      hasErrors = true;
      messages.forEach(message => {
        // eslint-disable-next-line no-console
        console.error(
          `${path.relative(PROJECT_ROOT, file)}:${message.line}:${message.column} ${message.message} (${message.ruleId})`
        );
      });
    }
  }

  if (hasErrors) {
    process.exitCode = 1;
  } else {
    // eslint-disable-next-line no-console
    console.log("Theme lint passed");
  }
}

run().catch(error => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exitCode = 1;
});
