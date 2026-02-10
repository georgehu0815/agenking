import type { ClawdbotPluginApi, ClawdbotPluginDefinition } from "clawdbot/plugin-sdk";
import { convertMarkdownToPdf, type ConvertOptions } from "./src/convert.js";

// Config schema with parse method (required by clawdbot)
const configSchema = {
  parse(value: unknown) {
    const raw =
      value && typeof value === "object" && !Array.isArray(value)
        ? (value as Record<string, unknown>)
        : {};

    return {
      pdfEngine: (raw.pdfEngine as string) || "xelatex",
      defaultToc: raw.defaultToc !== false,
      defaultNumberSections: raw.defaultNumberSections !== false,
      defaultMargin: (raw.defaultMargin as string) || "1in",
    };
  },
  uiHints: {
    pdfEngine: {
      label: "PDF Engine",
      help: "LaTeX engine: pdflatex, xelatex, or lualatex",
    },
    defaultToc: {
      label: "Table of Contents",
      help: "Include TOC by default",
    },
    defaultNumberSections: {
      label: "Number Sections",
      help: "Number section headings by default",
    },
    defaultMargin: {
      label: "Page Margin",
      help: "Default margin (e.g., 1in, 2.5cm)",
    },
  },
};

export default {
  id: "markdown-to-pdf",
  name: "Markdown to PDF",
  description: "Convert markdown files to professionally formatted PDF documents using Pandoc",
  version: "1.0.0",
  configSchema,

  register: (api: ClawdbotPluginApi) => {
    const { logger, pluginConfig } = api;

    // Get default settings from plugin config
    const defaults = {
      pdfEngine: (pluginConfig?.pdfEngine as string) || "xelatex",
      toc: pluginConfig?.defaultToc !== false,
      numberSections: pluginConfig?.defaultNumberSections !== false,
      margin: (pluginConfig?.defaultMargin as string) || "1in",
    };

    logger.info("Registering markdown-to-pdf tool");

    // Register the tool
    api.registerTool({
      name: "markdown_to_pdf",
      description: `Convert a markdown file to PDF format using Pandoc.

IMPORTANT: This tool requires pandoc and LaTeX to be installed on the host system.
Make sure /opt/homebrew/bin and /Library/TeX/texbin are in PATH.

The tool will:
1. Read the markdown file from the specified path
2. Convert it to PDF using pandoc with LaTeX rendering
3. Save the PDF to the output path
4. Return the path to the generated PDF

Supported options:
- pdfEngine: LaTeX engine (pdflatex, xelatex, lualatex) - default: ${defaults.pdfEngine}
- toc: Include table of contents - default: ${defaults.toc}
- numberSections: Number section headings - default: ${defaults.numberSections}
- margin: Page margin - default: ${defaults.margin}
- fontSize: Font size (10pt, 11pt, 12pt) - default: 11pt
- highlightStyle: Code highlighting theme (tango, pygments, kate) - default: tango

Note: Emojis and special Unicode characters may not render in the PDF.
Use xelatex engine for better Unicode support.`,

      parameters: {
        type: "object",
        properties: {
          inputPath: {
            type: "string",
            description: "Path to the input markdown file (must exist)",
          },
          outputPath: {
            type: "string",
            description: "Path where the PDF should be saved",
          },
          options: {
            type: "object",
            description: "Optional conversion options",
            properties: {
              pdfEngine: {
                type: "string",
                enum: ["pdflatex", "xelatex", "lualatex"],
                description: "LaTeX engine to use",
              },
              toc: {
                type: "boolean",
                description: "Generate table of contents",
              },
              numberSections: {
                type: "boolean",
                description: "Number section headings",
              },
              margin: {
                type: "string",
                description: "Page margin (e.g., '1in', '2.5cm')",
              },
              fontSize: {
                type: "string",
                enum: ["10pt", "11pt", "12pt"],
                description: "Font size",
              },
              highlightStyle: {
                type: "string",
                enum: ["tango", "pygments", "espresso", "kate", "monochrome"],
                description: "Code block highlighting style",
              },
            },
          },
        },
        required: ["inputPath", "outputPath"],
      },

      execute: async ({ inputPath, options = {} }: {
        inputPath: string;
        outputPath: string;
        options?: Partial<ConvertOptions>;
      }) => {
        try {
          logger.info(`Converting markdown to PDF: ${inputPath}`);

          // Merge options with defaults
          const convertOptions: ConvertOptions = {
            pdfEngine: options.pdfEngine || defaults.pdfEngine,
            toc: options.toc ?? defaults.toc,
            numberSections: options.numberSections ?? defaults.numberSections,
            margin: options.margin || defaults.margin,
            fontSize: options.fontSize || "11pt",
            highlightStyle: options.highlightStyle || "tango",
          };

          // Perform the conversion
          const result = await convertMarkdownToPdf(
            inputPath,
            arguments[0].outputPath,
            convertOptions,
            logger,
          );

          if (result.success) {
            logger.info(`PDF generated successfully: ${result.outputPath}`);
            return {
              success: true,
              outputPath: result.outputPath,
              message: `Successfully converted markdown to PDF: ${result.outputPath}`,
              warnings: result.warnings,
            };
          } else {
            logger.error(`PDF conversion failed: ${result.error}`);
            return {
              success: false,
              error: result.error,
              message: `Failed to convert markdown to PDF: ${result.error}`,
            };
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          logger.error(`Unexpected error during PDF conversion: ${errorMsg}`);
          return {
            success: false,
            error: errorMsg,
            message: `Unexpected error: ${errorMsg}`,
          };
        }
      },
    });

    logger.info("markdown-to-pdf tool registered successfully");
  },
} satisfies ClawdbotPluginDefinition;
