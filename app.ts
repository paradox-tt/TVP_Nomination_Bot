import { ApiPromise, WsProvider } from '@polkadot/api';
import { ChainData } from './ChainData';
import { NominationData } from './NominationData';
import { Settings } from './Settings';
import { PrettyOutput, TVP_Candidate, ValidatorScore } from './Types';
import { Utility } from './Utility';


//Main function
async function main() {

    //Load setting.ts with some variable from a file specified in settings
    await Utility.loadSettingsFile();

    let chain_data = ChainData.getInstance();

    //Creates a connection to an API endpoint specified in settings.
    const api = await ApiPromise.create({ provider: new WsProvider(Settings.ws_provider) }).then(x => {
        Utility.Logger.info(`Connected to end point`);
        Utility.Logger.info(`Trying to set API to singleton and set chain data...`);
        return x;
    }).catch(err => {
        Utility.Logger.error(err);
        return process.exit(-1);
    });

    //If there is an issue retrieving the API then exit
    if (api == undefined) process.exit(-1);

    //load chain data information
    await getChainPrefix(api).then(prefix => {
        chain_data.setPrefix(prefix);
        chain_data.setApi(api);
        Utility.Logger.info(`API and Chain data set.`);
    }).catch(err => {
        Utility.Logger.error(err);
    });

    //With all data loaded initiate the change of nominations
    monitor_session_changes();

}


/* Primarily focused on listening for a session event change and switching nominations
   when the era and session criterias are met
*/

async function monitor_session_changes() {

    let chain_data = ChainData.getInstance();
    let api = chain_data.getApi();
    
    Utility.Logger.info('Waiting for new session event..');
    //On the first load set this to 0, validators would be rotated in the next
    var change_validators = 0;

    //Listen for events
    api.query.system.events((events) => {
        //For each event
        events.forEach((record) => {
            // Extract the phase, event and the event types
            const { event } = record;
            //If the event is a change session event
            if (api.events.session.NewSession.is(event)) {
                //Determine the session
                const current_session = (parseInt(event.data[0].toString()) % 6) + 1;
                Utility.Logger.info(`Current session is : ${current_session} on ${api.rpc.chain}, there are ${change_validators} before nominations are changed.`);

                //If the session is as specified in the setting
                if(current_session==Settings.session_to_change){
                    //If the right era is attained
                    if(change_validators==0){
                        //Refresh information, get a set of 24 validators and then nominate them
                        load_supporting_information().then(x=>{
                            getValidators().then(validators=>{
                                nominateValidators(validators);
                            });
                        });
                        //After a change in validators reset the counter
                        change_validators=Settings.era_to_rotate;
                    }else{
                        //If the era is not as desired, then decrease the counter
                        change_validators--;
                    }
                }
            }

        });
    });
}


/*  Issues a staking.nominate transaction for a given list of validator stashes
 */
async function nominateValidators(validator_list:string[]){
    let chain_data = ChainData.getInstance();
    let api = chain_data.getApi();
    const key_ring = await Utility.getKeyring();

    if (api != undefined && key_ring != undefined) {
        api.tx.staking.nominate(validator_list)
            .signAndSend(key_ring)
            .then(x => {
                Utility.Logger.info('Nominations changed');
            })
            .catch(err => {
                Utility.Logger.error(err);
            });
    }
}

/* Load supporting information before selecting validators,
   this shall be done before each validator selection.
*/
async function load_supporting_information() {
    
    let nomination_data = NominationData.getInstance();
    nomination_data.clearData();//clear any previous data

    var candidates: string[] = [];

    //Gets a filtered list of TVP candidates matching desired criteria
    const tvp_candidates = await filterTVPCandidates().then(x => {
        Utility.Logger.info(`TVP candidates loaded`);
        Utility.Logger.info(`Trying to merge candidate arrays...`);
        return x;
    }).catch(err => {
        Utility.Logger.error(err);
        return [];
    });

    //Combines stashes of the tvp and preferred candidates into a single array
    candidates = candidates.concat(tvp_candidates)
                           .concat(Settings.preferred_candidates);

    Utility.Logger.info(`Candidate arrays merged`);

    //Converts each stash into a validator object and loads this
    //into the nomination_data instance
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

    //Populates era points for each validator
    await nomination_data.loadAverageEraPoints().then(x => {
        Utility.Logger.info(`Era points loaded.`);
    }).catch(err => {
        Utility.Logger.error(err);
    });
}

