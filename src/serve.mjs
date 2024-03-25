import OpenAI from "openai";
import express from "express";

const apiKey = "<YOUR KEY HERE>";

const client = new OpenAI({ apiKey });
// via Ollama running open source models locally
// const client = new OpenAI({ apiKey, baseURL: "http://localhost:11434/v1" });


const app = express();
app.use(express.static("www"));
app.use(express.json()) // for parsing req.body when mine type is application/json

app.post("/summarize", async (req, res) => {
  const request = {
    model: "gpt-3.5-turbo-0125",  // GPT-4 Turbo is pricier than GPT 3.5 Turbo, but and stick closer to the text (quoting it rather than extrapolating meaning) and follows the prompt more accurately.
//    model: "llama2-uncensored",  // via Ollama running locally
    messages: [
      {"role": "system", "content": "You are a newspaper editor conscious to make text fit within a given word limit."},
      {"role": "user", "content": `Simplify the text delimited by @@@ in as close to ${req.body.count} words as possible: @@@ ${req.body.text} @@@}`},
    ],
    // max_tokens: maxTokens, // will cut off sentences
    seed: 42
  }

  const then = Date.now();
  // via OpenAI's NodeJS client lib
  const completion = await client.chat.completions.create(request);

  // via Fetch + OpenAI API
  // const response = await fetch("api.openai.com/v1/chat/completions", {
  //   method: "POST",
  //   headers: {
  //     "Content-Type": "application/json",
  //     "Authorization": `Bearer ${apiKey}`,
  //   },
  //   body: JSON.stringify(request)
  // })
  // const completion = await response.json();
  const elapsed = (Date.now() - then) / 1000;
  console.log(`received from OpenAI in ${elapsed}s`, completion);

  res.json(completion);
});

app.listen(8000, () => console.log("Server running on http://localhost:8000"));
