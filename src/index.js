import OpenAI from "openai"

// Uncomment for live reload
// new EventSource('/esbuild').addEventListener('change', () => location.reload())

const apiKey = "<YOUR KEY HERE>"


// Normally this would not run from the client browser but on the server side. This is for dev only
const client = new OpenAI({ apiKey, dangerouslyAllowBrowser: true});

// messy UI
const articleEl = document.querySelector('#article');
const summaryLengthEl = document.querySelector('#summary-length');
const wordsEl = document.querySelector('#words');
const maxEl = document.querySelector('#max');
const summaryEl = document.querySelector('#summary');
const debugEl = document.querySelector('#debug');
const refreshEl = document.querySelector('#refresh');

let article_words = 0;

const calculateWordsCount = text => text.replaceAll(/[,;\(\)\.\?\!\\\n"]/g, '').split(' ').length;

const updateSummary = async (articleChanged) => {
  if (!articleEl.value) {
    summaryEl.innerText = "Please enter an article to summarize"
    return
  };

  if (articleChanged) {
    // calculate the number of words in the article and update the word count slider appropriately
    article_words = calculateWordsCount(articleEl.value);
    maxEl.innerText = article_words;
    wordsEl.max = article_words;
    wordsEl.step = Math.ceil(article_words / 25);
    wordsEl.value = Math.ceil(article_words / 2);
    updateWordCount(wordsEl.value);
  }
  
  let max_tokens = Math.floor(parseInt(wordsEl.value) * 1000 / 750);
  debugEl.innerText = JSON.stringify({  max_tokens, article_words });

  refreshEl.style.display = 'block';

  // GPT API call
  const request = {
    // model: 'gpt-4-1106-preview',  // GPT-4 Turbo, pricier than GPT 3.5 Turbo, but and stick closer to the text (quoting it rather than extrapolating meaning) and follows the prompt more accurately.
    model: "gpt-3.5-turbo-1106",
    messages: [
      // these prompts aren't enough, as the AI model will always summarize the text, even if only a light editing was needed such as when the summary limit is very close to the article count
      // {"role": "system", "content": "You are Ernest Hemingway, summarizing text in direct and concise language."},
      {"role": "system", "content": "You are a newspaper editor whose goal is to make text fit a given word limit."},
      // apparently, it's complicated to make the AI model calculate the number of words in the original text (a 1544 space delimited word is seen as a 700 word text)
      // all the magic is really in the prompt...
      // {"role": "user", "content": `Take an iterative approach to get the text delimited by @@@ exactly ${wordsEl.value} words long. Keep track of the number of iterations you went though. At each iteration, remove filler words, adverbs, rhetorical questions and words of lesser importance from the text edited at the previous iteration. Stop until the edited text is below but as close to ${wordsEl.value} words long as possible, or until you reach 5 iterations. Return the final edited text: @@@ ${articleEl.value} @@@}`},
      {"role": "user", "content": `Simplify the text delimited by @@@ in as close to ${wordsEl.value} words as possible. Start by removing filler words, or words of no importance to the text's meaning. Then simplify some more only if the edited text is still above the word limits: @@@ ${articleEl.value} @@@}`},
    ],
    // max_tokens: maxTokens, // will cut off sentences
    seed: 42
  }
  // via OpenAI's NodeJS client lib
  // const completion = await client.chat.completions.create(request)

  // via API endpoint instead
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify(request)
  })
  const completion = await response.json();

  // update UI with summary
  const summary_words = calculateWordsCount(completion.choices[0].message.content);
  summaryEl.innerText = completion.choices[0].message.content;
  debugEl.innerText = JSON.stringify({ finish_reason: completion.choices[0].finish_reason, ...completion.usage, max_tokens, article_words, summary_words });
  refreshEl.style.display = 'none';
}

const updateWordCount = nbWords => {
  if (!articleEl.value) return;

  summaryLengthEl.innerText = nbWords + ' words';
}

wordsEl.oninput = e => updateWordCount(e.target.value);
wordsEl.onchange = _ => updateSummary(false);
article.oninput = _ => updateSummary(true);
