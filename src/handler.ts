import { erc721TransferEventHash, openSeaOrderMatchEventAbi, openSeaOrderMatchEventHash } from './constants/abis';
import { Order } from './typings';
import { web3 } from './utils/web3';

export const handleTxn = async (txnHash: string): Promise<Order | null> => {
  const receipt = await web3.eth.getTransactionReceipt(txnHash);
  const transferLogs = receipt.logs.filter((l) => l.topics[0] === erc721TransferEventHash && l.address.toLowerCase() === '0x9401518f4ebba857baa879d9f76e1cc8b31ed197');
  const osOrderMatchLogs = receipt.logs.filter((l) => l.topics[0] === openSeaOrderMatchEventHash);

  // Single token Sale
  if (transferLogs.length === 1) {
    const tokenId = transferLogs[0].topics[3];

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
          buyerAddress: txnDetail.to,
          sellerAddress: txnDetail.from,
          tokenId: tokenId,
          valueGwei: txnDetail.value,
          form: 'buy',
        };
      }
    }
  }
  // Multiple token Sale
  else if (transferLogs.length > 1) {
    // dedup as some sweep contract will transfer same token for twice.
    const tokenIds = [...new Set(transferLogs.map((l) => l.topics[3]))];
    const sellerAdds = transferLogs.map((l) => l.topics[1]);
    const txnDetail = await web3.eth.getTransaction(txnHash);
    if (Number(txnDetail.value) !== 0 && txnDetail.to !== null && Number(txnDetail.to) !== 0) {
      return {
        type: 'multiple',
        buyerAddress: txnDetail.to,
        sellerAddress: sellerAdds,
        tokenId: tokenIds,
        valueGwei: txnDetail.value,
        form: 'buy',
      };
    }
  }

  return null;
};
