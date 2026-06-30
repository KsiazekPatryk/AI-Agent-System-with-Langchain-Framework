import { createAgent,piiRedactionMiddleware,tool } from "langchain"
import z from "zod"
import "dotenv/config"


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
)

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
    middleware: [
        piiRedactionMiddleware({
            rules: {
                credit_card: /\b\d{4}-\d{4}-\d{4}-\d{4}\b/g,
                ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
                phone: /\b\d{3}-\d{3}-\d{4}\b/g,
            }
        })
    ]
})

const response = await agent.invoke({
    messages: [{role: "user", content: "My credit card is 1234-5678-9012-3456, is this master or visa?"}]
})
console.log(response);