import { watch } from 'chokidar';

/**
 * @internal
 */
export const chokidarGlob = (glob: string) =>
  new Promise<string[]>((resolve) => {
    const paths: string[] = [];
    const watcher = watch(glob).on('add', (path) => {
      paths.push(path);
    });

    watcher.on('ready', async () => {
      await watcher.close();
      resolve(paths);
    });
  });
