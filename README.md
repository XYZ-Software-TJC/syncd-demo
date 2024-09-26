# Syncd SDK Integration

This project uses the Syncd SDK to enhance your application's functionality. Follow the steps below to set up and use the Syncd SDK in your project.

## Installation

You can install the syncd-sdk using your preferred package manager. Choose one of the following commands:

### Using pnpm

```bash
pnpm add syncd-sdk
```

### Using npm

```bash
npm install syncd-sdk
```

### Using yarn

```bash
yarn add syncd-sdk
```

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
