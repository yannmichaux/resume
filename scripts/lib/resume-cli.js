import { execSync } from "child_process";
import fs from "fs";
import path from "path";

function resolveResumeCli() {
  if (process.env.RESUME_CLI) return process.env.RESUME_CLI;
  try {
    execSync("command -v resume", { stdio: "ignore" });
    return "resume";
  } catch {
    return "npx --yes resume-cli";
  }
}

/**
 * @param {string} projectRoot
 * @param {{ resumePath: string, outputPath: string, format: 'html'|'pdf', theme: string }} options
 */
function exportWithResumeCli(projectRoot, options) {
  const resumePath = path.resolve(options.resumePath);
  const outputPath = path.resolve(options.outputPath);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  let effectiveResumePath = resumePath;
  let tempFile = null;

  if (options.format === "pdf") {
    const resume = JSON.parse(fs.readFileSync(resumePath, "utf8"));
    resume.meta = { ...resume.meta, pdfMode: true };
    tempFile = resumePath.replace(/\.json$/, ".pdf-tmp.json");
    fs.writeFileSync(tempFile, JSON.stringify(resume, null, 2), "utf8");
    effectiveResumePath = tempFile;
  }

  const cmd = [
    resolveResumeCli(),
    "export",
    outputPath,
    "--format",
    options.format,
    "--theme",
    options.theme,
    "--resume",
    effectiveResumePath,
  ].join(" ");

  try {
    execSync(cmd, { stdio: "inherit", cwd: projectRoot, shell: true });
  } finally {
    if (tempFile && fs.existsSync(tempFile)) {
      fs.unlinkSync(tempFile);
    }
  }
}

export { resolveResumeCli, exportWithResumeCli };
