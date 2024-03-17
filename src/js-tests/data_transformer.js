import * as Parser from "csv-parse/sync";
import * as fs from "fs";

export function load_csv(fileUrl) {
    const data_raw = fs.readFileSync(fileUrl);

    const data = Parser.parse(data_raw, {
        columns: true
    });

    return data.map(ticket => {
        let linear_ticket = {
            id: ticket['Ticket ID'],
            full_problem: "Issue: " + ticket.Issue + " ||| Description: " + ticket.Description,
            issue: ticket.Issue,
            description: ticket.Description,
            category: ticket.Category,
            date: new Date(ticket.Date),
        }
        ticket['Agent Name'] ? linear_ticket.agent = ticket['Agent Name'] : undefined;
        ticket.Resolved ?
            ticket.Resolved === "True" ?
                linear_ticket.resolved = true :
                linear_ticket.resolved = false :
            undefined;
        ticket.Resolution ? linear_ticket.resolution = ticket.Resolution : undefined;
        return linear_ticket;
    });
}

//Function to transform JSON into CSV format
function transform_json_to_csv(fileUrl) {
    const data_raw = fs.readFileSync(fileUrl);
    const data = JSON.parse(data_raw);
    let newFile = {
        "20": {},
        "21": {},
        "22": {},
        "23": {},
        "24": {},
        "25": {},
        "26": {},
        "27": {},
        "28": {},
        "29": {},
    };
    for (let key in data) {
        for (let id in data[key]) {
            newFile[id][key] = data[key][id]
        }
    }
    let csv = "Ticket ID,Issue,Category,Resolution,Date,Agent Name,Resolved,Description\n";
    for (let id in newFile)

        csv += [
            //Not transforming Ticket ID as this is metadata which will be needed to make eventual back-queries to the original database in the future 
            newFile[id]["Ticket ID"],
            newFile[id].Issue,
            newFile[id].Category,
            newFile[id].Resolution,
            //Date differs in format from the other two but it doesn't matter as it's all converted to JSON anyways ultimately
            newFile[id].Date,
            newFile[id]["Agent Name"],
            newFile[id].Resolved,
            newFile[id].Description.replaceAll(",", "")
        ]
            .join(",") + "\n";
    fs.writeFileSync("C:\\Users\\turba\\Documents\\Code\\AA_Case-Study\\data\\old_tickets\\ticket_dump_3.csv", csv)
}
//const linear_historical_tickets = load_csv(path.join(__dirname, "..", "data", "old_tickets", "ticket_dump_1.csv"));

/* const linear_new_tickets = load_csv(path.join(__dirname, "..", "data", "new_tickets.csv"));
console.log(linear_new_tickets); */