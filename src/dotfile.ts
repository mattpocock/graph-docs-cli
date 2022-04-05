import { execSync } from 'child_process';
import * as path from 'path';
import { writeFileSync } from 'fs';
import { getConfig } from './getConfig';
import { getContentGraph } from './getContentGraph';
import { chokidarGlob } from './chokidarGlob';

export const getDotfile = async (glob: string, cachePath: string) => {
  const db = await getContentGraph(glob);
  /**
   * Relative paths
   */
  const allFiles = await chokidarGlob(glob);

  const config = await getConfig();

  const getColor = (name: string) => {
    const group = config?.groups.find((g) => g.id === db[name].meta.group);
    if (!group) return 'black';
    return group.color;
  };

  /**
   * Full-length paths
   */
  const changedModules1 = execSync('git diff --name-only HEAD', {
    cwd: process.cwd(),
  })
    .toString()
    .split('\n')
    .map((i) => i.trim())
    .filter(Boolean);

  /**
   * Relative paths
   */
  const allTrackedFiles = execSync('git ls-files', {
    cwd: process.cwd(),
  })
    .toString()
    .split('\n')
    .map((i) => i.trim())
    .filter(Boolean);

  const changedModules = new Set<string>();

  allFiles.forEach((file) => {
    const fileIsTracked = allTrackedFiles.includes(file);

    if (!fileIsTracked) {
      changedModules.add(path.parse(file).name);
    }

    const fileHasChanged = changedModules1.some((changedFile) => {
      return changedFile.includes(file);
    });

    if (fileHasChanged) {
      changedModules.add(path.parse(file).name);
    }
  });

  // const changedModules = allFiles
  //   .filter((item) => {
  //     return allFiles.some((file) => item.includes(file));
  //   })
  //   .map((item) => path.parse(item).name);

  const dotfileText = `
    digraph kmap {
      ${Object.values(db)
        .map((node) => {
          return `
          ${node.deps
            .map((dep) => {
              const secondColor = getColor(node.name);
              return `"${dep}" -> "${node.name}" ${`[color="${secondColor}"]`}`;
            })
            .join('\n')}`;
        })
        .join('\n')}
      ${Object.values(db)
        .map((item) => {
          return `"${item.name}" [color="${getColor(
            item.name,
          )}",penwidth=2.0, margin="0.2,0"]`;
        })
        .join('\n')}
      ${Array.from(changedModules)
        .map((mod) => {
          return `"${mod}" [style="filled,bold" fontcolor="white" tooltip="Changed"]`;
        })
        .join('\n')}
    }
  `;

  const dotfilePath = path.resolve(cachePath, 'dotfile.dot');

  const imgPath = path.resolve(cachePath, 'graph.svg');

  writeFileSync(dotfilePath, dotfileText);

  execSync(`dot -Tsvg ${dotfilePath} > ${imgPath}`);

  return { dotfilePath, imgPath };
};
