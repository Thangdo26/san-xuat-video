/**
 * Minimal `--flag` / `--key value` parser.
 *
 * npm passes script arguments after `--`, so `npm run video:render -- --slug x`
 * arrives here as ["--slug", "x"].
 */
export const parseArgs = (argv) => {
  const flags = {};
  const positional = [];

  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (!token.startsWith("--")) {
      positional.push(token);
      continue;
    }
    const body = token.slice(2);
    const eq = body.indexOf("=");
    if (eq !== -1) {
      flags[body.slice(0, eq)] = body.slice(eq + 1);
      continue;
    }
    const next = argv[i + 1];
    if (next !== undefined && !next.startsWith("--")) {
      flags[body] = next;
      i++;
    } else {
      flags[body] = true;
    }
  }

  return { flags, positional };
};

export const requireSlug = (flags, command) => {
  const slug = flags.slug;
  if (typeof slug !== "string" || slug.length === 0) {
    throw new Error(
      `Missing --slug.\nUsage: npm run ${command} -- --slug da-nang-3n2d`,
    );
  }
  return slug;
};

export const fail = (message) => {
  console.error(`\n✖ ${message}\n`);
  process.exit(1);
};
