import { Ollama } from "@langchain/community/llms/ollama"

import { PromptTemplate } from "@langchain/core/prompts";

const llm = new Ollama({
    model: "gemma:2b-instruct"
})

export async function summarizeInfo(issue:string,description:string) {
    const prompt = PromptTemplate.fromTemplate(`
<start_of_turn>user
Take the following prompt and simplify it to only 1 easy to search keyword. Your output will be used to semantic search similar statements. Start the search keyword with a -.

Prompt: {prompt}<end_of_turn>

<start_of_turn>model
    `);
    const response = await prompt.pipe(llm).invoke({prompt:"Issue: "+issue+". Description: "+description+"."
    })
    const keywords = response.split("\n");
    return keywords[0];
}