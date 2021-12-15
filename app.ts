import { ApiPromise, WsProvider } from '@polkadot/api';
import { ChainData } from './ChainData';
import { NominationData } from './NominationData';
import { Settings } from './Settings';
import { TVP_Candidate, ValidatorScore } from './Types';
import { Utility } from './Utility';
import { Validator } from './Validator';



async function getChainPrefix(api: ApiPromise) {
    const chainInfo = await api.registry.getChainProperties()
    var result = "0";

    if (chainInfo != null) {
        result = chainInfo.ss58Format.toString();
    }
    return parseInt(result);
}

async function main() {

    let chain_data = ChainData.getInstance();
    let nomination_data = NominationData.getInstance();
    var candidates: string[] = [];

    //Loads some chain data based information
    const api = await ApiPromise.create({ provider: new WsProvider(Settings.ws_provider) }).then(x => {
        Utility.Logger.info(`Connected to end point`);
        Utility.Logger.info(`Trying to set API to singleton and set chain data...`);
        return x;
    }).catch(err => {
        Utility.Logger.error(err);
        return undefined;
    });

    if (api == undefined) return;

    await getChainPrefix(api).then(prefix => {
        chain_data.setPrefix(prefix);
        chain_data.setApi(api);
        Utility.Logger.info(`API and Chain data set.`);
    }).catch(err => {
        Utility.Logger.error(err);
    });


    //Gets a filtered list of TVP candidates matching desired criteria
    const tvp_candidates = await filterTVPCandidates().then(x => {
        Utility.Logger.info(`TVP candidates loaded`);
        Utility.Logger.info(`Trying to merge candidate arrays...`);
        return x;
    }).catch(err => {
        Utility.Logger.error(err);
        return [];
    });


    //Combines all stashes into a single array
    candidates = candidates.concat(tvp_candidates)
        .concat(Settings.partners)
        .concat(Settings.preferred_candidates);
    Utility.Logger.info(`Candidate arrays merged`);

    //Converts each stash into a validator entry
    await loadValidatorArray(candidates).then(x => {
        Utility.Logger.info(`Candidates converted to validator objects`);
        Utility.Logger.info(`Trying to load nomination data...`);
        return x;
    }).catch(err => {
        Utility.Logger.error(err);
        return [];
    });

    //Populates nominators for each validator entry
    await nomination_data.loadNominationData(candidates).then(x => {
        Utility.Logger.info(`Nomination data loaded`);
        Utility.Logger.info(`Trying to load era points...`);
        return x;
    }).catch(err => {
        Utility.Logger.error(err);
        return [];
    });

    await nomination_data.loadAverageEraPoints().then(x => {
        Utility.Logger.info(`Era points loaded.`);

        return x;
    }).catch(err => {
        Utility.Logger.error(err);
        return [];
    });

    monitor_session_changes();

}

async function monitor_session_changes() {

    getValidators();
}

function getValidators(): string[] {

    let nomination_data = NominationData.getInstance();

    var sorted_validators = nomination_data.validators.sort((x, y) => x.getValidatorScore() < y.getValidatorScore() ? 1 : -1);
    var winners: ValidatorScore[] = [];
    var runners_up: ValidatorScore[] = [];

    sorted_validators.forEach(validator => {
        if (winners.filter(added_validator => added_validator.parent == validator.getParentIdentity()).length < 2
            && validator.getNominations() < Settings.nomination_threshold) {
            winners.push({
                val_address: validator.getAddress(),
                name: validator.getIdentityName(),
                parent: validator.getParentIdentity(),
                score: validator.getValidatorScore()
            });
        }
        else {
            runners_up.push({ val_address: validator.getAddress(), name: validator.getIdentityName(), parent: validator.getParentIdentity(), score: validator.getValidatorScore() });
        }
    });

    if (Settings.debug) {
        Utility.Logger.debug("Winners");
        console.log(winners);
        Utility.Logger.debug("Runners up");
        console.log(runners_up);
    }
    var results: string[]=[];
    results = results.concat(Settings.partners)
                     .concat(winners.slice(0, Settings.max_nominations - Settings.partners.length - 1)
                        .map(validator => validator.val_address)
        );
    results = results.concat(runners_up.slice(0, Settings.max_nominations - results.length)
                        .map(validator => validator.val_address)
    );

    console.log(results);

    return results

}


async function loadValidatorArray(candidates: string[]) {
    let nomination_data = NominationData.getInstance();
    var validator_promises: any[] = [];

    candidates.forEach(candidate => {
        validator_promises.push(nomination_data.addValidator(candidate));
    });

    await Promise.all(validator_promises).then(x => {
        validator_promises = [];
    });
}

async function filterTVPCandidates(): Promise<string[]> {
    return Utility.getCandidates().then(candidates => {

        var tvp_candidates: TVP_Candidate[] = [];

        //Valid canidates only
        tvp_candidates = candidates.filter(candidate => candidate.valid == true)//Valid candidates
            .filter(candidate => candidate.faults == 0)//No faults
            .filter(candidate => candidate.unclaimedEras.length == 0)//All payments processed
            .filter(candidate => candidate.active == false)//Not already in the active set
            .filter(candidate => candidate.commission >= Settings.min_commission //Commission is between min and max
                && candidate.commission <= Settings.max_commission)


        return tvp_candidates.map(tvp_candidate => tvp_candidate.stash);
    });
}



main();
