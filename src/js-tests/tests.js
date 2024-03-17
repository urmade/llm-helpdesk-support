import { load_csv } from "../util/data_transformer.js";
import { printCSV, scoreResult } from "./model_scoring.js";
import { createMultiVariableVectorStore, createSingleVariableVectorStore } from "./vector_store.js";
import { summarizeInfo } from "../preprocessor.js";

import * as fs from "fs";

/* const MultiTextDb = await createMultiVariableVectorStore();
console.info("Initialized Multitext DB"); */
/* const IssueDb = await createSingleVariableVectorStore("issue");
console.info("Initialized Issue DB");
const DescriptionDb = await createSingleVariableVectorStore("description");
console.info("Initialized Description DB");
const FullPromblemDb = await createSingleVariableVectorStore("full_problem");
console.info("Initialized FullPrompt DB"); */
const LLMSummaryDb = await createSingleVariableVectorStore("llm_summary");
console.info("Initialized LLM Embedded DB");



let testResults = "Test Name;Test Case ID;Vector Store;Filters(n/r/c/rc);Correct Answers;Total Score;Average Confidence\n";
/* 
//Testing on vectorized "Description" field
testResults += (await runTestSuite("description",DescriptionDb,"descr"))
//Testing on vectorized "Description" field in DB with both vectorized Description and Issue
testResults += (await runTestSuite("description",MultiTextDb,"multi_descr"))

//Testing on vectorized "Issue" field
testResults += (await runTestSuite("issue",IssueDb,"iss"))
testResults += (await runTestSuite("issue",MultiTextDb,"multi_iss"))

//Testing on vectorized "Issue" and "Description" as variable "full_problem"
testResults += (await runTestSuite("full_problem",FullPromblemDb,"full"))
testResults += (await runTestSuite("full_problem",MultiTextDb,"multi_full"))
 */
//Testing on generated summary "Issue" and "Description" as variable "llm_summary"
for (let i = 1; i < 6; i++) {
    const newTickets = load_csv("C:\\Users\\turba\\Documents\\Code\\AA_Case-Study\\data\\new_tickets.csv");
    for (let i = 0; i < newTickets.length; i++) {
        newTickets[i].llm_summary = await summarizeInfo(newTickets[i].issue, newTickets[i].description)
    }
    testResults += (await runTestSuite(newTickets, "llm_summary", LLMSummaryDb, "llm_mistral7b_3keys_iteration" + i))
}
fs.writeFileSync("C:\\Users\\turba\\Documents\\Code\\AA_Case-Study\\scores\\mistral7b1key_stress-test.csv", testResults);


async function runTestSuite(newTickets, variable, vector_store, descr) {
    let testResults = "";
    //Variable only - no filter
    const nf = await test(newTickets, variable, vector_store, false, false);
    testResults += printCSV(descr + "_nf", "chroma", "n", nf);
    //Variable only - resolved filter
    const rf = await test(newTickets, variable, vector_store, true, false);
    testResults += printCSV(descr + "_rf", "chroma", "r", rf);
    //Variable only - categorized filter
    const cf = await test(newTickets, variable, vector_store, false, true);
    testResults += printCSV(descr + "_cf", "chroma", "c", cf);
    //Variable only - resolved and categorized filter
    const rcf = await test(newTickets, variable, vector_store, true, true);
    testResults += printCSV(descr + "_rcf", "chroma", "rc", rcf);

    return testResults;
}

async function test(newTickets, variable, vectorStore, filterResolved, filterCategory) {
    let scoringArray = [];
    for (let i = 0; i < newTickets.length; i++) {
        const resolution = await vectorStore.similaritySearchWithScore(newTickets[i][variable], 3, (doc) => {
            let allow = true;
            if (filterResolved) allow = doc.metadata.resolved;
            if (filterCategory) allow = (doc.metadata.category === newTickets[i].category);
            if (filterResolved && filterCategory) allow = doc.metadata.resolved && (doc.metadata.category === newTickets[i].category);
            return allow;
        });

        const score = scoreResult(resolution, newTickets[i]);

        scoringArray.push(score);
    }
    let overallScoreCount = 0.0;
    let avgConfidence = 0.0;
    let totalScores = 0;
    scoringArray.map(score => {
        if (score.totalScore >= 0) {
            overallScoreCount += score.totalScore;
            totalScores++;
        }
        avgConfidence += score.avgConfidence;

    })
    scoringArray.unshift({ totalScore: overallScoreCount / totalScores, avgConfidence: avgConfidence / scoringArray.length })
    return scoringArray;
}