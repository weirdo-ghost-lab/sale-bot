import AsyncRetry from 'async-retry';

import { erc721TransferEventHash, openSeaOrderMatchEventAbi, openSeaOrderMatchEventHash } from './constants/abis';
import { Order } from './typings';
import { web3 } from './utils/web3';

export const handleTxn = async (txnHash: string): Promise<Order | null> => {
  const receipt = await AsyncRetry(
    async () => {
      // type is wrong as it sometimes return null
      const resp = await web3.eth.getTransactionReceipt(txnHash);
      if (!resp) {
        throw Error('null returned');
      }
      return resp;
    },
    {
      retries: 3,
      minTimeout: 3000,
      maxTimeout: 5000,
      onRetry: (_, t) => {
        // eslint-disable-next-line no-console
        console.log(`Retrying ${t} getTransactionReceipt with ${txnHash}`);
      },
    },
  );
  const transferLogs = receipt.logs.filter((l) => l.topics[0] === erc721TransferEventHash && l.address.toLowerCase() === '0x9401518f4ebba857baa879d9f76e1cc8b31ed197');
  const osOrderMatchLogs = receipt.logs.filter((l) => l.topics[0] === openSeaOrderMatchEventHash);

  // dedup as some sweep contract will transfer same token for twice.
  const tokenIds = [...new Set(transferLogs.map((l) => l.topics[3]))];

  // Single token Sale
  if (tokenIds.length === 1) {
    const tokenId = tokenIds[0];

    // Sold on Opensea
    if (osOrderMatchLogs.length === 1) {
      const data = web3.eth.abi.decodeLog(openSeaOrderMatchEventAbi.inputs || [], osOrderMatchLogs[0].data, osOrderMatchLogs[0].topics.slice(1));
      if (data['buyHash'] && Number(data['buyHash'])) {
        // accept offer
        return {
          type: 'single',
          buyerAddress: data['maker'],
          sellerAddress: data['taker'],
          tokenId: tokenId,
          valueGwei: data['price'],
          form: 'accept',
        };
      } else {
        // buy from list
        return {
          type: 'single',
          buyerAddress: data['taker'],
          sellerAddress: data['maker'],
          tokenId: tokenId,
          valueGwei: data['price'],
          form: 'buy',
        };
      }
    }
    // unknown Marketplace, use txn value
    else {
      const txnDetail = await web3.eth.getTransaction(txnHash);
      if (Number(txnDetail.value) !== 0 && txnDetail.to !== null && Number(txnDetail.to) !== 0) {
        return {
          type: 'single',
          buyerAddress: txnDetail.from,
          sellerAddress: txnDetail.to,
          tokenId: tokenId,
          valueGwei: txnDetail.value,
          form: 'buy',
        };
      }
    }
  }
  // Multiple token Sale
  else if (tokenIds.length > 1) {
    // TODO: this is wrong, need fix
    const sellerAdds = transferLogs.map((l) => l.topics[1]);
    const txnDetail = await web3.eth.getTransaction(txnHash);
    if (Number(txnDetail.value) !== 0 && txnDetail.to !== null && Number(txnDetail.to) !== 0) {
      return {
        type: 'multiple',
        buyerAddress: txnDetail.from,
        sellerAddress: sellerAdds,
        tokenId: tokenIds,
        valueGwei: txnDetail.value,
        form: 'buy',
      };
    }
  }

  return null;
};
