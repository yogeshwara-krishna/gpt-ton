const rapidApiKey = "07585b4120mshbc941a57c6ebd11p11de9bjsn089233df6ab2";

const allSportsApi2BaseUrl = "https://allsportsapi2.p.rapidapi.com";

const allSportsApi2BaseUrlHeaders = {
  "X-RapidAPI-Key": `${rapidApiKey}`,
  "X-RapidAPI-Host": "allsportsapi2.p.rapidapi.com",
};

export const getSchedule = async () => {
  try {
    const response = await fetch(
      `${allSportsApi2BaseUrl}/api/matches/4/4/2023`,
      {
        method: "GET",
        headers: allSportsApi2BaseUrlHeaders,
      }
    );
    const body = await response.json();
    return body;
  } catch (error) {
    console.error("Error getting leagues: ", error);
    return [];
  }
};

export const getAllMatchesByDate = async (
  date: Date,
  category: "soccer" | "cricket" | "basketball" | "tennis"
) => {
  const day = date.getDate(),
    month = date.getMonth() + 1,
    year = date.getFullYear();
  const endpoints = {
    soccer: `/api/matches/${day}/${month}/${year}`,
    cricket: `/api/cricket/matches/${day}/${month}/${year}`,
    basketball: `/api/basketball/matches/${day}/${month}/${year}`,
    tennis: `/api/tennis/events/${day}/${month}/${year}`,
  };
  try {
    const response = await fetch(
      `${allSportsApi2BaseUrl}${endpoints[category]}`,
      {
        method: "GET",
        headers: allSportsApi2BaseUrlHeaders,
      }
    );
    const body = await response.json();
    return body;
  } catch (error) {
    console.error("Error getting leagues: ", error);
    return [];
  }
};

export const getTeamDetails = async (teamID: string, category: string) => {
  const cat =
    category.toLowerCase() !== "soccer" ? `/${category.toLowerCase()}` : "";
  try {
    const response = await fetch(
      `${allSportsApi2BaseUrl}/api${cat}/team/${teamID}`,
      {
        method: "GET",
        headers: allSportsApi2BaseUrlHeaders,
      }
    );
    return response.json();
  } catch (e) {
    console.error(e);
  }
};

export const getScheduleMatchByCategory = async (
  teamID: string,
  category: string
) => {
  const cat =
    category.toLowerCase() !== "soccer" ? `/${category.toLowerCase()}` : "";
  try {
    const response = await fetch(
      `${allSportsApi2BaseUrl}/api${cat}/team/${teamID}/matches/next/0`,
      {
        method: "GET",
        headers: allSportsApi2BaseUrlHeaders,
      }
    );

    return response.json();
  } catch (e) {
    console.error(e);
  }
};

export const getTeamLogo = async (teamID: number, category: string) => {
  const cat =
    category.toLowerCase() !== "soccer" ? `/${category.toLowerCase()}` : "";
  try {
    const response = await fetch(
      `${allSportsApi2BaseUrl}/api${cat}/team/${teamID}/image`,
      {
        method: "GET",
        headers: allSportsApi2BaseUrlHeaders,
      }
    );

    //convert response to url
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    return url;
  } catch (e) {
    console.error(e);
  }
};

export const searchTeam = async (query: string, category: string) => {
  const cat =
    category.toLowerCase() !== "soccer" ? `/${category.toLowerCase()}` : "";
  try {
    const resp = await (
      await fetch(`${allSportsApi2BaseUrl}/api${cat}/search/${query}`, {
        method: "GET",
        headers: allSportsApi2BaseUrlHeaders,
      })
    ).json();
    return resp.results;
  } catch (e) {
    console.error(e);
  }
};

export const getMatchDetails = async (
  matchID: string,
  category: "soccer" | "cricket" | "basketball" | "tennis"
) => {
  const endpoints = {
    soccer: `/api/match/${matchID}`,
    cricket: `/api/cricket/match/${matchID}`,
    basketball: `/api/basketball/match/${matchID}`,
    tennis: `/api/tennis/event/${matchID}`,
  };
  try {
    const response = await fetch(
      `${allSportsApi2BaseUrl}${endpoints[category]}`,
      {
        method: "GET",
        headers: allSportsApi2BaseUrlHeaders,
      }
    );
    const body = await response.json();
    return body.event;
  } catch (e) {
    console.error(e);
  }
};
