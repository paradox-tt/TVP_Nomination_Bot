import { NominationData } from "./NominationData";
import { Nominator } from "./Nominator";
import { Settings } from "./Settings";
import { ValidatorIdentity } from "./Types";


export class Validator {

    private nominators: Nominator[]; //Stores nominator objects
    private val_address: string; //The chain prefix applied address for the validator
    private bonded_amount: number;//self stake
    private val_identity: ValidatorIdentity; //Identity object
    private era_points: number[];//An era point entry for each era validated
    private commission: number;//Commission 1-100
    private isBlocked: boolean;//Has the validator blocked nominations
    private isValidator: boolean;//Does the stash have the validator intent

    public constructor(val_address: string) {
        this.val_address = val_address;
        this.nominators = [];
        this.val_identity = <ValidatorIdentity>{};
        this.bonded_amount = -1;
        this.isBlocked = true;
        this.isValidator = false;

        this.era_points = [];
        this.commission = 100;
    }

    public addNominator(nominator: Nominator) {
        this.nominators.push(nominator);
    }

    public addEraPoints(era_points: number) {
        this.era_points.push(era_points);
    }

    public getAddress() {
        return this.val_address;
    }

    public getBondedAmount(): number {
        return this.bonded_amount;
    }

    public getParentIdentity() {
        return this.val_identity.name;
    }

    public getIntent() {
        return this.isValidator;
    }

    public getBlockedNominations() {
        return this.isBlocked;
    }

    /*  Retrieves the name of the validator in Primary\Sub format
        If there isn't a sub just display the primary
    */
    public getIdentityName() {
        if (this.val_identity.sub_identity == undefined) {
            return this.val_identity.name.trim();
        } else {
            return `${this.val_identity.name.trim()}\\${this.val_identity.sub_identity.trim()}`;
        }
    }

    public getEraPoints() {
        return this.era_points;
    }

    //Sum era points, then divide by the total number of entries
    public getAverageEraPoints() {
        if (this.era_points.length == 0)
            return 0;
        else
            return this.era_points.reduce((x, y) => x + y, 0) / this.era_points.length;
    }

    //If you generated era points then you validated
    public getNumberErasValidated() {
        return this.era_points.length;
    }

    public getCommission() {
        return this.commission;
    }

    //Gets the sum of all nominator bonds
    public getNominations(): number {
        var result = 0.0;

        this.nominators.forEach(nominator => {
            result += nominator.getBondedAmount();
        });

        return result;
    }

    /* SCORING SECTION
       The following functions aid with establishing a score for each validator
    */


    private getSelfStakeScore(): number {
        const max_self_stake = NominationData.getInstance().getMaxSelfStake();

        var result = (this.getBondedAmount() / max_self_stake) * Settings.w_self_stake;

        result = result > Settings.w_self_stake ? Settings.w_self_stake : result;

        if (Settings.debug) {
            console.log(`${this.getIdentityName()} - Self Stake - (${this.getBondedAmount()}) Max - (${max_self_stake}) Result - [${result}]`);
        }

        return result;
    }

    private getEraPointsScore(): number {
        const max_era_points = NominationData.getInstance().getMaxEraPoints();

        const result = (this.getAverageEraPoints() / max_era_points) * Settings.w_era_points;

        if (Settings.debug) {
            console.log(`${this.getIdentityName()} - Average Era Points - (${this.getAverageEraPoints()}) Max - (${max_era_points}) Result - [${result}]`);
        }

        return result;
    }

    private getNominationScore(): number {
        const nominator_data = NominationData.getInstance();

        const mean = nominator_data.getAvergaeNominatorBond();
        const sd = nominator_data.getStandardDeviation();

        const val_sd = Math.abs((this.getNominations() - mean) / sd);
        var result = ((Settings.std_dev_reward - val_sd) / Settings.std_dev_reward) * Settings.w_nominations;
        result = result < 0 ? 0 : result;

        if (Settings.debug) {
            console.log(`${this.getIdentityName()} - Nominations - (${this.getNominations()}) Std Dev - (${val_sd}) Result - [${result}]`);
        }

        return result;
    }

    private getCommissionScore(): number {

        var commission = this.getCommission() <= Settings.min_commission ? Settings.min_commission : this.getCommission();

        const result = (1 - (commission / (Settings.max_commission - Settings.min_commission))) * Settings.w_commission;

        if (Settings.debug) {
            console.log(`${this.getIdentityName()} - Actual Commssion - (${this.getCommission()})  Adjusted Commission - (${commission}) Max - (${Settings.max_commission}) Result - [${result}]`);
        }

        return result;
    }

    private getNumErasValidationScore(): number {

        var number_eras_active = this.getNumberErasValidated() <= Settings.validation_eras ? Settings.validation_eras : this.getNumberErasValidated();

        var result = 0;
        if (number_eras_active >= Settings.validation_eras) {
            result = Settings.w_validation_eras;
        } else {
            result = (number_eras_active / Settings.validation_eras) * Settings.w_validation_eras;
        }

        if (Settings.debug) {
            console.log(`${this.getIdentityName()} - Number of Eras active - (${number_eras_active})  Target - (${Settings.w_validation_eras}) Result - [${result}]`);
        }

        return result;
    }

    public getValidatorScore() {
        return this.getSelfStakeScore() +
            this.getEraPointsScore() +
            this.getCommissionScore() +
            this.getNominationScore() +
            this.getNumErasValidationScore();
    }

    // Basic Mutators
    public setIntention(intent: boolean) {
        this.isValidator = intent;
    }

    public setBlocked(blocked: boolean) {
        this.isBlocked = blocked;
    }

    public setBondedAmount(bonded_ammount: number) {
        this.bonded_amount = bonded_ammount;
    }

    public setIdentity(val_identity: ValidatorIdentity) {
        this.val_identity = val_identity;
    }

    public setCommission(commission: number) {
        this.commission = commission;
    }

}