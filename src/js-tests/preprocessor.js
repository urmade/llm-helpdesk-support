import { Ollama } from "@langchain/community/llms/ollama";
import { PromptTemplate } from "@langchain/core/prompts";

const llm = new Ollama({
    model: "gemma:2b-instruct"
})

export async function summarizeInfo(issue,description) {
    const prompt = PromptTemplate.fromTemplate(`
    <start_of_turn>Take the following prompt and simplify it to only 1 easy to search keyword. Your output will be used to semantic search similar statements. Start the search keyword with a -.
     {prompt}  <end_of_turn>
     <start_of_turn>model
    `);
    const response = await prompt.pipe(llm).invoke({prompt:"Issue: "+issue+". Description: "+description+"."
    })
    const keywords = response.split("\n").filter(line => {
        if(line.trim().startsWith("-")) return true;
        return false;
    })
    if(!keywords[0]) return await summarizeInfo(issue,description);
    return keywords[0].substring(1).trim();
}


//console.log((await summarizeInfo("Email synchronization error.","Emails not syncing correctly across devices, causing communication delays. This is a recurring issue.")));