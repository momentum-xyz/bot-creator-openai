import React, { FC, useState } from 'react';
import {
  TextField,
  List,
  ListItem,
  ListItemText,
  InputAdornment,
  IconButton,
  LinearProgress,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';

export interface Message {
  content: string;
  sender: 'me' | 'server';
}

interface ChatHistoryProps {
  messages: Message[];
}

export const ChatHistory: FC<ChatHistoryProps> = ({ messages }) => {
  return (
    <List>
      {messages.map((msg, index) => (
        <ListItem
          key={index}
          style={{
            justifyContent: msg.sender === 'me' ? 'flex-end' : 'flex-start',
          }}
        >
          <ListItemText
            primary={msg.content}
            style={{
              background: msg.sender === 'me' ? '#e0f7fa' : '#ffecb3',
              padding: '8px 16px',
              borderRadius: '16px',
              maxWidth: '70%',
              display: 'inline-block',
              // preserve newline
              whiteSpace: 'pre-wrap',
            }}
          />
        </ListItem>
      ))}
    </List>
  );
};

export interface ChatInputProps {
  onSend: (message: string) => Promise<void>;
}

export const ChatInput = ({ onSend }: ChatInputProps) => {
  const [message, setMessage] = useState<string>('');

  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedMsg = message.trim();

    if (trimmedMsg) {
      try {
        setIsLoading(true);
        await onSend(trimmedMsg);
        setMessage('');
      } finally {
        setIsLoading(false);
      }
    }
  };
  return (
    <form onSubmit={handleSubmit} className="chat-input-panel">
      {isLoading && <LinearProgress sx={{ margin: '1em 0' }} />}
      <TextField
        fullWidth
        variant="outlined"
        autoComplete="off"
        value={message}
        disabled={isLoading}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type your message"
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton onClick={handleSubmit}>
                <SendIcon />
              </IconButton>
            </InputAdornment>
          ),
        }}
      />
    </form>
  );
};
