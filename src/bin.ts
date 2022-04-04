#!/usr/bin/env node

import { Command } from 'commander';
import { version } from '../package.json';
import { getDotfile } from './dotfile';
import { getConfig } from './getConfig';
import { getContentGraph } from './getContentGraph';
import { getPathTo, getPathToMany } from './getPathTo';
import { logAndExit } from './logAndExit';
import * as path from 'path';
import { startServer } from './startServer';

const program = new Command();

program.version(version);

// program
//   .command('dotfile')
//   .description('Create a dotfile view of the entire module graph')
//   .argument('<files>', 'The files to target, expressed as a glob pattern')
//   .action(async (glob: string) => {
//     getDotfile(glob);
//   });

program
  .command('full-path')
  .description('Gets the full learning path of the entire graph')
  .argument('<files>', 'The files to target, expressed as a glob pattern')
  .action(async (glob: string) => {
    const db = await getContentGraph(glob);
    const config = await getConfig();

    if (!config?.groups) {
      logAndExit(
        'No groups found in config file. Groups are required for getting paths.',
      );
      return;
    }

    const path = getPathToMany(db, config, Object.keys(db));

    console.log(
      path.map((p) => ({
        id: p,
        group: db[p].meta.group,
      })),
    );
  });

program
  .command('path-to')
  .description('Gets the full learning path to a single module')
  .argument('<files>', 'The files to target, expressed as a glob pattern')
  .argument(
    '<module>',
    'The module id to target - the file name without the file extension',
  )
  .action(async (glob: string, module: string) => {
    const db = await getContentGraph(glob);
    const config = await getConfig();

    if (!config?.groups) {
      logAndExit(
        'No groups found in config file. Groups are required for getting paths.',
      );
      return;
    }

    const path = await getPathTo(db, config, module);
    console.log(
      path.map((p) => ({
        id: p,
        group: db[p].meta.group,
      })),
    );
  });

program
  .command('lint')
  .description('Validate that the files all have valid dependencies')
  .argument('<files>', 'The files to target, expressed as a glob pattern')
  .action(async (glob: string) => {
    await getContentGraph(glob);
  });

program
  .command('dev')
  .description('Start a dev server, watching for changes in your content graph')
  .argument('<files>', 'The files to target, expressed as a glob pattern')
  .action(async (glob: string) => {
    startServer(glob, __dirname, {
      publicPath: './public',
      port: 3001,
    });
  });

program.parse(process.argv);
