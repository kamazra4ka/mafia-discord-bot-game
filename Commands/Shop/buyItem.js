import {addItemToUser, takeCoinsFromDatabase} from "../Handlers/DatabaseHandlers.js";

export const buyItem = async (interaction, item) => {
    try {
        await takeCoinsFromDatabase(interaction.user.id, item);
        await addItemToUser(interaction.user.id, item);

        let itemName;
        // switch case to add emojis
        switch (item) {
            case 'activerole':
                itemName = '💎 Active role';
                break;
            case 'fakedocuments':
                itemName = '🔎 Fake documents';
                break;
            case 'knife':
                itemName = '🔪 Knife';
                break;
            default:
                itemName = 'Error';
        }
        await interaction.reply({ content: `You bought **${itemName}**!`, ephemeral: true });

        setTimeout(async () => {
            await interaction.deleteReply();
        }, 2500);
    } catch (e) {
        const channel = await client.channels.fetch('1180826418523942922');
        channel.send('Something went wrong. Please, try again.\n\n' + error);
    }
}