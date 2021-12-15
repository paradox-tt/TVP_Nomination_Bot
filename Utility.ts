import { TVP_Candidate } from "./Types";
import { ChainData } from "./ChainData";
import { Settings } from "./Settings";
import fetch from "node-fetch";
import { Logger } from "tslog";



export class Utility {

    static Logger:Logger= new Logger();

    static async getCandidates(): Promise<TVP_Candidate[]> {
        let monitor = ChainData.getInstance();
        const network = monitor.getChain();

        var fetch_result = await fetch(`https://${network}.w3f.community/candidates`);

        while (fetch_result.status != 200) {
            console.log("Having troubles finding candidate data, retrying in a minute");
            await new Promise(f => setTimeout(f, Settings.retry_time));
            fetch_result = await fetch(`https://${network}.w3f.community/candidates`);
        }

        var candidates: TVP_Candidate[] = await fetch_result.json();

        return candidates;
    }


    static getName(candidates: TVP_Candidate[], stash: string): string {
        var candidate = candidates.find(candidate => candidate.stash == stash);

        if (candidate != undefined) {
            var candidate_name;

            if (candidate.identity != undefined) {

                candidate_name = candidate.identity.name;

                if (candidate.identity.sub != undefined) {
                    candidate_name = `${candidate.identity.name}/${candidate.identity.sub}`;
                }
            }

            if (candidate.score != undefined) {
                return `${candidate_name} - (${candidate.score.aggregate.toFixed(2)})`;
            }

            return "Error";
        } else {
            return "Not found";
        }

    }

 
}