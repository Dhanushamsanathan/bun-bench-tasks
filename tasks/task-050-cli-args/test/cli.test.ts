import { describe, test, expect } from "bun:test";
import {
  parseArgs,
  getCommand,
  getPositionalArgs,
  getOption,
  hasFlag,
  CLIApp,
  runCLI,
  getScriptName,
} from "../src/cli";

describe("CLI Arguments Tests", () => {
  // Simulate real Bun.argv structure:
  // [0] = bun executable path
  // [1] = script path
  // [2+] = user arguments
  const mockArgv = (userArgs: string[]): string[] => [
    "/usr/local/bin/bun",
    "/path/to/script.ts",
    ...userArgs,
  ];

  describe("parseArgs", () => {
    test("should identify correct command from argv", () => {
      const argv = mockArgv(["build", "--verbose"]);
      const parsed = parseArgs(argv);

      // BUG: Returns "/usr/local/bin/bun" instead of "build"
      expect(parsed.command).toBe("build");
    });

    test("should parse positional arguments correctly", () => {
      const argv = mockArgv(["copy", "source.txt", "dest.txt"]);
      const parsed = parseArgs(argv);

      // BUG: Includes script path "/path/to/script.ts" in positional
      expect(parsed.positional).toEqual(["copy", "source.txt", "dest.txt"]);
    });

    test("should parse flags correctly", () => {
      const argv = mockArgv(["--verbose", "--dry-run", "-f"]);
      const parsed = parseArgs(argv);

      expect(parsed.flags.verbose).toBe(true);
      expect(parsed.flags["dry-run"]).toBe(true);
      expect(parsed.flags.f).toBe(true);
    });

    test("should parse options with values", () => {
      const argv = mockArgv(["--output", "build/", "--config", "prod.json"]);
      const parsed = parseArgs(argv);

      expect(parsed.options.output).toBe("build/");
      expect(parsed.options.config).toBe("prod.json");
    });

    test("should handle mixed arguments", () => {
      const argv = mockArgv(["build", "--env", "production", "src/", "--verbose"]);
      const parsed = parseArgs(argv);

      expect(parsed.command).toBe("build");
      expect(parsed.positional).toContain("src/");
      expect(parsed.options.env).toBe("production");
      expect(parsed.flags.verbose).toBe(true);
    });
  });

  describe("getCommand", () => {
    test("should return first user argument as command", () => {
      const argv = mockArgv(["run", "test.ts"]);

      // BUG: Returns script path instead of "run"
      expect(getCommand(argv)).toBe("run");
    });

    test("should return undefined for no arguments", () => {
      const argv = mockArgv([]);

      // BUG: Returns script path instead of undefined
      expect(getCommand(argv)).toBeUndefined();
    });
  });

  describe("getPositionalArgs", () => {
    test("should return only user positional arguments", () => {
      const argv = mockArgv(["file1.txt", "file2.txt", "--verbose"]);
      const positional = getPositionalArgs(argv);

      // BUG: Includes script path in result
      expect(positional).toEqual(["file1.txt", "file2.txt"]);
      expect(positional).not.toContain("/path/to/script.ts");
    });

    test("should exclude flags and options", () => {
      const argv = mockArgv(["input.txt", "--output", "out.txt", "-v"]);
      const positional = getPositionalArgs(argv);

      expect(positional).toContain("input.txt");
      expect(positional).toContain("out.txt"); // Value of --output is positional
      expect(positional).not.toContain("--output");
    });
  });

  describe("getOption", () => {
    test("should get option value", () => {
      const argv = mockArgv(["--port", "3000"]);

      expect(getOption("port", argv)).toBe("3000");
    });

    test("should return undefined for missing option", () => {
      const argv = mockArgv(["--host", "localhost"]);

      expect(getOption("port", argv)).toBeUndefined();
    });

    test("should not match option in bun path", () => {
      // Edge case: what if bun path contains --something?
      const argv = [
        "/path/--config/bun",
        "/script.ts",
        "--port",
        "8080",
      ];

      // Should get 8080, not match from path
      expect(getOption("port", argv)).toBe("8080");
    });
  });

  describe("hasFlag", () => {
    test("should detect long flags", () => {
      const argv = mockArgv(["--verbose", "--debug"]);

      expect(hasFlag("verbose", argv)).toBe(true);
      expect(hasFlag("debug", argv)).toBe(true);
      expect(hasFlag("quiet", argv)).toBe(false);
    });

    test("should detect short flags", () => {
      const argv = mockArgv(["-v", "-d"]);

      expect(hasFlag("verbose", argv)).toBe(true); // -v
      expect(hasFlag("debug", argv)).toBe(true);   // -d
    });

    test("should not match in script path", () => {
      const argv = [
        "/usr/local/bin/bun",
        "/path/with--verbose/script.ts",
        "arg1",
      ];

      // BUG: May incorrectly match --verbose in path
      expect(hasFlag("verbose", argv)).toBe(false);
    });
  });

  describe("CLIApp", () => {
    test("should parse command correctly", () => {
      const app = new CLIApp(mockArgv(["deploy", "--env", "prod"]));

      // BUG: command is "/usr/local/bin/bun" instead of "deploy"
      expect(app.command).toBe("deploy");
    });

    test("should parse args without script path", () => {
      const app = new CLIApp(mockArgv(["file1.txt", "file2.txt"]));

      // BUG: args includes script path
      expect(app.args).toEqual(["file1.txt", "file2.txt"]);
      expect(app.args).not.toContain("/path/to/script.ts");
    });

    test("should parse --key=value style options", () => {
      const app = new CLIApp(mockArgv(["--port=3000", "--host=localhost"]));

      expect(app.getOption("port")).toBe("3000");
      expect(app.getOption("host")).toBe("localhost");
    });

    test("should handle combined short flags", () => {
      const app = new CLIApp(mockArgv(["-vdf"]));

      expect(app.hasFlag("v")).toBe(true);
      expect(app.hasFlag("d")).toBe(true);
      expect(app.hasFlag("f")).toBe(true);
    });

    test("should get argument by index (from user args)", () => {
      const app = new CLIApp(mockArgv(["copy", "src.txt", "dst.txt"]));

      // BUG: Index 0 should be "copy", not script path
      expect(app.getArg(0)).toBe("copy");
      expect(app.getArg(1)).toBe("src.txt");
      expect(app.getArg(2)).toBe("dst.txt");
    });
  });

  describe("runCLI", () => {
    test("should run help command", () => {
      const argv = mockArgv(["help"]);
      const result = runCLI(argv);

      // BUG: Treats script path as command
      expect(result).toContain("Usage:");
    });

    test("should run version command", () => {
      const argv = mockArgv(["version"]);
      const result = runCLI(argv);

      expect(result).toBe("v1.0.0");
    });

    test("should run greet command with name", () => {
      const argv = mockArgv(["greet", "Alice"]);
      const result = runCLI(argv);

      // BUG: Wrong indices mean "Alice" not passed correctly
      expect(result).toBe("Hello, Alice!");
    });

    test("should run add command", () => {
      const argv = mockArgv(["add", "5", "3"]);
      const result = runCLI(argv);

      // BUG: Wrong indices mean addition is wrong
      expect(result).toBe("Result: 8");
    });

    test("should handle unknown command", () => {
      const argv = mockArgv(["unknown"]);
      const result = runCLI(argv);

      // BUG: Reports script path as unknown command
      expect(result).toContain("Unknown command: unknown");
    });
  });

  describe("getScriptName", () => {
    test("should return script filename not bun", () => {
      const argv = mockArgv(["arg1"]);

      // BUG: Returns "bun" instead of "script.ts"
      expect(getScriptName(argv)).toBe("script.ts");
    });

    test("should handle script in nested directory", () => {
      const argv = [
        "/usr/local/bin/bun",
        "/home/user/project/src/cli/main.ts",
        "arg1",
      ];

      expect(getScriptName(argv)).toBe("main.ts");
    });
  });

  describe("edge cases", () => {
    test("should handle no user arguments", () => {
      const argv = mockArgv([]);
      const parsed = parseArgs(argv);

      expect(parsed.positional).toEqual([]);
    });

    test("should handle -- separator", () => {
      const argv = mockArgv(["--", "--not-a-flag"]);
      const positional = getPositionalArgs(argv);

      // Everything after -- should be positional
      expect(positional).toContain("--not-a-flag");
    });

    test("should handle arguments with spaces (quoted)", () => {
      const argv = mockArgv(["--message", "hello world"]);

      expect(getOption("message", argv)).toBe("hello world");
    });
  });
});