async function getValidators(): Promise<string[]> {

    let nomination_data = NominationData.getInstance();

    var sorted_validators = nomination_data.validators.sort((x, y) => x.getValidatorScore() < y.getValidatorScore() ? 1 : -1);
    var winners: ValidatorScore[] = [];
    var runners_up: ValidatorScore[] = [];

    sorted_validators.forEach(validator => {
        if (winners.filter(added_validator => added_validator.parent == validator.getParentIdentity()).length < Settings.max_nodes_per_validator // Only x nodes per validator
            && validator.getNominations() < Settings.nomination_threshold // Bonds less than the threshold
        ) {
            //If a validator and nominations are not blocked then add to the winners
            //otherwise don't even add to runners up. 
            if (validator.getIntent() || !validator.getBlockedNominations()) {
                winners.push({
                    val_address: validator.getAddress(),
                    name: validator.getIdentityName(),
                    parent: validator.getParentIdentity(),
                    score: validator.getValidatorScore()
                });
            }

        }
        else {
            runners_up.push({ val_address: validator.getAddress(), name: validator.getIdentityName(), parent: validator.getParentIdentity(), score: validator.getValidatorScore() });
        }
    });

    var results: string[] = await mergeFinalArray(winners,runners_up);
    showDebugInfo(winners, runners_up);
    showNominationList(results);


    Utility.Logger.info(`(${results.length}) validators obtained`);
    return results;
}

async function showNominationList(results:string[]){
    let nomination_data = NominationData.getInstance();
    let chain_data = ChainData.getInstance();

    Utility.Logger.info(`Nominations for era ${await chain_data.getCurrentEra()}`);
    var pretty_output: PrettyOutput[] = [];
    results.forEach(result => {
        pretty_output.push(
            {
                val_address: result,
                identity: nomination_data.validators
                    .find(validator => validator.getAddress() == result)
                    .getIdentityName()
            }
        );
    });
    console.log(pretty_output);
}

async function mergeFinalArray(winners: ValidatorScore[], runners_up: ValidatorScore[]):Promise<string[]> {
    var results: string[] = [];
    results = results.concat(await filterPartners())
        .concat(winners.slice(0, Settings.max_nominations - Settings.partners.length - 1)
            .map(validator => validator.val_address)
        );
    results = results.concat(runners_up.slice(0, Settings.max_nominations - results.length)
        .map(validator => validator.val_address)
    );

    return results;
}

function showDebugInfo(winners: ValidatorScore[], runners_up: ValidatorScore[]) {
    if (Settings.debug) {
        Utility.Logger.debug("Winners");
        console.log(winners);
        Utility.Logger.debug("Runners up");
        console.log(runners_up);
    }
}

async function filterPartners(): Promise<string[]> {
    let nomination_data = NominationData.getInstance();

    var filtered_partners: string[] = [];
    for (var i = 0; i < Settings.partners.length; i++) {
        const isblocked = await nomination_data.isBlocked(Settings.partners[i]);
        const isValidator = await nomination_data.isValidator(Settings.partners[i]);

        if (isblocked) {
            Utility.Logger.warn(`Partner ${Settings.partners[i]} has nominations blocked, skipping.`);
        }
        if (!isValidator) {
            Utility.Logger.warn(`Partner ${Settings.partners[i]} is not a validator, skipping.`);
        }
        
        if (isValidator && !isblocked) {
            filtered_partners.push(Settings.partners[i]);
        }

    };

    return filtered_partners;
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

async function getChainPrefix(api: ApiPromise) {
    const chainInfo = await api.registry.getChainProperties()
    var result = "0";

    if (chainInfo != null) {
        result = chainInfo.ss58Format.toString();
    }
    return parseInt(result);
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
