import frontmatter from 'front-matter';
import * as fs from 'fs/promises';
import * as path from 'path';
import { chokidarGlob } from './chokidarGlob';
import { logAndExit } from './logAndExit';
import { DB, ModuleMetaObject } from './types';

/**
 * @internal
 */
export const getDeepDependencies = (
  db: DB,
): Record<string, Record<string, true>> => {
  const deps: Record<string, Record<string, true>> = {};

  const getDeepDepsOfEntry = (
    deps: string[],
    depSet = new Set<string>(),
    depth = 0,
  ) => {
    if (depth > 0) {
      deps.forEach((dep) => {
        depSet.add(dep);
      });
    }
    deps.forEach((dep) => {
      if (!db[dep]) {
        return;
      }
      getDeepDepsOfEntry(db[dep].deps, depSet, depth + 1);
    });
    return depSet;
  };

  Object.values(db).forEach((entry) => {
    const depSet = getDeepDepsOfEntry(entry.deps);

    deps[entry.name] = {};

    Array.from(depSet).forEach((dep) => {
      deps[entry.name][dep] = true;
    });
  });

  return deps;
};

const filterOutDeepDependencies = (db: DB): DB => {
  const deepDependencies = getDeepDependencies(db);

  Object.entries(db).forEach(([key, entry]) => {
    db[key].deps = entry.deps.filter((dep) => {
      return !deepDependencies[key]?.[dep];
    });
  });

  return db;
};

export const getContentGraph = async (glob: string) => {
  const allFiles = await chokidarGlob(glob);

  if (allFiles.length === 0) {
    logAndExit('No files found!');
  }

  const db: DB = {};

  for (const file of allFiles) {
    const fileContents = await fs.readFile(file, 'utf-8');

    const attributes = frontmatter(fileContents);
    const meta = ModuleMetaObject.parse(attributes.attributes);

    const name = path.parse(file).name;

    db[name] = {
      name,
      deps: meta.deps || [],
      body: attributes.body,
      meta,
    };
  }

  for (const node of Object.values(db)) {
    for (const dep of node.deps) {
      if (!db[dep]) {
        throw new Error(
          `Error in ${node.name}.md: ${dep} is not in the database`,
        );
      }
    }
  }

  return filterOutDeepDependencies(db);
};
