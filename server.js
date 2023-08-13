import http from "node:http";
import process from "node:process";
import path from "node:path";
import express from "express";
import { execa } from "execa";
import { globby } from "globby";
import { nanoid } from "nanoid";
import ffmpeg from "fluent-ffmpeg";

const app = express();

export function chunkify(text, { maxWords = 30, maxCharacters = 200 } = {}) {
  const chunks = [];
  const cleanedText = text
    .replace(/\([^()]*\)|\[\d+](?=\[\d+])?/g, "")
    .replace(/\s+/, " ");

  const sentences = cleanedText
    .replace(/([.?!:;])\s/g, "$1|||")
    .split("|||")
    .map((sentence) => sentence.trim().replace(/ +/g, " "));

  let currentChunk = "";

  sentences.forEach((sentence, index) => {
    const nextChunk = [currentChunk, sentence].join(" ").trim();

    if (
      nextChunk.split(" ").length < maxWords &&
      nextChunk.length < maxCharacters
    ) {
      currentChunk = nextChunk; // Add the sentence to the current chunk
    } else {
      chunks.push(currentChunk); // Add the current chunk to the list of chunks
      currentChunk = sentence; // Start a new chunk with the current sentence
    }

    // Add the last chunk if we have reached the end of the sentences
    if (index === sentences.length - 1) {
      chunks.push(currentChunk);
    }
  });

  return chunks;
}

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

async function generate({
  text,
  voice = "announcer                                                                                                                                                                                                                                                        ",
  fileName = `${nanoid()}.wav`,
  textTemperature = 0.7,
  silent = true,
  waveformTemperature = 0.7,
}) {
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
  await execa("python", args, { stdio: "inherit" });

  return {
    download: `http://127.0.0.1:${currentPort}/uploads/${fileName}`,
    browser: `http://127.0.0.1:${currentPort}/files/${fileName}`,
    text,
    voice,
    filePath: path.join(process.cwd(), "out", fileName),
    fileName,
    textTemperature,
    waveformTemperature,
  };
}

app.post("/generate", async (request, response) => {
  const { text, batchSize, fileName, ...task } = request.body;

  const chunks = chunkify(text);
  const [fileNameBase] = fileName.split(".");
  try {
    const answers = [];

    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize); // Get the next batch of chunks

      const batchPromises = batch.map((text, index) => {
        const filePart = (i + index + 1).toString().padStart(3, "0");
        const fileName = `${fileNameBase}__part_${filePart}.wav`;

        return generate({
          ...task,
          text,
          fileName,
        });
      });

      // eslint-disable-next-line no-await-in-loop
      const batchResults = await Promise.all(batchPromises);

      answers.push(...batchResults);
    }

    let command = ffmpeg();
    for (const { filePath } of answers) {
      command = command.input(filePath);
    }

    const fileName = `${fileNameBase}.mp3`;
    const filePath = path.join(process.cwd(), "out", fileName);
    command
      .on("end", function () {
        console.log(`Done! Output audio file is saved at: '${filePath}'`);

        response.status(201).json({
          text,
          fileNameBase,
          fileName,
          filePath,
          batchSize,
          voice: task.voice,
          download: `http://127.0.0.1:${currentPort}/uploads/${fileName}`,
          browser: `http://127.0.0.1:${currentPort}/files/${fileName}`,
          chunks: answers,
        });
      })
      .on("error", function (error) {
        throw error;
      })
      .mergeToFile(filePath, ".tmp");
  } catch (error) {
    response.status(500).json({ message: error.message });
  }
});

const server = http.createServer(app);

const portArgIndex = process.argv.indexOf('--port');
let currentPort = 3000; // default

if (portArgIndex !== -1 && process.argv.length > portArgIndex + 1) {
  const parsedPort = parseInt(process.argv[portArgIndex + 1], 10);
  if (!isNaN(parsedPort)) {
    currentPort = parsedPort;
  }
}

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
