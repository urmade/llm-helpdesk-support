import fetch from "node-fetch";

async function embed(payload) {
    const embeddingPayload = {
        "model": "mistral",
        "prompt": payload
    }
    const request = await fetch("http://localhost:11434/api/embeddings", {
        method: "post",
        body: JSON.stringify(embeddingPayload),
        headers: { 'Content-Type': 'application/json' }
    });

    const customEmbedding = await request.json();
    return customEmbedding;
}

async function embedStringArray(payloadArray) {
    const queries = [];
    payloadArray.forEach(element => {
        queries.push(embed(element));
    });
    const embeddings = await Promise.all(queries);
    return embeddings;
}

const embeddings = await embedStringArray(["Apple", "Woman", "Glass", "Chair"]);
console.log(embeddings);