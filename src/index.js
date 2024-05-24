import { create } from "@wppconnect-team/wppconnect";
import moment from "moment";
import { isAvailable, saveAppointment, readAppointments } from "./utils/csv";
import { NUMBER } from "./utils/constants";

create({ session: "support" })
  .then((client) => init(client))
  .catch((error) => console.log(error));

async function init(client) {
  console.log("Bot está sendo iniciado...");
  let options = new Map();

  await client
    .sendText(
      NUMBER,
      "👋 Olá! Bem-vindo ao consultório odontológico. Como posso ajudar?\n1. Agendar consulta\n2. Verificar consulta ativa"
    )
    .then((result) => {
      console.log("Result: ", result);
    })
    .catch((erro) => {
      console.error("Error when sending: ", erro);
    });

  const sessions = {};

  client.onMessage(async (message) => {
    const chatId = message.from;

    if (!sessions[chatId]) {
      sessions[chatId] = { stage: 0 };
    }

    const userSession = sessions[chatId];

    //Está dando algum conflito com todas as conversas.

    // if (options.get(chatId) == null) {
    //   await client.sendText(
    //     chatId,
    //     "Olá! Seja bem-vindo ao sistema automática de consultas. Escolha uma das opções abaixo:\n1. Agendar consulta\n2. Verificar consulta ativa"
    //   );
    //   options.set(chatId, true);
    //   return;
    // }

    if (userSession.stage === 0) {
      if (message.body === "1") {
        userSession.stage = 1;
        await client
          .sendText(chatId, "Qual é o seu nome?")
          .then((result) => {
            console.log("Result: ", result);
          })
          .catch((erro) => {
            console.error("Error when sending: ", erro);
          });
      } else if (message.body === "2") {
        const appointments = readAppointments().filter(
          (appointment) => appointment.chatId === chatId
        );

        if (appointments.length > 0) {
          const appointment = appointments[0];
          await client
            .sendText(
              chatId,
              `Você tem uma consulta agendada para o dia ${moment(
                appointment.data
              ).format("DD/MM/YYYY")} às ${moment(appointment.data).format(
                "HH:mm"
              )}.`
            )
            .then((result) => {
              console.log("Result: ", result);
            })
            .catch((erro) => {
              console.error("Error when sending: ", erro);
            });
        } else {
          await client
            .sendText(chatId, "Você não tem consultas ativas.")
            .then((result) => {
              console.log("Result: ", result);
            })
            .catch((erro) => {
              console.error("Error when sending: ", erro);
            });
        }
        delete sessions[chatId];
      } else {
        await client
          .sendText(chatId, "Opção inválida. Por favor, escolha 1 ou 2.")
          .then((result) => {
            console.log("Result: ", result);
          })
          .catch((erro) => {
            console.error("Error when sending: ", erro);
          });
      }
    } else if (userSession.stage === 1) {
      userSession.name = message.body;
      userSession.stage = 2;
      await client
        .sendText(
          chatId,
          `Olá ${userSession.name}, qual data você prefere para a consulta? Por favor, use o formato DD/MM/AAAA.`
        )
        .then((result) => {
          console.log("Result: ", result);
        })
        .catch((erro) => {
          console.error("Error when sending: ", erro);
        });
    } else if (userSession.stage === 2) {
      const dateInput = message.body;
      const formattedDate = moment(dateInput, "DD/MM/YYYY", true);

      if (!formattedDate.isValid()) {
        await client
          .sendText(
            chatId,
            "Data inválida. Por favor, insira a data no formato DD/MM/AAAA."
          )
          .then((result) => {
            console.log("Result: ", result);
          })
          .catch((erro) => {
            console.error("Error when sending: ", erro);
          });
        return;
      }

      userSession.date = formattedDate.format("YYYY-MM-DD");
      userSession.stage = 3;
      await client
        .sendText(
          chatId,
          "Qual horário você prefere? Por favor, use o formato HH:mm."
        )
        .then((result) => {
          console.log("Result: ", result);
        })
        .catch((erro) => {
          console.error("Error when sending: ", erro);
        });
    } else if (userSession.stage === 3) {
      const timeInput = message.body;
      const formattedDateTime = moment(
        `${userSession.date} ${timeInput}`,
        "YYYY-MM-DD HH:mm",
        true
      );

      if (!formattedDateTime.isValid()) {
        await client
          .sendText(
            chatId,
            "Horário inválido. Por favor, insira o horário no formato HH:mm."
          )
          .then((result) => {
            console.log("Result: ", result);
          })
          .catch((erro) => {
            console.error("Error when sending: ", erro);
          });
        return;
      }

      userSession.dateTime = formattedDateTime.toDate();
      if (isAvailable(formattedDateTime.format("YYYY-MM-DD HH:mm"))) {
        userSession.stage = 4;
        await client
          .sendText(
            chatId,
            `Confirmando, ${
              userSession.name
            }. Você quer agendar a consulta para o dia ${formattedDateTime.format(
              "DD/MM/YYYY"
            )} às ${formattedDateTime.format(
              "HH:mm"
            )}, correto? (Responda com Sim ou Não)`
          )
          .then((result) => {
            console.log("Result: ", result);
          })
          .catch((erro) => {
            console.error("Error when sending: ", erro);
          });
      } else {
        await client
          .sendText(
            chatId,
            `Desculpe, ${
              userSession.name
            }, mas já temos uma consulta agendada para o dia ${formattedDateTime.format(
              "DD/MM/YYYY"
            )} às ${formattedDateTime.format(
              "HH:mm"
            )}. Por favor, escolha outro horário.`
          )
          .then((result) => {
            console.log("Result: ", result);
          })
          .catch((erro) => {
            console.error("Error when sending: ", erro);
          });
        userSession.stage = 3;
      }
    } else if (userSession.stage === 4) {
      if (message.body.toLowerCase() === "sim") {
        await saveAppointment({
          chatId: chatId,
          nome: userSession.name,
          data: moment(userSession.dateTime).format("YYYY-MM-DD HH:mm"),
        });
        await client
          .sendText(
            chatId,
            `Sua consulta está agendada para o dia ${moment(
              userSession.dateTime
            ).format("DD/MM/YYYY")} às ${moment(userSession.dateTime).format(
              "HH:mm"
            )}. Obrigado, ${userSession.name}!`
          )
          .then((result) => {
            console.log("Result: ", result);
          })
          .catch((erro) => {
            console.error("Error when sending: ", erro);
          });
        options.delete(chatId);
        delete sessions[chatId];
      } else if (message.body.toLowerCase() === "não") {
        userSession.stage = 2;
        await client
          .sendText(
            chatId,
            "Ok, qual data e horário você prefere para a consulta?"
          )
          .then((result) => {
            console.log("Result: ", result);
          })
          .catch((erro) => {
            console.error("Error when sending: ", erro);
          });
      }
    }
  });
}
