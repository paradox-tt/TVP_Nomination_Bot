export class Nominator{

    private nom_address:string;
    private bonded_amount:number;

    public constructor(nom_address:string){
        this.bonded_amount=-1;
        this.nom_address=nom_address;
    }

    public getAddress(){
        return this.nom_address;
    }

    public getBondedAmount(){
        return this.bonded_amount;
    }

    public setBondedAmount(bonded_ammount:number){
        this.bonded_amount = bonded_ammount;
    }

}