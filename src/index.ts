import nodeCache from 'node-cache';
import { EventData } from 'web3-eth-contract';

import { erc721TransferEventAbi } from './constants/abis';
import { handleTxn } from './handler';
import { sendDiscordWebHookNotify } from './notifiers/discord';
import { sendTwitterBotNotify } from './notifiers/twitter';
import { web3 } from './utils/web3';

const cache = new nodeCache();

const contract = new web3.eth.Contract([erc721TransferEventAbi], '0x9401518f4ebba857baa879d9f76e1cc8b31ed197');

// start event listening
contract.events
  .Transfer({}, async (error: any, event: EventData) => {
    if (error) {
      // eslint-disable-next-line no-console
      console.error('Callback Error: \n', error);
      return;
    }

    try {
      const incomingTxn = event.transactionHash;
      if (cache.get(incomingTxn)) {
        return;
      } else {
        cache.set(incomingTxn, true, 3600);
      }
      const order = await handleTxn(incomingTxn);
      if (order) {
        sendDiscordWebHookNotify(order);
        sendTwitterBotNotify(order);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`Event Handling Error with Txn ${event.transactionHash}: \n`, error);
    }
  })
  .on('connected', () => {
    // eslint-disable-next-line no-console
    console.log('event listening started');
  });
