import express, { Request, Response } from 'express';
import http from 'http';
import bodyParser from 'body-parser';
import WebSocket from 'ws';
import { ChatMessage } from './open-ai';

interface Props {
  port: number;
  onRequest: (prompt: string) => Promise<string>;
  onClientConnected: (account: string) => Promise<{
    connectedToPosbus: boolean;
    hasOpenAIKey: boolean;
    challenge?: string;
    conversation: ChatMessage[];
  }>;
  onSignIn: (signature: string) => Promise<void>;
  onOpenAIKey: (apiKey: string) => Promise<void>;
}

export const startServer = ({
  port,
  onRequest,
  onClientConnected,
  onSignIn,
  onOpenAIKey,
}: Props) => {
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

  app.post('/api/prompt', async (req: Request, res: Response) => {
    try {
      console.log('Received prompt request');
      const { prompt } = req.body;

      const response = await onRequest(prompt);

      res.json({ response });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/initial', async (req: Request, res: Response) => {
    try {
      console.log('Received initial request');
      const { account } = req.body;
      const data = await onClientConnected(account);

      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/signin', async (req: Request, res: Response) => {
    try {
      console.log('Received sign in request');
      const { signature } = req.body;

      await onSignIn(signature);

      res.json({ response: 'ok' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/openai_key', async (req: Request, res: Response) => {
    try {
      console.log('Received openai key request');
      const { apiKey } = req.body;

      await onOpenAIKey(apiKey);

      res.json({ response: 'ok' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  server.listen(port, () => {
    console.log(`Server started on port ${port}`);
  });
};
