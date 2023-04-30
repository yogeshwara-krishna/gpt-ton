import axios from "axios";

const wikipediaApiUrl = "https://en.wikipedia.org/w/api.php";
async function searchWikipedia(searchQuery: string): Promise<void> {
  try {
    const response = await axios.get(wikipediaApiUrl, {
      params: {
        action: "query",
        list: "search",
        format: "json",
        srsearch: searchQuery,
        utf8: 1,
        formatversion: 2,
      },
    });

    const searchResults = response.data.query.search;

    console.log("Search Results:");
    searchResults.forEach((result: any) => {
      console.log(`${result.title}: ${result.pageid}`);
    });
  } catch (error) {
    console.error("Error fetching data:", error);
  }
}

searchWikipedia("Node.js");

export { searchWikipedia };
