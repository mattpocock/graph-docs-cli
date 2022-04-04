import express from 'express';
import { getDotfile } from './dotfile';
import * as path from 'path';
import * as fs from 'fs';
import { WebSocketServer, WebSocket } from 'ws';
import { watch } from 'chokidar';
import { CONFIG_FILE_PATH } from './constants';

export const startServer = async (
  glob: string,
  binPath: string,
  opts: { publicPath: string; port: number },
) => {
  const app = express();

  app.use(express.static(opts.publicPath));

  const dotfile = await getDotfile(glob, binPath);

  app.get('/', (req, res) => {
    res.send(getServerHtml(opts.port + 1));
  });
  app.get('/img.svg', (req, res) => {
    res.header('Content-Type', 'image/svg+xml');
    res.header('Content-Disposition', 'inline');

    res.status(200);

    res.send(fs.readFileSync(dotfile.imgPath));
  });
  app.get('/script.js', (req, res) => {
    res.send(fs.readFileSync(path.resolve(binPath, './devClient.js')));
  });

  const wss = new WebSocketServer({ port: opts.port + 1 });

  const connections = new Set<WebSocket>();

  wss.on('connection', (ws) => {
    connections.add(ws);
    ws.on('close', () => {
      connections.delete(ws);
    });
  });

  const handleChange = async () => {
    await getDotfile(glob, binPath);

    connections.forEach((ws) => {
      ws.send('New');
    });
  };

  watch([glob, CONFIG_FILE_PATH], { ignoreInitial: true })
    .on('change', handleChange)
    .on('add', handleChange)
    .on('unlink', handleChange);

  app.listen(opts.port, () => {
    console.log(`Listening on http://localhost:${opts.port}`);
  });
};

const getServerHtml = (port: number) => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Graph Docs</title>
      </head>
      <body>
        <object data="/img.svg" type="image/svg+xml" width="1900px" height="720px"></object>
        <script>
          const PORT = ${port};
        </script>
        <script src="/script.js"></script>
      </body>
    </html>
  `;
};
