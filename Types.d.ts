export interface TVP_Account {
    proxy:string;
    controller:string;
    stash:string;
    value:number;
}

export interface TVP_Candidate {
    discoveredAt: number;
    nominatedAt: number;
    offlineSince: number;
    offlineAccumulated: number;
    rank: number;
    faults: number;
    invalidityReasons: string;
    unclaimedEras: number[];
    inclusion: number;
    name: string;
    stash: string;
    kusamaStash: string;
    commission: number;
    identity?: Identity | null;
    active?: boolean | null;
    valid?: boolean | null;
    validity?: (ValidityEntity | null)[] | null;
    score?: Score | null;
    total: number;
  }

  export interface Identity {
    name: string;
    sub?: string | null;
    verified?: boolean | null;
    _id: string;
  }

  export interface ValidityEntity {
    valid: boolean;
    type: string;
    details: string;
    updated: number;
    _id: string;
  }

  export interface Score {
    _id: string;
    address: string;
    updated: number;
    total: number;
    aggregate: number;
    inclusion: number;
    spanInclusion: number;
    discovered: number;
    nominated: number;
    rank: number;
    unclaimed: number;
    bonded: number;
    faults: number;
    offline: number;
    randomness: number;
    __v: number;
  }

  export interface ValidatorIdentity{
      name: string;
      is_verified: boolean;
      sub_identity: string;
  }

  export interface ValidatorScore{
    val_address: string; 
    name:string; 
    parent:string;
    score:number;
  }