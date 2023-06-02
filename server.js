import http from "node:http";
import path from "node:path";
import express from "express";
import { execa } from "execa";
import { globby } from "globby";
import { nanoid } from "nanoid";

const app = express();

app.use(express.json());
app.use("/uploads", express.static("out"));

app.get("/files/:fileName", async (request, response) => {
  console.log(request.params);
  response.send(`<audio controls src="/uploads/${request.params.fileName}"/>`);
});

app.get("/voices", async (request, response) => {
  try {
    const voices = await globby(
      path.join(process.cwd(), "bark/assets/prompts/*.npz")
    ).then((files) => files.map((file) => path.parse(file).name));
    response.status(200).json({ voices });
  } catch (error) {
    response.status(500).json({ message: error.message });
  }
});

app.post("/generate", async (request, response) => {
  const {
    text,
    voice = "announcer",
    fileName = `${nanoid()}.wav`,
    textTemperature = 0.7,
    silent = true,
    waveformTemperature = 0.7,
  } = request.body;

  console.log("INPUT");
  console.log(request.body);

  const args = [
    "-m",
    "bark",
    "--text",
    text,
    "--output_filename",
    fileName,
    "--output_dir",
    "out",
     "--history_prompt",
    voice,
    "--text_temp",
    textTemperature,
    "--waveform_temp",
    waveformTemperature,
  ];
  if (silent) {
    args.push("--silent");
  }
  try {
    await execa("python", args, { stdio: "inherit" });

    const data = {
      download: `http://127.0.0.1:${currentPort}/uploads/${fileName}`,
      browser: `http://127.0.0.1:${currentPort}/files/${fileName}`,
      text,
      filePath: path.join(process.cwd(), "out", fileName),
      fileName,
      textTemperature,
      waveformTemperature,
    };
    console.log("OUTPUT");
    console.log(data);
    response.status(200).json(data);
  } catch (error) {
    response.status(500).json({ message: error.message });
  }
});

const server = http.createServer(app);
let currentPort = 3000;

function startServer() {
  server.listen(currentPort, () => {
    console.log(`Server is running on port ${currentPort}`);
  });
}

function handleListenError(error) {
  if (error.code === "EADDRINUSE") {
    console.log(
      `Port ${currentPort} is already in use. Trying the next port …`
    );
    currentPort++;
    startServer();
  } else {
    console.error(error);
  }
}

startServer();
server.on("error", handleListenError);
