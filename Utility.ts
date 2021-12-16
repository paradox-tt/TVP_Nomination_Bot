import { SettingsFile, TVP_Candidate } from "./Types";
import { ChainData } from "./ChainData";
import { Settings } from "./Settings";
import { Logger } from "tslog";
import { KeyringPair } from '@polkadot/keyring/types';
import { cryptoWaitReady } from '@polkadot/util-crypto';
import { Keyring } from '@polkadot/api';
import fetch from "node-fetch";
import * as fs from 'fs';
import * as rd from 'readline'

export class Utility {

    static Logger: Logger = new Logger();

    //Fetch candidate information from the TVP backend.  
    static async getCandidates(): Promise<TVP_Candidate[]> {
        let monitor = ChainData.getInstance();
        const network = monitor.getChain();

        var fetch_result = await fetch(`https://${network}.w3f.community/candidates`);
        var counter = 0;

        //Retry x times with a timeout in between.  If a result is not attained then return an empty set
        while (fetch_result.status != 200 && counter++ < 5) {
            console.log(`Having trouble finding candidate data, retrying in ${Settings.retry_time / 60000} minute(s)`);
            await new Promise(f => setTimeout(f, Settings.retry_time));
            fetch_result = await fetch(`https://${network}.w3f.community/candidates`);
        }

        //Default 
        var candidates: TVP_Candidate[] = [];

        //If the counter wasn't met then return results
        if(counter<5){
            candidates = await fetch_result.json();
        }
        
        return candidates;
    }


    //Get keyring for issuing the staking.nominate extrinsic
    static async getKeyring(): Promise<KeyringPair> {
        await cryptoWaitReady();
      

        const keyring = new Keyring({ type: 'sr25519' });

        if (Settings.derivation_path < 0) {
            return keyring.addFromMnemonic(Settings.seed_phrase);
        } else {
            return keyring.createFromUri(`${Settings.seed_phrase}//${Settings.derivation_path}`);
        }

    }
    /*  Load Settings.ts with data found in a file of JSON format
     */
    static async loadSettingsFile(){
        const rl = rd.createInterface({
            input: fs.createReadStream(Settings.secret_file)
        });  

        var json_data = "";
        for await (const line of rl) {
            json_data+=line;            
        }

        var secret_file:SettingsFile = JSON.parse(json_data);

        Settings.seed_phrase = secret_file.seed_phrase;
        Settings.derivation_path = secret_file.derivation_path;
        Settings.ws_provider = secret_file.ws_server;
        
        if(Settings.debug){
            console.log(secret_file);
        }
    }
}