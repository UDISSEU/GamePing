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
  platforms: string[];
  until: string;
  image: string;
  url: string;
  kind: "limited" | "free-to-play";
  steamAppId?: string;
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
  cheapestPriceEver?: { price: string; date: number };
  deals?: {
    dealID: string;
    storeID: string;
    price: string;
    retailPrice: string;
    savings: string;
  }[];
};

type CheapSharkStore = { storeID: string; storeName: string; isActive: number };

type SteamStoreResponse = Record<string, {
  success: boolean;
  data?: {
    header_image?: string;
    short_description?: string;
    developers?: string[];
    publishers?: string[];
    genres?: { description: string }[];
    categories?: { id: number; description: string }[];
    release_date?: { date: string; coming_soon: boolean };
    screenshots?: { path_full: string; path_thumbnail: string }[];
    movies?: { hls_h264?: string; mp4?: { max?: string; "480"?: string } }[];
  };
}>;

export type GameOffer = {
  id: string;
  store: string;
  price: string;
  priceValue: number;
  normalPrice: string;
  discount: string;
  url: string;
  platform?: string;
  type?: string;
  edition?: string;
  checkedAt?: string;
};

type GameHunterSearchResponse = {
  hits?: {
    title?: string;
    slug?: string;
    result_type?: string;
  }[];
};

type GameHunterGameResponse = {
  title?: string;
  prices?: {
    product_id?: number;
    price?: number;
    original_price?: number | null;
    edition?: string | null;
    discount_pct?: number | null;
    in_stock?: number;
    stock_status?: string;
    freshness?: string;
    store_name?: string;
    platform?: string;
    type?: string;
    last_checked_at?: string;
    scraped_at?: string;
    affiliate_url?: string | null;
    product_url?: string | null;
  }[];
};

export type SteamGameDetails = {
  description: string;
  developers: string[];
  publishers: string[];
  genres: string[];
  steamCloud: boolean;
  releaseDate: string;
  screenshots: string[];
};

export function officialStoreSearchUrl(store: string, title: string) {
  const cleanTitle = title
    .replace(/\s*\(Steam\)\s*(?:Key\s*)?Giveaway\s*$/i, "")
    .replace(/\s+(?:Key\s*)?Giveaway\s*$/i, "")
    .trim();
  const query = encodeURIComponent(cleanTitle);
  switch (store.toLocaleLowerCase("en")) {
    case "steam":
      return `https://store.steampowered.com/search/?term=${query}`;
    case "xbox":
    case "xbox store":
      return `https://www.xbox.com/pt-BR/Search/Results?q=${query}`;
    case "playstation":
    case "playstation store":
      return `https://store.playstation.com/pt-br/search/${query}`;
    default:
      return "";
  }
}

type YouTubeSearchResponse = {
  items?: {
    id?: { videoId?: string };
    snippet?: { title?: string; channelTitle?: string };
  }[];
};

type SteamSearchResponse = {
  items?: { id: number; name: string; type: string }[];
};

type SteamFreeGameSearchResponse = {
  items?: { name?: string; logo?: string }[];
};

