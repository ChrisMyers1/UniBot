import {
  Events,
  Interaction,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  EmbedBuilder,
  TextChannel,
} from "discord.js";
import { prisma } from "../lib/db";
import type { Command } from "../types";

export const name = Events.InteractionCreate;

export async function execute(
  interaction: Interaction,
  commands: Map<string, Command>
) {
  // --- Slash commands ---
  if (interaction.isChatInputCommand()) {
    const command = commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction);
    } catch (err) {
      console.error(`Error running /${interaction.commandName}:`, err);
      const payload = {
        content: "Something went wrong running that command.",
        ephemeral: true,
      };
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(payload);
      } else {
        await interaction.reply(payload);
      }
    }
    return;
  }

  // --- Select menu from /apply ---
  if (interaction.isStringSelectMenu() && interaction.customId === "apply-select") {
    const guildId = interaction.guildId!;
    const value = interaction.values[0];

    const option = await prisma.appOption.findUnique({
      where: { guildId_value: { guildId, value } },
    });

    if (!option) {
      await interaction.reply({
        content: "That option no longer exists.",
        ephemeral: true,
      });
      return;
    }

    const questions = option.questions as string[];

    const modal = new ModalBuilder()
      .setCustomId(`apply-modal-${value}`)
      .setTitle(option.label.slice(0, 45));

    questions.forEach((question, i) => {
      const input = new TextInputBuilder()
        .setCustomId(`q${i}`)
        .setLabel(question.slice(0, 45))
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true);
      modal.addComponents(
        new ActionRowBuilder<TextInputBuilder>().addComponents(input)
      );
    });

    await interaction.showModal(modal);
    return;
  }

  // --- Modal submission from /apply ---
  if (interaction.isModalSubmit() && interaction.customId.startsWith("apply-modal-")) {
    const value = interaction.customId.replace("apply-modal-", "");
    const guildId = interaction.guildId!;

    const option = await prisma.appOption.findUnique({
      where: { guildId_value: { guildId, value } },
    });

    if (!option) {
      await interaction.reply({
        content: "That option no longer exists.",
        ephemeral: true,
      });
      return;
    }

    const questions = option.questions as string[];
    const answers: Record<string, string> = {};
    questions.forEach((question, i) => {
      answers[question] = interaction.fields.getTextInputValue(`q${i}`);
    });

    await prisma.appResponse.create({
      data: {
        guildId,
        userId: interaction.user.id,
        optionValue: value,
        optionLabel: option.label,
        answers,
      },
    });

    const channel = await interaction.client.channels
      .fetch(option.targetChannelId)
      .catch(() => null);

    if (channel && channel instanceof TextChannel) {
      const embed = new EmbedBuilder()
        .setTitle(option.label)
        .setDescription(`Submitted by <@${interaction.user.id}>`)
        .addFields(
          Object.entries(answers).map(([q, a]) => ({
            name: q.slice(0, 256),
            value: a.slice(0, 1024) || "(no answer)",
          }))
        )
        .setTimestamp(new Date());

      await channel.send({ embeds: [embed] });
    }

    await interaction.reply({
      content: "Submitted. Thanks!",
      ephemeral: true,
    });
  }
}
