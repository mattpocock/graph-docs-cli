import * as fs from 'fs/promises';
import * as path from 'path';
import { ConfigObject } from './types';

export const getConfig = async () => {
  const configPath = path.resolve(process.cwd(), 'graph-docs.json');

  try {
    const fileContents = await fs.readFile(configPath, 'utf8');
    return ConfigObject.parse(JSON.parse(fileContents));
  } catch (e) {}
};
