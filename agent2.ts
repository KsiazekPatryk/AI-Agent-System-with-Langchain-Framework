import { createAgent, tool } from "langchain";
import z from "zod";
import "dotenv/config"

const getUserLocation = tool((_,config)=> {

    const user_id = config.context.user_id;
    //fire database query to get user location based on user_id
    user_id === 1 ? "Florida" : "SFO";

},
{
    name: "get_user_location",
    description: "Retrieve user information based on User Id",
    schema: z.object({})
}

);

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

const config = {
    context:{user_id: "1"} 
}
//12,12->city

const agent = createAgent({
    model: "claude-haiku-4-5-20251001",
    tools: []
});

const response = await agent.invoke({
    messages: [{role: "user", content: "What is the weather outside?"},


    ]
},config)

console.log(response);