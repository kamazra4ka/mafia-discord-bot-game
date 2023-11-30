import {ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder} from "discord.js";
import {getPlayerCoinsFromDatabase} from "../Handlers/DatabaseHandlers.js";

export const sendShopEmbed = async (interaction) => {

    const userCoins = await getPlayerCoinsFromDatabase(interaction.user.id);

    const item_1 = new ButtonBuilder()
        .setCustomId('buy_item_activerole')
        .setLabel('💎 Active role')
        .setStyle(ButtonStyle.Secondary);

    const item_2 = new ButtonBuilder()
        .setCustomId('buy_item_fakedocuments')
        .setLabel('🔎 Fake documents')
        .setStyle(ButtonStyle.Secondary);

    const item_3 = new ButtonBuilder()
        .setCustomId('buy_item_knife')
        .setLabel('🔪 Knife')
        .setStyle(ButtonStyle.Secondary);

    if (userCoins <= 1000) {
        item_1.setDisabled(true);
    }

    if (userCoins <= 250) {
        item_2.setDisabled(true);
    }

    if (userCoins <= 6450) {
        item_3.setDisabled(true);
    }

    const row = new ActionRowBuilder().addComponents(item_1).addComponents(item_2).addComponents(item_3);

    const startEmbed = new EmbedBuilder()
        .setColor('3a3a3a')
        .setTitle('Mafia Game: Shop')
        .setDescription(`Welcome to the shop, ${interaction.user.username}! Here you can buy items that can help you later in the game. You cannot use items more than once. To earn coins, you have to win the game.`)
        .addFields(
            { name: '💎 Active role', value: 'This item guarantees you an active role (Mafia, Doctor, etc) in the next game.\n  **1000 🪙**', inline: true },
            { name: '🔎 Fake documents', value: 'This item prevents detective from knowing your real role during a night check.\n  **250 🪙**', inline: true },
            { name: '🔪 Knife', value: 'This item allows you to kill any person at night even if you are not the mafia.\n  **6450 🪙**', inline: true }
        )
        .setImage('https://media.discordapp.net/attachments/1174711985686970368/1179427879273103521/shop.png?ex=6579becf&is=656749cf&hm=76f671a50880fb8edf73e40d80c2bdc67ebf5d38468a324724dafcb970634048&=&format=webp&quality=lossless&width=1921&height=641')
        .setTimestamp()
        .setFooter({ text: `You have ${userCoins} coins`, iconURL: 'https://pngimg.com/d/coin_PNG36871.png' });

    await interaction.reply({ components: [row], embeds: [startEmbed], ephemeral: true });
}