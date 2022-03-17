import { MessageEmbed, WebhookClient } from 'discord.js';

import { imageUrlMap } from '../metadata/imageUrls';
import { Order } from '../typings';
import { resolveMultiAddressDisplayable } from '../utils/ens';
import { DISCORD_WEBHOOK_URL } from '../utils/envVar';

const webhookClient = new WebhookClient({ url: DISCORD_WEBHOOK_URL });

const orderToMessageEmbed = async (order: Order): Promise<MessageEmbed> => {
  if (order.type === 'single') {
    const { sellerAddress, buyerAddress, tokenId: _t, valueGwei, form } = order;

    const tokenId = Number(_t);
    const resolvedAdds = await resolveMultiAddressDisplayable([sellerAddress, buyerAddress]);
    const price = Number(valueGwei) / 1000000000000000000.0;

    const embed = new MessageEmbed()
      .setTitle(`Lil Ghost #${tokenId}`)
      .setURL(`https://opensea.io/assets/0x9401518f4ebba857baa879d9f76e1cc8b31ed197/${tokenId}`)
      .setImage(imageUrlMap[String(tokenId) as keyof typeof imageUrlMap]);

    if (form === 'accept') {
      embed.setDescription(`${resolvedAdds[sellerAddress]} just accept ${resolvedAdds[buyerAddress]}'s offer of ${price}wETH.`);
    } else {
      embed.setDescription(`${resolvedAdds[buyerAddress]} just bought from ${resolvedAdds[sellerAddress]} for Ξ${price}.`);
    }

    return embed;
  } else {
    const { buyerAddress, tokenId: _t, valueGwei } = order;

    const price = Number(valueGwei) / 1000000000000000000.0;
    const tokenIds = _t.map(Number);
    const resolvedBuyerAddress = (await resolveMultiAddressDisplayable([buyerAddress]))[buyerAddress];
    const embed = new MessageEmbed()
      .setTitle('👀👀👀 Multi Purchase')
      .setColor('#0099ff')
      .setURL('https://opensea.io/collection/the-weirdo-ghost-gang')
      .setDescription(`${resolvedBuyerAddress} just bought ${tokenIds.length} Lil Ghosts for Ξ${price} at once.`);

    return embed;
  }
};

export const sendDiscordWebHookNotify = async (order: Order) => {
  const embed = await orderToMessageEmbed(order);

  await webhookClient.send({
    username: 'WGG Sale Bot',
    avatarURL: 'https://lh3.googleusercontent.com/LpZeqz7YqWALr_i4bbMyP4RzXXoprZdO2e-U8W8uqPvk7V11NMeaMvzTjNoEKZL1lagcLjPSpEm7xnm0SXKyPmBEVdwJi6ZxNQBMIA=s0',
    embeds: [embed],
  });
};
