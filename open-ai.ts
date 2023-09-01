import OpenAI from 'openai';
import { systemContent } from './open-ai-setup';
import { posbus } from '@momentum-xyz/bot-sdk';

const { OPENAI_API_KEY } = process.env;

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

const history: OpenAI.Chat.Completions.CreateChatCompletionRequestMessage[] =
  [];

export const sendToOpenAI = async (
  message: string,
  objects: Record<string, posbus.ObjectDefinition>,
  myTransform: posbus.TransformNoScale,
  asset3dNamesById: Record<string, string>
): Promise<string> => {
  history.push({
    role: 'user',
    content: message,
  });

  const messages: OpenAI.Chat.Completions.CreateChatCompletionRequestMessage[] =
    [
      {
        role: 'system',
        content:
          systemContent +
          '\nCurrent objects are:' +
          objectsToDescription(objects, asset3dNamesById) +
          '\nMy current transform is ' +
          JSON.stringify(myTransform),
      },
      ...history,
    ];
  console.log('Send to OpenAI', messages);

  const response = await openai.chat.completions.create({
    // model: 'gpt-3.5-turbo-16k',
    model: 'gpt-4',
    messages,
    // max_tokens: 200,
    // temperature: 0.3,
  });

  console.log('OpenAI response', response);

  const content = response?.choices?.[0]?.message.content;

  console.log('OpenAI response content', content);

  if (typeof content === 'string') {
    history.push({ role: 'assistant', content });
    return content;
  }
  throw new Error('Invalid response from OpenAI');
};

function objectsToDescription(
  objects: Record<string, posbus.ObjectDefinition>,
  asset3dNamesById: Record<string, string>
) {
  return JSON.stringify(
    Object.values(objects).map(({ id, asset_type, transform, name }) => {
      return {
        objectId: id,
        name,
        shape: asset3dNamesById[asset_type] || 'n/a',
        transform,
      };
    })
  );
}