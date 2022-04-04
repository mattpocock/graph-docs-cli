import { getConfig } from './getConfig';
import { getContentGraph } from './getContentGraph';

export const getDotfile = async (glob: string) => {
  const db = await getContentGraph(glob);

  const config = await getConfig();

  const getColor = (name: string) => {
    const group = config?.groups.find((g) => g.id === db[name].meta.group);
    if (!group) return 'black';
    return group.color;
  };

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
          return `"${item.name}" [color="${getColor(item.name)}",penwidth=2.0]`;
        })
        .join('\n')}
    }
  `;

  console.log(
    `https://dreampuf.github.io/GraphvizOnline/#${encodeURIComponent(
      dotfileText,
    )}`,
  );
};
