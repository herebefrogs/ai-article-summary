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

   // via API endpoint instead
  console.log('fetching', articleEl.value, wordsEl.value);
  const then = performance.now()
  const response = await fetch("http://localhost:8000/summarize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: articleEl.value,
      count: wordsEl.value
    })
  })
  const elapsed = (performance.now() - then) / 1000;
  console.log('fetched');

  const completion = await response.json();

  // update UI with summary
  const summary_words = calculateWordsCount(completion.choices[0].message.content);
  summaryEl.innerText = completion.choices[0].message.content;
  debugEl.innerText = JSON.stringify({ finish_reason: completion.choices[0].finish_reason, ...completion.usage, max_tokens, article_words, summary_words, elapsed });
  refreshEl.style.display = 'none';
}

const updateWordCount = nbWords => {
  if (!articleEl.value) return;

  summaryLengthEl.innerText = nbWords + ' words';
}

wordsEl.oninput = e => updateWordCount(e.target.value);
wordsEl.onchange = _ => updateSummary(false);
article.oninput = _ => updateSummary(true);
