import { readdir, readFile } from "node:fs/promises";
import { dirname, extname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const webRoot = resolve(scriptDir, "..");
const publicSiteRoot = resolve(webRoot, "src/features/public-site");

const forbiddenImportPatterns = [
  {
    pattern: /^@\/components\//,
    reason: "public routes must not import app UI primitives or composed app components",
  },
  {
    pattern: /^@\/features\/(?!public-site(?:\/|$))/,
    reason: "public routes must not import authenticated app or editor features",
  },
  {
    pattern: /^@\/hooks(?:\/|$)/,
    reason: "public routes should keep browser behavior feature-local",
  },
  {
    pattern: /^@\/data(?:\/|$)/,
    reason: "public routes must not import app sample/team data",
  },
  {
    pattern: /^@\/lib\/api(?:\/|$)/,
    reason: "public routes must not use the authenticated app API client",
  },
  {
    pattern: /^@dnd-kit(?:\/|$)/,
    reason: "editor drag dependencies must stay out of public routes",
  },
  {
    pattern: /^@tiptap(?:\/|$)/,
    reason: "editor rich-text dependencies must stay out of public routes",
  },
  {
    pattern: /^@tanstack\/react-query$/,
    reason: "public routes use a tiny feature-local fetcher, not authenticated app query state",
  },
  {
    pattern: /^@tanstack\/react-table$/,
    reason: "dashboard/table dependencies must stay out of public routes",
  },
  {
    pattern: /^(@base-ui|radix-ui|@radix-ui|cmdk|recharts|sonner|vaul|shadcn)(?:\/|$)/,
    reason: "authenticated app UI/runtime dependencies must stay out of public routes",
  },
];

const failures = [];

for (const filePath of await listSourceFiles(publicSiteRoot)) {
  const source = await readFile(filePath, "utf8");
  const imports = collectImports(source);

  for (const importRecord of imports) {
    if (importRecord.source === "@lightsite/contracts" && !importRecord.typeOnly) {
      failures.push({
        filePath,
        importSource: importRecord.source,
        reason: "public routes may import API contract types only; runtime schemas pull Zod into the public bundle",
      });
      continue;
    }

    const forbidden = forbiddenImportPatterns.find((candidate) =>
      candidate.pattern.test(importRecord.source),
    );

    if (forbidden) {
      failures.push({
        filePath,
        importSource: importRecord.source,
        reason: forbidden.reason,
      });
    }
  }
}

if (failures.length > 0) {
  console.error("Public boundary check failed:");

  for (const failure of failures) {
    console.error(
      `- ${relative(webRoot, failure.filePath)} imports ${failure.importSource}: ${failure.reason}`,
    );
  }

  process.exit(1);
}

console.log("Public boundary check passed.");

async function listSourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const path = join(directory, entry.name);

      if (entry.isDirectory()) {
        return listSourceFiles(path);
      }

      return isSourceFile(path) ? [path] : [];
    }),
  );

  return files.flat();
}

function isSourceFile(filePath) {
  return [".ts", ".tsx"].includes(extname(filePath));
}

function collectImports(source) {
  const imports = [];
  const staticImportPattern = /import\s+(type\s+)?(?:[^'"]+?\s+from\s+)?["']([^"']+)["']/g;
  const dynamicImportPattern = /import\s*\(\s*["']([^"']+)["']\s*\)/g;

  for (const match of source.matchAll(staticImportPattern)) {
    imports.push({
      source: match[2],
      typeOnly: Boolean(match[1]),
    });
  }

  for (const match of source.matchAll(dynamicImportPattern)) {
    imports.push({
      source: match[1],
      typeOnly: false,
    });
  }

  return imports;
}
