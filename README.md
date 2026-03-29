## Developer Feedback Aggregator

This is an AI powered developer feedback aggregator. It collects developer feedback and community signals, processes them with a model using the Model Context Protocol (MCP), and returns concise insights inside Microsoft Teams.

This repository contains a Teams app and a small MCP server that exposes context to the model. The project is focused on rapid prototyping and uses Microsoft Teams AI libraries and Azure for hosting.

## What this project does

- Accepts messages from a Teams user or conversation.
- Sends the message and any relevant context to an OpenAI style model via Azure OpenAI.
- Uses an MCP endpoint to provide additional context or tools to the model.
- Returns model generated text back to the user in Teams.
- Demo Video in the videos folder


## High level architecture

1. Teams app (bot) receives a user message in Teams.
2. Bot code runs locally or in an Azure Web App and uses the Teams AI library to construct prompts.
3. The app calls an MCP endpoint when it needs structured context or tools. The MCP server is implemented as an Azure Functions app in `microsoft-issues-mcp-server`.
4. The prompt uses an OpenAIChatModel pointed at Azure OpenAI to generate the response.
5. Response is sent back to the user in Teams.

## Key folders and files

- `developer-feedback-aggregator/` - Main Teams app and bot code.
	- `src/index.ts` - App entry point and message handler. Shows how the prompt, MCP client plugin, and OpenAI model are wired together.
	- `package.json` - Lists dependencies and dev scripts used to run and build the Teams app.
	- `appPackage/manifest.json` - Teams app manifest used when packaging or installing the app in Teams.
	- `infra/azure.bicep` - Bicep file to provision Azure resources such as an App Service and bot registration.
- `microsoft-issues-mcp-server/` - The MCP server implementation.
	- `src/` and `package.json` - This folder is implemented as an Azure Functions app. It uses the Model Context Protocol SDK to serve context to the model.

## Tech stack and main libraries

This project uses a Node.js and TypeScript stack with the following important libraries and services.

Runtime and language

- Node.js (v16 runtime suggested by the Bicep file).
- TypeScript for application code.

Microsoft Teams, AI, and MCP

- `@microsoft/teams-ai` and `@microsoft/teams.ai` - Teams AI libraries used to build the chat prompt and to run the app in a Teams friendly model.
- `@microsoft/teams.mcpclient` - MCP client plugin used by the ChatPrompt to call the MCP endpoint.
- `@microsoft/teams.openai` - Helpers for working with OpenAI style models inside the Teams AI stack.

Model provider

- `openai` - Official OpenAI SDK used for model calls if needed. In this project the Teams OpenAI adapter is used with environment variables configured for Azure OpenAI.

MCP server and Azure

- `@modelcontextprotocol/sdk` - The server side SDK used in the `microsoft-issues-mcp-server` Azure Functions app.
- `@azure/functions` - Azure Functions types and runtime glue used by the MCP server.
- Bicep - Infrastructure as code. `infra/azure.bicep` provisions App Service and bot registration.

Utilities and dev tooling

- `tsup` - Bundler used to build the TypeScript app into `dist`.
- `nodemon`, `ts-node` - Local development helpers.
- `dotenv` or env-cmd - Local environment file loading.
- `ws` - WebSocket library used by the Teams AI runtime where needed.

Server side dependencies for MCP server

- `node-fetch` - HTTP fetch library used by the MCP server.
- `zod` - Validation library used by the MCP server for input validation.

## Configuration and environment variables

The app expects a small set of environment variables. Populate a `.env` file in `community-insights` for local development. Example variables used in the code base:

- `AZURE_OPENAI_API_KEY` - The API key for Azure OpenAI.
- `AZURE_OPENAI_ENDPOINT` - Azure OpenAI endpoint URL.
- `AZURE_OPENAI_MODEL_DEPLOYMENT_NAME` - The deployment name for the model to use.
- `AZURE_OPENAI_API_VERSION` - API version string for the OpenAI client when using Azure.
- `AZURE_MCP_ENDPOINT` - URL of the MCP server endpoint (for example an Azure Function URL).
- `AZURE_FUNCTION_KEY` - Shared function key required by the MCP endpoint. The MCP client sends this in headers.
- `PORT` - Local server port (default 3000).

Store production secrets in a secure store such as Azure Key Vault and do not commit them to source control.

## How to run locally

1. Install dependencies from the root of `community-insights`.

```powershell
cd "mcp/community-insights"
npm install
```

2. Create a `.env` file with the environment variables above. A minimal `.env` example:

```text
AZURE_OPENAI_API_KEY=your_key_here
AZURE_OPENAI_ENDPOINT=https://your-openai-endpoint
AZURE_OPENAI_MODEL_DEPLOYMENT_NAME=gpt-deployment
AZURE_OPENAI_API_VERSION=2023-10-01-preview
AZURE_MCP_ENDPOINT=http://localhost:7071/api/mcp
AZURE_FUNCTION_KEY=local_function_key
PORT=3000
```

3. Start the app in development mode.

```powershell
npm run dev
```

4. Start the MCP server for local testing. From `microsoft-issues-mcp-server` run:

```powershell
cd "mcp/microsoft-issues-mcp-server"
npm install
npm run start
```

The MCP server is implemented as an Azure Functions app. The `start` script runs the Functions host locally. Make sure `AZURE_MCP_ENDPOINT` points to the Functions host URL and that the function key matches.


## Security and production notes

- Do not commit keys or secrets to source control.
- Use Azure Key Vault to store production secrets.
- Protect the MCP endpoint with function keys or authentication and do not expose it publicly without auth.
- Consider rate limits and model cost when enabling features that make many model calls.

## Simple contract for the core bot function

- Inputs: a Teams message text, a conversation id, and optional stored conversation history.
- Outputs: a string message or a MessageActivity object sent back to Teams.
- Error modes: network errors calling OpenAI or MCP, missing secrets, or invalid user input. The code returns a friendly error message when generation fails.

## Edge cases and operational concerns

- Empty or malformed user messages. The app prompts the user to send valid text.
- Long running or slow model calls. Consider streaming responses or a timeout policy.
- Scaling MCP server. If the MCP server returns large context payloads, paginate or limit the data.
- Authentication and permission scope when reading resources on behalf of a user.

## Next steps and optional improvements

- Add unit tests for the prompt building and MCP client interactions.
- Add a CI pipeline to build and test the TypeScript bundles.
- Containerize the bot and functions for predictable deployment.
- Add monitoring and structured logging for production usage.

## Where to look in the code

- `community-insights/src/index.ts` - Shows how the App, ChatPrompt, OpenAI model, and McpClientPlugin are wired.
- `community-insights/package.json` - Full list of Teams AI libraries and developer scripts.
- `community-insights/appPackage/manifest.json` - Teams app manifest. Use this to side load the app into Teams for testing.
- `microsoft-issues-mcp-server/` - MCP endpoint code and its `package.json` that lists `@modelcontextprotocol/sdk` and `@azure/functions`.

