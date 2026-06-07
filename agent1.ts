import {createAgent} from "langchain";
import "dotenv/config"

const agent = createAgent(
    {model: "claude-haiku-4-5-20251001"}
    );

const response = await agent.invoke({
    messages: 
    [{role: "user", content: "What is sum of 2+2"}]
});
console.log(response);


