// import logo from './logo.svg';
import { useEffect, useState } from 'react';
import './App.css';
import { ChatHistory, ChatInput } from './Chat';
import { Message } from './types';
import { AppBar, Button, TextField, Toolbar, Typography } from '@mui/material';
import { useWallet } from './useWallet';
import { useLocalStorage } from './useLocalStorage';
import { initialLoad, postNewMessage, sendOpenAIApiKey, signIn } from './api';

const initialMessage: Message = {
  role: 'assistant',
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
  const { isActive, account, connect, signChallenge } = useWallet();

  console.log('App wallet', { account, isActive });
  const [connected, setConnected] = useState(false);

  const [storedOpenAIApiKey, setStoredOpenAIApiKey] = useLocalStorage(
    'openai-api-key',
    null
  );
  const [hasOpenAIKey, setHasOpenAIKey] = useState<boolean>();
  const [openAiKeyString, setOpenAiKeyString] = useState<string>('');

  const [challenge, setChallenge] = useState('');

  console.log('App', {
    storedOpenAIApiKey,
    hasOpenAIKey,
    openAiKeyString,
    challenge,
    connected,
  });

  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    if (account) {
      initialLoad(account)
        .then(async (data) => {
          console.log('initialLoad data', data);
          const { connectedToPosbus, conversation, hasOpenAIKey, challenge } =
            data;

          if (connectedToPosbus) {
            setConnected(true);
          } else if (challenge) {
            setChallenge(challenge);
          } else {
            alert(
              'initialLoad error - not connected to posbus and no challenge!'
            );
          }

          setHasOpenAIKey(hasOpenAIKey);

          setMessages([initialMessage, ...conversation]);
        })
        .catch((err) => {
          console.log('initialLoad err', err);
        });
    }
  }, [account]);

  useEffect(() => {
    if (hasOpenAIKey === false && !!storedOpenAIApiKey) {
      sendOpenAIApiKey(storedOpenAIApiKey)
        .then(() => {
          setHasOpenAIKey(true);
        })
        .catch((err) => {
          console.log('sendOpenAIApiKey err', err);
        });
    }
  }, [storedOpenAIApiKey, hasOpenAIKey]);

  // Handlers

  const handleSend = async (message: string) => {
    setMessages((messages) => [
      ...messages,
      { content: message, role: 'user' },
    ]);
    const response = await postNewMessage(message);
    setMessages((messages) => [
      ...messages,
      { content: response, role: 'assistant' },
    ]);
  };

  const handleSignChallenge = async () => {
    try {
      const signature = await signChallenge(challenge);
      console.log('signature', signature);

      await signIn(signature);

      setConnected(true);
    } catch (err) {
      console.log('signIn err', err);
      alert('Something went wrong!');
    }
  };

  const handleSaveOpenAIApiKey = async () => {
    setStoredOpenAIApiKey(openAiKeyString);
    try {
      await sendOpenAIApiKey(storedOpenAIApiKey);
    } catch (err) {
      console.log('sendOpenAIApiKey err', err);
      alert('Something went wrong!');
    }
  };

  // Content

  let body = <div />;
  let footer = <div />;
  if (!isActive) {
    body = (
      <Button variant="contained" onClick={() => connect()}>
        Connect Wallet
      </Button>
    );
  } else if (!connected && !!challenge) {
    body = (
      <Button variant="contained" onClick={handleSignChallenge}>
        Sign In With Wallet
      </Button>
    );
  } else if (!hasOpenAIKey && !storedOpenAIApiKey) {
    body = (
      <>
        <p>
          You need to get an API key from{' '}
          <a href="https://platform.openai.com/">OpenAI Platform</a> and paste
          it here:
        </p>
        <TextField
          type="text"
          value={openAiKeyString}
          onChange={(e) => setOpenAiKeyString(e.target.value)}
        />
        <Button
          variant="contained"
          onClick={handleSaveOpenAIApiKey}
          disabled={openAiKeyString.length < 10}
        >
          Save
        </Button>
      </>
    );
  } else if (connected && hasOpenAIKey) {
    body = <ChatHistory messages={messages} />;
    footer = <ChatInput onSend={handleSend} />;
  }

  return (
    <div className="App">
      <AppBar position="static" className="App-header">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Odyssey Creator GPT
          </Typography>
        </Toolbar>
      </AppBar>
      <div className="App-body">{body}</div>
      <div className="App-footer">{footer}</div>
    </div>
  );
}

export default App;
