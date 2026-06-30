import { createAgent,llmToolSelectorMiddleware,modelFallbackMiddleware,summarizationMiddleware,tool } from "langchain"
import z from "zod"


const SearchTool = tool(({query})=> 
{
    return `Search result for "${query}": Found 5 articles are returned`
},
{
    name: "search",
    description: "Search the internet for information.",
    schema: z.object({
        query: z.string()
    })
})

const emailTool = tool(({recipient, subject})=>
{
    return `Email sent to ${recipient} with subject "${subject}"`
},
{
    name: "send_email",
    description: "send an email to someone",
    schema: z.object({
        recipient: z.string(),
        subject: z.string(),
    })
}

const getWeather = tool( (input)=>{
    return `Its sunny in ${input.city}`
    },
    {
    name: "getWeather",
    description: "Get the weather for a given city",
    schema: z.object({
        city: z.string()
        })
    }
)
const agent = createAgent({
    model: "claude-sonnet-4-5",
    tools: [SearchTool,emailTool,getWeather],
    middleware: [modelFallbackMiddleware("haiku-4-5","claude-sonnet-4-5"),
    summarizationMiddleware({
        model: "claude-sonnet-4-5",
        maxTokensBeforeSummary: 8000, //Trigger summarization of 8000 tokens.
        messagesToKeep: 20
    }),
    //50 tools - basic model - 3-4 tools - Main model (reasoning) --> output
    llmToolSelectorMiddleware({
        model: "haiku-4-5",
        maxTools: 2
    })
    ]
})

agent.invoke({
    messages: [{role: "user", content: "What is the weather in Tokyo?"}]
})
console.log(output.structuredResponse);