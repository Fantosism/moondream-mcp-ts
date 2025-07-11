#!/usr/bin/env node

import { config } from 'dotenv';
import { startMoondreamMCPServer } from './mcp/server';

// Load environment variables
config();

async function main() {
  try {
    console.log('🌙 Moondream MCP Server - TypeScript Implementation');
    console.log('=====================================');
    
    const server = await startMoondreamMCPServer();
    
    // Keep the server running
    console.log('✅ Server is running. Use Ctrl+C to stop.');
    
    // Wait indefinitely with proper signal handling
    await new Promise<void>((resolve) => {
      process.on('SIGINT', () => {
        console.log('\n🛑 Received SIGINT, shutting down gracefully...');
        resolve();
      });
      process.on('SIGTERM', () => {
        console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
        resolve();
      });
    });
    
    // Cleanup will be handled by the server's signal handlers
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the server if this file is executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Unhandled error:', error);
    process.exit(1);
  });
}

export { main };