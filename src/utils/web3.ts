import { createAlchemyWeb3 } from '@alch/alchemy-web3';

import { WEB3_API_ENDPOINT } from './envVar';

export const web3 = createAlchemyWeb3(WEB3_API_ENDPOINT);
