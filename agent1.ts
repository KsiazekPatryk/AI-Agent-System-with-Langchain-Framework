import {createAgent, tool} from "langchain";
import "dotenv/config"
import z from "zod";

//20-30{city: "New York"}

const getWeather = tool( ()=>{
    //${input.city} - by getting weather - returned Sunny
    return 'Its sunny in ${input.city}'
    }, 
    {
    name: "getWeather",
    description: "Get the weather for a given city",
    schema: z.object({
        city: z.string()
        })
    }
);



const agent = createAgent(
    {model: "claude-haiku-4-5-20251001",
     tools: [getWeather],
    },
    );

const response = await agent.invoke({
    messages: 
    [{role: "user", content: "What is weather in New York?"}]
});
//console.log(response);
const longMessages = response.messages[response.messages.length-1].content
console.log(longMessages);


