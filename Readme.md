# Odyssey Creator OpenAI/GPT Assistant

This project utilizes [Odyssey Momentum.xyz Bot SDK](https://github.com/momentum-xyz/bot-sdk-nodejs) to create a bot that can be used to make changes in an Odyssey using natural language with OpenAI assistance.

Sample commands:

- `add a new sphere above the teapot`
- `align all cubes in a single row with gap 5 between them`
- `remove all spheres`
- `rotate the teapot with 90 degrees horizontally`

The commands are sent to GPT-4 model along with the list of objects in the world and actions supported by the bot. The model returns the JSON the list of actions to be performed.

## Prerequisites

### Nodejs

You need to have [Node.js](https://nodejs.org/en/) version 20 (or higher) installed on your machine.

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

By default the bot connects to the world as Guest.

In order to make changes you want to connect as User and need to provide the private key of the user account - you can [retrive the account private key in MetaMask](https://support.metamask.io/hc/en-us/articles/360015289632-How-to-export-an-account-s-private-key) then set it as environment variable:

```bash
export BOT_SDK_PRIVATE_KEY=...
```

In order to connect to OpenAI you also need a key from [OpenAI platform](https://platform.openai.com/account/api-keys). Set it as environment variable:

```bash
export OPENAI_API_KEY=...
```

## Running

Run the bot:

```bash
npm start
```

### Connecting as User

Then stop the bot if it's running and run it again.

**NOTE** that only one connection for given user is allowed - make sure you don't have more than one bot instance with same account or the UI Client opened in the web browser.
