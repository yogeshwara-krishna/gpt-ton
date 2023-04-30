import axios from "axios";
require("dotenv").config();
const newsApiApiKey = process.env.NEWS_API_KEY;

async function fetchNewsArticles(query: string): Promise<string> {
  try {
    const response = await axios.get(
      `https://newsapi.org/v2/everything?q=${query}&apiKey=${newsApiApiKey}`
    );
    return JSON.stringify(response.data.articles);
  } catch (error) {
    console.error("Error fetching news articles:", error);
    return "";
  }
}

(async () => {
  const args = process.argv.slice(2);
  const searchTerm = args[0];

  const newsArticles = await fetchNewsArticles(searchTerm);
  console.log(newsArticles);
})();
