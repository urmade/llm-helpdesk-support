import { Chroma } from "@langchain/community/vectorstores/chroma";
import { load_csv } from "./data_transformer";
import { summarizeInfo } from "./preprocessor";
import { OllamaEmbeddings } from "@langchain/community/embeddings/ollama";

const tickets_1 = load_csv("C:\\Users\\turba\\Documents\\Code\\AA_Case-Study\\data\\old_tickets\\ticket_dump_1.csv");
const tickets_2 = load_csv("C:\\Users\\turba\\Documents\\Code\\AA_Case-Study\\data\\old_tickets\\ticket_dump_2.csv");
const tickets_3 = load_csv("C:\\Users\\turba\\Documents\\Code\\AA_Case-Study\\data\\old_tickets\\ticket_dump_3.csv");

const old_tickets = tickets_1.concat(tickets_2, tickets_3);

export async function getVectorStore(storeName:string) {
    return await Chroma.fromExistingCollection(
        new OllamaEmbeddings({
            model: "gemma:2b"
        }),
        {
            collectionName: storeName,
            collectionMetadata: {
                "hnsw:space": "cosine",
            }
        }
    )
}

export function lookupOldTickets(ticketId:string) {
    return old_tickets.find(ticket => {
        return ticket.id === ticketId;
    })
}
//Only called once manually to initialize DB with old tickets
async function createVectorStore(storeName:string) {
    const content:Array<string> = [];
    const metadata:Array<{[key:string]:any}> = [];
    for(const ticket of old_tickets) {
        const llm_summary = await summarizeInfo(ticket.issue,ticket.description);
        console.log(llm_summary);
        content.push(llm_summary);
        metadata.push({
            id: ticket.id,
            category: ticket.category,
            date: ticket.date,
            agent: ticket.agent,
            resolved: ticket.resolved,
            resolution: ticket.resolution,
            issue: ticket.issue,
            description: ticket.description
        })
    }
    console.log(content);
    console.info("Created LLM summaries!");
    return await Chroma.fromTexts(
        content,
        JSON.parse(JSON.stringify(metadata)),
        new OllamaEmbeddings({
            model: "gemma:2b"
        }),
          {
            collectionName: storeName,
            collectionMetadata: {
                "hnsw:space": "cosine",
              }
          }
    )
}


/* createVectorStore("ticket-embeddings-ext").then(db => {
    console.info(db.collectionName)
}) */