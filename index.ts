import {
  Bot,
  BotConfig,
  getAuthTokenWithPrivateKey,
  posbus,
} from '@momentum-xyz/bot-sdk';
import { promptUser } from './chat';
import { sendToOpenAI } from './open-ai';

// TODO change worldId to your world id!
const worldId = '00000000-0000-8000-8000-000000000027';
const backendUrl = 'http://localhost:4000';

// Set private key from environment variable if you want to connect as User, otherwise connect as Guest
const privateKey = process.env['BOT_SDK_PRIVATE_KEY'];

let initialDataReceived = false;
const objects: Record<string, posbus.ObjectDefinition> = {};
const objectsData: Record<string, posbus.ObjectData> = {};
let myTransform: posbus.TransformNoScale = {
  position: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0 },
};

// TODO load from DB
const asset3dNamesById = {
  'a55f9ca7-4b45-692e-204f-e37ed9dc3d78': 'bucky',
  '97daa12f-9b2e-536d-7851-3b0837175e4c': 'disc',
  '839b21db-52ff-45ce-7484-fd1b59ebb087': 'dodeca',
  'dad4e8a4-cdcc-4174-9d77-f7e849bba352': 'icosa',
  'a1f144de-b21a-d1e9-0635-6eb250927326': 'octo',
  '313a97cc-fe1b-39bb-56e7-516d213cc23d': 'sphere',
  '6e8fec1c-ff95-df66-1375-e312f6447b3d': 'torus',
  'eea924c0-6e33-393f-e06e-e6631e8860e9': 'capsule',
  '8a7e55f5-934d-8ebf-17bb-39e2d8d9bfa1': 'cone',
  '5b5bd872-0328-e38c-1b54-bf2bfa70fc85': 'cube',
  '46d923ad-21ff-276d-c3c4-ead2212bcb02': 'cylinder',
  '418c4963-623a-391c-795d-e6080be11899': 'quad',
  '2dc7df8e-a34a-829c-e3ca-b73bfe99faf0': 'orb',
  'de99ac0e-0ba0-6446-9263-46d3f6c854e5': 'teapot',
};
const asset3dIdsByName = Object.fromEntries(
  Object.entries(asset3dNamesById).map(([id, name]) => [name, id])
);
const supportedAssetNames = Object.keys(asset3dNamesById);
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
  console.log('No private key passed. Connect as guest...');
  bot.connect();
}

async function startMainLoop() {
  let prompt = 'Enter message to send or type "exit" to exit the chat';
  let message = '';
  while (true) {
    try {
      message = await promptUser(prompt);
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
          asset3dNamesById
        );

        const commands = JSON.parse(resp);
        prompt = await processResponse(
          Array.isArray(commands) ? commands : [commands]
        );
      }
    } catch (err: any) {
      console.error('Error', err);
      prompt = 'Error: ' + err.message;
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
        const { name, color, model, transform } = action;
        const asset_3d_id = asset3dIdsByName[model];
        if (!asset_3d_id) {
          console.error('Unknown model', model);
          break;
        }
        const object = await bot.spawnObject({
          name,
          transform: { ...defaultTransform, ...transform },
          asset_3d_id,
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
