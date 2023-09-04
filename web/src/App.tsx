// import logo from './logo.svg';
import { useState } from 'react';
import './App.css';
import { ChatHistory, ChatInput, Message } from './Chat';
import { AppBar, Toolbar, Typography } from '@mui/material';

const sendToServer = async (prompt: string) => {
  const response = await fetch('/api/prompt', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt }),
  });

  const body = await response.json();

  if (response.ok) {
    return body.response;
  } else {
    throw new Error(body.error);
  }
};

const initialMessage: Message = {
  sender: 'server',
  content: `Hello, I am GPT Odyssey. How can I help you?

I know about all the objects in the world with their names, positions, rotations, colors and shapes. I can also add new objects and remove existing ones.

I also know all the basic and public custom models so you can spawn them in the world.

I have limited knowledge about objects bounds.
  
I could understand commands like:

- add a new sphere above the teapot
- align all cubes in a single row with gap 5 between them
- remove all spheres
- rotate the teapot with 90 degrees horizontally
- replace the teapot with car
- replace all the spheres with double-size cubes
- add 5 cylinders right under the green cone aligned vertically with space of 5 between them
- set pink color to all the spheres
`,
};

function App() {
  const [messages, setMessages] = useState<Message[]>([initialMessage]);

  const handleSend = async (message: string) => {
    setMessages((messages) => [
      ...messages,
      { content: message, sender: 'me' },
    ]);
    const response = await sendToServer(message);
    setMessages((messages) => [
      ...messages,
      { content: response, sender: 'server' },
    ]);
  };

  return (
    <div className="App">
      <AppBar position="static" className="App-header">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Odyssey Creator GPT
          </Typography>
        </Toolbar>
      </AppBar>
      <div className="App-body">
        <ChatHistory messages={messages} />
      </div>
      <div className="App-footer">
        <ChatInput onSend={handleSend} />
      </div>
    </div>
  );
}

export default App;
