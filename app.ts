import { ApiPromise, WsProvider } from '@polkadot/api';
import { Settings } from './Settings';
import { Messaging } from './Messaging';
import { MonitoredData } from './MonitoredData';
import { encodeAddress } from '@polkadot/util-crypto';
import { Utility } from "./Utility";
import { ChainData } from './ChainData';
import { Nomination } from './Types';


/*
  Monitors for a proxy(announce) event, if it occurs then display a message
*/
async function monitorProxyAnnoucements() {

  let monitor = MonitoredData.getInstance();
  let chain_data = ChainData.getInstance();

  const prefix = chain_data.getPrefix();

  //In the unlikely event that API is undefined then exit by return;
  const api = chain_data.getApi();
  if (api == undefined) {
    return;
  }

  Messaging.sendMessage('Loading possible proxy assignments..');
  //Preloads possible candidates
  Settings.tvp_nominators.forEach(nominator_account => {
    Utility.getProxyNominees(nominator_account.controller).then(proxy_data => {
      monitor.addProxyCall({
        nominator: nominator_account.controller,
        proxy_info: proxy_data
      });
    });
  });

  Messaging.sendMessage('Waiting for proxy event..');

  api.query.system.events((events) => {

    events.forEach((record) => {
      // Extract the phase, event and the event types
      const { event } = record;
      // If the event is a proxy(annouce)
      if (api.events.proxy.Announced.is(event)) {
        //Get the public key from data[0] and then convert to the chain address
        const nominator_account = encodeAddress(event.data[0], prefix);

        //If the nominator_account is one of the 1KV nominator accounts then
        if (Settings.tvp_nominators
          .find(nominator => nominator.controller == nominator_account)) {

          //Retrieve the nominees from the an external source
          Utility.getProxyNominees(nominator_account).then(proxy_data => {
            //Adds the proxy call to the monitor singleton which also initates the message
            monitor.addProxyCall({
              nominator: nominator_account,
              proxy_info: proxy_data
            });
          });
        }
      }
    });
  });

}

/*
  Monitors for a session change event, if the session changes is also and era change
  then display current nominations, strikingthrough any who are no longer nominated,
  also increment number of eras that each retained validator is nominating for.
*/
async function monitorEraChange() {

  Messaging.sendMessage('Loading current nominations..');

  let chain_data = ChainData.getInstance();
  let monitor = MonitoredData.getInstance();

  //In the unlikely event that API is undefined then return;
  const api = chain_data.getApi();
  if (api == undefined) {
    return;
  }

  //Preload nominations on startup
  chain_data.getCurrentEra().then(era => {

    monitor.setEra(era);
    //Add to the nominations which will also send a message
    Settings.tvp_nominators.forEach(nominator => {
      Utility.getValidatorNominations(nominator.stash).then(nomination_data => {
        
        //Updates the previous nomination count for each nominee
        updateNominationData(nomination_data).then(u_nomination_data=>{
          monitor.addNomination(u_nomination_data);
        });
        
      });
    });

  });

  //Start monitoring new session events
  
  Messaging.sendMessage('Waiting for new session event..');

  api.query.system.events((events) => {

    events.forEach((record) => {
      // Extract the phase, event and the event types
      const { event } = record;
      // If the event is a new session event then
      if (api.events.session.NewSession.is(event)) {

        //retrieve the session
        const current_session = (parseInt(event.data[0].toString()) % 6) + 1;

        if (current_session == 1) {

          //Retrieve the current era
          chain_data.getCurrentEra().then(era => {
            monitor.setEra(era);

            //Add the nominations to the monitor, which also sends a message to the channel 
            Settings.tvp_nominators.forEach(nominator => {
              Utility.getValidatorNominations(nominator.stash).then(nomination_data => {
                monitor.addNomination(nomination_data);
              });
            });

          });
        }
      }
    });
  });
}

