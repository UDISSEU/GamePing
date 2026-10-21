export type PromoGame = {
  id: string;
  title: string;
  store: string;
  old: string;
  price: string;
  discount: string;
  image: string;
  url: string;
  appUrl?: string;
  steamAppId?: string;
  gameId: string;
  popularity: number;
  priceValue: number;
  onSale: boolean;
  category: GameCategory;
  trailerUrl?: string;
};

export type GameCategory = "Ação" | "RPG" | "Estratégia" | "Indie" | "Corrida" | "Simulação" | "Outros";
export type GamePreview = { type: "hls" | "mp4" | "youtube"; url: string };

export type FreeGame = {
  id: string;
  title: string;
  store: string;
  until: string;
  image: string;
  url: string;
};

type CheapSharkDeal = {
  dealID: string;
  title: string;
  storeID: string;
  salePrice: string;
  normalPrice: string;
  savings: string;
  isOnSale: string;
  thumb: string;
  gameID: string;
  steamRatingCount: string;
  steamAppID: string | null;
};

type GamerPowerGiveaway = {
  id: number;
  title: string;
  thumbnail: string;
  platforms: string;
  end_date: string;
  status: string;
  open_giveaway_url: string;
};

type CheapSharkGame = {
  gameID: string;
  external: string;
  steamAppID: string | null;
  cheapest: string;
  cheapestDealID: string;
  thumb: string;
};

type CheapSharkGameDetails = {
  info?: { title?: string; steamAppID?: string; thumb?: string };
  deals?: {
    dealID: string;
    storeID: string;
    price: string;
    retailPrice: string;
    savings: string;
  }[];
};

type SteamStoreResponse = Record<string, {
  success: boolean;
  data?: {
    header_image?: string;
    screenshots?: { path_full: string; path_thumbnail: string }[];
    movies?: { hls_h264?: string; mp4?: { max?: string; "480"?: string } }[];
  };
}>;

type YouTubeSearchResponse = {
  items?: {
    id?: { videoId?: string };
    snippet?: { title?: string; channelTitle?: string };
  }[];
};

type SteamSearchResponse = {
  items?: { id: number; name: string; type: string }[];
};

const storeNames: Record<string, string> = {
  "1": "Steam",
  "7": "GOG",
  "25": "Epic Games",
};

const storeIds = Object.keys(storeNames);
const usdBrlCacheKey = "gameping:usd-brl";
const usdBrlUpdatedKey = "gameping:usd-brl-updated";
const usdBrlCacheDuration = 12 * 60 * 60 * 1000;
const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});
const steamTrailerCache = new Map<string, GamePreview | null>();
const steamTrailerRequests = new Map<string, Promise<GamePreview | null>>();
const steamStoreDataCache = new Map<string, SteamStoreResponse[string]["data"] | null>();
const steamStoreDataRequests = new Map<string, Promise<SteamStoreResponse[string]["data"] | null>>();
const steamSearchCache = new Map<string, string | null>();
const youtubeTrailerCache = new Map<string, GamePreview | null>();
const youtubeTrailerRequests = new Map<string, Promise<GamePreview | null>>();
const gameDetailsCache = new Map<string, CheapSharkGameDetails | null>();

export const gameCategories: GameCategory[] = ["Ação", "RPG", "Estratégia", "Indie", "Corrida", "Simulação", "Outros"];

function categorizeGame(title: string): GameCategory {
  const normalized = title.toLocaleLowerCase("en");
  if (/\b(rpg|witcher|elden ring|dark souls|baldur|skyrim|fallout|final fantasy|dragon age|mass effect|persona)\b/.test(normalized)) return "RPG";
  if (/\b(strategy|strateg|civilization|xcom|total war|age of|command|conquer|warhammer|starcraft|company of heroes)\b/.test(normalized)) return "Estratégia";
  if (/\b(racing|racer|forza|need for speed|dirt|grid autosport|motogp|assetto corsa)\b/.test(normalized)) return "Corrida";
  if (/\b(simulator|simulation|simulador|farming|tycoon|planet zoo|cities: skylines|house flipper)\b/.test(normalized)) return "Simulação";
  if (/\b(indie|hollow knight|hades|celeste|stardew|undertale|dead cells|terraria|cuphead|spelunky)\b/.test(normalized)) return "Indie";
  if (/\b(action|shooter|doom|resident evil|grand theft auto|red dead|assassin|far cry|battlefield|call of duty|tomb raider|cyberpunk|borderlands|devil may cry)\b/.test(normalized)) return "Ação";
  return "Outros";
}

