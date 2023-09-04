import express, { Request, Response } from 'express';
import http from 'http';
import bodyParser from 'body-parser';
import WebSocket from 'ws';

interface Props {
  port: number;
  onRequest: (prompt: string) => Promise<string>;
}

export const startServer = ({ port, onRequest }: Props) => {
  const app = express();

  app.use(bodyParser.json());

  const server = http.createServer(app);
  const wss = new WebSocket.Server({ server });

  wss.on('connection', (ws: WebSocket) => {
    console.log('Client connected');

    ws.on('message', (message: string) => {
      console.log(`Received message => ${message}`);
    });

    ws.send('Hello from server!');
  });

  app.post('/api/prompt', (req: Request, res: Response) => {
    console.log('Received prompt request');
    onRequest(req.body.prompt)
      .then((response) => {
        res.json({ response });
      })
      .catch((err) => {
        res.status(500).json({ error: err.message });
      });
  });

  server.listen(port, () => {
    console.log(`Server started on port ${port}`);
  });
};
