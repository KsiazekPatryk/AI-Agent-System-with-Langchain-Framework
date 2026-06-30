import { createAgent,modelFallbackMiddleware,tool } from "langchain"
import z from "zod"


const SearchTool = tool(({query})=> 
{
    return `Search result for "${query}": Found 5 articles are reutrned`
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
`Email sent to ${recipient} with subject "${subject}"`
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
    tools: [SearchTool],
    middleware: [modelFallbackMiddleware("haiku-4-5","claude-sonnet-4-5"),

    ]
})