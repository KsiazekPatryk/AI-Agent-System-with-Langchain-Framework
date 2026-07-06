import { createAgent } from "langchain";
import { MultiServerMCPClient } from "@langchain/mcp-adapters";

const client = new MultiServerMCPClient({

    ecommerce : {
        
        transport: "stdio",
        command : "node",
        args : ["/Users/patrykksiazek/Downloads/mcp-ecommerce-crud/dist/mcp/server.js"],
    }
})


const mcpTools = await client.getTools();


createAgent({
    model: "claude-sonnet-4-5-20250929",
    tools: [...mcpTools]
})


