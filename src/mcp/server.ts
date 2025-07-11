import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { MoondreamClient, createConfigFromEnv, initializeLogger, getLogger } from '@/utils';
import { MOONDREAM_TOOLS } from './tools';
import { createMoondreamResources, getResourceContent } from './resources';
import { MoondreamMCPHandlers } from './handlers';

export class MoondreamMCPServer {
  private server: Server;
  private client: MoondreamClient;
  private handlers: MoondreamMCPHandlers;
  private logger: ReturnType<typeof getLogger>;

  constructor() {
    // Initialize configuration and client
    const config = createConfigFromEnv();
    this.logger = initializeLogger(config);
    this.client = new MoondreamClient(config);
    this.handlers = new MoondreamMCPHandlers(this.client);

    // Create MCP server
    this.server = new Server(
      {
        name: 'moondream-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
          resources: {},
        },
      }
    );

    this.setupHandlers();
  }

  private setupHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: MOONDREAM_TOOLS,
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async request => {
      return this.handlers.handleToolCall(request);
    });

    // List available resources
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      const config = createConfigFromEnv();
      return {
        resources: createMoondreamResources(config),
      };
    });

    // Read resource content
    this.server.setRequestHandler(ReadResourceRequestSchema, async request => {
      const { uri } = request.params;
      const config = createConfigFromEnv();

      try {
        const content = getResourceContent(uri, config);
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(content, null, 2),
            },
          ],
        };
      } catch (error) {
        throw new Error(
          `Failed to read resource ${uri}: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    });

    // Error handling
    this.server.onerror = error => {
      this.logger.error('MCP Server Error', { error: error.message }, 'mcp-server');
    };

    process.on('SIGINT', async () => {
      await this.cleanup();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      await this.cleanup();
      process.exit(0);
    });
  }

  async start(): Promise<void> {
    this.logger.info('Starting Moondream MCP Server...', {}, 'mcp-server');

    try {
      // Initialize the Moondream client
      const startTime = Date.now();
      await this.client.initialize();
      const initTime = Date.now() - startTime;
      this.logger.performance('client-initialization', initTime, {}, 'mcp-server');
      this.logger.info('Moondream client initialized', { initTimeMs: initTime }, 'mcp-server');

      // Create transport
      const transport = new StdioServerTransport();

      // Connect server to transport
      await this.server.connect(transport);
      this.logger.info('MCP Server started and listening on stdio', {}, 'mcp-server');
    } catch (error) {
      this.logger.error(
        'Failed to start MCP server',
        { error: error instanceof Error ? error.message : String(error) },
        'mcp-server'
      );
      throw error;
    }
  }

  async cleanup(): Promise<void> {
    this.logger.info('Cleaning up MCP Server...', {}, 'mcp-server');

    try {
      await this.client.cleanup();
      await this.server.close();
      this.logger.info('MCP Server cleanup completed', {}, 'mcp-server');
    } catch (error) {
      this.logger.error(
        'Error during cleanup',
        { error: error instanceof Error ? error.message : String(error) },
        'mcp-server'
      );
    }
  }
}

// Function to create and start the server
export async function startMoondreamMCPServer(): Promise<MoondreamMCPServer> {
  const server = new MoondreamMCPServer();
  await server.start();
  return server;
}
