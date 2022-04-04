import * as fs from 'fs/promises';
import * as path from 'path';
import { CONFIG_FILE_PATH } from './constants';
import { ConfigObject } from './types';

export const getConfig = async () => {
  const configPath = path.resolve(process.cwd(), CONFIG_FILE_PATH);

  try {
    const fileContents = await fs.readFile(configPath, 'utf8');
    return ConfigObject.parse(JSON.parse(fileContents));
  } catch (e) {}
};
