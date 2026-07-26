import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { OpenAIEmbeddings } from "@langchain/openai";
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
import { createAgent, tool } from "langchain";
import z from "zod";
import { MultiServerMCPClient } from "@langchain/mcp-adapters";
import "dotenv/config";

const client = new MultiServerMCPClient({

    ecommerce : {
        
        transport: "stdio",
        command : "node",
        args : ["/Users/patrykksiazek/Downloads/mcp-ecommerce-crud/dist/mcp/server.js"],
    }
})

const pdfPaths = ["/users/patrykksiazek/downloads/ProjectDocs/nke-10k-2023.pdf",
"/users/patrykksiazek/downloads/ProjectDocs/nke-10k-2023.pdf",
"/users/patrykksiazek/downloads/ProjectDocs/Nike-Inc-2025_10K.pdf",
"/users/patrykksiazek/downloads/ProjectDocs/nike-growth-story.pdf",
]

const allDocs = [];

for (const pdfPath of pdfPaths) 
{
    const loader = new PDFLoader(pdfPath);
    const docs = await loader.load();
    allDocs.push(...docs);
}

console.log(allDocs)
console.log(allDocs[0].pageContent)

const textSplitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 200 })

const allSplits = await textSplitter.splitDocuments(allDocs)
console.log(allSplits)

const embeddings = new OpenAIEmbeddings({ model: "text-embedding-3-large" })

const vectorStore = await MemoryVectorStore.fromDocuments(allSplits, embeddings)


const retrieve = tool(async({ query })=>
{
 const retrievedDocs = await vectorStore.similaritySearch(query, 2);
 const docsContent = retrievedDocs.map((doc) => doc.pageContent).join("\n\n");
 return docsContent;
},
{
    name: "retrieve",
    description: "Retrieve information from multiple pdf documents",
    schema: z.object({
        query: z.string()
    })
}
);

const mcpTools = await client.getTools();


const agent  = createAgent({
    model: "claude-sonnet-4-5-20250929",
    tools: [...mcpTools, retrieve] as any[],
})


const response = await agent.invoke({
    messages: [{ role: "user", content: "Get product with id 28 and check if that product name match with our company offerings" }],
});
console.log(response)