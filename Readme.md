# Odyssey Creator OpenAI/GPT Assistant

This project utilizes [Odyssey Momentum.xyz Bot SDK](https://github.com/momentum-xyz/bot-sdk-nodejs) to create a bot that can be used to make changes in an Odyssey using natural language with OpenAI assistance.

Sample commands:

- `add a new sphere above the teapot`
- `align all cubes in a single row with gap 5 between them`
- `remove all spheres`
- `rotate the teapot with 90 degrees horizontally`

The commands are sent to GPT-4 model along with the list of objects in the world and actions supported by the bot. The model returns the JSON the list of actions to be performed.

It's possible to use the bot from the Web UI Client or from the command line.

## Prerequisites

### Nodejs

You need to have [Node.js](https://nodejs.org/en/) version 18 or 20 (or higher) installed on your machine.

### Github npm package repository

For now the SDK packages are only hosted on Github npm package repository.
To use this you need to [authenticate](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry#authenticating-to-github-packages).
Read the Github documentation, create PAT and:

```shell
npm login --scope=@momentum-xyz --auth-type=legacy --registry=https://npm.pkg.github.com
```

## Installation

Clone the project with git or download the [latest version archive](https://github.com/momentum-xyz/bot-creator-openai/archive/refs/heads/master.zip) and unzip it. You can rename the default `bot-creator-openai-develop` to a different name.

In the console enter the project directory and install the dependencies:

```bash
cd bot-creator-openai-develop

npm install
```

## Configuration

In order to make changes in Odyssey you want to connect as User (not guest).

You will also need to provide OpenAI API key. You can get it from [OpenAI platform](https://platform.openai.com/account/api-keys).

It can be done either on the client side or on the server side.

**NOTE:** The Bot needs a different user account from the one used in the Odyssey UI-client (or at least simultaneously). It's because only one connection for given user is allowed at the same time.

So, one way to accomplish this is:

- Create a new Metamask account
- Sign out of Odyssey and sign in again using the new account - switch to the new account in Metamask and make sure to Connect it to current site
- Copy the address of the new account
- Sign-out and switch back to your main account
- In the Odyssey UI-client enable the Creator Mode, press Co-Creators and add the new account as a collaborator

Now you can use the new account to connect the Bot to your Odyssey.

## Client side

It's possible to sign in using Metamask wallet in the UI. Once you open the the UI in the browser, you will be asked to sign in.

The UI will also ask for OpenAI API key if it's not configured on server.

## Server side

It's also possible to configure everything on the server side.

In order to connect as User you need to provide the private key of the user account - you can [retrive the account private key in MetaMask](https://support.metamask.io/hc/en-us/articles/360015289632-How-to-export-an-account-s-private-key) then set it as environment variable:

```bash
export BOT_SDK_PRIVATE_KEY=...
```

The OpenAI key can also be set as environment variable:

```bash
export OPENAI_API_KEY=...
```

## Running

Run the bot:

```bash
npm start
```

Run the web:

```bash
npm run web
```

Open the web UI in the browser: http://localhost:4242
