# Ticket reference finder
## Overview
This repository shows an exemplary approach to set up a RAG-based (Retrieval Augmented Generation) Helpdesk system that learns from existing tickets and shows suggestions for new, incoming tickets. It is statically trained on given tickets, but backlearning (aka adding resolved new tickets into the system) could be easily implemented.

## Setup
The system is based on Langchain.js and requires ChromaDB for data storage as well as Ollama for running a local LLM. The easiest way to set up Chroma is via Docker, instructions can be found on [their website](https://docs.trychroma.com/deployment#docker). Ollama can be downloaded [here](https://ollama.com/).
The only other dependency is Typescript installed in your development environment.

To initialize your ChromaDB collection, run ollama pull gemma:2b (which will be used to embed / vectorize the tickets and make them compatible with the database), uncomment the code at the bottom of /util/initialize_db.ts and run the file. Only run it once (and comment the code out before starting the server), otherwise tickets will be duplicated in your database!

The reasoning on which LLMs were used for this and how the system is set up can be found in Model_evaluations.md.