# AI Agent System with Langchain Framework

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


