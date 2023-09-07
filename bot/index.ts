import {
  Bot,
  BotConfig,
  getAuthTokenWithPrivateKey,
  posbus,
  fetchAuthChallenge,
  getAuthTokenWithSignature,
} from '@momentum-xyz/bot-sdk';
import { promptUser } from './chat';
import {
  getHistory,
  initClient as initOpenAIClient,
  sendToOpenAI,
} from './open-ai';
import { startServer } from './server';
import { EventEmitter } from 'events';

const eventEmitter = new EventEmitter();

// TODO change worldId to your world id!
const worldId = '00000000-0000-8000-8000-000000000027';
const backendUrl = 'http://localhost:4000';

// Set private key from environment variable if you want to connect as User, otherwise connect as Guest
const { OPENAI_API_KEY, BOT_SDK_PRIVATE_KEY: privateKey } = process.env;

let initialDataReceived = false;
const objects: Record<string, posbus.ObjectDefinition> = {};
const objectsData: Record<string, posbus.ObjectData> = {};
let myTransform: posbus.TransformNoScale = {
  position: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0 },
};

const asset3dNamesById: Record<string, string> = {};
let supportedAssets: { asset3dId: string; name: string; category: string }[] =
  [];

const defaultTransform = {
  position: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0 },
  scale: { x: 1, y: 1, z: 1 },
};

const config: BotConfig = {
  worldId,
  backendUrl,

  onUserAdded: (user) => {
    // these come after world objects
    if (!initialDataReceived) {
      initialDataReceived = true;
      setTimeout(startMainLoop, 1000);
    }
  },
  onMyPosition(transform) {
    myTransform = transform;
  },

  onObjectAdded: (object) => {
    console.log('Object added!', JSON.stringify(object));
    if (object.id !== worldId) {
      objects[object.id] = object;
    }
  },
  onObjectRemoved: (objectId) => {
    console.log('Object removed!', objectId);
    delete objects[objectId];
  },
  onObjectMove(objectId, transform) {
    console.log('Object moved!', objectId, transform);
    objects[objectId].transform = transform;
  },
  onObjectData(objectId, data) {
    console.log('Object data!', objectId, data);
    objectsData[objectId] = data;
  },
};

const bot = new Bot(config);
if (privateKey) {
  console.log('Private key passed. Get the auth token...');
  getAuthTokenWithPrivateKey(privateKey, { backendUrl })
    .then((token) => {
      console.log('Connect with auth token...', token);
      bot.connect(token);
    })
    .catch((err) => {
      console.error('Failed to get auth token', err);
      process.exit(1);
    });
} else {
  console.log('No private key passed. Wait for sign-in');
}

if (OPENAI_API_KEY) {
  initOpenAIClient(OPENAI_API_KEY);
}

let userAccountAddress: string | undefined;

startServer({
  port: 4243,
  onRequest: async (prompt) => {
    console.log('Received prompt request');
    eventEmitter.emit('prompt', prompt);

    return new Promise((resolve) => {
      eventEmitter.once('response', (response) => {
        console.log('Received response', response);
        resolve(response);
      });
    });
  },
  onClientConnected: async (account) => {
    console.log('Client connected', account);
    userAccountAddress = account;
    const connectedToPosbus = bot.isConnected;
    let challenge: string | undefined;
    if (!connectedToPosbus) {
      challenge = await fetchAuthChallenge(account, { backendUrl });
    }
    return {
      connectedToPosbus,
      challenge,
      hasOpenAIKey: !!OPENAI_API_KEY,
      conversation: getHistory(),
    };
  },
  onSignIn: async (signature) => {
    console.log('Client signed in', signature);
    const token = await getAuthTokenWithSignature(
      signature,
      userAccountAddress!,
      { backendUrl }
    );
    await bot.connect(token);
  },
  onOpenAIKey: async (apiKey) => {
    console.log('Client set OpenAI key', apiKey);
    initOpenAIClient(apiKey);
  },
});

const waitForRequest = () =>
  new Promise((resolve) => {
    eventEmitter.once('prompt', (prompt) => {
      console.log('Received prompt', prompt);
      resolve(prompt);
    });
  });

async function startMainLoop() {
  supportedAssets = await Promise.all([
    bot.getSupportedAssets3d('basic'),
    bot.getSupportedAssets3d('custom'),
  ])
    .then((results) => results.flat())
    .then((assets) =>
      assets.map(({ id, meta: { name, category } }) => ({
        asset3dId: id,
        name,
        category,
      }))
    );
  console.log('Supported assets', supportedAssets);
  for (const asset of supportedAssets) {
    asset3dNamesById[asset.asset3dId] = asset.name;
  }

  let prompt = 'Enter message to send or type "exit" to exit the chat';
  let message = '';
  while (true) {
    try {
      message = (await Promise.race([
        promptUser(prompt),
        waitForRequest(),
      ])) as string;
    } catch (err) {
      console.log('Exiting chat...');
      process.exit(0);
    }

    try {
      if (message) {
        const resp = await sendToOpenAI(
          message,
          objects,
          objectsData,
          myTransform,
          supportedAssets
        );

        const commands = JSON.parse(resp);
        prompt = await processResponse(
          Array.isArray(commands) ? commands : [commands]
        );
        eventEmitter.emit('response', prompt);
      }
    } catch (err: any) {
      console.error('Error', err);
      prompt = 'Error: ' + err.message;
      eventEmitter.emit('response', err.message);
    }
  }
}

async function processResponse(actions: any[]) {
  for (const action of actions) {
    switch (action.type) {
      case 'text':
        return action.text;

      case 'new':
        console.log('New object', action);
        const { name, color, asset3dId, transform } = action;

        if (!asset3dNamesById[asset3dId]) {
          console.error('Unknown asset3dId', asset3dId);
          break;
        }
        const object = await bot.spawnObject({
          name,
          transform: { ...defaultTransform, ...transform },
          asset_3d_id: asset3dId,
        });
        console.log('Spawned object', object);
        if (color) {
          await bot.setObjectColor(object.id, color);
        }
        break;

      case 'edit':
        console.log('Edit object', action);
        if (action.color) {
          await bot.setObjectColor(action.objectId, action.color);
        }
        if (action.name) {
          await bot.setObjectName(action.objectId, action.name);
        }
        break;

      case 'remove':
        console.log('Remove object', action);
        bot.removeObject(action.objectId);
        break;

      case 'transform':
        console.log('Transform object', action);
        await bot.requestObjectLock(action.objectId);
        const newTransform = {
          ...objects[action.objectId].transform,
          ...action.transform,
        };
        bot.transformObject(action.objectId, newTransform);
        bot.requestObjectUnlock(action.objectId);
        break;

      default:
        console.log('Unknown action', action);
    }
  }
  return 'Done';
}
