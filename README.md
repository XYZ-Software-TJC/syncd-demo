# Syncd SDK Integration

This project uses the Syncd SDK to enhance your application's functionality. Follow the steps below to set up and use the Syncd SDK in your project.

## Installation

You can start this project by running the following command:

### Using pnpm

```bash
pnpm install
```

### Using npm

```bash
npm install
```

### Using yarn

```bash
yarn install
```

### Then run this command to push the schema to the database:

```bash
pnpm db:push
```

or

```bash
yarn db:push
```

or

```bash
npm run db:push
```

## Environment Setup

1. Copy the `.env.example` file to create a new `.env` file:

```bash
cp .env.example .env
```

2. Update the `.env` file with your specific values:

   - Generate a `NEXTAUTH_SECRET` using:
     ```bash
     openssl rand -base64 32
     ```
   - Set up Discord OAuth:
     - Go to the [Discord Developer Portal](https://discord.com/developers/applications/)
     - Create a new application
     - In the "OAuth2" section, add a redirect URL: `http://localhost:3000/api/auth/callback/discord`
     - Copy the Client ID and Client Secret
     - Update `DISCORD_CLIENT_ID` and `DISCORD_CLIENT_SECRET` in your `.env` file
   - Set up Syncd:
     - Get your Syncd API key and callback URL from the [Syncd dashboard](https://syncd-www-dev.vercel.app/dashboard/projects/<project-id>/project-settings)
     - Update `SYNCD_API_KEY` and `SYNCD_WEBHOOK_CALLBACK_URL` in your `.env` file

3. A Discord logo image (`discord-helper.png`) is included in the `public` directory for use in the authentication UI.

## Usage

To use the Syncd SDK in your project, follow these steps:

1. Import the SDK in your project:

```javascript
import { SyncdSdk } from "syncd-sdk";
```

2. Initialize the SDK with your project ID:

```javascript
import { SyncdSdk } from "syncd-sdk";

export const syncdNodeClient = new SyncdSdk({
  apiKey: env.SYNCD_API_KEY,

  // Note: This is not a required field
  // Defaults to use the PROD Syncd API
  // DO NOT REMOVE FOR THE DEMO
  apiUrl: env.SYNCD_API_URL,
});
```
