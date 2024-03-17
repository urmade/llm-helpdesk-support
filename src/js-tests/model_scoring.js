import * as fs from "fs";

const idealScores = JSON.parse(fs.readFileSync("C:\\Users\\turba\\Documents\\Code\\AA_Case-Study\\scores\\idealScores.json"));

export function scoreResult(vectorResult, testData) {
    let score = {
        id: testData.id,
        prompt: testData.full_problem,
        responses: [],
        correctAnswers: 0,
        totalScore: 0.0,
        avgConfidence: 0.0
    };
    const idealResolution = idealScores.find(el => el.id === testData.id);
    vectorResult.forEach(doc => {
        if (idealResolution.responses.includes(doc[0].metadata.id)) score.correctAnswers++;
        score.avgConfidence += doc[1];
        score.responses.push([
            doc[0].metadata.id, doc[1], doc[0].pageContent
        ])
    })
    if(idealResolution.responses.length > 0) {
        score.totalScore = score.correctAnswers / idealResolution.responses.length
    }
    else {
        score.totalScore = -1
    }
    score.avgConfidence = score.avgConfidence / vectorResult.length;
    let stringResult = "";
    if (score.totalScore === 1) stringResult = "✅ Perfect score";
    else if (score.totalScore > 0) stringResult = "⚠️ Partially correct";
    else if (score.totalScore === 0) stringResult = "❌ Failed test";
    else stringResult = "❓ No correct answers"
    console.info("Test Case " + testData.id + ": " + stringResult);
    return score;
}

export function printCSV(testName, vectorStore, filters, results) {
    let output_csv = "";
    output_csv += testName + ";Overall;" + vectorStore + ";" + filters + ";;" + results[0].totalScore + ";" + results[0].avgConfidence + "\n";
/*     for (let i = 1; i < results.length; i++) {
        output_csv += testName + ";" + results[i].id + ";" + vectorStore + ";" + filters + ";" + results[i].correctAnswers + ";" + results[i].totalScore + "\n";
    } */
    return output_csv;
}