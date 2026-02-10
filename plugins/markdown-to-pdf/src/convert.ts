import { exec } from "node:child_process";
import { promisify } from "node:util";
import { access, readFile } from "node:fs/promises";
import { constants } from "node:fs";
import type { PluginLogger } from "clawdbot/plugin-sdk";

const execAsync = promisify(exec);

export type ConvertOptions = {
  pdfEngine: "pdflatex" | "xelatex" | "lualatex";
  toc: boolean;
  numberSections: boolean;
  margin: string;
  fontSize: string;
  highlightStyle: string;
};

export type ConvertResult = {
  success: boolean;
  outputPath?: string;
  error?: string;
  warnings?: string[];
};

/**
 * Check if required binaries are available in PATH
 */
async function checkDependencies(logger: PluginLogger): Promise<{ pandoc: boolean; latex: boolean }> {
  const checks = { pandoc: false, latex: false };

  try {
    await execAsync("which pandoc");
    checks.pandoc = true;
  } catch {
    logger.warn("pandoc not found in PATH");
  }

  try {
    // Check for any LaTeX engine
    await execAsync("which pdflatex || which xelatex || which lualatex");
    checks.latex = true;
  } catch {
    logger.warn("No LaTeX engine found in PATH");
  }

  return checks;
}

/**
 * Ensure LaTeX binaries are in PATH
 */
function ensureLatexInPath(): string {
  const currentPath = process.env.PATH || "";
  const latexPaths = ["/opt/homebrew/bin", "/Library/TeX/texbin", "/usr/local/bin"];

  // Add LaTeX paths if not already present
  const pathParts = currentPath.split(":");
  const missingPaths = latexPaths.filter((p) => !pathParts.includes(p));

  if (missingPaths.length > 0) {
    return [...missingPaths, ...pathParts].join(":");
  }

  return currentPath;
}

/**
 * Convert markdown file to PDF using pandoc
 */
export async function convertMarkdownToPdf(
  inputPath: string,
  outputPath: string,
  options: ConvertOptions,
  logger: PluginLogger,
): Promise<ConvertResult> {
  // Ensure LaTeX is in PATH
  const enhancedPath = ensureLatexInPath();

  // Check dependencies
  const deps = await checkDependencies(logger);
  if (!deps.pandoc) {
    return {
      success: false,
      error: "pandoc is not installed or not in PATH. Install with: brew install pandoc",
    };
  }
  if (!deps.latex) {
    return {
      success: false,
      error: "LaTeX is not installed or not in PATH. Install with: brew install --cask basictex",
    };
  }

  // Check if input file exists
  try {
    await access(inputPath, constants.R_OK);
  } catch {
    return {
      success: false,
      error: `Input file not found or not readable: ${inputPath}`,
    };
  }

  // Build pandoc command
  const args = [
    `"${inputPath}"`,
    `-o "${outputPath}"`,
    `--pdf-engine=${options.pdfEngine}`,
    options.toc ? "--toc" : "",
    options.numberSections ? "--number-sections" : "",
    `--variable=geometry:margin=${options.margin}`,
    `--variable=fontsize=${options.fontSize}`,
    `--highlight-style=${options.highlightStyle}`,
  ]
    .filter(Boolean)
    .join(" ");

  const command = `pandoc ${args}`;

  logger.info(`Running: ${command}`);

  try {
    const { stdout, stderr } = await execAsync(command, {
      env: { ...process.env, PATH: enhancedPath },
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer for large outputs
    });

    const warnings: string[] = [];

    // Parse warnings from stderr
    if (stderr) {
      const warningLines = stderr
        .split("\n")
        .filter((line) => line.includes("[WARNING]"))
        .slice(0, 10); // Limit to first 10 warnings

      if (warningLines.length > 0) {
        warnings.push(...warningLines);
        logger.warn(`Pandoc warnings: ${warningLines.length} warnings emitted`);
      }
    }

    // Verify output file was created
    try {
      await access(outputPath, constants.R_OK);
    } catch {
      return {
        success: false,
        error: "PDF file was not created",
      };
    }

    return {
      success: true,
      outputPath,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  } catch (error) {
    const err = error as { code?: number; stderr?: string; stdout?: string };

    let errorMsg = "Unknown error occurred";
    if (err.stderr) {
      errorMsg = err.stderr;
    } else if (error instanceof Error) {
      errorMsg = error.message;
    }

    logger.error(`Pandoc execution failed: ${errorMsg}`);

    return {
      success: false,
      error: `Pandoc execution failed: ${errorMsg}`,
    };
  }
}
