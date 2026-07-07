
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { OpenAIEmbeddings } from "@langchain/openai";
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
import { createAgent, dynamicSystemPromptMiddleware } from "langchain";
import "dotenv/config";


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


const ragMiddleware = dynamicSystemPromptMiddleware(async(state)=>
{
 const userMessage =  state.messages[0].content;
 const query = typeof userMessage === "string" ? userMessage : "";
 const retrievedDocs = await vectorStore.similaritySearch(query, 2);
 const docsContent = retrievedDocs.map((doc) => doc.pageContent).join("\n\n");
 return `You are helpful assistant. Use the following context from the document to answer the user's question:\n\n${docsContent}`;
});

const agent = createAgent({
    model: "claude-sonnet-4-6",
    tools: [],
    middleware: [ragMiddleware]
})

const result = await agent.invoke({
    messages: [{role: "user", content: "What was Nike's revenue in 2023 & 2025 and from which Town Nike has grown into worldfamous footwear?"}]
})

console.log(result)