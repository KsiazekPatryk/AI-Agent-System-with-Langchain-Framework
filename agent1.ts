import {createAgent} from "langchain";
import "dotenv/config"

const agent = createAgent(
    {model: "claude-sonnet-4-6"}
    );

const response = await agent.invoke({
    messages: 
    [{role: "user", content: "What is sum of 2+2"}]
});
console.log(response);


