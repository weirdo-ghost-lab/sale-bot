import { AbiItem } from 'web3-utils';

import { web3 } from '../utils/web3';

export const erc721TransferEventAbi: AbiItem = {
  anonymous: false,
  inputs: [
    {
      indexed: true,
      internalType: 'address',
      name: 'from',
      type: 'address',
    },
    {
      indexed: true,
      internalType: 'address',
      name: 'to',
      type: 'address',
    },
    {
      indexed: true,
      internalType: 'uint256',
      name: 'tokenId',
      type: 'uint256',
    },
  ],
  name: 'Transfer',
  type: 'event',
};
export const erc721TransferEventHash = web3.eth.abi.encodeEventSignature(erc721TransferEventAbi);

export const openSeaOrderMatchEventAbi: AbiItem = {
  anonymous: false,
  inputs: [
    {
      indexed: false,
      name: 'buyHash',
      type: 'bytes32',
    },
    {
      indexed: false,
      name: 'sellHash',
      type: 'bytes32',
    },
    {
      indexed: true,
      name: 'maker',
      type: 'address',
    },
    {
      indexed: true,
      name: 'taker',
      type: 'address',
    },
    {
      indexed: false,
      name: 'price',
      type: 'uint256',
    },
    {
      indexed: true,
      name: 'metadata',
      type: 'bytes32',
    },
  ],
  name: 'OrdersMatched',
  type: 'event',
};
export const openSeaOrderMatchEventHash = web3.eth.abi.encodeEventSignature(openSeaOrderMatchEventAbi);
