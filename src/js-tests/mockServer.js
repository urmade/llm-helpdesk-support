import { createSingleVariableVectorStore } from "./vector_store.js";
import { summarizeInfo } from "../preprocessor.js";
import { Ollama } from "@langchain/community/llms/ollama";
import { PromptTemplate } from "@langchain/core/prompts";
import { lookupOldTickets } from "./vector_store.js";

const LLMSummaryDb = await createSingleVariableVectorStore("llm_summary");
const llm = new Ollama({
    model: "gemma:2b-instruct"
})

export async function findResponse(issue, description, strict) {
    const summarizedTicket = await summarizeInfo(issue, description);
    let knownTickets = await LLMSummaryDb.similaritySearch(summarizedTicket, 3, 
        strict? (doc) => {
        return doc.metadata.resolved === true
    } : undefined) ;
    //Failsafe if the same ticket is returned multiple times
    let ticketIds = [];
    knownTickets.map(ticket => {
        ticketIds.push(ticket.metadata.id)
    });
    ticketIds.forEach(function (value, index, arr) {

        let first_index = arr.indexOf(value);
        let last_index = arr.lastIndexOf(value);

        if (first_index !== last_index) {
            ticketIds.splice(last_index,1);
            knownTickets.splice(last_index,1);
        }
    });
    return knownTickets;
}


async function getReferences(issue,description) {
    const references = await findResponse(issue,description);
    return references;
}

async function getSuggestions(issue,description) {
    const references = await findResponse(issue,description,false);
    const tickets = [];
    const ticketResolutions = [];
    references.forEach(doc => {
        const original_ticket = lookupOldTickets(doc.metadata.id);
        ticketResolutions.push(original_ticket.resolution);
        tickets.push(original_ticket);
    })
    const prompt = PromptTemplate.fromTemplate(`[INST]Present the context to an IT Support Agent to provide him a suggestion on how to solve the problem. You are not allowed to use any information outside of the context given. Keep your answer short and minimal.
    Problem: Issue: {issue} - Description: {description}
    Context: {context}
    [/INST]`)
    const response = await prompt.pipe(llm).invoke({
        issue: issue,
        description: description,
        context:"- "+ticketResolutions.join("\n-")
    })
    return {
        llm_response: response,
        resolutions: ticketResolutions,
        referenced_tickets: tickets
    };
}

console.info(await getSuggestions("New software installation request","A request to install new project management software."));