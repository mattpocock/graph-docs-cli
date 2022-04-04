import { execSync } from 'child_process';
import * as path from 'path';
import { writeFileSync } from 'fs';
import { getConfig } from './getConfig';
import { getContentGraph } from './getContentGraph';

export const getDotfile = async (glob: string, cachePath: string) => {
  const db = await getContentGraph(glob);

  const config = await getConfig();

  const getColor = (name: string) => {
    const group = config?.groups.find((g) => g.id === db[name].meta.group);
    if (!group) return 'black';
    return group.color;
  };

  const changedModules = execSync('git diff --name-only HEAD', {
    cwd: process.cwd(),
  })
    .toString()
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => path.parse(item).name);

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
      ${changedModules
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
