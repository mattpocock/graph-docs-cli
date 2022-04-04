import { getDeepDependencies } from './getContentGraph';
import { Config, DB } from './types';

export const getPathTo = (db: DB, config: Config, element: string) => {
  return getPathToMany(db, config, [element]);
};

export const getPathToMany = (db: DB, config: Config, elements: string[]) => {
  const pathSegments: string[] = [];

  const deepDependencies = getDeepDependencies(db);

  Object.values(db).forEach((dbItem) => {
    dbItem.deps.forEach((dep) => {
      deepDependencies[dbItem.name][dep] = true;
    });
  });

  const getDescendents = (path: string) => {
    if (db[path]) {
      if (!pathSegments.some((segment) => segment === path)) {
        pathSegments.push(path);
        db[path].deps.forEach((dep) => {
          getDescendents(dep);
        });
      }
    }
  };

  elements.forEach((element) => {
    getDescendents(element);
  });

  const groupedPaths: Record<string, string[]> = {};

  pathSegments.forEach((segment) => {
    const group = db[segment].meta.group;

    if (group) {
      if (!groupedPaths[group]) {
        groupedPaths[group] = [];
      }
      groupedPaths[group].push(segment);
    }
  });

  return Object.entries(groupedPaths)
    .sort(([a], [b]) => {
      const aGroupIndex = config?.groups?.findIndex((g) => g.id === a) ?? 0;
      const bGroupIndex = config?.groups?.findIndex((g) => g.id === b) ?? 0;
      return aGroupIndex - bGroupIndex;
    })
    .flatMap(([, paths]) => {
      return paths.sort((a, b) => {
        if (deepDependencies[b][a]) {
          return -1;
        }
        return 1;
      });
    });
};
