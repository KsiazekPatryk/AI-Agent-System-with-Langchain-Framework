# AI Agent System with Langchain Framework

## agent1.ts

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
