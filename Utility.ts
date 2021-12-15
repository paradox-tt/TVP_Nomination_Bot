import { TVP_Candidate } from "./Types";
import { ChainData } from "./ChainData";
import { Settings } from "./Settings";
import { Logger } from "tslog";
import { KeyringPair } from '@polkadot/keyring/types';
import { cryptoWaitReady } from '@polkadot/util-crypto';
import { Keyring } from '@polkadot/api';
import fetch from "node-fetch";

export class Utility {

    static Logger: Logger = new Logger();

    static async getCandidates(): Promise<TVP_Candidate[]> {
        let monitor = ChainData.getInstance();
        const network = monitor.getChain();

        var fetch_result = await fetch(`https://${network}.w3f.community/candidates`);

        while (fetch_result.status != 200) {
            console.log(`Having trouble finding candidate data, retrying in ${Settings.retry_time / 60000} minute(s)`);
            await new Promise(f => setTimeout(f, Settings.retry_time));
            fetch_result = await fetch(`https://${network}.w3f.community/candidates`);
        }

        var candidates: TVP_Candidate[] = await fetch_result.json();

        return candidates;
    }

    static async getKeyring(seed_phrase: string, deriviation_path: number): Promise<KeyringPair> {
        await cryptoWaitReady();

        const keyring = new Keyring({ type: 'sr25519' });

        if (deriviation_path < 0) {
            return keyring.addFromMnemonic(seed_phrase);
        } else {
            return keyring.createFromUri(`${seed_phrase}//${deriviation_path}`);
        }

    }

}