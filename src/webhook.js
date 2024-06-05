import express from "express";
import axios from "axios";

const app = express();
app.use(express.json());

const VERIFY_TOKEN = "testing";
const WHATSAPP_TOKEN = "";

const appointments = [];

async function sendMessage(to, text) {
  await axios({
    method: "POST",
    url: "https://graph.facebook.com/v19.0/277841092077171/messages",
    headers: {
      Authorization: `Bearer ${WHATSAPP_TOKEN}`,
      "Content-Type": "application/json",
    },
    data: {
      messaging_product: "whatsapp",
      to,
      text: { body: text },
    },
  });
}

async function receiveMessage(business_phone_number_id) {
  const response = await axios({
    method: "GET",
    url: `https://graph.facebook.com/v19.0/${business_phone_number_id}/messages?limit=1`,
    headers: {
      Authorization: `Bearer ${WHATSAPP_TOKEN}`,
    },
  });

  const message = response.data.messages[0];
  return { text: message.text.body };
}

function validateAndStoreCPF(cpf) {
  const cpfRegex = /^\d{11}$/;
  if (cpfRegex.test(cpf)) {
    return cpf;
  } else {
    console.error("Invalid CPF format.");
    return null;
  }
}

function validateAndStoreDate(date) {
  const dateRegex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;
  if (dateRegex.test(date)) {
    return date;
  } else {
    console.error("Invalid date format.");
    return null;
  }
}

app.post("/webhook", async (req, res) => {
  console.log("Incoming webhook message:", JSON.stringify(req.body, null, 2));

  const message = req.body.entry?.[0]?.changes[0]?.value?.messages?.[0];

  if (message?.type === "text") {
    const business_phone_number_id =
      req.body.entry?.[0].changes?.[0].value?.metadata?.phone_number_id;

    if (message.text.body.toLowerCase().includes("agendar consulta")) {
      let userName = "";
      let userCPF = "";
      let userProblem = "";
      let userDate = "";

      await sendMessage(
        message.from,
        "Olá! Para agendar uma consulta, informe seu nome completo."
      );
      userName = (await receiveMessage(business_phone_number_id)).text;

      await sendMessage(
        message.from,
        `Olá ${userName}, agora informe seu CPF (sem pontos ou traços).`
      );
      userCPF = validateAndStoreCPF(
        (await receiveMessage(business_phone_number_id)).text
      );
      if (!userCPF) {
        await sendMessage(
          message.from,
          "CPF inválido. Por favor, informe um CPF válido."
        );
        return res.sendStatus(200);
      }

      await sendMessage(
        message.from,
        `Olá ${userName}, agora descreva brevemente o problema que você está enfrentando.`
      );
      userProblem = (await receiveMessage(business_phone_number_id)).text;

      await sendMessage(
        message.from,
        `Olá ${userName}, por fim, informe a data desejada para a consulta (no formato DD/MM/AAAA).`
      );
      userDate = validateAndStoreDate(
        (await receiveMessage(business_phone_number_id)).text
      );
      if (!userDate) {
        await sendMessage(
          message.from,
          "Data inválida. Por favor, informe uma data válida no formato DD/MM/AAAA."
        );
        return res.sendStatus(200);
      }

      appointments.push({
        nome: userName,
        cpf: userCPF,
        problema: userProblem,
        data: userDate,
      });

      await sendMessage(
        message.from,
        `Consulta agendada com sucesso para ${userDate}. Entraremos em contato em breve. Obrigado!`
      );
    }
  }

  res.sendStatus(200);
});

app.get("/", (req, res) => {
  res.send(`<pre>Nothing to see here.
  Checkout README.md to start.</pre>`);
});

app.listen(3000, () => {
  console.log("Server is listening on port 3000");
});
