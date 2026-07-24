# AI Agent System with LangChain Framework

## Overview

A progressive, hands-on implementation of AI agent patterns using the **LangChain** framework in TypeScript. Each agent and RAG pipeline builds on the previous one, introducing a new concept from the fundamentals of agent architecture through to full MCP-integrated agentic RAG deployable via LangGraph.

### 1. AI Agents – Fundamentals
- Understanding Agent Architecture
- Creating agents using `createAgent()`
- Agent invocation & message passing
- Tool-based agent workflows
- Model selection (GPT-4, Claude Sonnet, Claude Haiku)

### 2. Tools & Function Calling
- Custom tools with `tool()`
- Zod validation schemas
- Multi-tool orchestration
- Examples: `getWeather`, `getTime`, `emailTool`, `searchTool`

### 3. System Prompts & Prompt Engineering
- Custom `systemPrompt`
- `dynamicSystemPromptMiddleware` — context injection

### 4. Context Management
- `config.context` usage — user-specific data
- Environment configs

### 5. Memory & State Management
- `MemorySaver` checkpointer
- `thread_id` handling
- Persistent conversation history

### 6. Structured Outputs
- `responseFormat`
- Zod schemas
- Type-safe responses

### 7. Model Configuration
- `initChatModel()`
- Temperature, timeout, token limits
- Multi-model support

### 8. Middleware System
- `dynamicModelSelection`
- `modelFallbackMiddleware`
- `summarizationMiddleware`
- `llmToolSelectorMiddleware`
- `piiRedactionMiddleware`

### 9. Guardrails & Safety
- PII detection
- Regex filtering
- Compliance patterns

### 10. Retrieval Augmented Generation (RAG)
- PDF & DOCX loading
- Text splitting (chunk size 1000 / overlap 200)
- Embeddings: `text-embedding-3-large`
- `MemoryVectorStore`
- Similarity Search & MMR
- RAG via middleware & tools

### 11. Multi-Tool Agents
- Combining RAG + utility tools
- Multi-domain orchestration

### 12. MCP Integration – Agentic RAG
- `MultiServerMCPClient`
- External systems + RAG

### 13. LangGraph Deployment
- `langgraph.json`
- `ragagentServer.ts`

### 14. Environment Management
- API keys & `.env` usage
- LangSmith tracing

---

## Agent1

A simple AI agent built with LangChain, powered by the **Claude Haiku** model, with two tools:

### Tools

| Tool | Description |
|------|-------------|
| `getWeather` | Returns the weather for a given city (currently mocked: "It's sunny in {city}") |
| `getTime` | Returns the current time for a given city (currently mocked: "The current time in {city} is 3:00 PM") |

### How it works

1. Creates an agent (`createAgent`) with the `claude-haiku-4-5-20251001` model and the set of tools.
2. Invokes the agent with a user question — default: `"What is weather & time in New York?"`.
3. The agent decides which tools to call, executes them, and returns a composed response.
4. The result is logged to the console.

### Notes

- Both tools use Zod for input schema validation (`city: string`).
- Tool responses are currently hardcoded — no real weather or time API is connected yet.

### Run

```bash
npx ts-node agent1.ts
```

---

## Agent2

An AI agent that demonstrates a **two-step tool chain**: it first retrieves the user's location, then fetches the weather for that location — without the user needing to specify a city.

### Tools

| Tool | Description |
|------|-------------|
| `getUserLocation` | Returns the user's city based on their `user_id` from context (currently mocked: user `"1"` → `"Florida"`) |
| `getWeather` | Returns the weather for a given city (currently mocked: "It's sunny in {city}") |

### How it works

1. Creates an agent with the `claude-haiku-4-5-20251001` model and both tools.
2. Invokes the agent with `"What is the weather outside?"` and passes a `config` object containing `user_id`.
3. The agent calls `getUserLocation` first (instructed via tool description), retrieves the city.
4. The agent then calls `getWeather` with that city and returns the final answer.

### Notes

- `getUserLocation` receives `config.context.user_id` via LangChain's runtime config — this is how user context is securely injected into tools.
- Tool responses are currently hardcoded — no real database or weather API is connected yet.

### Differences from Agent1

| | Agent1 | Agent2 |
|--|--------|--------|
| **Tools** | `getWeather`, `getTime` | `getUserLocation`, `getWeather` |
| **Tool usage** | Independent tools — each answers a separate question | **Chained tools** — the output of one feeds the next |
| **User input** | The city must be stated in the question (`"...in New York?"`) | The city is **inferred** — the user only asks `"What is the weather outside?"` |
| **Context** | No context used | Passes a `config` with `user_id`, injected into the tool via `config.context.user_id` |
| **Key concept** | Basic tool calling | Tool chaining + runtime user context |

### Run

```bash
npx ts-node agent2.ts
```

---

## Agent3

An AI agent with a **humorous weather-forecaster persona** that uses a system prompt to guide its behavior and returns a **structured response** validated by a Zod schema.

### Tools

| Tool | Description |
|------|-------------|
| `get_user_location` | Returns the user's location based on `user_id` from context (currently mocked: user `"1"` → `"Florida"`, otherwise `"SFO"`) |
| `getWeather` | Returns the weather for a given city (currently mocked: "Its sunny in {city}") |

### How it works

1. Creates an agent with the `claude-haiku-4-5-20251001` model, both tools, a `systemPrompt`, and a `responseFormat`.
2. The `systemPrompt` defines the agent as an expert weather forecaster that speaks with humour and instructs it to determine the location first.
3. Invokes the agent with `"What is the weather outside?"` and passes a `qaConfig` object containing `user_id`.
4. The agent calls `get_user_location` to resolve the city, then `getWeather`, and returns the result.
5. The response is constrained to a Zod schema (`human_response`, `weather_conditions`) and logged via `response.structuredResponse`.

### Notes

- Uses a `systemPrompt` to shape the agent's tone and tool-calling strategy.
- Uses `responseFormat` (a Zod object) to enforce a **structured response** instead of free-form text.
- Tool responses are currently hardcoded — no real database or weather API is connected yet.

### What Agent3 adds over Agent2

| | Agent3 | Agent2 |
|--|--------|--------|
| **System prompt** | Adds a `systemPrompt` defining a humorous expert-forecaster persona and tool strategy | None |
| **Output format** | **Structured response** validated by a Zod `responseFormat` (`human_response`, `weather_conditions`) | Free-form text answer |
| **Result access** | Reads `response.structuredResponse` (a typed object) | Reads the final message content |
| **Tools** | Same tools (`get_user_location`, `getWeather`) — chaining behavior unchanged | `getUserLocation`, `getWeather` |
| **Key concept** | Persona via system prompt + guaranteed structured output | Tool chaining + runtime context |

### Run

```bash
npx ts-node agent3.ts
```

---

## Agent4

An AI agent that adds **conversational memory** on top of Agent3, using a LangGraph `MemorySaver` checkpointer so the agent remembers earlier turns within the same thread. It also configures the model explicitly via `initChatModel`.

### Tools

| Tool | Description |
|------|-------------|
| `get_user_location` | Returns the user's location based on `user_id` from context (currently mocked: user `"1"` → `"Florida"`, otherwise `"SFO"`) |
| `getWeather` | Returns the weather for a given city (currently mocked: "Its sunny in {city}") |

### How it works

1. Builds the model with `initChatModel("claude-haiku-4-5-20251001", { temperature: 0.7, timeout: 30, max_tokens: 1000 })` for explicit control over model parameters.
2. Creates a `MemorySaver` checkpointer and passes it to `createAgent` so conversation state is persisted per thread.
3. Each `invoke` passes a `config` with `configurable.thread_id` — this is **required** when a checkpointer is used, as it tells the checkpointer which conversation thread to persist.
4. The first two calls (`"What is the weather outside?"` then `"What location did you tell me about?"`) share the same `thread_id`, so the agent remembers the resolved location across turns.
5. The third call (`"Suggest me good places in that location"`) demonstrates how memory is keyed by `thread_id` — different configs (`config` vs `qaConfig`) represent different conversation threads and contexts.
6. Each response is read from the last message (`response.messages[...].content`) and logged.

