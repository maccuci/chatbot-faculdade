import { existsSync, writeFileSync, readFileSync } from "fs";
import { createObjectCsvWriter } from "csv-writer";
import moment from "moment";

const PATH = "./consultas.csv";

export const readAppointments = () => {
  if (!existsSync(PATH)) writeFileSync(PATH, "chatId,nome,data\n");

  const data = readFileSync(PATH, "utf-8");
  const lines = data.split("\n").slice(1);

  return lines.map((line) => {
    const [chatId, nome, data] = line.split(",");
    return {
      chatId,
      nome,
      data: moment(data, "YYYY-MM-DD HH:mm").toDate(),
    };
  });
};

export const saveAppointment = (appointment) => {
  const writer = createObjectCsvWriter({
    path: PATH,
    header: [
      {
        id: 'chatId',
        title: 'chatId'
      },
      {
        id: "nome",
        title: "nome",
      },
      {
        id: "data",
        title: "data",
      },
    ],
    append: true,
  });

  return writer.writeRecords([appointment]);
};

export const isAvailable = (dateTime) => {
  const appointments = readAppointments();
  const dateToCheck = moment(dateTime, "YYYY-MM-DD HH:mm").toDate();

  return !appointments.some((appointment) =>
    moment(appointment.data).isSame(dateToCheck)
  );
};
