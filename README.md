# 🐶 Express Bark API

A Node/Express server for [Bark](https://github.com/suno-ai/bark). Please refer to the original docs for up to date
information on Bark by [Suno](https://www.suno.ai/).

## Notice

Bark is limited to ~13 seconds af output.  
This demo allows unlimited length and returns an array of audio files as well as the concatenated audio file.  
The concatenation is done via [ffmpeg](https://ffmpeg.org/).

> Make sure to have [ffmpeg](https://ffmpeg.org/) installed on your machine.

This project (currently) assumes that you have used npm before and are comfortable ensuring your environment to be set
up.

## Setup

Certain steps (to get the miniconda running with GPU supprt) were boldly copied from [this Gradio Web-ui for Bark](https://github.com/Fictiverse/bark).
TBH, I have no Idea what I did here but it might just work :). If you know your way around python and setting this up manually, feel free to contribute.
I am no Python developer and was only able to adjust things based on trial and error, (adjusting types in the python code)

### Windows

You can try the [one click installer](https://github.com/failfa-st/express-bark/releases/tag/v0.1.0) (express-bark.zip).
Simply download it, extract it and double-click `run.bat` (and hope that it works).
If it doesn't work feel free to open an issue, so that we can look into fixing any issues that might occur.

Thank you

### MacOS & Linux

1. Clone this repository
2. Ensure that you have `python` installed
3. Ensure that you have `node@18` installed (you can run `nvm use` if you use [NVM](https://github.com/nvm-sh/nvm))
4. run `npm install` to install npm dependencies
5. run `pip install .` to install python requirements
6. (once) run `npm run download:model` to download the model (also executes [bark with a test generation](#download))
7. run `npm run dev` (or `npm start` if you don't plan to make changes to [`server.js`](server.js))

### Download

The `download:model` script should download the model and run a test generation:

> 💡 Info  
> Example on macOS M1 PRO, using CPU (no optimizations)  
> Windows/Linux with an Nvidia will be a lot faster (highly recommended)  
> An [RTX4090](https://www.nvidia.com/en-us/geforce/graphics-cards/40-series/rtx-4090/) will generate the test in ~2 seconds

```
> download:model
> python -m bark --text "You are all set up."

No GPU being used. Careful, inference might be very slow!
100%|██████████████████████████████████████████████████████████| 100/100 [00:08<00:00, 11.72it/s]
100%|██████████████████████████████████████████████████████████████| 7/7 [00:27<00:00,  3.99s/it]
Done! Output audio file is saved at: './bark_generation.wav'

Process finished with exit code 0
```

## Sending requests

This project provides these endpoints:

- [GET voices](#voices) (retrieve all available voices)
- GET uploads:fileName (download/serve generated files)
- GET files:fileName (display/play generated files)
- [POST generate](#generate) (generate audio from text)

### Voices

**GET `/voices`**

```
RESPONSE: {voices: string[]}
```

### Generate

**POST `/generate`**

```
REQUEST: RequestParams
RESPONSE: ResponseObject
```

```ts
interface RequestParams {
  text: string;
  /* @default "[nanoid].wav" */
  fileName?: string;
  /* @default 0.7 */
  textTemperature?: number;
  /* @default 0.7 */
  waveformTemperature?: number;
  /* @default false */
  silent?: boolean;
}

interface ResponseObject {
  download: string;
  browser: string;
}
```

#### Parameters

| Property            | required | Type    | Default Value  | Description                                     |
| ------------------- | -------- | ------- | -------------- | ----------------------------------------------- |
| text                | yes      | string  |                | The text to be processed.                       |
| fileName            | no       | string  | \[nanoid\].wav | The name of the output file.                    |
| textTemperature     | no       | number  | 0.7            | The temperature for text generation.            |
| waveformTemperature | no       | number  | 0.7            | The temperature for waveform generation.        |
| silent              | no       | boolean | true           | Indicates whether the process should be silent. |
