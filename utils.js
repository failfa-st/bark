export function condaPython(condaEnv, pythonScriptPath) {
    switch (process.platform) {
        case 'win32':
            // Detect if using cmd.exe or PowerShell on Windows
            if (process.env.ComSpec && process.env.ComSpec.endsWith('cmd.exe')) {
                // For cmd.exe on Windows
                return `activate ${condaEnv} && python ${pythonScriptPath}`;
            } else {
                // For PowerShell on Windows
                return `conda activate ${condaEnv}; python ${pythonScriptPath}`;
            }
        default:
            // For Unix-based platforms (Linux, macOS)
            // Use the CONDA_EXE environment variable to get the conda path
            const condaPath = process.env.CONDA_EXE || 'conda';
            return `eval "$(${condaPath} shell.posix activate ${condaEnv})" && python ${pythonScriptPath}`;
 
    }
}

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
