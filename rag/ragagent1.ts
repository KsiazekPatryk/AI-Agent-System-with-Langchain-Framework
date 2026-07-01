
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf"
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters"

const loader = new PDFLoader("/users/patrykksiazek/downloads/ProjectDocs/nke-10k-2023.pdf")
const docs = await loader.load()
console.log(docs)
console.log(docs[0].pageContent)

const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 200 })
const chunks = await splitter.splitDocuments(docs)
console.log(chunks)