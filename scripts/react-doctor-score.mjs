/**
 * Purpose: Print a clean React Doctor score for local hooks and scripts
 * Responsibility: Run React Doctor in JSON mode and summarize the result
 * Important Notes:
 *   - JSON mode suppresses the interactive-looking project selection output
 *   - Exit code is preserved so Husky can block commits and pushes on failures
 */

import { spawnSync } from "node:child_process";

const result = spawnSync(
  "pnpm",
  [
    "exec",
    "react-doctor",
    "--json",
    "--json-compact",
    "--project",
    "nikharta-roop",
    ".",
  ],
  {
    encoding: "utf8",
    stdio: ["inherit", "pipe", "pipe"],
  }
);

if (result.status !== 0) {
  process.stdout.write(result.stdout);
  process.stderr.write(result.stderr);
  process.exit(result.status ?? 1);
}

try {
  const report = JSON.parse(result.stdout);
  const project = report.projects?.[0];
  const score = project?.score?.score;
  const label = project?.score?.label;
  const issueCount = project?.diagnostics?.length ?? 0;

  if (typeof score !== "number") {
    throw new Error("React Doctor score missing from JSON report.");
  }

  console.log(
    `React Doctor score: ${score}${label ? ` (${label})` : ""} | issues: ${issueCount}`
  );
} catch (error) {
  console.error("React Doctor completed, but the JSON report could not be parsed.");
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
