import { createAgent, createMiddleware, initChatModel, tool } from "langchain";
import z from "zod";
import "dotenv/config"
import {MemorySaver} from "@langchain/langgraph"
import { ChatOpenAI } from "@langchain/openai"

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

const dynamicModelSelection = createMiddleware({
    name: "dynamicModelSelection",
    wrapModelCall: (request, handler) =>
        {
            const messageCount = request.messages.length;
            return handler({
                ...request,
                model: messageCount < 3 ? model : basicModel
            })
        }

})

const config = {
    configurable: {thread_id: "1"},
    context:{user_id: "1"},
    db: {} 

}
//12,12->city

const qaConfig = {
    configurable: {thread_id: "2"},
    context: {user_id: "3"},
    db: {}//qa db
}

const responseFormat = z.object({
    human_response: z.string(),
    weather_conditions: z.string()
});

// if messages count is less than 3 --> choose CheaperModel, AdvancedModel

const model = await initChatModel(
    "claude-sonnet-4-5",
    {
        temperature: 0.7, timeout: 30, max_tokens: 1000
    }
)
const basicModel = new ChatOpenAI(
    {
        model: "gpt-4o-mini",
    }

)

const checkpointer = new MemorySaver();

const agent = createAgent({
    model: model,
    tools: [getUserLocation, getWeather],
    systemPrompt,
    responseFormat,checkpointer,
    middleware: [dynamicModelSelection] as const
});

const response = await agent.invoke({
    messages: [{role: "user", content: "What is the weather outside?"},
   ]
},config);


const response1= await agent.invoke({
    messages: [{role: "user", content: "What location did you tell me about?"},
   ]
},config);


const response2 = await agent.invoke({
    messages: [{role: "user", content: "Suggest me good places in that location"},
   ]
},config);




//console.log(response.structuredResponse);