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

    const command =
      commands.get(interaction.commandName);

    if (!command) return;


    try {

      await command.execute(interaction);

    } catch (err) {

      console.error(
        `Error running /${interaction.commandName}:`,
        err
      );


      const payload = {
        content:
          "Something went wrong running that command.",
        ephemeral: true,
      };


      if (
        interaction.replied ||
        interaction.deferred
      ) {

        await interaction.followUp(payload);

      } else {

        await interaction.reply(payload);

      }
    }

    return;
  }



  // ==================================================
  // DASHBOARD BUTTONS
  // ==================================================

  if (interaction.isButton()) {


    if (!interaction.guild) {

      return interaction.reply({
        content:
          "This can only be used inside a server.",
        ephemeral:true,
      });

    }


    const guildId =
      interaction.guild.id;

    const userId =
      interaction.user.id;



    // -------------------------------
    // CLOCK IN
    // -------------------------------

    if (interaction.customId === "clock_in") {


      const existing =
        await prisma.timeEntry.findFirst({
          where:{
            guildId,
            userId,
            status:"in",
          },
        });



      if(existing){

        return interaction.reply({
          content:
            "🟢 You are already clocked in.",
          ephemeral:true,
        });

      }



      await prisma.timeEntry.create({

        data:{
          guildId,
          userId,
          clockInAt:new Date(),
          status:"in",
        },

      });



      return interaction.reply({

        content:
          "🟢 You have clocked in.",

        ephemeral:true,

      });

    }




    // -------------------------------
    // CLOCK OUT
    // -------------------------------

    if (interaction.customId === "clock_out") {


      const entry =
        await prisma.timeEntry.findFirst({

          where:{
            guildId,
            userId,
            status:"in",
          },

        });



      if(!entry){

        return interaction.reply({

          content:
            "🔴 You are not currently clocked in.",

          ephemeral:true,

        });

      }



      const now =
        new Date();



      await prisma.timeEntry.update({

        where:{
          id:entry.id,
        },


        data:{

          clockOutAt:now,
          status:"out",

        },

      });



      return interaction.reply({

        content:
          "🔴 You have clocked out.",

        ephemeral:true,

      });

    }





    // -------------------------------
    // MY TIME
    // -------------------------------

    if (interaction.customId === "my_time") {


      const entries =
        await prisma.timeEntry.findMany({

          where:{
            guildId,
            userId,
          },

        });



      let totalSeconds = 0;



      for (const entry of entries) {


        const end =
          entry.clockOutAt ??
          new Date();



        totalSeconds += Math.floor(

          (
            end.getTime()
            -
            entry.clockInAt.getTime()

          )
          /
          1000

        );

      }



      const hours =
        Math.floor(
          totalSeconds / 3600
        );


      const minutes =
        Math.floor(
          (totalSeconds % 3600) / 60
        );



      return interaction.reply({

        content:
          `⏱️ Your total time: **${hours}h ${minutes}m**`,

        ephemeral:true,

      });

    }

  }




  // ==================================================
  // APPLY SELECT MENU
  // ==================================================

  if (
    interaction.isStringSelectMenu() &&
    interaction.customId === "apply-select"
  ) {


    const guildId =
      interaction.guildId!;


    const value =
      interaction.values[0];



    const option =
      await prisma.appOption.findUnique({

        where:{
          guildId_value:{
            guildId,
            value,
          },
        },

      });



    if (!option) {

      await interaction.reply({

        content:
          "That option no longer exists.",

        ephemeral:true,

      });

      return;

    }



    const questions =
      option.questions as string[];



    const modal =
      new ModalBuilder()

        .setCustomId(
          `apply-modal-${value}`
        )

        .setTitle(
          option.label.slice(0,45)
        );



    questions.forEach((question,i)=>{


      const input =
        new TextInputBuilder()

          .setCustomId(`q${i}`)

          .setLabel(
            question.slice(0,45)
          )

          .setStyle(
            TextInputStyle.Paragraph
          )

          .setRequired(true);



      modal.addComponents(

        new ActionRowBuilder<TextInputBuilder>()

          .addComponents(input)

      );

    });



    await interaction.showModal(modal);

    return;

  }




  // ==================================================
  // APPLY MODAL SUBMISSION
  // ==================================================

  if (
    interaction.isModalSubmit() &&
    interaction.customId.startsWith("apply-modal-")
  ) {


    const value =
      interaction.customId.replace(
        "apply-modal-",
        ""
      );


    const guildId =
      interaction.guildId!;



    const option =
      await prisma.appOption.findUnique({

        where:{
          guildId_value:{
            guildId,
            value,
          },
        },

      });



    if (!option) {

      await interaction.reply({

        content:
          "That option no longer exists.",

        ephemeral:true,

      });

      return;

    }



    const questions =
      option.questions as string[];



    const answers: Record<string,string> = {};



    questions.forEach((question,i)=>{

      answers[question] =
        interaction.fields.getTextInputValue(
          `q${i}`
        );

    });



    await prisma.appResponse.create({

      data:{

        guildId,

        userId:
          interaction.user.id,

        optionValue:
          value,

        optionLabel:
          option.label,

        answers,

      },

    });




    const channel =
      await interaction.client.channels
        .fetch(option.targetChannelId)
        .catch(()=>null);



    if (
      channel &&
      channel instanceof TextChannel
    ) {


      const embed =
        new EmbedBuilder()

          .setTitle(option.label)

          .setDescription(
            `Submitted by <@${interaction.user.id}>`
          )

          .addFields(

            Object.entries(answers)
              .map(([q,a])=>({

                name:q.slice(0,256),

                value:
                  a.slice(0,1024)
                  ||
                  "(no answer)",

              }))

          )

          .setTimestamp();



      await channel.send({

        embeds:[
          embed
        ],

      });

    }



    await interaction.reply({

      content:
        "Submitted. Thanks!",

      ephemeral:true,

    });


    return;

    
  }

}