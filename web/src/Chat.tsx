import React, { FC, useEffect, useRef, useState } from 'react';
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
import { Message } from './types';

interface ChatHistoryProps {
  messages: Message[];
}

const contentToText = (content: string) => {
  try {
    console.log('contentToText:', content);
    const parsed = JSON.parse(content);
    if (typeof parsed === 'string') {
      return parsed;
    }
    if (Array.isArray(parsed)) {
      return parsed
        .filter((it) => it.type === 'text')
        .map((it) => it.text)
        .join('\n');
    }
    if (typeof parsed === 'object' && parsed.text) {
      return parsed.text;
    }
  } catch (err) {
    // console.log('contentToText err', err);
  }
  return content;
};

export const ChatHistory: FC<ChatHistoryProps> = ({ messages }) => {
  const refLast = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (refLast.current) {
      refLast.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  return (
    <List>
      {messages.map((msg, index) => {
        const isUser = msg.role === 'user';
        const text = contentToText(msg.content);

        return (
          <ListItem
            key={index}
            style={{
              justifyContent: isUser ? 'flex-end' : 'flex-start',
            }}
          >
            <ListItemText
              primary={text}
              style={{
                background: isUser ? '#e0f7fa' : '#ffecb3',
                padding: '8px 16px',
                borderRadius: '16px',
                maxWidth: '70%',
                display: 'inline-block',
                // preserve newline
                whiteSpace: 'pre-wrap',
              }}
            />
          </ListItem>
        );
      })}
      <span ref={refLast} />
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
      {isLoading && <LinearProgress sx={{ margin: '1em 0' }} />}
    </form>
  );
};
