import { ApiPromise } from '@polkadot/api';

export class ChainData {
    private static instance: ChainData;
    private chain:string;
    private prefix:number;
    private era:number;
    private api:ApiPromise|undefined;

    private constructor() { 
        this.prefix=-1;
        this.chain="";
        this.era=-1;
        this.api = undefined;
    }

    public static getInstance(): ChainData {
        if (!ChainData.instance) {
            ChainData.instance = new ChainData();
        }

        return ChainData.instance;
    }

    public setPrefix(prefix:number){
        if(prefix==2){
            this.prefix = prefix;
            this.chain = "kusama";
        }else{
            this.prefix = 0;
            this.chain = "polkadot";
        }
    }

    public setEra(era:number){
        this.era=era;
    }

    public getPrefix(){
        return this.prefix;
    }

    public getChain(){
        return this.chain;
    }

    public getEra(){
        return this.era;
    }

    public setApi(api:ApiPromise){
        this.api = api;
    }

    public getApi(){
        
        return this.api;
    }
    // Gets the curent era
    public async getCurrentEra(){
        let chain_data = ChainData.getInstance();
        const api = chain_data.getApi();
        
        if(api==undefined)
            return;

        const currentEra = await api.query.staking.currentEra();
        return Number(currentEra);
    };
}