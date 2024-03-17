import { getVectorStore, lookupOldTickets } from "./util/initialize_db.js";
import { summarizeInfo } from "./util/preprocessor.js";
import { Ollama } from "@langchain/community/llms/ollama.js"
import { PromptTemplate } from "@langchain/core/prompts";
import { load_csv } from "./util/data_transformer";
import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config();

const llm = new Ollama({
    model: "gemma:7b-instruct"
})

export async function findResponse(issue: string, description: string, strict: boolean) {
    const LLMSummaryDb = await getVectorStore("ticket-embeddings-ext");
    const summarizedTicket = await summarizeInfo(issue, description);
    let knownTickets = await LLMSummaryDb.similaritySearch(summarizedTicket, 3,
        strict ? (doc: any) => {
            return doc.metadata.resolved === true
        } : undefined);
    //Failsafe if the same ticket is returned multiple times
    let ticketIds: Array<string> = [];
    knownTickets.map(ticket => {
        ticketIds.push(ticket.metadata.id)
    });
    ticketIds.forEach(function (value, index, arr) {

        let first_index = arr.indexOf(value);
        let last_index = arr.lastIndexOf(value);

        if (first_index !== last_index) {
            ticketIds.splice(last_index, 1);
            knownTickets.splice(last_index, 1);
        }
    });
    return knownTickets;
}


async function getReferences(issue: string, description: string, strictRAG:boolean) {
    const references = await findResponse(issue, description, strictRAG);
    return references;
}

async function getSuggestions(issue: string, description: string,strictRAG:boolean, strictResponse:boolean) {
    const references = await findResponse(issue, description, strictRAG);
    const tickets: Array<{ [key: string]: any }> = [];
    const ticketResolutions: Array<string> = [];
    references.forEach(doc => {
        const original_ticket = lookupOldTickets(doc.metadata.id);
        if (original_ticket) {
            ticketResolutions.push(original_ticket.resolution);
            tickets.push(original_ticket);
        }
    })
    let strictResponseConstraint = "";
    strictResponse?
    strictResponseConstraint = "You are not allowed to use any information outside of the context given.":
    strictResponseConstraint = "After you have summarized the context, feel free to also provide your own suggestions to solve the problem. Start this section with 'As an AI, I would also recommend...'."
    
    const prompt = PromptTemplate.fromTemplate(`
[INST]Present the context to an IT Support Agent to provide him a suggestion on how to solve the problem. `+strictResponseConstraint+`
Problem: Issue: {issue} - Description: {description}
Context: {context}
[/INST]`)

    const response = await prompt.pipe(llm).invoke({
        issue: issue,
        description: description,
        context: "- " + ticketResolutions.join("\n-")
    })
    return {
        llm_response: response,
        resolutions: ticketResolutions,
        referenced_tickets: tickets
    };
}

async function testAllUseCases(strictRAG: boolean, strictResponse: boolean) {
    const new_tickets = load_csv(path.join(__dirname, "..","data","new_tickets.csv"));
    for(let ticket of new_tickets) {
        const response = await getSuggestions(ticket.issue,ticket.description,strictRAG,strictResponse);
        console.log(`
Issue: `+ticket.issue+`
Description: `+ticket.description+`
LLM Response: `+response.llm_response+`

        `)
    }
}

getSuggestions("Application performance issue", "Performance of the internal application is slow and laggy.",true,false).then(suggestion => {
    console.info(suggestion);
})
/* 
testAllUseCases(true,false).then(() => {
    console.log("Done!");
}) */