function normalizeGameTitle(title: string): string {
  return title
    .replace(/\s*\([^)]*\)\s*(?:key\s*)?giveaway\s*$/i, "")
    .replace(/\s+giveaway\s*$/i, "")
    .replace(/[®™©]/g, "")
    .toLocaleLowerCase("en")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function getYouTubeGameTitle(title: string): string {
  return title
    .replace(/\s*\((?:epic games?|indiegala|itch\.io|steam|gog|stove|giveaway|key)\)\s*/gi, " ")
    .replace(/\s+(?:key\s+)?giveaway\s*$/i, "")
    .replace(/\s+\((?:key\s+)?giveaway\)\s*$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function findSteamAppId(title: string, signal: AbortSignal): Promise<string | null> {
  const normalizedTitle = normalizeGameTitle(title);
  const cached = steamSearchCache.get(normalizedTitle);
  if (cached !== undefined) return cached;

  const params = new URLSearchParams({ term: normalizedTitle, cc: "br", l: "english" });
  const result = await fetchJson<SteamSearchResponse>(`/steam-api/storesearch/?${params}`, signal);
  const exactMatch = result.items?.find((item) => item.type === "app" && normalizeGameTitle(item.name) === normalizedTitle);
  const appId = exactMatch ? String(exactMatch.id) : null;
  steamSearchCache.set(normalizedTitle, appId);
  return appId;
}

export async function fetchGameTrailer(title: string, steamAppId: string | undefined, signal: AbortSignal): Promise<GamePreview | null> {
  let steamError: unknown;
  let primaryAppId = steamAppId;
  try {
    primaryAppId ??= await findSteamAppId(title, signal) ?? undefined;
    const primaryTrailer = primaryAppId ? await fetchCachedSteamTrailer(primaryAppId) : null;
    if (primaryTrailer) return primaryTrailer;

    const searchedAppId = steamAppId ? await findSteamAppId(title, signal) : null;
    if (searchedAppId && searchedAppId !== primaryAppId) {
      const searchedTrailer = await fetchCachedSteamTrailer(searchedAppId);
      if (searchedTrailer) return searchedTrailer;
    }
  } catch (error) {
    if (signal.aborted) throw error;
    steamError = error;
  }

  try {
    const youtubePreview = await fetchYouTubeTrailer(title, signal);
    if (youtubePreview || !steamError) return youtubePreview;
  } catch (error) {
    if (signal.aborted) throw error;
    if (steamError) throw new Error(`Steam: ${String(steamError)} YouTube: ${String(error)}`);
    throw error;
  }
  throw new Error(`Não foi possível carregar a prévia da Steam: ${String(steamError)}`);
}

async function fetchCachedSteamTrailer(steamAppId: string): Promise<GamePreview | null> {
  const pending = steamTrailerRequests.get(steamAppId);
  if (pending) return pending;

  const request = fetchSteamTrailer(steamAppId, AbortSignal.timeout(15000));
  steamTrailerRequests.set(steamAppId, request);
  try {
    return await request;
  } finally {
    steamTrailerRequests.delete(steamAppId);
  }
}

export async function fetchSteamArtwork(steamAppId: string, hero: boolean): Promise<string | null> {
  const data = await fetchCachedSteamStoreData(steamAppId, AbortSignal.timeout(15000));
  if (hero) return data?.screenshots?.[0]?.path_full ?? data?.header_image ?? null;
  return data?.header_image ?? data?.screenshots?.[0]?.path_full ?? null;
}

async function fetchCachedSteamStoreData(steamAppId: string, signal: AbortSignal): Promise<SteamStoreResponse[string]["data"] | null> {
  const cached = steamStoreDataCache.get(steamAppId);
  if (cached !== undefined) return cached;
  const pending = steamStoreDataRequests.get(steamAppId);
  if (pending) return pending;

  const request = (async () => {
    const result = await fetchJson<SteamStoreResponse>(
      `/steam-api/appdetails?appids=${encodeURIComponent(steamAppId)}&l=english`,
      signal,
    );
    const app = result[steamAppId];
    return app?.success ? app.data ?? null : null;
  })();
  steamStoreDataRequests.set(steamAppId, request);
  try {
    const data = await request;
    steamStoreDataCache.set(steamAppId, data);
    return data;
  } finally {
    steamStoreDataRequests.delete(steamAppId);
  }
}

export async function fetchSteamTrailer(steamAppId: string, signal: AbortSignal): Promise<GamePreview | null> {
  const cached = steamTrailerCache.get(steamAppId);
  if (cached !== undefined) return cached;

  const data = await fetchCachedSteamStoreData(steamAppId, signal);
  if (!data) {
    steamTrailerCache.set(steamAppId, null);
    return null;
  }

  const movie = data.movies?.find((item) => item.hls_h264);
  const masterUrl = movie?.hls_h264;
  if (!masterUrl) {
    const mp4Movie = data.movies?.find((item) => item.mp4?.["480"] || item.mp4?.max);
    const mp4Url = mp4Movie?.mp4?.["480"] ?? mp4Movie?.mp4?.max ?? null;
    const mp4Preview = mp4Url ? { type: "mp4" as const, url: mp4Url } : null;
    steamTrailerCache.set(steamAppId, mp4Preview);
    return mp4Preview;
  }

  const masterResponse = await fetch(masterUrl, { signal });
  if (!masterResponse.ok) throw new Error(`A Steam respondeu com status ${masterResponse.status} ao carregar o trailer.`);
  const masterPlaylist = await masterResponse.text();
  const lines = masterPlaylist.split(/\r?\n/);
  const variants: { url: string; bandwidth: number; resolution: number }[] = [];
  for (let index = 0; index < lines.length - 1; index += 1) {
    const streamInfo = lines[index];
    const playlistPath = lines[index + 1]?.trim();
    if (!streamInfo.startsWith("#EXT-X-STREAM-INF:") || !playlistPath || playlistPath.startsWith("#")) continue;
    const bandwidth = Number(streamInfo.match(/BANDWIDTH=(\d+)/)?.[1] ?? Number.MAX_SAFE_INTEGER);
    const resolution = Number(streamInfo.match(/RESOLUTION=\d+x(\d+)/)?.[1] ?? Number.MAX_SAFE_INTEGER);
    variants.push({ url: new URL(playlistPath, masterUrl).toString(), bandwidth, resolution });
  }

  const videoPlaylistUrl = variants.sort((a, b) => a.resolution - b.resolution || a.bandwidth - b.bandwidth)[0]?.url ?? masterUrl;
  const hlsPreview = { type: "hls" as const, url: videoPlaylistUrl };
  steamTrailerCache.set(steamAppId, hlsPreview);
  return hlsPreview;
}

export async function fetchYouTubeTrailer(title: string, signal: AbortSignal): Promise<GamePreview | null> {
  const normalizedTitle = normalizeGameTitle(title);
  const cached = youtubeTrailerCache.get(normalizedTitle);
  if (cached !== undefined) return cached;
  const pending = youtubeTrailerRequests.get(normalizedTitle);
  if (pending) return pending;

  const request = (async () => {
    const gameTitle = getYouTubeGameTitle(title);
    const params = new URLSearchParams({
      q: `${gameTitle} gameplay`,
      part: "snippet",
      type: "video",
      maxResults: "5",
      videoEmbeddable: "true",
      videoSyndicated: "true",
      safeSearch: "moderate",
      order: "relevance",
    });
    const result = await fetchJson<YouTubeSearchResponse>(`/youtube-api/search?${params}`, signal);
    const titleTokens = normalizeGameTitle(gameTitle).split(" ").filter((token) => token.length > 1);
    const match = result.items?.find((item) => {
      const videoId = item.id?.videoId;
      const videoTitle = normalizeGameTitle(item.snippet?.title ?? "");
      return Boolean(
        videoId
        && /^[\w-]{11}$/.test(videoId)
        && titleTokens.every((token) => videoTitle.includes(token))
        && /gameplay|game play|walkthrough|playthrough|let'?s play/i.test(item.snippet?.title ?? ""),
      );
    });
    const videoId = match?.id?.videoId;
    return videoId
      ? {
        type: "youtube" as const,
        url: `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${videoId}&playsinline=1&rel=0`,
      }
      : null;
  })();
  youtubeTrailerRequests.set(normalizedTitle, request);
  try {
    const preview = await request;
    youtubeTrailerCache.set(normalizedTitle, preview);
    return preview;
  } finally {
    youtubeTrailerRequests.delete(normalizedTitle);
  }
}

async function fetchJson<T>(url: string, signal: AbortSignal): Promise<T> {
  const response = await fetch(url, { signal });
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { error?: unknown } | null;
    if (typeof body?.error === "string") throw new Error(body.error);
    throw new Error(`A API respondeu com status ${response.status}.`);
  }
  return response.json() as Promise<T>;
}

export async function fetchUsdBrl(signal: AbortSignal) {
  const cachedRate = Number(window.localStorage.getItem(usdBrlCacheKey));
  const cachedAt = Number(window.localStorage.getItem(usdBrlUpdatedKey));
  if (Number.isFinite(cachedRate) && cachedRate > 0 && Date.now() - cachedAt < usdBrlCacheDuration) {
    return { rate: cachedRate, updatedAt: cachedAt, stale: false };
  }
  try {
    const result = await fetchJson<{ rates: { BRL: number } }>(
      "https://open.er-api.com/v6/latest/USD",
      signal,
    );
    if (!Number.isFinite(result.rates.BRL) || result.rates.BRL <= 0) {
      throw new Error("A cotação USD/BRL retornada é inválida.");
    }
    const updatedAt = Date.now();
    window.localStorage.setItem(usdBrlCacheKey, String(result.rates.BRL));
    window.localStorage.setItem(usdBrlUpdatedKey, String(updatedAt));
    return { rate: result.rates.BRL, updatedAt, stale: false };
  } catch (error) {
    if (signal.aborted) throw error;
    if (Number.isFinite(cachedRate) && cachedRate > 0 && Number.isFinite(cachedAt)) {
      return { rate: cachedRate, updatedAt: cachedAt, stale: true };
    }
    throw new Error(`Não foi possível consultar a cotação do dólar. ${String(error)}`);
  }
}

export async function fetchActiveDeals(signal: AbortSignal, usdBrl: number) {
  const results = await Promise.allSettled(
    storeIds.map(async (storeId) => {
      const params = new URLSearchParams({
        storeID: storeId,
        onSale: "1",
        pageSize: "60",
        sortBy: "DealRating",
        desc: "1",
      });
      const deals = await fetchJson<CheapSharkDeal[]>(
        `https://www.cheapshark.com/api/1.0/deals?${params}`,
        signal,
      );
      return deals
        .filter((deal) => deal.isOnSale === "1" && Number(deal.savings) > 0)
        .map((deal): PromoGame => ({
          id: deal.dealID,
          title: deal.title,
          store: storeNames[deal.storeID] ?? "Loja",
          old: currency.format(Number(deal.normalPrice) * usdBrl),
          price: currency.format(Number(deal.salePrice) * usdBrl),
          discount: `-${Math.round(Number(deal.savings))}%`,
          image: deal.thumb,
          url: deal.storeID === "1" && deal.steamAppID
            ? `https://store.steampowered.com/app/${deal.steamAppID}`
            : `https://www.cheapshark.com/redirect?dealID=${encodeURIComponent(deal.dealID)}`,
          appUrl: deal.storeID === "1" && /^\d+$/.test(deal.steamAppID ?? "")
            ? `steam://store/${deal.steamAppID}`
            : undefined,
          steamAppId: /^\d+$/.test(deal.steamAppID ?? "") ? deal.steamAppID ?? undefined : undefined,
          gameId: deal.gameID,
          popularity: Number(deal.steamRatingCount) || 0,
          priceValue: Number(deal.salePrice) * usdBrl,
          onSale: true,
          category: categorizeGame(deal.title),
        }));
    }),
  );

  const deals: PromoGame[] = [];
  const errors: string[] = [];
  results.forEach((result, index) => {
    if (result.status === "fulfilled") {
      deals.push(...result.value);
    } else if (!signal.aborted) {
      errors.push(`${storeNames[storeIds[index]]}: ${String(result.reason)}`);
    }
  });

  if (deals.length === 0 && errors.length === storeIds.length) {
    throw new Error(errors.join(" "));
  }

  return {
    deals: deals.sort((a, b) => b.popularity - a.popularity),
    errors,
  };
}

export async function searchGameCatalog(query: string, signal: AbortSignal, usdBrl: number, limit = 15) {
  const params = new URLSearchParams({ title: query, limit: String(limit) });
  const results = await fetchJson<CheapSharkGame[]>(
    `https://www.cheapshark.com/api/1.0/games?${params}`,
    signal,
  );
  return Promise.all(results.map(async (game): Promise<PromoGame> => {
    let details = gameDetailsCache.get(game.gameID);
    if (details === undefined) {
      try {
        details = await fetchJson<CheapSharkGameDetails>(
          `https://www.cheapshark.com/api/1.0/games?id=${encodeURIComponent(game.gameID)}`,
          signal,
        );
        gameDetailsCache.set(game.gameID, details);
      } catch (error) {
        if (signal.aborted) throw error;
        details = null;
        gameDetailsCache.set(game.gameID, null);
      }
    }

    const deals = (details?.deals ?? [])
      .filter((deal) => Number.isFinite(Number(deal.price)) && Number(deal.price) > 0 && Number.isFinite(Number(deal.retailPrice)) && Number(deal.retailPrice) > 0)
      .sort((a, b) => Number(a.price) - Number(b.price));
    const bestDeal = deals[0];
    const onSale = bestDeal ? Number(bestDeal.price) < Number(bestDeal.retailPrice) : false;
    const priceValue = bestDeal ? Number(onSale ? bestDeal.price : bestDeal.retailPrice) * usdBrl : Number.POSITIVE_INFINITY;
    const retailPrice = bestDeal ? Number(bestDeal.retailPrice) * usdBrl : null;
    const salePrice = bestDeal ? Number(bestDeal.price) * usdBrl : null;
    const discount = onSale && bestDeal ? `-${Math.round(Number(bestDeal.savings))}%` : "";
    const steamAppId = details?.info?.steamAppID ?? game.steamAppID;
    const dealUrl = bestDeal?.dealID
      ? `https://www.cheapshark.com/redirect?dealID=${encodeURIComponent(bestDeal.dealID)}`
      : game.steamAppID
        ? `https://store.steampowered.com/app/${game.steamAppID}`
        : `https://www.cheapshark.com/redirect?gameID=${encodeURIComponent(game.gameID)}`;

    return {
      id: `catalog-${game.gameID}`,
      gameId: game.gameID,
      title: details?.info?.title ?? game.external,
      store: bestDeal ? storeNames[bestDeal.storeID] ?? "Loja" : "Catálogo de jogos",
      old: onSale && retailPrice !== null ? currency.format(retailPrice) : "",
      price: priceValue === Number.POSITIVE_INFINITY
        ? "Preço indisponível"
        : currency.format(priceValue),
      discount,
      image: details?.info?.thumb ?? game.thumb,
      url: dealUrl,
      appUrl: /^\d+$/.test(steamAppId ?? "")
        ? `steam://store/${steamAppId}`
        : undefined,
      steamAppId: /^\d+$/.test(steamAppId ?? "") ? steamAppId ?? undefined : undefined,
      popularity: 0,
      priceValue,
      onSale,
      category: categorizeGame(details?.info?.title ?? game.external),
    };
  }));
}

export async function fetchActiveFreeGames(signal: AbortSignal) {
  const giveaways = await fetchJson<GamerPowerGiveaway[]>(
    "https://www.gamerpower.com/api/giveaways?platform=pc&type=game",
    signal,
  );
  const now = Date.now();

  return giveaways
    .filter((giveaway) => {
      if (giveaway.status !== "Active") return false;
      if (giveaway.end_date === "N/A") return true;
      const endDate = new Date(`${giveaway.end_date.replace(" ", "T")}Z`).getTime();
      return Number.isFinite(endDate) && endDate > now;
    })
    .map((giveaway): FreeGame => ({
      id: String(giveaway.id),
      title: giveaway.title,
      store: giveaway.platforms.split(",").map((platform) => platform.trim()).find((platform) => platform !== "PC") ?? "PC",
      until:
        giveaway.end_date === "N/A"
          ? "Disponível por tempo limitado"
          : `Grátis até ${new Date(`${giveaway.end_date.replace(" ", "T")}Z`).toLocaleDateString("pt-BR")}`,
      image: giveaway.thumbnail,
      url: giveaway.open_giveaway_url,
    }));
}
