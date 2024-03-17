import * as Parser from "csv-parse/sync";
import * as fs from "fs";

export function load_csv(fileUrl:string) {
    const data_raw = fs.readFileSync(fileUrl);

    const data:Array<{[key:string]:any}> = Parser.parse(data_raw, {
        columns: true
    });

    return data.map(ticket => {
        let linear_ticket:{[key:string]:any} = {
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