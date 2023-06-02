# 🐶 Express Bark API

A Node/Express server for [Bark](https://github.com/suno-ai/bark). Please refer t the original docs for up to date
information on Bark by [Suno](https://www.suno.ai/).

## Notice

Bark is limited to ~13 seconds af output. This demo does not (yet) handle longer texts

This project (currently) assumes that you have used npm before and are comfortable ensuring your environment to be set
up.

## Setup

1. Clone this repository
2. Ensure that you have `python@3` installed (we use `pip3` to install requirements)
3. Ensure that you have `node@18` installed (you can run `nvm use` if you use [NVM](https://github.com/nvm-sh/nvm))
4. run `npm install` to install npm packages and python requirements
   - (once) run `npm run download:model` to download the model (also executes [bark with a test generation](#download))
5. run `npm run dev` (or `npm start` if you don't plan to make changes to [`server.js`](server.js))

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
  /* @default "audio.wav" */
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

| Property            | required | Type    | Default Value | Description                                     |
| ------------------- | -------- | ------- | ------------- | ----------------------------------------------- |
| text                | true     | string  |               | The text to be processed.                       |
| fileName            | false    | string  | "audio.wav"   | The name of the output file.                    |
| textTemperature     | false    | number  | 0.7           | The temperature for text generation.            |
| waveformTemperature | false    | number  | 0.7           | The temperature for waveform generation.        |
| silent              | false    | boolean | false         | Indicates whether the process should be silent. |
