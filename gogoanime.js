// amvstr.js

/**
 * Searches for anime using the Amvstr API.
 * Assumes the API endpoint returns a JSON object with a structure similar to:
 * { data: { animes: [ { id, name, poster, episodes: { dub: ... } } ] } }
 */
async function searchResults(keyword) {
    try {
        const encodedKeyword = encodeURIComponent(keyword);
        const responseText = await fetch(`https://api.amvstr.me/api/v1/search?q=${encodedKeyword}`);
        const data = JSON.parse(responseText);

        const transformedResults = data.results.map(anime => ({
            title: anime.title,
            image: anime.image_url,
            href: `https://anitaku.bz/${anime.id}`
        }));

        return JSON.stringify(transformedResults);
    } catch (error) {
        console.log('Fetch error in searchResults:', error);
        return JSON.stringify([{ title: 'Error', image: '', href: '' }]);
    }
}

/**
 * Extracts detailed information for a given anime.
 * Expects the URL format to be: https://amvstr.me/watch/{animeID}
 * Assumes the details endpoint returns:
 * { data: { anime: { info: { description, stats: { duration } }, moreInfo: { aired } } } }
 */
async function extractDetails(url) {
    try {
        const match = url.match(/https:\/\/anitaku\.bz\/(.+)$/);
        if (!match) throw new Error("Invalid URL format");
        const encodedID = match[1];
        const responseText = await fetch(`https://api.amvstr.me/api/v1/info/${encodedID}`);
        const data = JSON.parse(responseText);
        
        const transformedResults = [{
            description: data.synopsis || 'No description available',
            aliases: `Duration: Unknown`,
            airdate: `Aired: ${data.released ? data.released : 'Unknown'}`
        }];
        
        return JSON.stringify(transformedResults);
    } catch (error) {
        console.log('Details error:', error);
        return JSON.stringify([{
            description: 'Error loading description',
            aliases: 'Duration: Unknown',
            airdate: 'Aired: Unknown'
        }]);
    }
}

/**
 * Retrieves the list of episodes for the given anime.
 * Expects the URL format to be: https://amvstr.me/watch/{animeID}
 * Assumes the episodes endpoint returns:
 * { data: { episodes: [ { episodeId, number } ] } }
 */
async function extractEpisodes(url) {
    try {
        const match = url.match(/https:\/\/anitaku\.bz\/(.+)$/);
        if (!match) throw new Error("Invalid URL format");
        const encodedID = match[1];
        const responseText = await fetch(`https://api.amvstr.me/api/v1/episode/${encodedID}`);
        const data = JSON.parse(responseText);

        console.log(match);
        console.log(match[1]);

        const transformedResults = data.episodes.map(episode => {
            return {
                href: `https://anitaku.bz/${episode.id}`,
                number: episode.episode
            };
        });
        
        return JSON.stringify(transformedResults);
    } catch (error) {
        console.log('Fetch error in extractEpisodes:', error);
        return JSON.stringify([]);
    }    
}

/**
 * Extracts the HLS stream URL for a given episode.
 * Expects the URL format to be: https://amvstr.me/watch/{animeID}
 * Assumes the stream sources endpoint returns:
 * { data: { sources: [ { type, url } ] } }
 */
async function extractStreamUrl(url) {
    try {
       const match = url.match(/https:\/\/amvstr\.me\/watch\/(.+)$/);
       if (!match) throw new Error("Invalid URL format");
       const encodedID = match[1];
       const responseText = await fetch(`https://api.amvstr.me/api/v1/amvstr/episode/sources?animeEpisodeId=${encodedID}&category=dub`);
       const data = JSON.parse(responseText);
       
       // Look for the HLS source in the returned sources list.
       const hlsSource = data.data.sources.find(source => source.type === 'hls');
       return hlsSource ? hlsSource.url : null;
    } catch (error) {
       console.log('Fetch error in extractStreamUrl:', error);
       return null;
    }
}
