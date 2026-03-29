import 'dotenv/config';
import { App } from '@microsoft/teams.apps';
import { DevtoolsPlugin } from '@microsoft/teams.dev';
import { ChatPrompt, Message} from '@microsoft/teams.ai';
import { ConsoleLogger } from '@microsoft/teams.common/logging';
import { OpenAIChatModel } from '@microsoft/teams.openai';
import { McpClientPlugin } from '@microsoft/teams.mcpclient';
import { MessageActivity } from '@microsoft/teams.api';

//  Create the app
const app = new App({
  plugins: [new DevtoolsPlugin()],
});

//  Logger
const logger = new ConsoleLogger("community-insights-bot", { level: "debug" });

//  In-memory store for conversation history
const conversationStore = new Map<string, Message[]>();
const getOrCreateConversationHistory = (conversationId: string): Message[] => {
  const existing = conversationStore.get(conversationId);
  if (existing) return existing;
  const messages: Message[] = [];
  conversationStore.set(conversationId, messages);
  return messages;
};

//  ChatPrompt setup with MCP client
const prompt = new ChatPrompt(
  {
    instructions: "You are a helpful assistant. Use the available tools to answer the user's request.",
    model: new OpenAIChatModel({
      model: process.env.AZURE_OPENAI_MODEL_DEPLOYMENT_NAME!,
      apiKey: process.env.AZURE_OPENAI_API_KEY!,
      endpoint: process.env.AZURE_OPENAI_ENDPOINT!,
      apiVersion: process.env.AZURE_OPENAI_API_VERSION,
    }),
    logger
  },
  [new McpClientPlugin({ logger })]
).usePlugin("mcpClient", {
  url: process.env.AZURE_MCP_ENDPOINT!,
  params: {
      headers: {
        "x-functions-key": process.env.AZURE_FUNCTION_KEY!,
      },
    },
});

//  Message handler
app.on("message", async ({ activity, send }) => {
  await send({ type: "typing" });

  const userMessage = activity.text?.trim();
  const conversationId = activity.conversation.id;

  if (!userMessage) {
    await send("Please send a valid message.");
    return;
  }

  logger.info(" Incoming message:", userMessage);

  try {
    const history = getOrCreateConversationHistory(conversationId);

    // Update prompt with history
    //prompt.messages = history;

    const result = await prompt.send(userMessage, {
      messages: history
    });

    if (result.content) {
      const response = new MessageActivity(result.content);
      await send(response);
    } else {
      await send(" The assistant didn’t return any message.");
    }
  } catch (err) {
    console.error(" Error:", err);
    await send("Something went wrong while generating the response.");
  }
});

//
(async () => {
  await app.start(+(process.env.PORT || 3000));
})();
