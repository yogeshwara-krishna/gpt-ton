import axios from "axios";
import { config } from "../config";

const API_KEY = config.googleApiKey;
const SEARCH_ENGINE_ID = config.googleSearchEngineId;

const queryGoogle = async (searchTerm: string) => {
  const url = `https://www.googleapis.com/customsearch/v1?key=${API_KEY}&cx=${SEARCH_ENGINE_ID}&q=${encodeURIComponent(
    searchTerm
  )}&num=20`;
  const res = await axios.get(url);
  const items = res.data.items;
  if (items) {
    consolidateResults(items);
  } else {
    console.error("Error: Unable to fetch search results.");
  }
};

function consolidateResults(items: any[]) {
  const results = items.map((item) => ({
    title: item.title,
    link: item.link,
    snippet: item.snippet,
  }));

  console.log(results);
}
