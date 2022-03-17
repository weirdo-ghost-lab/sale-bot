import { TwitterApi } from 'twitter-api-v2';

import { Order } from '../typings';
import { resolveMultiAddressDisplayable } from '../utils/ens';
import { TWITTER_API_APP_KEY, TWITTER_API_APP_SECRET, TWITTER_API_USER_ACCESS_TOKEN, TWITTER_API_USER_SECRET } from '../utils/envVar';

const client = new TwitterApi({
  appKey: TWITTER_API_APP_KEY,
  appSecret: TWITTER_API_APP_SECRET,
  accessToken: TWITTER_API_USER_ACCESS_TOKEN,
  accessSecret: TWITTER_API_USER_SECRET,
});

const orderToDes = async (order: Order) => {
  if (order.type === 'single') {
    const { sellerAddress, buyerAddress, tokenId: _t, valueGwei, form } = order;

    const tokenId = Number(_t);
    const resolvedAdds = await resolveMultiAddressDisplayable([sellerAddress, buyerAddress]);

    const suffix = `\n\n#WeirdoGhostGang\nhttps://opensea.io/assets/0x9401518f4ebba857baa879d9f76e1cc8b31ed197/${tokenId}`;
    const price = Number(valueGwei) / 1000000000000000000.0;

    if (form === 'accept') {
      return `Lil Ghost #${tokenId}\n\n${resolvedAdds[sellerAddress]} just accept ${resolvedAdds[buyerAddress]}'s offer of ${price}wETH.${suffix}`;
    } else {
      return `Lil Ghost #${tokenId}\n\n${resolvedAdds[buyerAddress]} just bought from ${resolvedAdds[sellerAddress]} for Ξ${price}.${suffix}`;
    }
  } else {
    const { buyerAddress, tokenId: _t, valueGwei } = order;

    const price = Number(valueGwei) / 1000000000000000000.0;
    const tokenIds = _t.map(Number);
    const resolvedBuyerAddress = (await resolveMultiAddressDisplayable([buyerAddress]))[buyerAddress];

    return `👀👀👀\n\n${resolvedBuyerAddress} just bought ${tokenIds.length} Lil Ghosts for Ξ${price} at once. \n\n#WeirdoGhostGang\nhttps://opensea.io/collection/the-weirdo-ghost-gang`;
  }
};

export const sendTwitterBotNotify = async (order: Order) => {
  const des = await orderToDes(order);
  await client.v2.tweet(des);
};
