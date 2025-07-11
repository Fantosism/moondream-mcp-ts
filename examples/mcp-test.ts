#!/usr/bin/env ts-node

import { config } from 'dotenv';
import { spawn } from 'child_process';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

// Load environment variables
config();

async function testMCPServer() {
  console.log('🧪 Testing Moondream MCP Server');
  console.log('==============================');

  // Start the MCP server process
  const serverProcess = spawn('npm', ['run', 'mcp'], {
    stdio: ['pipe', 'pipe', 'inherit'],
    cwd: process.cwd(),
  });

  try {
    // Create MCP client
    const transport = new StdioClientTransport({
      command: 'npm',
      args: ['run', 'mcp'],
    });

    const client = new Client(
      {
        name: 'moondream-test-client',
        version: '1.0.0',
      },
      {
        capabilities: {},
      }
    );

    // Connect to server
    await client.connect(transport);
    console.log('✅ Connected to MCP server');

    // Test 1: List tools
    console.log('\n📋 Testing list tools...');
    const toolsResult = await client.listTools();
    console.log(`Found ${toolsResult.tools.length} tools:`);
    toolsResult.tools.forEach(tool => {
      console.log(`  - ${tool.name}: ${tool.description}`);
    });

    // Test 2: List resources
    console.log('\n📦 Testing list resources...');
    const resourcesResult = await client.listResources();
    console.log(`Found ${resourcesResult.resources.length} resources:`);
    resourcesResult.resources.forEach(resource => {
      console.log(`  - ${resource.name}: ${resource.description}`);
    });

    // Test 3: Read a resource
    console.log('\n📖 Testing read resource...');
    const configResource = await client.readResource({
      uri: 'moondream://config',
    });
    console.log('Config resource content:');
    console.log(configResource.contents[0].text);

    // Test 4: Call caption_image tool
    console.log('\n🖼️  Testing caption_image tool...');
    const captionResult = await client.callTool({
      name: 'caption_image',
      arguments: {
        image_path: 'https://picsum.photos/400/300?random=1',
        length: 'normal',
      },
    });
    console.log('Caption result:');
    console.log((captionResult.content as any)[0].text);

    // Test 5: Call generate_alt_text tool
    console.log('\n♿ Testing generate_alt_text tool...');
    const altTextResult = await client.callTool({
      name: 'generate_alt_text',
      arguments: {
        image_path: 'https://picsum.photos/400/300?random=1',
        style: 'descriptive',
        max_length: 125,
      },
    });
    console.log('Alt-text result:');
    console.log((altTextResult.content as any)[0].text);

    console.log('\n✅ All MCP tests completed successfully!');

    // Cleanup
    await client.close();
    
  } catch (error) {
    console.error('❌ MCP test failed:', error);
    throw error;
  } finally {
    // Kill server process
    serverProcess.kill('SIGTERM');
    console.log('🧹 Server process terminated');
  }
}

// Run the test
if (require.main === module) {
  testMCPServer().catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
}

export { testMCPServer };