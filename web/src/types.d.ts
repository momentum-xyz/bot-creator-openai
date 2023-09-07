export interface Message {
  content: string;
  role: 'user' | 'assistant';
}

export interface InitialData {
  connectedToPosbus: boolean;
  hasOpenAIKey: boolean;
  challenge?: string;
  conversation: Message[];
}