const storeNames: Record<string, string> = {
  "1": "Steam",
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
const gameHunterPlatformCache = new Map<string, { playStation: boolean; xbox: boolean }>();
const gameHunterPlatformRequests = new Map<string, Promise<{ playStation: boolean; xbox: boolean }>>();
let cheapSharkStoreNamesPromise: Promise<Map<string, string>> | null = null;

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
    .replace(/\s*\((?:indiegala|itch\.io|steam|gog|stove|giveaway|key)\)\s*/gi, " ")
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

export async function fetchSteamGameDetails(steamAppId: string | undefined, title: string, signal: AbortSignal): Promise<SteamGameDetails | null> {
  const resolvedAppId = steamAppId ?? await findSteamAppId(title, signal) ?? undefined;
  if (!resolvedAppId) return null;
  const data = await fetchCachedSteamStoreData(resolvedAppId, signal);
  if (!data) return null;
  return {
    description: data.short_description ?? "",
    developers: data.developers ?? [],
    publishers: data.publishers ?? [],
    genres: data.genres?.map((genre) => genre.description) ?? [],
    steamCloud: data.categories?.some((category) => category.id === 23 || /steam cloud/i.test(category.description)) ?? false,
    releaseDate: data.release_date?.date ?? "",
    screenshots: data.screenshots?.map((screenshot) => screenshot.path_full) ?? [],
  };
}

export async function fetchSteamCloudSupport(steamAppId: string | undefined, title: string, signal: AbortSignal) {
  const resolvedAppId = steamAppId ?? await findSteamAppId(title, signal) ?? undefined;
  if (!resolvedAppId) return false;
  const data = await fetchCachedSteamStoreData(resolvedAppId, signal);
  return data?.categories?.some((category) => category.id === 23 || /steam cloud/i.test(category.description)) ?? false;
}

async function fetchCheapSharkStoreNames(): Promise<Map<string, string>> {
  cheapSharkStoreNamesPromise ??= fetchJson<CheapSharkStore[]>(
    "/cheapshark-api/stores",
    AbortSignal.timeout(10000),
  )
    .then((stores) => new Map(stores.map((store) => [store.storeID, store.storeName])))
    .catch((error: unknown) => {
      cheapSharkStoreNamesPromise = null;
      throw error;
    });
  return cheapSharkStoreNamesPromise;
}

function isOfficialConsoleStoreOffer(record: NonNullable<GameHunterGameResponse["prices"]>[number]) {
  const storeName = record.store_name;
  const allowedHost = storeName === "Xbox Store"
    ? (host: string) => host === "xbox.com" || host.endsWith(".xbox.com")
    : storeName === "PlayStation Store"
      ? (host: string) => host === "playstation.com" || host.endsWith(".playstation.com")
      : null;
  if (!allowedHost) return false;
  return [record.affiliate_url, record.product_url].some((value) => {
    if (typeof value !== "string") return false;
    try {
      const url = new URL(value);
      return url.protocol === "https:" && allowedHost(url.hostname.toLowerCase());
    } catch {
      return false;
    }
  });
}

export async function fetchGameOffers(gameId: string, usdBrl: number, signal: AbortSignal) {
  let details = gameDetailsCache.get(gameId);
  if (details === undefined) {
    details = await fetchJson<CheapSharkGameDetails>(
      `/cheapshark-api/games?id=${encodeURIComponent(gameId)}`,
      signal,
    );
    gameDetailsCache.set(gameId, details);
  }
  if (!details) return { offers: [], historicalLow: null, storeNamesError: "" };
  const steamAppId = details.info?.steamAppID;

  let storeNameMap: Map<string, string>;
  let storeNamesError = "";
  try {
    storeNameMap = await fetchCheapSharkStoreNames();
  } catch (error) {
    if (signal.aborted) throw error;
    storeNameMap = new Map(Object.entries(storeNames));
    storeNamesError = `Não foi possível carregar os nomes da loja Steam: ${String(error)}`;
  }

  const offers = (details.deals ?? [])
    .filter((deal) => deal.storeID === "1" && Number.isFinite(Number(deal.price)) && Number(deal.price) >= 0)
    .map((deal): GameOffer => {
      const priceValue = Number(deal.price) * usdBrl;
      const originalValue = Number(deal.retailPrice);
      const hasOriginalPrice = Number.isFinite(originalValue) && originalValue >= Number(deal.price);
      const checkedAt = new Date().toISOString();
      return {
        id: deal.dealID,
        store: storeNameMap.get(deal.storeID) ?? `Loja ${deal.storeID}`,
        price: currency.format(priceValue),
        priceValue,
        normalPrice: hasOriginalPrice ? currency.format(originalValue * usdBrl) : "",
        discount: Number(deal.savings) > 0 ? `-${Math.round(Number(deal.savings))}%` : "",
        url: /^\d+$/.test(steamAppId ?? "")
          ? `https://store.steampowered.com/app/${steamAppId}`
          : `https://store.steampowered.com/search/?term=${encodeURIComponent(details.info?.title ?? "")}`,
        platform: "PC",
        type: "digital",
        checkedAt,
      };
    })
    .sort((a, b) => a.priceValue - b.priceValue);
  return { offers, historicalLow: null, storeNamesError };
}

export async function fetchGameHunterConsoleOffers(title: string, signal: AbortSignal) {
  const params = new URLSearchParams({ q: title, limit: "8" });
  const search = await fetchJson<GameHunterSearchResponse>(`/gamehunter-api/search?${params}`, signal);
  const normalizedTitle = normalizeGameTitle(title);
  const match = search.hits?.find((hit) =>
    hit.result_type === "game" &&
    typeof hit.slug === "string" &&
    normalizeGameTitle(hit.title ?? "") === normalizedTitle
  );
  if (!match?.slug) return { matched: false, offers: [] as GameOffer[] };

  const game = await fetchJson<GameHunterGameResponse>(
    `/gamehunter-api/games/${encodeURIComponent(match.slug)}`,
    signal,
  );
  if (normalizeGameTitle(game.title ?? "") !== normalizedTitle) {
    throw new Error("O título retornado pelo GameHunter não corresponde ao jogo consultado.");
  }

  const offers = (game.prices ?? [])
    .filter((record) => {
      const price = record.price;
      const inStock = record.in_stock === 1 || record.stock_status === "in_stock";
      return typeof record.platform === "string" &&
        isOfficialConsoleStoreOffer(record) &&
        inStock &&
        record.freshness === "fresh" &&
        typeof price === "number" &&
        Number.isFinite(price) &&
        price >= 0;
    })
    .map((record): GameOffer => {
      const priceValue = record.price!;
      const originalValue = record.original_price;
      const normalPrice = typeof originalValue === "number" && Number.isFinite(originalValue) && originalValue >= priceValue
        ? currency.format(originalValue)
        : "";
      const discount = typeof record.discount_pct === "number" && record.discount_pct > 0
        ? `-${Math.round(record.discount_pct)}%`
        : "";
      const offerUrl = [record.affiliate_url, record.product_url].find((value) => {
        if (typeof value !== "string") return false;
        try {
          const url = new URL(value);
          const isOfficialHost = record.store_name === "Xbox Store"
            ? url.hostname === "xbox.com" || url.hostname.endsWith(".xbox.com")
            : url.hostname === "playstation.com" || url.hostname.endsWith(".playstation.com");
          return url.protocol === "https:" && isOfficialHost;
        } catch {
          return false;
        }
      });

      return {
        id: `gamehunter-${record.product_id ?? record.store_name}-${record.platform}`,
        store: record.store_name ?? "Loja",
        price: currency.format(priceValue),
        priceValue,
        normalPrice,
        discount,
        url: offerUrl ?? `https://gamehunter.com.br/jogo/${encodeURIComponent(match.slug!)}`,
        platform: record.platform,
        type: record.type,
        edition: typeof record.edition === "string" ? record.edition : undefined,
        checkedAt: record.last_checked_at ?? record.scraped_at ?? new Date().toISOString(),
      };
    })
    .sort((a, b) => a.priceValue - b.priceValue);
  return { matched: true, offers };
}

export function fetchGameHunterConsolePlatforms(title: string) {
  const cacheKey = normalizeGameTitle(title);
  const cached = gameHunterPlatformCache.get(cacheKey);
  if (cached) return Promise.resolve(cached);

  const pending = gameHunterPlatformRequests.get(cacheKey);
  if (pending) return pending;

  const request = fetchGameHunterConsoleOffers(title, AbortSignal.timeout(12000))
    .then(({ offers }) => {
      const platforms = {
        playStation: offers.some((offer) => /^ps[345]$/i.test(offer.platform ?? "")),
        xbox: offers.some((offer) => /^xbox\b/i.test(offer.platform ?? "")),
      };
      gameHunterPlatformCache.set(cacheKey, platforms);
      return platforms;
    })
    .finally(() => gameHunterPlatformRequests.delete(cacheKey));

  gameHunterPlatformRequests.set(cacheKey, request);
  return request;
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

async function fetchJson<T>(url: string, signal: AbortSignal, cache: RequestCache = "default"): Promise<T> {
  const response = await fetch(url, { signal, cache });
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

// Jogos populares de console usados para buscar ofertas Xbox/PlayStation no GameHunter.
const consoleFeaturedTitles = [
  "EA Sports FC 26",
  "EA Sports FC 25",
  "Elden Ring",
  "Elden Ring Nightreign",
  "Red Dead Redemption 2",
  "GTA V",
  "Grand Theft Auto V",
  "Cyberpunk 2077",
  "Hogwarts Legacy",
  "Call of Duty Black Ops 6",
  "Forza Horizon 5",
  "Halo Infinite",
  "Marvel's Spider-Man 2",
  "Marvel's Spider-Man: Miles Morales",
  "Marvel's Spider-Man Remastered",
  "God of War Ragnarok",
  "The Last of Us Part II Remastered",
  "Horizon Forbidden West",
  "Ghost of Tsushima",
  "Nioh Collection",
  "Days Gone",
  "Returnal",
  "Demon's Souls",
  "Astro Bot",
  "Ratchet & Clank: Rift Apart",
];

export async function fetchActiveDeals(signal: AbortSignal, usdBrl: number) {
  // Busca várias páginas de ofertas para que jogos famosos (ex.: Undertale),
  // que ficam além da primeira página da API, apareçam no site.
  const pageNumbers = [0, 1, 2, 3, 4, 5];
  const results = await Promise.allSettled(
    storeIds.flatMap((storeId) => pageNumbers.map(async (pageNumber) => {
      const params = new URLSearchParams({
        storeID: storeId,
        onSale: "1",
        pageSize: "60",
        sortBy: "DealRating",
        desc: "1",
        pageNumber: String(pageNumber),
      });
      const deals = await fetchJson<CheapSharkDeal[]>(
        `/cheapshark-api/deals?${params}`,
        signal,
        "no-store",
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
          url: deal.storeID === "1" && /^\d+$/.test(deal.steamAppID ?? "")
            ? `https://store.steampowered.com/app/${deal.steamAppID}`
            : `https://store.steampowered.com/search/?term=${encodeURIComponent(deal.title)}`,
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
    })),
  );

  const allDeals: PromoGame[] = [];
  const errors: string[] = [];
  for (const result of results) {
    if (result.status === "fulfilled") {
      allDeals.push(...result.value);
    } else {
      errors.push(String(result.reason));
    }
  }

  const seen = new Set<string>();
  const uniqueDeals = allDeals.filter((deal) => {
    const key = deal.gameId || deal.title.toLocaleLowerCase("en");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Jogos famosos nem sempre aparecem nas primeiras páginas da API
  // (a ordenação por "DealRating" pode omiti-los), então buscamos
  // diretamente pelos títulos mais populares conhecidos.
  const famousTitles = [
    "Undertale",
    "Hollow Knight",
    "Stardew Valley",
    "Hades",
    "Celeste",
    "Cuphead",
    "Terraria",
    "Dead Cells",
    "Sekiro",
    "Elden Ring",
    "Red Dead Redemption 2",
    "Cyberpunk 2077",
    "The Witcher 3",
    "Dark Souls III",
    "Baldur's Gate 3",
  ];
  const missingFamous = famousTitles.filter((title) =>
    !uniqueDeals.some((deal) => deal.title.toLocaleLowerCase("en") === title.toLocaleLowerCase("en")));
  const famousResults = await Promise.allSettled(
    missingFamous.map(async (title) => {
      const params = new URLSearchParams({
        storeID: "1",
        onSale: "1",
        pageSize: "5",
        title,
      });
      const deals = await fetchJson<CheapSharkDeal[]>(
        `/cheapshark-api/deals?${params}`,
        signal,
        "no-store",
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
          url: deal.storeID === "1" && /^\d+$/.test(deal.steamAppID ?? "")
            ? `https://store.steampowered.com/app/${deal.steamAppID}`
            : `https://store.steampowered.com/search/?term=${encodeURIComponent(deal.title)}`,
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
  for (const result of famousResults) {
    if (result.status !== "fulfilled") continue;
    for (const deal of result.value) {
      const key = deal.gameId || deal.title.toLocaleLowerCase("en");
      if (!seen.has(key)) {
        seen.add(key);
        uniqueDeals.push(deal);
      }
    }
  }

  // Ofertas Xbox/PlayStation (GameHunter) dos jogos populares de console.
  // Apenas ofertas realmente em promoção (com desconto) entram no feed;
  // itens a preço cheio são descartados.
  const consoleResults = await Promise.allSettled(
    consoleFeaturedTitles.map(async (title): Promise<PromoGame[]> => {
      const { offers } = await fetchGameHunterConsoleOffers(title, signal);
      const consoleOffers = offers.filter((offer) =>
        (offer.store === "Xbox Store" || offer.store === "PlayStation Store") && Boolean(offer.discount));
      if (!consoleOffers.length) return [];
      // Enriquece com capa e steamAppId via CheapShark /games (o endpoint /deals não aceita "title").
      let thumb = "";
      let steamAppId: string | undefined;
      let popularity = 150;
      try {
        const params = new URLSearchParams({ title, limit: "1" });
        const [match] = await fetchJson<CheapSharkGame[]>(
          `/cheapshark-api/games?${params}`,
          signal,
        );
        if (match) {
          thumb = match.thumb;
          if (/^\d+$/.test(match.steamAppID ?? "")) steamAppId = match.steamAppID ?? undefined;
        }
      } catch {
        // Sem capa disponível: o card aparece com o visual padrão.
      }
      return consoleOffers.map((offer, index): PromoGame => ({
        id: `console-${offer.id}-${index}`,
        title: title,
        store: offer.store === "Xbox Store" ? "Xbox" : "PlayStation",
        old: offer.normalPrice,
        price: offer.price,
        discount: offer.discount,
        image: thumb,
        url: offer.url,
        steamAppId,
        gameId: `console-${offer.id}-${index}`,
        popularity,
        priceValue: offer.priceValue,
        onSale: true,
        category: categorizeGame(title),
      }));
    }),
  );
  for (const result of consoleResults) {
    if (result.status !== "fulfilled") continue;
    for (const deal of result.value) {
      const key = deal.gameId;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueDeals.push(deal);
      }
    }
  }

  return {
    deals: uniqueDeals.sort((a, b) => b.popularity - a.popularity),
    errors,
  };
}

export async function searchGameCatalog(query: string, signal: AbortSignal, usdBrl: number, limit = 15) {
  const params = new URLSearchParams({ title: query, limit: String(limit) });
  const results = await fetchJson<CheapSharkGame[]>(
    `/cheapshark-api/games?${params}`,
    signal,
  );
  return Promise.all(results.map(async (game): Promise<PromoGame> => {
    let details = gameDetailsCache.get(game.gameID);
    if (details === undefined) {
      try {
        details = await fetchJson<CheapSharkGameDetails>(
          `/cheapshark-api/games?id=${encodeURIComponent(game.gameID)}`,
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
      .filter((deal) => deal.storeID === "1")
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
    ? /^\d+$/.test(steamAppId ?? "")
      ? `https://store.steampowered.com/app/${steamAppId}`
      : `https://store.steampowered.com/search/?term=${encodeURIComponent(details?.info?.title ?? game.external)}`
    : steamAppId
      ? `https://store.steampowered.com/app/${steamAppId}`
      : `https://store.steampowered.com/search/?term=${encodeURIComponent(game.external)}`;

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
      appUrl: bestDeal?.storeID === "1" && /^\d+$/.test(steamAppId ?? "")
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
  const steamFreeGamePages = [0, 25].map((start) => {
    const params = new URLSearchParams({
      query: "",
      maxprice: "free",
      category1: "998",
      count: "25",
      start: String(start),
      json: "1",
      cc: "br",
      l: "brazilian",
    });
    return fetchJson<SteamFreeGameSearchResponse>(`/steam-store/search/results/?${params}`, signal);
  });
  const [giveawaysResult, ...steamResults] = await Promise.allSettled([
    fetchJson<GamerPowerGiveaway[]>("https://www.gamerpower.com/api/giveaways?type=game", signal),
    ...steamFreeGamePages,
  ]);
  const errors: string[] = [];
  const giveaways = giveawaysResult.status === "fulfilled" ? giveawaysResult.value : [];
  if (giveawaysResult.status === "rejected" && !signal.aborted) {
    errors.push(`Ofertas temporárias: ${String(giveawaysResult.reason)}`);
  }
  const steamGames = steamResults.flatMap((result, index) => {
    if (result.status === "rejected") {
      if (!signal.aborted) errors.push(`Jogos grátis da Steam (página ${index + 1}): ${String(result.reason)}`);
      return [];
    }
    return result.value.items ?? [];
  });
  const now = Date.now();

  const limitedTimeGames = giveaways
    .filter((giveaway) => {
      if (giveaway.status !== "Active") return false;
      if (giveaway.end_date === "N/A") return true;
      const endDate = new Date(`${giveaway.end_date.replace(" ", "T")}Z`).getTime();
      return Number.isFinite(endDate) && endDate > now;
    })
    .map((giveaway) => {
      const platforms = giveaway.platforms.split(",").map((platform) => platform.trim().toLocaleLowerCase("en"));
      const availablePlatforms = [
        ...(platforms.includes("steam") ? ["Steam"] : []),
        ...(platforms.some((platform) => /^xbox(?: one| series(?: x\|s)?| cloud gaming)$/.test(platform)) ? ["Xbox"] : []),
        ...(platforms.some((platform) => /^(?:playstation [45]|ps[45])$/.test(platform)) ? ["PlayStation"] : []),
      ];
      return { giveaway, availablePlatforms };
    })
    .filter(({ availablePlatforms }) => availablePlatforms.length > 0)
    .filter(({ giveaway }, index, filtered) => filtered.findIndex((item) => item.giveaway.id === giveaway.id) === index)
    .map(({ giveaway, availablePlatforms }): FreeGame => ({
      id: String(giveaway.id),
      title: giveaway.title,
      store: availablePlatforms[0],
      platforms: availablePlatforms,
      kind: "limited",
      until:
        giveaway.end_date === "N/A"
          ? "Disponível por tempo limitado"
          : `Grátis até ${new Date(`${giveaway.end_date.replace(" ", "T")}Z`).toLocaleDateString("pt-BR")}`,
      image: giveaway.thumbnail,
      url: officialStoreSearchUrl(availablePlatforms[0], giveaway.title),
    }));
  const limitedTimeTitles = new Set(limitedTimeGames.map((game) => normalizeGameTitle(game.title)));
  const freeToPlayGames = steamGames.flatMap((game): FreeGame[] => {
    const appId = game.logo?.match(/\/apps\/(\d+)\//)?.[1];
    const title = game.name?.trim();
    if (!appId || !title || limitedTimeTitles.has(normalizeGameTitle(title))) return [];
    return [{
      id: `steam-free-${appId}`,
      title,
      store: "Steam",
      platforms: ["Steam"],
      until: "Free-to-play · Grátis permanentemente",
      image: game.logo ?? "",
      url: `https://store.steampowered.com/app/${appId}/`,
      kind: "free-to-play",
      steamAppId: appId,
    }];
  });
  const uniqueGames = new Map<string, FreeGame>();
  [...limitedTimeGames, ...freeToPlayGames].forEach((game) => {
    const key = normalizeGameTitle(game.title);
    if (!uniqueGames.has(key)) uniqueGames.set(key, game);
  });
  if (uniqueGames.size === 0 && errors.length > 0) throw new Error(errors.join(" "));
  return { games: [...uniqueGames.values()], errors };
}
