import { MultiServerMCPClient } from "@langchain/mcp-adapters";

const client = new MultiServerMCPClient({

    ecommerce : {
        
        transport: "stdio",
        command : "node",
        args : ["/Users/patrykksiazek/Downloads/mcp-ecommerce-crud/dist/mcp/server.js"],
    }
})

