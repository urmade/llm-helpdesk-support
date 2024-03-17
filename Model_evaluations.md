# Building the system - considerations and approach
## Considerations
### Data - Understanding and refining the datasets
There are multiple attributes that could be used in the solution. Issue, Description and Solution could all be used for similarity search, Category could be either fed into the similarity search or used to narrow down the search, and Resolved should indicate which data may not be used as the solution proposed did not fix the problem.
For my approach, the following data structure was defined:
- Potential vectors: Issue, Description, Issue and Description, LLM-generated summary of Issue and Description as keyword
- Metadata: All data provided (included Issue and Description)

### Deciding on method of data retrieval
The only viable format to incorporate the source data into the output seems to be a RAG system. The context will be far to big to fully put into a prompt otherwise, and a RAG allows to pre-filter for relevant reference tickets to a given problem.

To find the best combination of search vector and search algorithm a test was conducted. The (pre-test) assumption for an ideal system was:
- Query vector: Issue
- RAG vector: Issue + Description
- Search Algorithm: Cosine

For the test, each new ticket was assigned a set of "ideal" database tickets that should be returned. The test should be viewed only as indicative as each test suite was only run once (leaving a lot of room for variance) and some minor issues were discovered in the setup of the vector database. Outcome of the test:

Search Algorithm | Vector | RAG-stored Vector | Performance (Accuracy)
--- | --- | --- | --- 
Cosine | Description | Description | 56%
Cosine | Description | Description + Issue | 56%
Cosine | Issue | Issue | 38%
Cosine | Issue | Description + Issue | 38%
Cosine | Description + Issue | Description + Issue | 75%
Cosine | LLM Summary | LLM Summary | 100%
Cosine | LLM Summary | Description + Issue | 19%
--- | --- | --- | --- 
Inner Product | Description | Description | 50%
Inner Product | Description | Description + Issue | 50%
Inner Product | Issue | Issue | 13%
Inner Product | Issue | Description + Issue | 13%
Inner Product | Description + Issue | Description + Issue | 31%
Inner Product | LLM Summary | LLM Summary | 31%
Inner Product | LLM Summary | Description + Issue | 38%
--- | --- | --- | --- 
Squared L2 | Description | Description | 69%
Squared L2 | Description | Description + Issue | 69%
Squared L2 | Issue | Issue | 25%
Squared L2 | Issue | Description + Issue | 25%
Squared L2 | Description + Issue | Description + Issue | 56%
Squared L2 | LLM Summary | LLM Summary | 56%
Squared L2 | LLM Summary | Description + Issue | 60%

Based on these tests the following approach was selected:
- Query vector: LLM generated summary of Issue + Description
- RAG vector: LLM generated summary of Issue + Description
- Search Algorithm: Cosine

This approach produces higher upfront token sizes (each ticket has to be run through the LLM once, including each ticket we want an answer for), but should be partly compensated for by a smaller token size for the response query (as keywords are usually only 3-5 words).

### Deciding on vector encoding
The next decision was about how many keywords should be produced for each ticket. Another test was conducted (this time each test ran 5 times to get a more objective result) using 1 keywords, 3 keywords and 5 keywords.

Number of keys | Performance (Accuracy)
--- | ---
1 | 75%
3 | 53%
5 | 53%

The test concluded an ideal setup of one keyword per ticket. This is likely due to the small dataset used in the PoC. A production database would likely perform better with 3 or 5 keywords to make tickets more specific.

## Implementation
### Generating ticket summaries
For the ticket summary the PoC chose gemma-2b-instruct. The instruction-trained LLM helps reducing token cost by performing decent with zero-shot queries, and the base model returned decent responses, though very few responses were not useful, i.e. returining only "issue". For the PoC this was deemed okay, though an evaluation of gemma-7b or higher would make sense to compare performance of both systems.

### Generating embeddings
For the embeddings gemma-2b was used for optimal performance.

### Generating the final response
For the final response gemma-7b was chosen. The 2b model tended to hallucinate in most cases, ignoring the boundaries of the request and incorporating its own information on top of the context provided. The extended model only recapped the solutions from the tickets found by the RAG in a mostly natural, human-like tone. This step could potentially be omitted to make the solution even cheaper, but refining the output makes the solutions proposed more comprehendable and allows for extensibility later on. As an example for this a "creative" mode was implemented which allows the LLM to give its own suggestions next to the findings of the RAG.