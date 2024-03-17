import { createSingleVariableVectorStore } from "./vector_store.js";
import { summarizeInfo } from "../preprocessor.js";
import express from "express";
import { Ollama } from "@langchain/community/llms/ollama";
import { PromptTemplate } from "@langchain/core/prompts";


const LLMSummaryDb = await createSingleVariableVectorStore("llm_summary");

export async function findResponse(issue, description) {
    const summarizedTicket = await summarizeInfo(issue, description);
    const knownTickets = await LLMSummaryDb.similaritySearch(summarizedTicket, 3);
    //Failsafe if the same ticket is returned multiple times
    const ticketIds = [];
    knownTickets.map(ticket => {
        ticketIds.push(ticket.metadata.id)
    });
    ticketIds.forEach(function (value, index, arr) {

        let first_index = arr.indexOf(value);
        let last_index = arr.lastIndexOf(value);

        if (first_index !== last_index) {
            knownTickets.splice(last_index);
        }
    });
    return knownTickets;
}

const app = express();

app.post("/api/tickets", express.json(), async (req,res) => {
    if(!req.body.issue || !req.body.description) {
        res.status(400).send("Missing input parameters!");
    }
    else {
        console.log("Received request!");
        const references = await findResponse(req.body.issue,req.body.description);
        /* const referenceStrings = [];
        references.map(result => {
            referenceStrings.push(result.pageContent);
        }) */
        res.send(references);
    }
})

app.post("/api/tickets/references", express.json(), async (req,res) => {
    if(!req.body.issue || !req.body.description) {
        res.status(400).send("Missing input parameters!");
    }
    else {
        console.log("Received request!");
        const references = await findResponse(req.body.issue,req.body.description);
        res.send(references);
    }
})

app.listen(process.env.PORT || 3000, () => {
    console.info("Server running and initialized");
})