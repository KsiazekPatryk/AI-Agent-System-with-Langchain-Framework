import {createAgent} from "langchain";

const agent = createAgent(
    {model: "claude-sonnet-4-6"}
    );

const response = agent.invoke({
    messages: 
    [{role: "user", content: "What is sum of 2+2"}]
});
console.log(response);


