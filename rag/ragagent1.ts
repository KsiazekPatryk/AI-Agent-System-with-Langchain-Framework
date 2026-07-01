
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { OpenAIEmbeddings } from "@langchain/openai";
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
import "dotenv/config";

const loader = new PDFLoader("/users/patrykksiazek/downloads/ProjectDocs/nke-10k-2023.pdf")
const docs = await loader.load()
console.log(docs)
console.log(docs[0].pageContent)

const textSplitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 200 })
const allSplits = await textSplitter.splitDocuments(docs)
console.log(allSplits)

const embeddings = new OpenAIEmbeddings({ model: "text-embedding-3-large" })

const vectorStore = await MemoryVectorStore.fromDocuments(allSplits, embeddings)

const results = await vectorStore.similaritySearch("When was Nike incorporated?");

console.log(results)

