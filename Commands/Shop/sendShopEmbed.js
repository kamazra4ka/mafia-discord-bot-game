import {ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder} from "discord.js";
import {getPlayerCoinsFromDatabase} from "../Handlers/DatabaseHandlers.js";

export const sendShopEmbed = async (interaction) => {
    const item_1 = new ButtonBuilder()
        .setCustomId('buy_item_1')
        .setLabel('💎 Active role | 🪙 1000 coins')
        .setStyle(ButtonStyle.Secondary);

    const item_2 = new ButtonBuilder()
        .setCustomId('buy_item_2')
        .setLabel('🔎 Fake documents | 🪙 250 coins')
        .setStyle(ButtonStyle.Secondary);

    const item_3 = new ButtonBuilder()
        .setCustomId('buy_item_3')
        .setLabel('🔪 Knife | 🪙 1450 coins')
        .setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder().addComponents(item_1).addComponents(item_2).addComponents(item_3);

    const userCoins = await getPlayerCoinsFromDatabase(interaction.user.id);

    const startEmbed = new EmbedBuilder()
        .setColor('3a3a3a')
        .setTitle('Mafia Game: Shop')
        .setDescription(`Welcome to the shop, ${interaction.user.username}! Here you can buy items that can help you later in the game. You cannot use items more than once. To earn coins, you have to win the game.`)
        .addFields(
            { name: '💎 Active role', value: 'This item guarantees you an active role (Mafia, Doctor, etc) in the next game.', inline: true },
            { name: '🔎 Fake documents', value: 'This item prevents detective from knowing your real role during a night check.', inline: true },
            { name: '🔪 Knife', value: 'This item allows you to kill any person at night even if you are not a mafia.', inline: true }
        )
        .setImage('https://media.discordapp.net/attachments/1174711985686970368/1179427879273103521/shop.png?ex=6579becf&is=656749cf&hm=76f671a50880fb8edf73e40d80c2bdc67ebf5d38468a324724dafcb970634048&=&format=webp&quality=lossless&width=1921&height=641')
        .setTimestamp()
        .setFooter({ text: `You have ${userCoins} coins`, iconURL: 'https://pngimg.com/d/coin_PNG36871.png' });

    await interaction.reply({ components: [row], embeds: [startEmbed], ephemeral: true });
}