/* 
  This will be used to populate correct 'previous' nomination counts for nominees on first load
  of the bot, for now do nothing.

  TODO: Read chain data to populate previous nominations
*/
async function updateNominationData(nominationData:Nomination):Promise<Nomination> {
    /*var previous_nominations = await Utility.getPreviousNominations();
    previous_nominations = previous_nominations.filter(item=>item.address==nominationData.nominator);

    var result:Nomination = {
      nominator:nominationData.nominator,
      era:nominationData.era,
      nominees:[]
    }*/ 
    return nominationData;
}

/*
    The following method monitors block numbers, if the block number is at the anticipated block number
    of a proxy call, then send a message to expect a change in the next era.

    In the future this would be expanded to anticipate proxy(announce) calls, if it isn't retrieved in
    24+lag hours then send a message that something might be wrong.
*/
async function monitorProxyChanges() {
  let monitor = MonitoredData.getInstance();
  let chain_data = ChainData.getInstance();

  const api = chain_data.getApi();
  if (api == undefined) {
    return;
  }

  await api.rpc.chain.subscribeNewHeads((header) => {

    var block_number: number = parseInt(header.number.unwrap().toString());
    var proxy_data = monitor.hasProxyCall(block_number);

    if (proxy_data.nominator != undefined) {

      var tvp_nominator = Settings.tvp_nominators.find(nominator => nominator.controller == proxy_data.nominator);
      var stash = tvp_nominator != undefined ? tvp_nominator.stash : "unknown";

      Messaging.sendMessage(`Proxy call for ${stash}  was executed, changes should be seen in the next era.`);
      /*

      The code below was used to compare the proxy call to present nomination data it was considered not relevant as the next era this information is shown.
      It would be left for future development

      if(proxy_data.proxy_info!=undefined)
        //Messaging.sendMessage(`Proxy call for ${proxy_data.nominator} should be executed at ${proxy_data.proxy_info.number}`);

        var nomination_data:Nomination;
        nomination_data= monitor.getNominations(proxy_data.nominator);
        
        if(nomination_data){

           if(nomination_data.nominees){
          
            var nominees = nomination_data.nominees.map(nominee=>nominee.val_address);
            
            var proxy_nominations:string[] = proxy_data.proxy_info.targets;

              if(proxy_nominations!=undefined){
                var difference = nominees.filter(nominee=>proxy_nominations?.indexOf(nominee)<0);
                
                if(difference!=undefined){
                  var percentage_change = (((difference.length*1.0)/(proxy_nominations.length*1.0))*100.00);
                  percentage_change = 100.00 - percentage_change;
                  


                  //Messaging.sendMessage(`Proxy call for ${proxy_data.nominator} should be executed.</br> The change is a ${percentage_change.toFixed(2)}% match.`);   
                                 
                }

              }
           }
        }*/
    }
  });

}

/*
  The main function loads variables from an external text file, as a matter of confirmation,
  the loaded settings are sent to the console.  

  An Api Promise is created and used to initialise the chain data singleton.  

  Three async methods are then executed.

  Monitor Proxy Announcements - This monitors for the proxy(announce) event and invokes an external
                                undisclosed API for nomination data.

  Monitor Era Change          - This method keeps track of changes of nominations for each nominator account
                                changes are represented by strikethroughs and an era count is kept.

  Monitor Proxy Changes       - This method anticipates when the proxy(announcement) is called and posts a
                                message that alerts users to expect a change in nominations within the next era.

                                It was intentionally designed to avoid monitoring of an on-chain event as these events
                                might fail or never occur.
*/

async function main() {

  await Utility.loadVariables();
  console.log(Settings);
  const api = await ApiPromise.create({ provider: new WsProvider(Settings.provider) });

  await Utility.initalizeChainData(api).then(x => {
    monitorProxyAnnoucements();
    monitorEraChange();
    monitorProxyChanges();
  });

}


main();
