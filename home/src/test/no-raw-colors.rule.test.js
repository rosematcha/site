import { describe, expect, it } from "vitest";
import { Linter } from "eslint";
import ruleModule from "../../eslint-rules/no-raw-colors.cjs";

const rule = ruleModule?.default ?? ruleModule;

const runRule = code => {
  const linter = new Linter();
  linter.defineRule("no-raw-colors", rule);
  return linter.verify(
    code,
    {
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
    },
    { filename: "inline.js" }
  );
};

describe("no-raw-colors ESLint rule", () => {
  it("allows CSS variables", () => {
    const results = runRule("const styles = { color: 'var(--text-primary)' };");
    expect(results).toHaveLength(0);
  });

  it("flags hex colors", () => {
    const results = runRule("const styles = { backgroundColor: '#fff' };");
    expect(results).toHaveLength(1);
    expect(results[0].messageId).toBe("unexpectedColor");
  });

  it("flags functional notation colors", () => {
    const results = runRule("const styles = { borderColor: 'rgb(0, 0, 0)' };");
    expect(results).toHaveLength(1);
    expect(results[0].messageId).toBe("unexpectedColor");
  });

  it("flags named colors in template literals", () => {
    const results = runRule("const styles = css`color: crimson;`;");
    expect(results).toHaveLength(1);
    expect(results[0].messageId).toBe("unexpectedColor");
  });
});
