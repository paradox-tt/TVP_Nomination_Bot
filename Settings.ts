export class Settings {
    
    /*
        ws_provider, seed_phrase and derviation_path will be loaded from the secret file
        any modifications will be overwritten
        
    */
    static ws_provider = '';

    static seed_phrase = '';

    static derivation_path = -1;

    static secret_file = 'hidden_file';
    //Shows additional information
    static debug = false;

    static retry_time = 10*60*1000;

    //When calculating a score for nominations, scores will be give up to X std
    static std_dev_reward = 1;

    //When calculating self-stake the following fraction of stake would be removed 
    static remove_outliers = 0.05;

    //If a validator has > the threshold they would be placed in the runners up list
    //as they can independently enter the active set
    static nomination_threshold = 20000;

    static min_commission = 0.0;

    static max_commission = 2.0;

    static session_to_change = 4;

    static era_to_rotate = 3;

    static max_nominations = 24;

    static max_nodes_per_validator = 2;

    //Look back at era points gained in the last x eras
    static era_points_range = 120;

    //Validator must have validated for y eras, 
    //NOTE: this must be <= era_points_range
    static validation_eras = 30;

    static bond_divider = 1000000000000;

    static commission_divider = 1000000000;

    static exempt_nominators = [
        "HTAeD1dokCVs9MwnC1q9s2a7d2kQ52TAjrxE1y5mj5MFLLA", //LSM Stash
        "G1rrUNQSk7CjjEmLSGcpNu72tVtyzbWdUvgmSer9eBitXWf", //TVP Stash
        "HgTtJusFEn2gmMmB5wmJDnMRXKD6dzqCpNR7a99kkQ7BNvX", //TVP Stash
        "EX9uchmfeSqKTM7cMMg8DkH49XV8i4R7a7rqCn8btpZBHDP"  //TVP Stash
    ];

    //These validators will always be nominated
    static partners=["DaBhcS7G5XKC5YkBnPiTuMqx6rSLYs3LMR8fbHtsMY6EuF7"];

    //Some of these validators will be nominated, 
    //It is recommended to maintain this list with a minimum of 16-18 validators.
    static preferred_candidates = [
        "CczSz9z41uHpftVviWz91TgjLe3SmbvXfbAc958cjy7F6Qs",  //Nodeasy
        "Cg5jUiVZRNNrxPhViNC6kQZC88iQcxgxseSuXUJdqAkQmBL",  //Ryabina
        "CsKvJ4fdesaRALc5swo5iknFDpop7YUwKPJHdmUvBsUcMGb",  //Polkachu
        "D8jYsDb2bQhhtzmwAswUuw85UtqNSc7SoTm4ddaMXDR9hEt",  //Ryabina
        "DB2mp5nNhbFN86J9hxoAog8JALMhDXgwvWMxrRMLNUFMEY4",  //Jaco
        "DMYLmrFzzxqqhQwKjiq9yycvGMXTKfA9Jo1go1mfT4R7Xrb",  //P2P
        "DQX3arNph8UXAALhLM6vj4a4B5E68vYaLDh9Up9gsz1h4HE",  //P2P
        "DSbhnaGBytDGRfZTmdcArzCL6T3HQ8gcZxWpF5gLBP6y1Qe",  //Wei
        "DzSj1Z9PoqM6shYfgn3FTVpavhxF9Jo25kmgGU3NGGfo7qY",  //P2P
        "E2pSzVjX9RktXQRcR2DpMGQMf6bFCMhUnY3zRiR18RmdD8N",  //Jaco
        "EsNZHmG4bQMGzQNK4Z2CR7Hdhu4or7p2vsLRChUEJcjJAeU",  //ParaNodes
        "EUuSLp7BySaabH535hYk9qc23Cvu5MkkUDauCn9JHcA31Fw",  //Jaco
        "FkWky3r2bryP3aaAwVWykYrKesAwkDyKZWsDyBvck7YawSi",  //ParaNodes
        "G7qfizahfCsNwnwFEwFjsWEjq4gTSMaBQZaMSdRpsfgfYJa",  //Jaco 
        "G7Ur4BnMSfP2qE7ruSob5gwGQ5nzkGWu7Yqh14FcMqnDtgB",  //Stake.Zone
        "GcwN2PeqKC1acwATPiwWDHWxdrDewa1fBWTFrCziF4d37aT",  //KeepNode
        "GLv5F6mqjBHUhDybhS6avcmn2bNotiAQbstz64Ra3uVnBHu",  //Jaco
        "GpyTMuLmG3ADWRxhZpHQh5rqMgNpFoNUyxA1DJAXfvsQ2Ly",  //Polkachu
        "GZTCN6mH74Wvr6KnqF2pDiJmE1xjPuATdeKo4YAuf4yY3AE",  //P2P
        "Hc74U7YkArgkq9GjNyzeD5KiBMawm9py3QqAt1jHDbYmJ1V",  //Jaco
        "HsxGLNhJabLdnCpY2gQzfevq5BiiMn4dvEj6r6Z1xggq3nJ",  //P2P
        "J4GLk8QZktKt7wBN2KHzgkexPXHsVjAr2VHRXeSuPjLvPsi",  //DotScanner
        "J9gdi88VAa8hbXQ67DxMMDt5medNCPpZyAk3behE7iKATuT"   //KeepNode
    ]

    /*
        WEIGHTS!!
    */
   //Weights related to reduce risk     
   static w_self_stake = 10;
   static w_validation_eras = 10;
   
   //Weights related to profit
   static w_commission = 15;
   static w_era_points = 15;
   
   //Prefer validators with stake closer to the mean
   static w_nominations = 25;

   
   



}