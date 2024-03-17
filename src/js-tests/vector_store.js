import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { Chroma } from "@langchain/community/vectorstores/chroma";
import { OllamaEmbeddings } from "@langchain/community/embeddings/ollama";

import { load_csv } from "../util/data_transformer.js";
import { summarizeInfo } from "../preprocessor.js";

const tickets_1 = load_csv("C:\\Users\\turba\\Documents\\Code\\AA_Case-Study\\data\\old_tickets\\ticket_dump_1.csv");
const tickets_2 = load_csv("C:\\Users\\turba\\Documents\\Code\\AA_Case-Study\\data\\old_tickets\\ticket_dump_2.csv");
const tickets_3 = load_csv("C:\\Users\\turba\\Documents\\Code\\AA_Case-Study\\data\\old_tickets\\ticket_dump_3.csv");


const old_tickets = tickets_1.concat(tickets_2, tickets_3);

for(let i = 0; i < old_tickets.length; i++) {
    old_tickets[i].llm_summary = await summarizeInfo(old_tickets[i].issue,old_tickets[i].description)
}
export function lookupOldTickets(ticketId) {
    return old_tickets.find(ticket => {
        return ticket.id === ticketId;
    })
}

async function createVectorStore(storeName,content,metadata) {
    return await Chroma.fromTexts(
        content,
        JSON.parse(JSON.stringify(metadata)),
        new OllamaEmbeddings({
            model: "mistral", // default value
            baseUrl: "http://localhost:11434", // default value
          }),
          {
            collectionName: storeName+"-mis",
            collectionMetadata: {
                "hnsw:space": "cosine",
              }
          }
    )
}

export async function createMultiVariableVectorStore() {
    const ticket_content = [];
    old_tickets.map(ticket => {
        ticket_content.push(ticket["issue"]);
    })
    old_tickets.map(ticket => {
        ticket_content.push(ticket["description"]);
    })
    let ticket_metadata = old_tickets.map(ticket => {
        return {
            id: ticket.id,
            category: ticket.category,
            date: ticket.date,
            agent: ticket.agent,
            resolved: ticket.resolved,
            resolution: ticket.resolution,
            issue: ticket.issue,
            description: ticket.description
        }
    });
    ticket_metadata = ticket_metadata.concat(ticket_metadata);
    const vectorStore = await createVectorStore("multi",ticket_content, ticket_metadata);
    return vectorStore;
}

export async function createSingleVariableVectorStore(variable) {
    const ticket_content = [];
    old_tickets.map(ticket => {
        ticket_content.push(ticket[variable]);
    })
    const ticket_metadata = old_tickets.map(ticket => {
        return {
            id: ticket.id,
            category: ticket.category,
            date: ticket.date,
            agent: ticket.agent,
            resolved: ticket.resolved,
            resolution: ticket.resolution,
            issue: ticket.issue,
            description: ticket.description
        }
    });
    const vectorStore = await createVectorStore(variable,ticket_content, ticket_metadata);
    return vectorStore;
}