### Notes

- A checkpointer (`MemorySaver`) gives the agent **memory across invocations** within the same thread.
- **Every** `invoke` must include `configurable.thread_id` when a checkpointer is attached, otherwise it throws `Failed to put checkpoint ... missing a required "thread_id"`.
- `config` and `qaConfig` carry both a `thread_id` (which conversation) and `context.user_id` (which user's location to resolve).
- Tool responses are currently hardcoded — no real database or weather API is connected yet.

### What Agent4 adds over Agent3

| | Agent4 | Agent3 |
|--|--------|--------|
| **Memory** | Persists conversation state with a `MemorySaver` checkpointer — remembers earlier turns | Stateless — each `invoke` starts fresh |
| **Model setup** | Builds the model via `initChatModel(...)` with explicit `temperature`, `timeout`, `max_tokens` | Passes the model id as a string to `createAgent` |
| **Config** | Requires `configurable.thread_id` on every `invoke` to key the conversation thread | No `thread_id` needed |
| **Interaction** | Multiple chained `invoke` calls in one run (follow-up questions across turns) | A single `invoke` call |
| **Result access** | Reads the last message content (`response.messages[...].content`) | Reads `response.structuredResponse` |
| **Key concept** | Conversational memory + explicit model configuration | Persona + structured output |

### Run

```bash
npx ts-node agent4.ts
```

---

## Agent5

An AI agent that extends Agent4 with **dynamic model selection middleware** — it automatically switches between a more powerful and a cheaper model depending on how many messages are in the current request.

### Tools

| Tool | Description |
|------|-------------|
| `get_user_location` | Returns the user's location based on `user_id` from context (currently mocked: user `"1"` → `"Florida"`, otherwise `"SFO"`) |
| `getWeather` | Returns the weather for a given city (currently mocked: "Its sunny in {city}") |

### How it works

1. Two models are initialised:
   - `model` — `claude-sonnet-4-5` (advanced, higher cost)
   - `basicModel` — `claude-haiku-4-5` (cheaper, faster)
2. A `dynamicModelSelection` middleware is created with `createMiddleware`. Its `wrapModelCall` intercepts every model call and checks `request.messages.length`:
   - **< 3 messages** → uses the advanced `model` (claude-sonnet)
   - **≥ 3 messages** → switches to the cheaper `basicModel` (claude-haiku)
3. The middleware is passed to `createAgent` via the `middleware` option.
4. Three `invoke` calls are made in sequence (weather query → location recall → place suggestions), sharing the same `thread_id` so memory is preserved across turns.
5. Responses use `structuredResponse` (Zod-validated) and are logged to the console.

### Notes

- `createMiddleware` is a LangChain API that lets you intercept and modify model calls before they are executed — similar to HTTP middleware.
- The model switch is fully transparent to the agent — it still uses the same tools, system prompt, and response format.
- `MemorySaver` is still used for conversational memory across invocations.
- Tool responses are currently hardcoded — no real database or weather API is connected yet.

### Differences between Agent4 and Agent5

| | Agent4 | Agent5 |
|--|--------|--------|
| **Models** | Single model: `claude-haiku-4-5-20251001` | Two models: `claude-sonnet-4-5` (advanced) and `claude-haiku-4-5` (cheap) |
| **Middleware** | None | `dynamicModelSelection` middleware via `createMiddleware` |
| **Model selection** | Always the same model for every call | Automatically switches model based on message count (< 3 → sonnet, ≥ 3 → haiku) |
| **Cost optimisation** | No | Yes — uses a cheaper model once the conversation grows |
| **Imports** | No extra model imports | Adds `createMiddleware` from `langchain` and `ChatAnthropic` from `@langchain/anthropic` |
| **Result access** | Reads last message content (`response.messages[...].content`) | Reads `response.structuredResponse` (Zod-validated object) |
| **Key concept** | Conversational memory + explicit model config | **Dynamic model selection via middleware** |

### Run

```bash
npx ts-node agent5.ts
```

---

## Agent6

An AI agent that demonstrates **three production-ready middleware** working together: automatic model fallback on failure, conversation summarization to manage token usage, and LLM-based smart tool selection to reduce unnecessary tool calls.

### Tools

| Tool | Description |
|------|-------------|
| `search` | Searches the internet for information (currently mocked: returns 5 articles for a given query) |
| `send_email` | Sends an email to a recipient with a given subject (currently mocked) |
| `getWeather` | Returns the weather for a given city (currently mocked: "Its sunny in {city}") |

### How it works

1. Creates an agent with `claude-sonnet-4-5` and three middleware layers:
   - **`modelFallbackMiddleware("claude-haiku-4-5", "claude-sonnet-4-5")`** — if the primary model (`claude-sonnet-4-5`) fails, automatically retries with `claude-haiku-4-5` as fallback.
   - **`summarizationMiddleware`** — when the conversation reaches 8 000 tokens, automatically summarizes older messages and keeps the last 20, preventing context window overflow.
   - **`llmToolSelectorMiddleware`** — uses `claude-haiku-4-5` to pre-select the most relevant tools (max 2) before passing the request to the main model, reducing input tokens and cost.
2. Invokes the agent with a single message asking for Tokyo's weather and an email send.
3. The agent calls `getWeather` and `send_email` in parallel, then returns a final answer.
4. The full response object (all messages) is logged to the console.

### Notes

- Middleware layers are applied in order — `modelFallbackMiddleware` wraps the outermost call, then `summarizationMiddleware`, then `llmToolSelectorMiddleware` closest to the model.
- `llmToolSelectorMiddleware` uses a cheaper/faster model to filter tools, so the main model only sees the relevant subset — lowers cost and latency.
- `summarizationMiddleware` requires its own `model` reference to generate the summary — uses `claude-sonnet-4-5` here.
- Tool responses are currently hardcoded — no real search, email, or weather API is connected yet.

### Differences between Agent5 and Agent6

| | Agent5 | Agent6 |
|--|--------|--------|
| **Middleware approach** | Custom `createMiddleware` with manual `wrapModelCall` logic | Three built-in production middleware: `modelFallbackMiddleware`, `summarizationMiddleware`, `llmToolSelectorMiddleware` |
| **Model fallback** | No automatic fallback — only switches based on message count | `modelFallbackMiddleware` automatically retries with a backup model on failure |
| **Token management** | No token limit handling | `summarizationMiddleware` summarizes history at 8 000 tokens, keeping the last 20 messages |
| **Tool selection** | All tools always passed to the model | `llmToolSelectorMiddleware` pre-selects up to 2 most relevant tools using a cheap model |
| **Memory** | `MemorySaver` checkpointer — conversational memory across turns | No checkpointer — stateless single invocation |
| **Tools** | `get_user_location`, `getWeather` | `search`, `send_email`, `getWeather` |
| **Response format** | Zod-validated `structuredResponse` | Raw `response.messages` array |
| **Key concept** | Custom dynamic model selection | **Built-in production middleware stack** |

### Run

```bash
npx ts-node agent6.ts
```

---

## Agent7

An AI agent that adds **PII (Personally Identifiable Information) redaction middleware** — it automatically detects and masks sensitive data such as credit card numbers, SSNs, and phone numbers in user messages before they reach the model.

### Tools

| Tool | Description |
|------|-------------|
| `search` | Searches the internet for information (currently mocked: returns 5 articles for a given query) |
| `send_email` | Sends an email to a recipient with a given subject (currently mocked) |
| `getWeather` | Returns the weather for a given city (currently mocked: "Its sunny in {city}") |

### How it works

1. Creates an agent with `claude-sonnet-4-5` and `piiRedactionMiddleware` configured with three regex rules:
   - `credit_card` — matches patterns like `1234-5678-9012-3456`
   - `ssn` — matches patterns like `123-45-6789`
   - `phone` — matches patterns like `123-456-7890`
2. Before any message reaches the model, the middleware scans the content and replaces matched patterns with `[REDACTED]`.
3. Invokes the agent with a message containing a raw credit card number.
4. The model never sees the actual PII — it only receives the redacted version.
5. The full response object is logged to the console.

### Notes

- `piiRedactionMiddleware` is marked as `@deprecated` in LangChain but remains functional. The alternative is to build a custom middleware using `createMiddleware` with manual regex replacement logic.
- Rules use standard JavaScript `RegExp` objects — the `g` flag ensures all occurrences in a message are replaced.
- This middleware protects against accidental PII leakage to third-party LLM providers.

### Differences between Agent6 and Agent7

| | Agent6 | Agent7 |
|--|--------|--------|
| **Middleware** | `modelFallbackMiddleware`, `summarizationMiddleware`, `llmToolSelectorMiddleware` | `piiRedactionMiddleware` |
| **Primary concern** | Reliability, token management, cost optimisation | **Data privacy and PII protection** |
| **Input processing** | Messages passed to model as-is | Sensitive patterns (credit card, SSN, phone) **redacted before reaching the model** |
| **Model stack** | Multiple models (sonnet + haiku for fallback/selection) | Single model: `claude-sonnet-4-5` |
| **Key concept** | Production middleware stack | **PII redaction for data privacy** |

### Run

```bash
npx ts-node agent7.ts
```

---

## RAG (Retrieval-Augmented Generation)

Agents in this category combine LLMs with external knowledge sources — documents are loaded, split into chunks, indexed in a vector store, and searched semantically before the answer is passed to the model.

---

## RAGAgent1

A foundational RAG pipeline that **loads a PDF document, splits it into chunks, embeds them into a vector store, and performs semantic search** — without an attached language model.

### How it works

1. **Document loading** — `PDFLoader` reads the `nke-10k-2023.pdf` file (Nike 2023 Annual Report).
2. **Chunking** — `RecursiveCharacterTextSplitter` splits the document into chunks of `1000` characters with a `200`-character overlap, preserving context across chunk boundaries.
3. **Embeddings** — `OpenAIEmbeddings` with the `text-embedding-3-large` model converts each text chunk into a numeric vector.
4. **Vector store** — `MemoryVectorStore` holds all vectors in memory (no persistence).
5. **Similarity search** — `similaritySearch("When was Nike incorporated?")` returns the chunks most semantically close to the query.
6. **MMR Retriever** — `asRetriever` with `searchType: "mmr"` (Maximal Marginal Relevance) and `fetchK: 1`, `lambda: 0.5` configures a retriever that balances relevance and diversity of results.

### Key concepts

| Concept | Description |
|---------|-------------|
| **PDFLoader** | Loads PDF pages as LangChain documents |
| **RecursiveCharacterTextSplitter** | Intelligently splits text while preserving sentence/paragraph boundaries |
| **OpenAIEmbeddings** | Converts text into vectors using the `text-embedding-3-large` model |
| **MemoryVectorStore** | In-memory vector store — fast for prototyping, no persistence |
| **similaritySearch** | Cosine similarity search — returns the most semantically relevant chunks |
| **MMR Retriever** | Maximal Marginal Relevance — results are relevant but diverse |

### Requirements

- `OPENAI_API_KEY` environment variable set in `.env`
- PDF file available at `/users/patrykksiazek/downloads/ProjectDocs/nke-10k-2023.pdf`

### Run

```bash
npx tsx rag/ragagent1.ts
```

---

## RAGAgent2

A RAG pipeline that **injects retrieved document context dynamically into the system prompt** using `dynamicSystemPromptMiddleware`, connecting the vector store to a language model through the agent's middleware layer.

### How it works

1. **Document loading & chunking** — same as RAGAgent1: `PDFLoader` loads the PDF, `RecursiveCharacterTextSplitter` splits it into `1000`-character chunks with `200`-character overlap.
2. **Embeddings & vector store** — `OpenAIEmbeddings` (`text-embedding-3-large`) embeds all chunks into a `MemoryVectorStore`.
3. **RAG middleware** — `dynamicSystemPromptMiddleware` intercepts every agent call and:
   - extracts the user's message from `state.messages[0].content`
   - runs `similaritySearch(query, 2)` to retrieve the 2 most relevant chunks
   - joins them and returns a system prompt with the retrieved context injected
4. **Agent** — `createAgent` uses `claude-sonnet-4-6` with no tools, only the `ragMiddleware` — the model answers purely based on the injected context.
5. The agent is invoked with `"When was Nike incorporated?"` and the result is logged.

### Key concepts

| Concept | Description |
|---------|-------------|
| **dynamicSystemPromptMiddleware** | Intercepts each agent call to build a dynamic system prompt — ideal for injecting RAG context |
| **state.messages** | Gives the middleware access to the current conversation messages |
| **similaritySearch(query, 2)** | Retrieves the 2 most semantically similar chunks for the query |
| **Middleware-based RAG** | Context is injected at the middleware level — the agent itself requires no changes |

### What RAGAgent2 adds over RAGAgent1

| | RAGAgent1 | RAGAgent2 |
|--|-----------|-----------|
| **Language model** | No LLM — only vector search | `claude-sonnet-4-6` answers the query |
| **Context delivery** | Results logged to console | Context injected into system prompt via middleware |
| **Middleware** | None | `dynamicSystemPromptMiddleware` |
| **Output** | Raw document chunks | Natural language answer grounded in retrieved context |
| **Key concept** | Vector store + similarity search | **RAG via dynamic system prompt middleware** |

### Requirements

- `OPENAI_API_KEY` environment variable set in `.env` (for embeddings)
- `ANTHROPIC_API_KEY` environment variable set in `.env` (for `claude-sonnet-4-6`)
- PDF file available at `/users/patrykksiazek/downloads/ProjectDocs/nke-10k-2023.pdf`

### Run

```bash
npx tsx rag/ragagent2.ts
```

---

## RAGAgent3

A multi-document RAG pipeline that **loads multiple PDF files, merges them into a single vector store, and answers questions that require knowledge spanning across several documents**.

### How it works

1. **Multi-document loading** — iterates over an array of 4 PDF paths (including Nike 10-K 2023, Nike 10-K 2025, and a Nike growth story document) and loads each with `PDFLoader`, merging all pages into a single `allDocs` array.
2. **Chunking** — `RecursiveCharacterTextSplitter` splits all documents into `1000`-character chunks with `200`-character overlap.
3. **Embeddings & vector store** — `OpenAIEmbeddings` (`text-embedding-3-large`) embeds every chunk into a shared `MemoryVectorStore`.
4. **RAG middleware** — `dynamicSystemPromptMiddleware` retrieves the 2 most relevant chunks for the user's query and injects them as context into the system prompt — identical approach to RAGAgent2.
5. **Agent** — `createAgent` uses `claude-sonnet-4-6` with no tools and the `ragMiddleware`.
6. Invoked with a cross-document question: `"What was Nike's revenue in 2023 & 2025 and from which Town Nike has grown into worldfamous footwear?"` — requiring facts from multiple source documents.

### Key concepts

| Concept | Description |
|---------|-------------|
| **Multi-document loading** | Loops over a list of PDF paths and merges all pages into one document array |
| **Shared vector store** | All documents — regardless of source — are embedded into a single `MemoryVectorStore` |
| **Cross-document retrieval** | `similaritySearch` can surface relevant chunks from any of the loaded documents |
| **Source metadata** | Each chunk retains its `source` path in metadata, allowing traceability back to the original file |

### What RAGAgent3 adds over RAGAgent2

| | RAGAgent2 | RAGAgent3 |
|--|-----------|-----------|
| **Documents** | Single PDF (`nke-10k-2023.pdf`) | **4 PDFs** merged into one vector store |
| **Knowledge scope** | Facts from one report only | Cross-document knowledge (2023 & 2025 reports + growth story) |
| **Loading strategy** | Single `PDFLoader` call | Loop over `pdfPaths` array, accumulating docs |
| **Query complexity** | Single-document question | **Multi-document question** spanning years and topics |
| **Key concept** | Middleware-based RAG with one document | **Multi-document RAG** |

### Requirements

- `OPENAI_API_KEY` environment variable set in `.env` (for embeddings)
- `ANTHROPIC_API_KEY` environment variable set in `.env` (for `claude-sonnet-4-6`)
- PDF files available at:
  - `/users/patrykksiazek/downloads/ProjectDocs/nke-10k-2023.pdf`
  - `/users/patrykksiazek/downloads/ProjectDocs/Nike-Inc-2025_10K.pdf`
  - `/users/patrykksiazek/downloads/ProjectDocs/nike-growth-story.pdf`

### Run

```bash
npx tsx rag/ragagent3.ts
```

---

## RAGAgent4

A DOCX-based RAG pipeline that **loads a Word document, embeds its contents into a vector store, and answers questions by injecting retrieved context into the system prompt**.

### How it works

1. **Document loading** — `DocxLoader` reads the `nike-growth-story.docx` file.
2. **Chunking** — `RecursiveCharacterTextSplitter` splits the document into chunks of `1000` characters with a `200`-character overlap.
3. **Embeddings & vector store** — `OpenAIEmbeddings` with `text-embedding-3-large` embeds the chunks into a `MemoryVectorStore`.
4. **RAG middleware** — `dynamicSystemPromptMiddleware` extracts the user's message, runs `similaritySearch(query, 2)`, and injects the top 2 retrieved chunks into the system prompt.
5. **Agent** — `createAgent` uses `claude-sonnet-4-6` with no tools, relying entirely on retrieved DOCX context.
6. The agent is invoked with: `"What are key highlights of Nike's growth story?"` and the full result is logged.

### What RAGAgent4 adds over RAGAgent3

| | RAGAgent3 | RAGAgent4 |
|--|-----------|-----------|
| **Document format** | Multiple PDFs | **Single DOCX** (`nike-growth-story.docx`) |
| **Loader** | `PDFLoader` | **`DocxLoader`** |
| **Knowledge scope** | Cross-document knowledge from several PDFs | Focused knowledge from one Word document |
| **Retrieval source** | Merged vector store across multiple reports | Vector store built from one DOCX source |
| **Key concept** | Multi-document PDF RAG | **DOCX-based RAG with dynamic prompt injection** |

### Requirements

- `OPENAI_API_KEY` environment variable set in `.env` (for embeddings)
- `ANTHROPIC_API_KEY` environment variable set in `.env` (for `claude-sonnet-4-6`)
- DOCX file available at `/users/patrykksiazek/downloads/ProjectDocs/nike-growth-story.docx`

### Run

```bash
npx tsx rag/ragagent4.ts
```

---

## RAGAgent5

A second DOCX-based RAG example that **currently mirrors RAGAgent4's implementation exactly**, using the same document-loading, embedding, retrieval, and prompt-injection flow.

### How it works

1. **Document loading** — `DocxLoader` reads the `nike-growth-story.docx` file.
2. **Chunking** — `RecursiveCharacterTextSplitter` splits the document into chunks of `1000` characters with a `200`-character overlap.
3. **Embeddings & vector store** — `OpenAIEmbeddings` with `text-embedding-3-large` embeds the chunks into a `MemoryVectorStore`.
4. **RAG middleware** — `dynamicSystemPromptMiddleware` extracts the user's message, runs `similaritySearch(query, 2)`, and injects the top 2 retrieved chunks into the system prompt.
5. **Agent** — `createAgent` uses `claude-sonnet-4-6` with no tools and answers solely from retrieved DOCX context.
6. The agent is invoked with: `"What are key highlights of Nike's growth story?"` and the result is logged.

### How RAGAgent5 differs from RAGAgent4

| | RAGAgent4 | RAGAgent5 |
|--|-----------|-----------|
| **Implementation** | DOCX RAG pipeline | **Currently identical implementation** |
| **Loader** | `DocxLoader` | `DocxLoader` |
| **Retrieval strategy** | `similaritySearch(query, 2)` via middleware | Same |
| **Model** | `claude-sonnet-4-6` | Same |
| **Key concept** | DOCX-based RAG | **Parallel DOCX RAG example / staging variant** |

### Requirements

- `OPENAI_API_KEY` environment variable set in `.env` (for embeddings)
- `ANTHROPIC_API_KEY` environment variable set in `.env` (for `claude-sonnet-4-6`)
- DOCX file available at `/users/patrykksiazek/downloads/ProjectDocs/nike-growth-story.docx`

### Run

```bash
npx tsx rag/ragagent5.ts
```

---

## RAGAgent6

An agentic RAG example that **combines multi-document retrieval with MCP tools**, allowing the agent to query external systems and compare that live data against company knowledge stored in PDFs.

### How it works

1. **MCP client setup** — `MultiServerMCPClient` connects to an external `ecommerce` MCP server over `stdio` using a local Node entrypoint.
2. **Document loading** — the pipeline loads multiple PDF files with `PDFLoader`, including the 2023 Nike report, the 2025 Nike report, and the Nike growth story document.
3. **Chunking** — `RecursiveCharacterTextSplitter` splits all loaded pages into chunks of `1000` characters with a `200`-character overlap.
4. **Embeddings & vector store** — `OpenAIEmbeddings` with `text-embedding-3-large` embeds all chunks into a shared `MemoryVectorStore`.
5. **Retrieval tool** — a custom `retrieve` tool wraps `vectorStore.similaritySearch(query, 2)` so the agent can pull relevant PDF context on demand instead of injecting it through middleware.
6. **External tools** — `client.getTools()` imports the MCP tools exposed by the ecommerce server and merges them with the local `retrieve` tool.
7. **Agent** — `createAgent` uses `claude-sonnet-4-5-20250929` with both MCP tools and the RAG retrieval tool.
8. The agent is invoked with: `"Get product with id 28 and check if that product name match with our company offerings"`, so it can fetch product data externally and verify alignment against Nike-related documents.

### What RAGAgent6 adds over RAGAgent5

| | RAGAgent5 | RAGAgent6 |
|--|-----------|-----------|
| **Retrieval integration** | Middleware injects context automatically | **Tool-based retrieval** via `retrieve` |
| **External systems** | None | **MCP ecommerce server integration** |
| **Knowledge sources** | One DOCX document | Multiple PDFs plus external MCP data |
| **Agent tools** | No tools | MCP tools + custom RAG tool |
| **Key concept** | DOCX RAG through middleware | **Agentic RAG with MCP orchestration** |

### Requirements

- `OPENAI_API_KEY` environment variable set in `.env` (for embeddings)
- `ANTHROPIC_API_KEY` environment variable set in `.env` (for `claude-sonnet-4-5-20250929`)
- PDF files available at:
   - `/users/patrykksiazek/downloads/ProjectDocs/nke-10k-2023.pdf`
   - `/users/patrykksiazek/downloads/ProjectDocs/Nike-Inc-2025_10K.pdf`
   - `/users/patrykksiazek/downloads/ProjectDocs/nike-growth-story.pdf`
- Built MCP server available at `/Users/patrykksiazek/Downloads/mcp-ecommerce-crud/dist/mcp/server.js`

### Run

```bash
npx tsx rag/ragagent6.ts
```

---

---

# Opis projektu

# System Agentów AI z Frameworkiem LangChain

## Przegląd

Stopniowa, praktyczna implementacja wzorców agentów AI z wykorzystaniem frameworku **LangChain** w TypeScript. Każdy agent i potok RAG rozbudowuje poprzedni, wprowadzając nowy koncept — od podstaw architektury agentów po w pełni zintegrowany agentic RAG z MCP, możliwy do wdrożenia za pomocą LangGraph.

### 1. Agenty AI – Podstawy
- Zrozumienie architektury agentów
- Tworzenie agentów przy użyciu `createAgent()`
- Wywoływanie agentów i przekazywanie wiadomości
- Przepływy pracy z narzędziami (tool-based workflows)
- Wybór modelu (GPT-4, Claude Sonnet, Claude Haiku)

### 2. Narzędzia i Function Calling
- Własne narzędzia z `tool()`
- Schematy walidacji Zod
- Orkiestracja wielu narzędzi
- Przykłady: `getWeather`, `getTime`, `emailTool`, `searchTool`

### 3. Prompty systemowe i inżynieria promptów
- Własny `systemPrompt`
- `dynamicSystemPromptMiddleware` — wstrzykiwanie kontekstu

### 4. Zarządzanie kontekstem
- Użycie `config.context` — dane specyficzne dla użytkownika
- Konfiguracje środowiskowe

### 5. Pamięć i zarządzanie stanem
- Checkpointer `MemorySaver`
- Obsługa `thread_id`
- Trwała historia konwersacji

### 6. Ustrukturyzowane odpowiedzi
- `responseFormat`
- Schematy Zod
- Odpowiedzi z bezpieczeństwem typów

### 7. Konfiguracja modelu
- `initChatModel()`
- Temperatura, limit czasu, limity tokenów
- Wsparcie wielu modeli

### 8. System middleware
- `dynamicModelSelection`
- `modelFallbackMiddleware`
- `summarizationMiddleware`
- `llmToolSelectorMiddleware`
- `piiRedactionMiddleware`

### 9. Guardrails i bezpieczeństwo
- Wykrywanie PII
- Filtrowanie przez wyrażenia regularne
- Wzorce zgodności z regulacjami

### 10. Retrieval Augmented Generation (RAG)
- Ładowanie plików PDF i DOCX
- Dzielenie tekstu (rozmiar fragmentu 1000 / nakładanie 200)
- Embeddingi: `text-embedding-3-large`
- `MemoryVectorStore`
- Similarity Search i MMR
- RAG przez middleware i narzędzia

### 11. Agenty wielonarzędziowe
- Łączenie RAG z narzędziami użytkowymi
- Orkiestracja wielu dziedzin

### 12. Integracja MCP – Agentic RAG
- `MultiServerMCPClient`
- Zewnętrzne systemy + RAG

### 13. Wdrożenie LangGraph
- `langgraph.json`
- `ragagentServer.ts`

### 14. Zarządzanie środowiskiem
- Klucze API i użycie `.env`
- Śledzenie z LangSmith

---

## Agent1

Prosty agent AI zbudowany z LangChain, oparty na modelu **Claude Haiku**, z dwoma narzędziami:

### Narzędzia

| Narzędzie | Opis |
|-----------|------|
| `getWeather` | Zwraca pogodę dla podanego miasta (aktualnie mockowane: "It's sunny in {city}") |
| `getTime` | Zwraca aktualny czas dla podanego miasta (aktualnie mockowane: "The current time in {city} is 3:00 PM") |

### Jak działa

1. Tworzy agenta (`createAgent`) z modelem `claude-haiku-4-5-20251001` i zestawem narzędzi.
2. Wywołuje agenta z pytaniem użytkownika — domyślnie: `"What is weather & time in New York?"`.
3. Agent decyduje, które narzędzia wywołać, wykonuje je i zwraca złożoną odpowiedź.
4. Wynik jest logowany do konsoli.

### Uwagi
- Oba narzędzia używają Zod do walidacji schematu wejściowego (`city: string`).
- Odpowiedzi narzędzi są aktualnie zakodowane na stałe — żadne prawdziwe API pogody ani czasu nie jest podłączone.

### Uruchomienie

```bash
npx ts-node agent1.ts
```

---

## Agent2

Agent AI demonstrujący **dwuetapowy łańcuch narzędzi**: najpierw pobiera lokalizację użytkownika, a następnie sprawdza pogodę dla tej lokalizacji — bez potrzeby podawania miasta przez użytkownika.

### Narzędzia

| Narzędzie | Opis |
|-----------|------|
| `getUserLocation` | Zwraca miasto użytkownika na podstawie `user_id` z kontekstu (mockowane: użytkownik `"1"` → `"Florida"`) |
| `getWeather` | Zwraca pogodę dla podanego miasta (mockowane: "It's sunny in {city}") |

### Jak działa

1. Tworzy agenta z modelem `claude-haiku-4-5-20251001` i oboma narzędziami.
2. Wywołuje agenta z `"What is the weather outside?"` i przekazuje obiekt `config` zawierający `user_id`.
3. Agent najpierw wywołuje `getUserLocation` (zgodnie z opisem narzędzia), pobiera miasto.
4. Następnie wywołuje `getWeather` z tym miastem i zwraca końcową odpowiedź.

### Uwagi

- `getUserLocation` otrzymuje `config.context.user_id` przez konfigurację runtime LangChain — w ten sposób kontekst użytkownika jest bezpiecznie wstrzykiwany do narzędzi.
- Odpowiedzi narzędzi są aktualnie zakodowane na stałe.

### Różnice względem Agent1

| | Agent1 | Agent2 |
|--|--------|--------|
| **Narzędzia** | `getWeather`, `getTime` | `getUserLocation`, `getWeather` |
| **Użycie narzędzi** | Niezależne narzędzia — każde odpowiada na osobne pytanie | **Łańcuch narzędzi** — wyjście jednego zasila kolejne |
| **Wejście użytkownika** | Miasto musi być podane w pytaniu | Miasto jest **wywnioskowane** — użytkownik pyta tylko `"What is the weather outside?"` |
| **Kontekst** | Brak kontekstu | Przekazuje `config` z `user_id`, wstrzyknięty do narzędzia przez `config.context.user_id` |
| **Kluczowy koncept** | Podstawowe wywołanie narzędzi | Łańcuch narzędzi + kontekst użytkownika w runtime |

### Uruchomienie

```bash
npx ts-node agent2.ts
```

---

## Agent3

Agent AI z **humorystyczną personą prezentera pogody**, który używa promptu systemowego do kierowania swoim zachowaniem i zwraca **ustrukturyzowaną odpowiedź** zwalidowaną schematem Zod.

### Narzędzia

| Narzędzie | Opis |
|-----------|------|
| `get_user_location` | Zwraca lokalizację użytkownika na podstawie `user_id` z kontekstu (mockowane: użytkownik `"1"` → `"Florida"`, inaczej `"SFO"`) |
| `getWeather` | Zwraca pogodę dla podanego miasta (mockowane: "Its sunny in {city}") |

### Jak działa

1. Tworzy agenta z modelem `claude-haiku-4-5-20251001`, oboma narzędziami, `systemPrompt` i `responseFormat`.
2. `systemPrompt` definiuje agenta jako eksperta meteorologa mówiącego z humorem i nakazuje mu najpierw ustalić lokalizację.
3. Wywołuje agenta z `"What is the weather outside?"` i przekazuje obiekt `qaConfig` z `user_id`.
4. Agent wywołuje `get_user_location` aby ustalić miasto, następnie `getWeather` i zwraca wynik.
5. Odpowiedź jest ograniczona do schematu Zod (`human_response`, `weather_conditions`) i logowana przez `response.structuredResponse`.

### Co Agent3 dodaje względem Agent2

| | Agent3 | Agent2 |
|--|--------|--------|
| **Prompt systemowy** | Dodaje `systemPrompt` z humoreystyczną personą i strategią wywoływania narzędzi | Brak |
| **Format wyjścia** | **Ustrukturyzowana odpowiedź** zwalidowana schematem Zod | Odpowiedź w dowolnym formacie tekstowym |
| **Kluczowy koncept** | Persona przez prompt systemowy + gwarantowane ustrukturyzowane wyjście | Łańcuch narzędzi + kontekst runtime |

### Uruchomienie

```bash
npx ts-node agent3.ts
```

---

## Agent4

Agent AI dodający **pamięć konwersacji** na bazie Agent3, używający checkpointera `MemorySaver` z LangGraph, dzięki czemu agent pamięta wcześniejsze tury w tym samym wątku. Konfiguruje też model jawnie przez `initChatModel`.

### Narzędzia

| Narzędzie | Opis |
|-----------|------|
| `get_user_location` | Zwraca lokalizację użytkownika (mockowane: użytkownik `"1"` → `"Florida"`, inaczej `"SFO"`) |
| `getWeather` | Zwraca pogodę dla podanego miasta (mockowane) |

### Jak działa

1. Buduje model przez `initChatModel("claude-haiku-4-5-20251001", { temperature: 0.7, timeout: 30, max_tokens: 1000 })`.
2. Tworzy checkpointer `MemorySaver` i przekazuje go do `createAgent` — stan konwersacji jest trwały per wątek.
3. Każde `invoke` przekazuje `config` z `configurable.thread_id` — wymagane przy użyciu checkpointera.
4. Pierwsze dwa wywołania dzielą ten sam `thread_id`, więc agent pamięta ustaloną lokalizację między turami.
5. Trzecie wywołanie demonstruje, jak pamięć jest kluczowana przez `thread_id`.

### Co Agent4 dodaje względem Agent3

| | Agent4 | Agent3 |
|--|--------|--------|
| **Pamięć** | Trwały stan konwersacji z `MemorySaver` | Bezstanowy — każde `invoke` zaczyna od nowa |
| **Konfiguracja modelu** | `initChatModel(...)` z jawnym `temperature`, `timeout`, `max_tokens` | ID modelu jako string |
| **Kluczowy koncept** | Pamięć konwersacji + jawna konfiguracja modelu | Persona + ustrukturyzowane wyjście |

### Uruchomienie

```bash
npx ts-node agent4.ts
```

---

## Agent5

Agent AI rozszerzający Agent4 o **middleware dynamicznego wyboru modelu** — automatycznie przełącza się między bardziej zaawansowanym a tańszym modelem w zależności od liczby wiadomości w bieżącym żądaniu.

### Narzędzia

| Narzędzie | Opis |
|-----------|------|
| `get_user_location` | Zwraca lokalizację użytkownika (mockowane) |
| `getWeather` | Zwraca pogodę dla podanego miasta (mockowane) |

### Jak działa

1. Inicjalizowane są dwa modele:
   - `model` — `claude-sonnet-4-5` (zaawansowany, wyższy koszt)
   - `basicModel` — `claude-haiku-4-5` (tańszy, szybszy)
2. Middleware `dynamicModelSelection` przechwytuje każde wywołanie modelu i sprawdza `request.messages.length`:
   - **< 3 wiadomości** → używa zaawansowanego `model` (claude-sonnet)
   - **≥ 3 wiadomości** → przełącza na tańszy `basicModel` (claude-haiku)
3. Middleware jest przekazywane do `createAgent` przez opcję `middleware`.

### Różnice między Agent4 a Agent5

| | Agent4 | Agent5 |
|--|--------|--------|
| **Modele** | Jeden model: `claude-haiku-4-5-20251001` | Dwa modele: `claude-sonnet-4-5` i `claude-haiku-4-5` |
| **Middleware** | Brak | `dynamicModelSelection` przez `createMiddleware` |
| **Wybór modelu** | Zawsze ten sam model | Automatyczne przełączanie na podstawie liczby wiadomości |
| **Optymalizacja kosztów** | Nie | Tak — tańszy model po rozrośnięciu konwersacji |
| **Kluczowy koncept** | Pamięć konwersacji + jawna konfiguracja modelu | **Dynamiczny wybór modelu przez middleware** |

### Uruchomienie

```bash
npx ts-node agent5.ts
```

---

## Agent6

Agent AI demonstrujący **trzy produkcyjne middleware** działające razem: automatyczny fallback modelu przy błędzie, podsumowywanie konwersacji do zarządzania użyciem tokenów oraz inteligentny wybór narzędzi przez LLM w celu redukcji niepotrzebnych wywołań.

### Narzędzia

| Narzędzie | Opis |
|-----------|------|
| `search` | Przeszukuje internet w poszukiwaniu informacji (mockowane: zwraca 5 artykułów dla zapytania) |
| `send_email` | Wysyła e-mail do odbiorcy z podanym tematem (mockowane) |
| `getWeather` | Zwraca pogodę dla podanego miasta (mockowane) |

### Jak działa

1. Tworzy agenta z `claude-sonnet-4-5` i trzema warstwami middleware:
   - **`modelFallbackMiddleware`** — jeśli główny model zawiedzie, automatycznie ponawia z `claude-haiku-4-5`.
   - **`summarizationMiddleware`** — po osiągnięciu 8 000 tokenów automatycznie podsumowuje starsze wiadomości, zachowując ostatnie 20.
   - **`llmToolSelectorMiddleware`** — używa `claude-haiku-4-5` do wstępnego wyboru max 2 najbardziej trafnych narzędzi.
2. Wywołuje agenta z pytaniem o pogodę w Tokio i prośbą o wysłanie e-maila.
3. Agent wywołuje `getWeather` i `send_email` równolegle, a następnie zwraca końcową odpowiedź.

### Różnice między Agent5 a Agent6

| | Agent5 | Agent6 |
|--|--------|--------|
| **Podejście do middleware** | Własny `createMiddleware` z ręczną logiką `wrapModelCall` | Trzy wbudowane produkcyjne middleware |
| **Fallback modelu** | Brak | `modelFallbackMiddleware` automatycznie ponawia z modelem zapasowym |
| **Zarządzanie tokenami** | Brak | `summarizationMiddleware` podsumowuje historię przy 8 000 tokenów |
| **Wybór narzędzi** | Wszystkie narzędzia zawsze przekazywane do modelu | `llmToolSelectorMiddleware` wstępnie wybiera max 2 trafne narzędzia |
| **Kluczowy koncept** | Własny dynamiczny wybór modelu | **Produkcyjny stos middleware** |

### Uruchomienie

```bash
npx ts-node agent6.ts
```

---

## Agent7

Agent AI dodający **middleware redakcji PII (Personally Identifiable Information)** — automatycznie wykrywa i maskuje wrażliwe dane, takie jak numery kart kredytowych, numery PESEL/SSN i numery telefonów w wiadomościach użytkownika, zanim dotrą do modelu.

### Narzędzia

| Narzędzie | Opis |
|-----------|------|
| `search` | Przeszukuje internet (mockowane) |
| `send_email` | Wysyła e-mail (mockowane) |
| `getWeather` | Zwraca pogodę (mockowane) |

### Jak działa

1. Tworzy agenta z `claude-sonnet-4-5` i `piiRedactionMiddleware` z trzema regułami regex:
   - `credit_card` — dopasowuje wzorce jak `1234-5678-9012-3456`
   - `ssn` — dopasowuje wzorce jak `123-45-6789`
   - `phone` — dopasowuje wzorce jak `123-456-7890`
2. Przed dotarciem wiadomości do modelu middleware skanuje treść i zastępuje dopasowane wzorce `[REDACTED]`.
3. Model nigdy nie widzi rzeczywistych danych PII — otrzymuje tylko zredagowaną wersję.

### Różnice między Agent6 a Agent7

| | Agent6 | Agent7 |
|--|--------|--------|
| **Middleware** | `modelFallbackMiddleware`, `summarizationMiddleware`, `llmToolSelectorMiddleware` | `piiRedactionMiddleware` |
| **Główny cel** | Niezawodność, zarządzanie tokenami, optymalizacja kosztów | **Prywatność danych i ochrona PII** |
| **Przetwarzanie wejścia** | Wiadomości przekazywane do modelu bez zmian | Wrażliwe wzorce (karta kredytowa, SSN, telefon) **redagowane przed dotarciem do modelu** |
| **Kluczowy koncept** | Produkcyjny stos middleware | **Redakcja PII dla ochrony prywatności danych** |

### Uruchomienie

```bash
npx ts-node agent7.ts
```

---

## RAG (Retrieval-Augmented Generation)

Agenty z tej kategorii łączą LLM z zewnętrznymi źródłami wiedzy — dokumenty są ładowane, dzielone na fragmenty, indeksowane w wektorowym magazynie danych i przeszukiwane semantycznie przed przekazaniem odpowiedzi do modelu.

---

## RAGAgent1

Podstawowy potok RAG, który **ładuje dokument PDF, dzieli go na fragmenty, osadza je w wektorowym magazynie danych i wykonuje wyszukiwanie semantyczne** — bez podłączonego modelu językowego.

### Jak działa

1. **Ładowanie dokumentu** — `PDFLoader` wczytuje plik `nke-10k-2023.pdf` (Raport Roczny Nike 2023).
2. **Fragmentacja** — `RecursiveCharacterTextSplitter` dzieli dokument na fragmenty po `1000` znaków z nakładaniem `200` znaków.
3. **Embeddingi** — `OpenAIEmbeddings` z modelem `text-embedding-3-large` zamienia każdy fragment tekstu na wektor liczbowy.
4. **Wektorowy magazyn** — `MemoryVectorStore` przechowuje wszystkie wektory w pamięci (bez trwałości).
5. **Wyszukiwanie podobieństwa** — `similaritySearch("When was Nike incorporated?")` zwraca fragmenty najbardziej zbliżone semantycznie do zapytania.
6. **Retriever MMR** — `asRetriever` z `searchType: "mmr"` konfiguruje retriever balansujący trafność i różnorodność wyników.

### Kluczowe koncepty

| Koncept | Opis |
|---------|------|
| **PDFLoader** | Ładuje strony PDF jako dokumenty LangChain |
| **RecursiveCharacterTextSplitter** | Inteligentnie dzieli tekst, zachowując granice zdań/akapitów |
| **OpenAIEmbeddings** | Zamienia tekst na wektory modelem `text-embedding-3-large` |
| **MemoryVectorStore** | Wektorowy magazyn w pamięci — szybki do prototypowania, bez trwałości |
| **similaritySearch** | Wyszukiwanie przez podobieństwo cosinusowe — zwraca najbardziej trafne semantycznie fragmenty |
| **Retriever MMR** | Maximal Marginal Relevance — wyniki są trafne, ale zróżnicowane |

### Wymagania

- Zmienna środowiskowa `OPENAI_API_KEY` ustawiona w `.env`
- Plik PDF dostępny pod `/users/patrykksiazek/downloads/ProjectDocs/nke-10k-2023.pdf`

### Uruchomienie

```bash
npx tsx rag/ragagent1.ts
```

---

## RAGAgent2

Potok RAG, który **dynamicznie wstrzykuje pobrany kontekst dokumentu do promptu systemowego** za pomocą `dynamicSystemPromptMiddleware`, łącząc wektorowy magazyn danych z modelem językowym przez warstwę middleware agenta.

### Jak działa

1. **Ładowanie i fragmentacja dokumentu** — tak samo jak RAGAgent1.
2. **Embeddingi i wektorowy magazyn** — `OpenAIEmbeddings` osadza wszystkie fragmenty w `MemoryVectorStore`.
3. **Middleware RAG** — `dynamicSystemPromptMiddleware` przechwytuje każde wywołanie agenta i:
   - wyciąga wiadomość użytkownika z `state.messages[0].content`
   - uruchamia `similaritySearch(query, 2)` aby pobrać 2 najbardziej trafne fragmenty
   - łączy je i zwraca prompt systemowy z wstrzykniętym kontekstem
4. **Agent** — `createAgent` używa `claude-sonnet-4-6` bez narzędzi, tylko z `ragMiddleware`.
5. Agent jest wywoływany z `"When was Nike incorporated?"` i wynik jest logowany.

### Co RAGAgent2 dodaje względem RAGAgent1

| | RAGAgent1 | RAGAgent2 |
|--|-----------|-----------|
| **Model językowy** | Brak LLM — tylko wyszukiwanie wektorowe | `claude-sonnet-4-6` odpowiada na zapytanie |
| **Dostarczanie kontekstu** | Wyniki logowane do konsoli | Kontekst wstrzykiwany do promptu systemowego przez middleware |
| **Middleware** | Brak | `dynamicSystemPromptMiddleware` |
| **Wyjście** | Surowe fragmenty dokumentu | Odpowiedź w języku naturalnym oparta na pobranym kontekście |
| **Kluczowy koncept** | Wektorowy magazyn + wyszukiwanie podobieństwa | **RAG przez middleware dynamicznego promptu systemowego** |

### Wymagania

- `OPENAI_API_KEY` w `.env` (dla embeddingów)
- `ANTHROPIC_API_KEY` w `.env` (dla `claude-sonnet-4-6`)
- Plik PDF dostępny pod `/users/patrykksiazek/downloads/ProjectDocs/nke-10k-2023.pdf`

### Uruchomienie

```bash
npx tsx rag/ragagent2.ts
```

---

## RAGAgent3

Wielodokumentowy potok RAG, który **ładuje wiele plików PDF, łączy je w jeden wektorowy magazyn danych i odpowiada na pytania wymagające wiedzy z kilku dokumentów jednocześnie**.

### Jak działa

1. **Ładowanie wielu dokumentów** — iteruje po tablicy 4 ścieżek PDF i ładuje każdy przez `PDFLoader`, łącząc wszystkie strony w jedną tablicę `allDocs`.
2. **Fragmentacja** — `RecursiveCharacterTextSplitter` dzieli wszystkie dokumenty na fragmenty po `1000` znaków z nakładaniem `200`.
3. **Embeddingi i wektorowy magazyn** — `OpenAIEmbeddings` osadza każdy fragment we wspólnym `MemoryVectorStore`.
4. **Middleware RAG** — `dynamicSystemPromptMiddleware` pobiera 2 najbardziej trafne fragmenty i wstrzykuje je jako kontekst do promptu systemowego.
5. **Agent** — `createAgent` używa `claude-sonnet-4-6` bez narzędzi i z `ragMiddleware`.
6. Wywoływany z pytaniem krzyżującym dokumenty: `"What was Nike's revenue in 2023 & 2025 and from which Town Nike has grown into worldfamous footwear?"`.

### Co RAGAgent3 dodaje względem RAGAgent2

| | RAGAgent2 | RAGAgent3 |
|--|-----------|-----------|
| **Dokumenty** | Jeden PDF (`nke-10k-2023.pdf`) | **4 pliki PDF** połączone w jeden wektorowy magazyn |
| **Zakres wiedzy** | Fakty z jednego raportu | Wiedza z wielu dokumentów (raporty 2023 i 2025 + historia wzrostu) |
| **Strategia ładowania** | Jedno wywołanie `PDFLoader` | Pętla po tablicy `pdfPaths`, kumulacja dokumentów |
| **Złożoność zapytania** | Pytanie do jednego dokumentu | **Pytanie do wielu dokumentów** obejmujące lata i tematy |
| **Kluczowy koncept** | RAG przez middleware z jednym dokumentem | **Wielodokumentowy RAG** |

### Wymagania

- `OPENAI_API_KEY` w `.env` (dla embeddingów)
- `ANTHROPIC_API_KEY` w `.env` (dla `claude-sonnet-4-6`)
- Pliki PDF dostępne pod:
  - `/users/patrykksiazek/downloads/ProjectDocs/nke-10k-2023.pdf`
  - `/users/patrykksiazek/downloads/ProjectDocs/Nike-Inc-2025_10K.pdf`
  - `/users/patrykksiazek/downloads/ProjectDocs/nike-growth-story.pdf`

### Uruchomienie

```bash
npx tsx rag/ragagent3.ts
```

---

## RAGAgent4

Potok RAG oparty na DOCX, który **ładuje dokument Word, osadza jego treść w wektorowym magazynie danych i odpowiada na pytania przez wstrzyknięcie pobranego kontekstu do promptu systemowego**.

### Jak działa

1. **Ładowanie dokumentu** — `DocxLoader` wczytuje plik `nike-growth-story.docx`.
2. **Fragmentacja** — `RecursiveCharacterTextSplitter` dzieli dokument na fragmenty po `1000` znaków z nakładaniem `200` znaków.
3. **Embeddingi i wektorowy magazyn** — `OpenAIEmbeddings` z modelem `text-embedding-3-large` osadza fragmenty w `MemoryVectorStore`.
4. **Middleware RAG** — `dynamicSystemPromptMiddleware` wyciąga wiadomość użytkownika, uruchamia `similaritySearch(query, 2)` i wstrzykuje 2 najtrafniejsze fragmenty do promptu systemowego.
5. **Agent** — `createAgent` używa `claude-sonnet-4-6` bez narzędzi i opiera odpowiedź wyłącznie na pobranym kontekście z DOCX.
6. Agent jest wywoływany z pytaniem: `"What are key highlights of Nike's growth story?"`, a pełny wynik jest logowany.

### Co RAGAgent4 dodaje względem RAGAgent3

| | RAGAgent3 | RAGAgent4 |
|--|-----------|-----------|
| **Format dokumentu** | Wiele plików PDF | **Pojedynczy DOCX** (`nike-growth-story.docx`) |
| **Loader** | `PDFLoader` | **`DocxLoader`** |
| **Zakres wiedzy** | Wiedza z kilku PDF-ów | Skoncentrowana wiedza z jednego dokumentu Word |
| **Źródło retrievalu** | Połączony wektorowy magazyn wielu raportów | Wektorowy magazyn zbudowany z jednego pliku DOCX |
| **Kluczowy koncept** | Wielodokumentowy PDF RAG | **RAG oparty na DOCX z dynamicznym wstrzykiwaniem promptu** |

### Wymagania

- `OPENAI_API_KEY` w `.env` (dla embeddingów)
- `ANTHROPIC_API_KEY` w `.env` (dla `claude-sonnet-4-6`)
- Plik DOCX dostępny pod `/users/patrykksiazek/downloads/ProjectDocs/nike-growth-story.docx`

### Uruchomienie

```bash
npx tsx rag/ragagent4.ts
```

---

## RAGAgent5

Drugi przykład RAG oparty na DOCX, który **aktualnie ma dokładnie taką samą implementację jak RAGAgent4** i używa tego samego przepływu ładowania dokumentu, embeddingów, retrievalu i wstrzykiwania kontekstu do promptu.

### Jak działa

1. **Ładowanie dokumentu** — `DocxLoader` wczytuje plik `nike-growth-story.docx`.
2. **Fragmentacja** — `RecursiveCharacterTextSplitter` dzieli dokument na fragmenty po `1000` znaków z nakładaniem `200` znaków.
3. **Embeddingi i wektorowy magazyn** — `OpenAIEmbeddings` z modelem `text-embedding-3-large` osadza fragmenty w `MemoryVectorStore`.
4. **Middleware RAG** — `dynamicSystemPromptMiddleware` wyciąga wiadomość użytkownika, uruchamia `similaritySearch(query, 2)` i wstrzykuje 2 najtrafniejsze fragmenty do promptu systemowego.
5. **Agent** — `createAgent` używa `claude-sonnet-4-6` bez narzędzi i odpowiada wyłącznie na bazie pobranego kontekstu z DOCX.
6. Agent jest wywoływany z pytaniem: `"What are key highlights of Nike's growth story?"`, a wynik jest logowany.

### Czym RAGAgent5 różni się od RAGAgent4

| | RAGAgent4 | RAGAgent5 |
|--|-----------|-----------|
| **Implementacja** | Potok RAG dla DOCX | **Aktualnie identyczna implementacja** |
| **Loader** | `DocxLoader` | `DocxLoader` |
| **Strategia retrievalu** | `similaritySearch(query, 2)` przez middleware | Taka sama |
| **Model** | `claude-sonnet-4-6` | Taki sam |
| **Kluczowy koncept** | RAG oparty na DOCX | **Równoległy przykład / wariant roboczy DOCX RAG** |

### Wymagania

- `OPENAI_API_KEY` w `.env` (dla embeddingów)
- `ANTHROPIC_API_KEY` w `.env` (dla `claude-sonnet-4-6`)
- Plik DOCX dostępny pod `/users/patrykksiazek/downloads/ProjectDocs/nike-growth-story.docx`

### Uruchomienie

```bash
npx tsx rag/ragagent5.ts
```

---

## RAGAgent6

Przykład agentic RAG, który **łączy retrieval z wielu dokumentów z narzędziami MCP**, dzięki czemu agent może odpytywać zewnętrzne systemy i porównywać te dane z wiedzą firmową zapisaną w PDF-ach.

### Jak działa

1. **Konfiguracja klienta MCP** — `MultiServerMCPClient` łączy się z zewnętrznym serwerem `ecommerce` MCP przez `stdio`, używając lokalnego entrypointu Node.
2. **Ładowanie dokumentów** — potok ładuje wiele plików PDF przez `PDFLoader`, w tym raport Nike 2023, raport Nike 2025 oraz dokument o historii wzrostu Nike.
3. **Fragmentacja** — `RecursiveCharacterTextSplitter` dzieli wszystkie załadowane strony na fragmenty po `1000` znaków z nakładaniem `200`.
4. **Embeddingi i wektorowy magazyn** — `OpenAIEmbeddings` z modelem `text-embedding-3-large` osadza wszystkie fragmenty we wspólnym `MemoryVectorStore`.
5. **Narzędzie retrieval** — własne narzędzie `retrieve` opakowuje `vectorStore.similaritySearch(query, 2)`, dzięki czemu agent może pobierać kontekst z PDF-ów na żądanie zamiast przez middleware.
6. **Zewnętrzne narzędzia** — `client.getTools()` importuje narzędzia MCP wystawione przez serwer ecommerce i łączy je z lokalnym narzędziem `retrieve`.
7. **Agent** — `createAgent` używa `claude-sonnet-4-5-20250929` wraz z narzędziami MCP i narzędziem retrieval RAG.
8. Agent jest wywoływany z pytaniem: `"Get product with id 28 and check if that product name match with our company offerings"`, aby pobrać dane produktu z systemu zewnętrznego i porównać je z dokumentami związanymi z Nike.

### Co RAGAgent6 dodaje względem RAGAgent5

| | RAGAgent5 | RAGAgent6 |
|--|-----------|-----------|
| **Integracja retrievalu** | Middleware automatycznie wstrzykuje kontekst | **Retrieval jako narzędzie** `retrieve` |
| **Systemy zewnętrzne** | Brak | **Integracja z serwerem MCP ecommerce** |
| **Źródła wiedzy** | Jeden dokument DOCX | Wiele PDF-ów plus zewnętrzne dane MCP |
| **Narzędzia agenta** | Brak narzędzi | Narzędzia MCP + własne narzędzie RAG |
| **Kluczowy koncept** | DOCX RAG przez middleware | **Agentic RAG z orkiestracją MCP** |

### Wymagania

- `OPENAI_API_KEY` w `.env` (dla embeddingów)
- `ANTHROPIC_API_KEY` w `.env` (dla `claude-sonnet-4-5-20250929`)
- Pliki PDF dostępne pod:
   - `/users/patrykksiazek/downloads/ProjectDocs/nke-10k-2023.pdf`
   - `/users/patrykksiazek/downloads/ProjectDocs/Nike-Inc-2025_10K.pdf`
   - `/users/patrykksiazek/downloads/ProjectDocs/nike-growth-story.pdf`
- Zbudowany serwer MCP dostępny pod `/Users/patrykksiazek/Downloads/mcp-ecommerce-crud/dist/mcp/server.js`

### Uruchomienie

```bash
npx tsx rag/ragagent6.ts
```


