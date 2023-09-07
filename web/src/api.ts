import { InitialData } from './types';

export const initialLoad = async (account: string): Promise<InitialData> => {
  const response = await fetch('/api/initial', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ account }),
  });

  const body = await response.json();

  console.log('Initial Load body', body);

  if (response.ok) {
    return body;
  } else {
    throw new Error(body.error);
  }
};

export const signIn = async (signature: string): Promise<void> => {
  const response = await fetch('/api/signin', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ signature }),
  });

  const body = await response.json();

  if (!response.ok) {
    throw new Error(body.error);
  }
};

export const postNewMessage = async (prompt: string): Promise<string> => {
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

export const sendOpenAIApiKey = async (apiKey: string): Promise<void> => {
  const response = await fetch('/api/openai_key', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ apiKey }),
  });

  const body = await response.json();

  if (!response.ok) {
    throw new Error(body.error);
  }
};
