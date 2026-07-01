
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf"

const loader = new PDFLoader("/users/patrykksiazek/downloads/ProjectDocs/nke-10k-2023.pdf")
const docs = await loader.load()
console.log(docs)
console.log(docs[0].pageContent)