import { Nominator } from "./Nominator";
import { Validator } from "./Validator";
import { ChainData } from "./ChainData";
import { Settings } from './Settings';
import { ValidatorIdentity } from "./Types";
import { PalletStakingEraRewardPoints } from "@polkadot/types/lookup";
import { validators } from "@polkadot/api-derive/staking";
export class NominationData {

    private static instance: NominationData;
    public validators: Validator[];

    private constructor() {
        this.validators = [];
    }

    public static getInstance(): NominationData {
        if (!NominationData.instance) {
            NominationData.instance = new NominationData();
        }

        return NominationData.instance;
    }

    public async addNominatorToValidator(nom_address: string, val_address: string) {

        var val_index = this.validators.findIndex(validator => validator.getAddress() == val_address);

        var nominator: Nominator = <Nominator>{};

        await this.getBondedAmount(nom_address).then(bonded_amount => {
            nominator = new Nominator(nom_address);
            nominator.setBondedAmount(bonded_amount);
        });

        if (val_index > -1) {
            this.validators[val_index].addNominator(nominator);
        }

    }

    public async loadNominationData(candidates: string[]) {
        let chain_data = ChainData.getInstance();
        let nomination_data = NominationData.getInstance();

        const nomination_entries = [];
        const api = chain_data.getApi();

        if (api == undefined)
            return;

        const nominations = await api.query.staking.nominators.entries();

        for (let [nom_address, validators] of nominations) {
            var nominator = nom_address!.toHuman()!.toString();

            //If the nominator is in the exceptions list don't count it
            if (Settings.exempt_nominators.indexOf(nominator) < 0) {
                for (var i = 0; i < validators.unwrapOrDefault().targets.length; i++) {
                    const validator = validators.unwrapOrDefault().targets[i].toHuman();

                    if (candidates.indexOf(validator) > -1)
                        nomination_entries.push(nomination_data.addNominatorToValidator(nominator, validator));

                }
            }

        }

        await Promise.all(nomination_entries);
    }

    public async addValidator(val_address: string) {
        var validator: Validator;
        try {
            const bonded_amount = await this.getBondedAmount(val_address);
            const val_identity = await this.getFormattedIdentity(val_address);
            const commission = await this.getCommission(val_address);


            validator = new Validator(val_address);

            validator.setBondedAmount(bonded_amount);
            validator.setIdentity(val_identity);
            validator.setCommission(commission);


            this.validators.push(validator);
        } catch {
            console.log(`Error when creating validator - ${val_address}`);
        };
    }

    public async getBondedAmount(stash: string): Promise<number> {
        let chain_data = ChainData.getInstance();
        const api = chain_data.getApi();

        if (api == undefined) return -1;

        const controller = await api.query.staking.bonded(stash);

        const ledger = await (await api.query.staking.ledger(controller.toString())).unwrapOrDefault();
        if (ledger.active) {
            var bonded_amount = parseFloat(ledger.active.toString()) / Settings.bond_divider;
            return bonded_amount;
        }

        return 0.0;
    }

    // Gets the commission for a given validator in a percent format
    private async getCommission(validator: string): Promise<number> {
        let chain_data = ChainData.getInstance();
        const api = chain_data.getApi();

        if (api == undefined) return -1;

        const prefs = await api.query.staking.validators(validator);

        if (prefs.commission.toNumber() < 1000) {
            return 0;
        } else {
            return (prefs.commission.toNumber() / Settings.commission_divider) * 100.0;
        }

    }

    //The functions below were adopted or adapted from the 1KV backend
    //Thanks Will!
    public async loadAverageEraPoints() {
        let chain_data = ChainData.getInstance();
        const api = chain_data.getApi();

        if (api == undefined) return;

        var validator_stashes = this.validators.map(validator => validator.getAddress());

        var currentEra = await chain_data.getCurrentEra();
        currentEra = currentEra == undefined ? 0 : currentEra;


        for (var i = Settings.era_points_range; i > 0; i--) {

            let erasRewardPoints: PalletStakingEraRewardPoints = await api.query.staking.erasRewardPoints(currentEra - i);

            for (let [address, value] of erasRewardPoints.individual.entries()) {

                if (validator_stashes.indexOf(address.toHuman()) > -1) {
                    //console.log(`${address.toHuman()} ${value}`);
                    const validator_index = this.validators.findIndex(validator => validator.getAddress() == address.toHuman());

                    if (validator_index > -1) {
                        this.validators[validator_index].addEraPoints(parseInt(value.toString()));
                    }
                }
            }
        }
    }

    /*
        This method was left mostly as-is from the 1KV backend. 
        TODO: Try to remove dependency on hex2a function, possible use of toHuman()
    */
    public async getFormattedIdentity(addr: string): Promise<ValidatorIdentity> {
        let chain_data = ChainData.getInstance();
        const api = chain_data.getApi();

        if (api == undefined) return <ValidatorIdentity>{};


        let identity, verified, sub;
        identity = await api.query.identity.identityOf(addr);
        if (!identity.isSome) {
            identity = await api.query.identity.superOf(addr);
            if (!identity.isSome) return { name: addr, is_verified: false, sub_identity: null };

            const subRaw = identity.unwrap()[1].toHex();

            if (subRaw && subRaw.substring(0, 2) === "0x") {
                sub = this.hex2a(subRaw.substring(2));
            } else {
                sub = subRaw;
            }
            const superAddress = identity.unwrap()[0].toHex();
            identity = await api.query.identity.identityOf(superAddress);
        }

        const raw = identity.unwrap().info.display.toHex();
        const { judgements } = identity.unwrap();
        for (const judgement of judgements) {
            const status = judgement[1];
            if (status.isReasonable || status.isKnownGood) {
                verified = status.isReasonable || status.isKnownGood;
                continue;
            }
        }

        if (raw && raw.substring(0, 2) === "0x") {
            return { name: this.hex2a(raw.substring(2)), is_verified: verified, sub_identity: sub };
        } else return { name: raw, is_verified: verified, sub_identity: sub };
    };

    private hex2a(hex: string): string {
        return decodeURIComponent("%" + hex.match(/.{1,2}/g)!.join("%"));
    }

    //Gets the max of the average self stake
    public getMaxSelfStake(): number {
        var bond_array = this.validators.map(validator => validator.getBondedAmount());
        bond_array = bond_array.sort((x, y) => x - y);
   
        var low = Math.round(bond_array.length * Settings.remove_outliers);
        var high = bond_array.length - low;
        
        return bond_array.slice(low, high).reduce((x, y) => x > y ? x : y);


    }

    //Gets the maximum of the average era points
    public getMaxEraPoints(): number {
        const era_point_array = this.validators.map(validator => validator.getAverageEraPoints());
        return era_point_array.reduce((x, y) => x > y ? x : y);
    }

    //Get the maximum validator bond
    public getAvergaeNominatorBond(): number {
        const nominator_bond = this.validators.map(validator => validator.getNominations());
        return nominator_bond.reduce((x, y) => x + y) / nominator_bond.length;
    }

    public getStandardDeviation() {
        const n = this.validators.length;
        const array = this.validators.map(validator => validator.getNominations());
        const mean = this.getAvergaeNominatorBond();
        return Math.sqrt(array.map(x => Math.pow(x - mean, 2)).reduce((x, y) => x + y) / n)
    }
}