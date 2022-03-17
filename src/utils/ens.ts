import { toUnicode } from 'idna-uts46-hx';
import nodeCache from 'node-cache';
import { AbiItem } from 'web3-utils';

import { web3 } from './web3';

// constants
const ensReverseRecordsAddress_mainnet = '0x3671aE578E63FdF66ad4F3E12CC0c0d71Ac7510C';
const ensReverseRecordsAbi: AbiItem[] = [
  { inputs: [{ internalType: 'contract ENS', name: '_ens', type: 'address' }], stateMutability: 'nonpayable', type: 'constructor' },
  {
    inputs: [{ internalType: 'address[]', name: 'addresses', type: 'address[]' }],
    name: 'getNames',
    outputs: [{ internalType: 'string[]', name: 'r', type: 'string[]' }],
    stateMutability: 'view',
    type: 'function',
  },
];

// runtime instances
const cache = new nodeCache({
  stdTTL: 3600,
});
const ensReverseRecordsContract = new web3.eth.Contract(ensReverseRecordsAbi, ensReverseRecordsAddress_mainnet);

function normalize(name: string) {
  return name ? toUnicode(name, { useStd3ASCII: true }) : name;
}

const _resolveMultiAddressEns = async (adds: string[]) => {
  try {
    const allNames: string[] = await ensReverseRecordsContract.methods.getNames(adds).call();
    return allNames.map((n) => (normalize(n) === n ? n : ''));
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    return Array.from({ length: adds.length }, () => '');
  }
};

/**
 * resolve an array of eth address to its ens.
 * if an address has no ens set, original address
 * will be its resolved result.
 *
 * @param addresses array of eth addresses
 * @param options option object
 * @param options.noCache whether cache resolved result
 * @returns Object with key as its original address and value as resolved result
 */
export const resolveMultiAddressEns = async (addresses: string[], options?: { noCache?: boolean }): Promise<Record<string, string>> => {
  if (options?.noCache) {
    const res = await _resolveMultiAddressEns(addresses);
    return addresses.reduce((acc, cur, i) => {
      acc[cur] = res[i];
      return acc;
    }, {} as Record<string, string>);
  }

  const cRes = cache.mget<string>(addresses);
  if (Object.keys(cRes).length === addresses.length) {
    return cRes as any;
  }
  const unResolved = addresses.filter((v) => !Boolean(cRes[v]));
  const res = await resolveMultiAddressEns(unResolved, { noCache: true });

  cache.mset(Object.keys(res).map((k) => ({ key: k, val: res[k] })));

  return {
    ...cRes,
    ...res,
  };
};

/**
 * resolve addresses to displayable format.
 * to ens or short term format with ...
 * @param addresses eth address
 * @returns Object with key as its original address and value as resolved result
 */
export const resolveMultiAddressDisplayable = async (addresses: string[]): Promise<Record<string, string>> => {
  const nameMap = await resolveMultiAddressEns(addresses);
  return Object.keys(nameMap).reduce((acc, cur) => {
    acc[cur] = nameMap[cur] ? nameMap[cur] : `${cur.substring(0, 6)}...${cur.slice(-4)}`;
    return acc;
  }, {} as Record<string, string>);
};
