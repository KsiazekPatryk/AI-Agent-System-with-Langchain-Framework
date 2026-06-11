import { createAgent, initChatModel, tool } from "langchain";
import z from "zod";
import "dotenv/config"


const systemPrompt = `You are the expert weather forecaster who also speaks in humour way. 

You have access to two tools: get_weather_for_location: 
Use this to get the weather for a specific location. get_user_location: use this to get the user's locatioon. 
If a user asks you for the weather, make sure you know the location first.
If a user asks you for the weather, make sure you know the location. 
If you can tell from the question that they mean wheather they are, use the get_user_location tool to find their location.`


const getUserLocation = tool((_,config)=> {

    const user_id = config.context.user_id;
    //fire database query to get user location based on user_id
    return user_id === "1" ? "Florida" : "SFO";

},
{
    name: "get_user_location",
    description: "Get the current user's location. Always call this first when the user asks about weather and has not specified a city.",
    schema: z.object({})
}

);

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
);

const config = {
    context:{user_id: "1"} 
}
//12,12->city

const qaConfig = {
    context: {user_id: "1"},
    db: {}//qa db    
}

const responseFormat = z.object({
    human_response: z.string(),
    weather_conditions: z.string()
});

const model = await initChatModel(
    "claude-haiku-4-5-20251001"
    {
        temperature: 0.7, timeout: 30, max_tokens: 1000
    }
)


const agent = createAgent({
    model: model,
    tools: [getUserLocation, getWeather],
    systemPrompt,
    responseFormat
});

const response = await agent.invoke({
    messages: [{role: "user", content: "What is the weather outside?"},
    //messages: [{role: "user", content: "What is the time in New York?"}],
    //messages: [{role: "user", content: "What is the weather & time in New York?"}],
   ]
},qaConfig);

console.log(response.structuredResponse);