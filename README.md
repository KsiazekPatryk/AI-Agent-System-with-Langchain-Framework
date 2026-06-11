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

### Run

```bash
npx ts-node agent2.ts
```
