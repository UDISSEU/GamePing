import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { fetchActiveDeals, fetchActiveFreeGames, fetchGameHunterConsoleOffers, fetchGameHunterConsolePlatforms, fetchGameOffers, fetchGameTrailer, fetchSteamArtwork, fetchSteamCloudSupport, fetchSteamGameDetails, fetchUsdBrl, fetchYouTubeTrailer, gameCategories, officialStoreSearchUrl, searchGameCatalog, searchNintendoCatalog, type FreeGame, type GameCategory, type GameOffer, type GamePreview, type PromoGame, type SteamGameDetails } from "./promotions";

type Page = "home" | "free" | "new" | "game" | "alerts" | "wishlist" | "cart" | "collection";
type CollectionKey = "offers" | "popular" | "other" | "recommended" | "free";
type IconName =
  | "search"
  | "bell"
  | "user"
  | "chevron"
  | "arrow"
  | "heart"
  | "plus"
  | "check"
  | "mail"
  | "menu"
  | "x"
  | "chart"
  | "telegram"
  | "discord"
  | "phone"
  | "instagram"
  | "youtube"
  | "edit"
  | "trash"
  | "cart";
type SortOrder = "popular" | "price-asc" | "price-desc";
type GamePlatform = "PC" | "PlayStation" | "Xbox";
type SavedCartItem = { gameId: string; title: string; image: string; url: string; appUrl?: string; store: string; price: string; priceValue: number };

const images = {
  rider:
    "https://images.unsplash.com/photo-1642345843526-6279c8880a49?auto=format&fit=crop&w=1800&q=88",
  purple:
    "https://images.unsplash.com/flagged/photo-1579451443170-44b3963c3341?auto=format&fit=crop&w=900&q=85",
  digital:
    "https://images.unsplash.com/photo-1705510144116-cc4d88838b14?auto=format&fit=crop&w=1600&q=88",
  alley:
    "https://images.unsplash.com/photo-1635205411883-ae35d1169f60?auto=format&fit=crop&w=900&q=85",
  neon:
    "https://images.unsplash.com/photo-1634910440823-193b061d28a5?auto=format&fit=crop&w=900&q=85",
  soldier:
    "https://images.unsplash.com/photo-1533972751724-9135a8410a4c?auto=format&fit=crop&w=900&q=85",
  stage:
    "https://images.unsplash.com/photo-1610232801646-58c90c3c5355?auto=format&fit=crop&w=900&q=85",
};

type PriceAlert = { id: string; title: string; target: string };

const prototypeWishlistTitles = new Set(["neon requiem", "night protocol"]);

function readSaved<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const saved = window.localStorage.getItem(key);
    return saved ? JSON.parse(saved) as T : fallback;
  } catch {
    return fallback;
  }
}

function readSavedFavorites() {
  const favorites = readSaved<unknown>("gameping:favorites", []);
  if (!Array.isArray(favorites)) return [];
  return favorites.filter((title): title is string =>
    typeof title === "string" && !prototypeWishlistTitles.has(title.trim().toLocaleLowerCase("en"))
  );
}

function readSavedAlerts() {
  const savedAlerts = readSaved<unknown>("gameping:alerts", []);
  if (!Array.isArray(savedAlerts)) return [];
  return savedAlerts.filter((alert): alert is PriceAlert =>
    typeof alert === "object" &&
    alert !== null &&
    "id" in alert &&
    typeof alert.id === "string" &&
    "title" in alert &&
    typeof alert.title === "string" &&
    !prototypeWishlistTitles.has(alert.title.trim().toLocaleLowerCase("en")) &&
    "target" in alert &&
    typeof alert.target === "string"
  );
}

function openOffer(url: string) {
  if (/^steam:\/\/store\/\d+$/.test(url)) {
    window.open(url, "_blank", "noopener,noreferrer");
    return;
  }
  try {
    const parsedUrl = new URL(url);
    const allowedHost = ["steampowered.com", "epicgames.com", "xbox.com", "playstation.com"]
      .some((domain) => parsedUrl.hostname === domain || parsedUrl.hostname.endsWith(`.${domain}`));
    if (parsedUrl.protocol !== "https:" || !allowedHost) {
      throw new Error("Only official Steam, Epic Games, Xbox, and PlayStation links can be opened.");
    }
    window.open(parsedUrl.toString(), "_blank", "noopener,noreferrer");
  } catch (error) {
    console.error("Blocked a non-official store link:", error);
    window.alert("Este link não pertence a uma loja oficial permitida e foi bloqueado.");
  }
}

function normalizeCartStore(store: string) {
  const normalized = store.toLocaleLowerCase("en");
  if (normalized.includes("steam")) return "Steam";
  if (normalized.includes("epic")) return "Epic Games";
  if (normalized.includes("xbox")) return "Xbox";
  if (normalized.includes("playstation")) return "PlayStation";
  return "Steam";
}

function normalizeSavedCartItem(item: SavedCartItem): SavedCartItem {
  const store = normalizeCartStore(item.store);
  const appUrl = store === "Steam" && item.appUrl && /^steam:\/\/store\/\d+$/.test(item.appUrl)
    ? item.appUrl
    : undefined;
  return {
    ...item,
    store,
    url: officialStoreSearchUrl(store, item.title),
    appUrl,
  };
}

function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, ReactNode> = {
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></>,
    user: <><circle cx="12" cy="8" r="4" /><path d="M4 21c.8-5 3.4-7 8-7s7.2 2 8 7" /></>,
    chevron: <path d="m9 18 6-6-6-6" />,
    arrow: <><path d="M5 12h14" /><path d="m14 7 5 5-5 5" /></>,
    heart: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />,
    plus: <><path d="M12 5v14" /><path d="M5 12h14" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>,
    menu: <><path d="M4 7h16" /><path d="M4 12h16" /><path d="M4 17h16" /></>,
    x: <><path d="m6 6 12 12" /><path d="m18 6-12 12" /></>,
    chart: <><path d="M4 19V5" /><path d="M4 19h16" /><path d="m6 15 4-5 4 3 5-7" /></>,
    telegram: <><path d="m21 3-7.5 18-4-7-7-4Z" /><path d="M9.5 14 21 3" /></>,
    discord: <><path d="M8 8a13 13 0 0 1 8 0l2 8c-1.7 1.5-3.4 2.2-5 2.5l-1-1.5-1 1.5c-1.8-.3-3.5-1-5-2.5Z" /><circle cx="9.5" cy="13" r=".8" fill="currentColor" /><circle cx="14.5" cy="13" r=".8" fill="currentColor" /></>,
    phone: <><rect x="7" y="2" width="10" height="20" rx="2" /><path d="M10 5h4M11 19h2" /><path d="M14.5 10a2.5 2.5 0 0 0-5 0c0 2-1 2-1 3h7c0-1-1-1-1-3" /></>,
    instagram: <><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r=".8" fill="currentColor" /></>,
    youtube: <><path d="M21 8.3a2.8 2.8 0 0 0-2-2C17.2 6 12 6 12 6s-5.2 0-7 .3a2.8 2.8 0 0 0-2 2A29 29 0 0 0 3 12a29 29 0 0 0 .3 3.7 2.8 2.8 0 0 0 2 2c1.7.3 6.9.3 6.9.3s5.2 0 7-.3a2.8 2.8 0 0 0 2-2 29 29 0 0 0 .3-3.7 29 29 0 0 0-.5-3.7Z" /><path d="m10 15 5-3-5-3Z" /></>,
    edit: <><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" /></>,
    trash: <><path d="M4 7h16M9 7V4h6v3M7 7l1 14h8l1-14M10 11v6M14 11v6" /></>,
    cart: <><path d="M3 3h2l2.4 12.4a2 2 0 0 0 2 1.6h8.8a2 2 0 0 0 2-1.6L22 8H6" /><circle cx="10" cy="21" r="1" /><circle cx="18" cy="21" r="1" /></>,
  };
  return <svg aria-hidden="true" className="icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">{paths[name]}</svg>;
}

function Button({
  children,
  variant = "primary",
  onClick,
  className = "",
  ariaLabel,
}: {
  children: ReactNode;
  variant?: "primary" | "secondary" | "outline";
  onClick?: () => void;
  className?: string;
  ariaLabel?: string;
}) {
  return <button className={`button button-${variant} ${className}`} onClick={onClick} aria-label={ariaLabel}>{children}</button>;
}

function StoreTag({ children }: { children: ReactNode }) {
  return <span className="store-tag"><span className="store-dot" />{children}</span>;
}

function GameArtwork({ src, steamAppId, hero = false, className, alt = "" }: { src: string; steamAppId?: string; hero?: boolean; className?: string; alt?: string }) {
  const [imageSrc, setImageSrc] = useState(src);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    let cancelled = false;
    setImageSrc(src);
    if (!steamAppId) return () => { cancelled = true; };

    const loadArtwork = () => {
      void fetchSteamArtwork(steamAppId, hero)
        .then((artwork) => {
          if (!cancelled && artwork) setImageSrc(artwork);
        })
        .catch(() => {
          if (!cancelled) setImageSrc(src);
        });
    };
    const image = imageRef.current;
    if (!hero && image && "IntersectionObserver" in window) {
      const observer = new IntersectionObserver((entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          observer.disconnect();
          loadArtwork();
        }
      }, { rootMargin: "300px" });
      observer.observe(image);
      return () => {
        cancelled = true;
        observer.disconnect();
      };
    }
    loadArtwork();
    return () => { cancelled = true; };
  }, [hero, src, steamAppId]);

  return <img ref={imageRef} className={className} src={imageSrc} alt={alt} loading={hero ? "eager" : "lazy"} onError={() => { if (imageSrc !== src) setImageSrc(src); }} />;
}

function Discount({ children, historic = false }: { children: ReactNode; historic?: boolean }) {
  return <span className={historic ? "discount historic" : "discount"}>{historic && <Icon name="chart" size={13} />}{children}</span>;
}

let hlsPlayerPromise: Promise<typeof import("hls.js/light")> | null = null;

function loadHlsPlayer() {
  hlsPlayerPromise ??= import("hls.js/light");
  return hlsPlayerPromise;
}

function useGamePreview(game: { title: string; steamAppId?: string }, active: boolean, enabled = true) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const warmupRef = useRef<HTMLElement>(null);
  const setWarmupRef = useCallback((element: HTMLElement | null) => { warmupRef.current = element; }, []);
  const startLoadingRef = useRef<() => void>(() => {});
  const fallbackRef = useRef<() => void>(() => {});
  const [source, setSource] = useState<GamePreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewPlaying, setPreviewPlaying] = useState(false);
  const [previewLoaded, setPreviewLoaded] = useState(false);
  const [previewError, setPreviewError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    let requested = false;
    let cancelled = false;
    setSource(null);
    setPreviewLoading(false);
    setPreviewPlaying(false);
    setPreviewLoaded(false);
    setPreviewError("");
    const loadTrailer = () => {
      if (requested || !enabled) return;
      requested = true;
      setPreviewLoading(true);
      setPreviewError("");
      fetchGameTrailer(game.title, game.steamAppId, controller.signal)
        .then((preview) => {
          if (cancelled) return;
          setSource(preview);
          if (!preview) setPreviewError("Trailer não encontrado na Steam ou no YouTube.");
          else if (preview.type !== "youtube") void loadHlsPlayer().catch((error: unknown) => {
            if (!cancelled) setPreviewError(`Não foi possível preparar o player: ${String(error)}`);
          });
        })
        .catch((error: unknown) => {
          if (!cancelled && !controller.signal.aborted) setPreviewError(`Não foi possível carregar o trailer: ${String(error)}`);
        })
        .finally(() => {
          if (!cancelled) setPreviewLoading(false);
        });
    };
    startLoadingRef.current = loadTrailer;

    const target = warmupRef.current;
    if (enabled && target && "IntersectionObserver" in window) {
      const observer = new IntersectionObserver((entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          loadTrailer();
          observer.disconnect();
        }
      }, { rootMargin: "300px" });
      observer.observe(target);
      return () => {
        cancelled = true;
        controller.abort();
        observer.disconnect();
      };
    }
    if (enabled) loadTrailer();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [enabled, game.steamAppId, game.title]);

  useEffect(() => {
    if (active) startLoadingRef.current();
  }, [active]);

  useEffect(() => {
    const video = videoRef.current;
    if (!active || !source || source.type === "youtube" || !video) return;

    let cancelled = false;
    let fallbackRequested = false;
    const fallbackController = new AbortController();
    const fallbackToYouTube = () => {
      if (cancelled || fallbackRequested) return;
      fallbackRequested = true;
      setPreviewPlaying(false);
      setPreviewLoaded(false);
      setPreviewError("Trailer Steam falhou; tentando YouTube...");
      void fetchYouTubeTrailer(game.title, fallbackController.signal)
        .then((fallback) => {
          if (cancelled) return;
          if (fallback) {
            setPreviewError("");
            setSource(fallback);
          } else {
            setPreviewError("Trailer Steam falhou e não foi encontrado um trailer correspondente no YouTube.");
          }
        })
        .catch((error: unknown) => {
          if (!cancelled && !fallbackController.signal.aborted) setPreviewError(`Trailer Steam falhou. ${String(error)}`);
        });
    };
    fallbackRef.current = fallbackToYouTube;

    if (source.type === "mp4" || video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = source.url;
      void video.play().catch(() => setPreviewError("O navegador não conseguiu iniciar a prévia."));
      return () => {
        cancelled = true;
        fallbackController.abort();
        if (fallbackRef.current === fallbackToYouTube) fallbackRef.current = () => {};
        video.pause();
        video.removeAttribute("src");
        video.load();
      };
    }

    let hls: import("hls.js").default | undefined;
    void loadHlsPlayer().then(({ default: Hls }) => {
      if (cancelled) return;
      if (!Hls.isSupported()) {
        fallbackToYouTube();
        return;
      }
      hls = new Hls();
      hls.loadSource(source.url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        void video.play().catch(() => setPreviewError("A reprodução do trailer foi bloqueada pelo navegador."));
      });
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) fallbackToYouTube();
      });
    }).catch((error: unknown) => {
      if (!cancelled) setPreviewError(`Não foi possível iniciar o player: ${String(error)}`);
    });
    return () => {
      cancelled = true;
      fallbackController.abort();
      if (fallbackRef.current === fallbackToYouTube) fallbackRef.current = () => {};
      hls?.destroy();
    };
  }, [active, game.title, source]);

  return {
    warmupRef: setWarmupRef,
    videoRef,
    source,
    previewLoading,
    previewPlaying,
    previewLoaded,
    previewError,
    onPlaying: () => {
      setPreviewError("");
      setPreviewPlaying(true);
    },
    onLoaded: () => setPreviewLoaded(true),
    onPause: () => setPreviewPlaying(false),
    onVideoError: () => {
      if (!active) return;
      if (source?.type === "youtube") setPreviewError("O YouTube não conseguiu carregar esta prévia.");
      else fallbackRef.current();
    },
    previewLabel: previewPlaying
      ? "PRÉVIA DO JOGO"
      : previewLoading || previewError?.includes("tentando YouTube") ? "BUSCANDO PRÉVIA..."
      : previewError || !source ? "PRÉVIA INDISPONÍVEL"
      : !previewLoaded ? "INICIANDO PRÉVIA..." : "PRÉVIA CARREGADA",
  };
}

function PreviewPlayer({ preview, title }: { preview: ReturnType<typeof useGamePreview>; title: string }) {
  if (!preview.source) return null;
  if (preview.source.type === "youtube") {
    return <iframe className="game-preview-frame" src={preview.source.url} title={`Prévia de ${title}`} allow="autoplay; encrypted-media; picture-in-picture" referrerPolicy="strict-origin-when-cross-origin" onLoad={preview.onLoaded} onError={preview.onVideoError} />;
  }
  return <video ref={preview.videoRef} className="game-preview-video" autoPlay muted loop playsInline onPlaying={preview.onPlaying} onPause={preview.onPause} onError={preview.onVideoError} />;
}

function SectionHeader({ eyebrow, title, link, onLink }: { eyebrow?: string; title: string; link?: string; onLink?: () => void }) {
  return (
    <div className="section-heading">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h2>{title}</h2>
      </div>
      {link && <button className="text-link section-more-link" onClick={onLink}>{link}<Icon name="arrow" /></button>}
    </div>
  );
}

function Header({
  page,
  go,
  onLogin,
  cartCount,
  accountEmail,
  onLogout,
  query,
  onSearch,
  games,
  usdBrl,
}: {
  page: Page;
  go: (page: Page) => void;
  onLogin: () => void;
  cartCount: number;
  accountEmail: string;
  onLogout: () => void;
  query: string;
  onSearch: (query: string) => void;
  games: PromoGame[];
  usdBrl: number | null;
}) {
  const [open, setOpen] = useState(false);
  const [searchText, setSearchText] = useState(query);
  const [suggestions, setSuggestions] = useState<PromoGame[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [suggestionsError, setSuggestionsError] = useState("");
  useEffect(() => setSearchText(query), [query]);
  useEffect(() => {
    const term = searchText.trim();
    if (term.length < 2) {
      setSuggestions([]);
      setSuggestionsLoading(false);
      setSuggestionsError("");
      return;
    }

    const activeMatches = games.filter((game) => game.title.toLocaleLowerCase("pt-BR").includes(term.toLocaleLowerCase("pt-BR")));
    const nintendoMatches = searchNintendoCatalog(term);
    if (usdBrl === null) {
      setSuggestions([...activeMatches, ...nintendoMatches].slice(0, 6));
      setSuggestionsLoading(false);
      setSuggestionsError("");
      return;
    }

    const controller = new AbortController();
    setSuggestions([...activeMatches, ...nintendoMatches].slice(0, 6));
    setSuggestionsLoading(true);
    setSuggestionsError("");
    const timeout = window.setTimeout(async () => {
      try {
        const catalogMatches = await searchGameCatalog(term, controller.signal, usdBrl, 6);
        if (controller.signal.aborted) return;
        const availableMatches = [...activeMatches, ...nintendoMatches];
        const activeByTitle = new Map(availableMatches.map((game) => [game.title.toLocaleLowerCase("pt-BR"), game]));
        const merged = catalogMatches.map((game) => activeByTitle.get(game.title.toLocaleLowerCase("pt-BR")) ?? game);
        for (const game of availableMatches) {
          if (!merged.some((match) => match.title.toLocaleLowerCase("pt-BR") === game.title.toLocaleLowerCase("pt-BR"))) merged.push(game);
        }
        setSuggestions(merged.slice(0, 6));
      } catch (error) {
        if (!controller.signal.aborted) {
          setSuggestions([...activeMatches, ...nintendoMatches].slice(0, 6));
          setSuggestionsError(`Não foi possível consultar as sugestões: ${String(error)}`);
        }
      } finally {
        if (!controller.signal.aborted) setSuggestionsLoading(false);
      }
    }, 450);
    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [games, searchText, usdBrl]);

  const submitSearch = (term: string) => {
    const normalizedTerm = term.trim();
    if (!normalizedTerm) return;
    setSearchText(normalizedTerm);
    setSuggestionsOpen(false);
    setOpen(false);
    onSearch(normalizedTerm);
  };

  const searchBox = (className = "") => (
    <div className={`game-search ${className}`}>
      <label className="search">
        <Icon name="search" />
        <input
          aria-label="Buscar jogos"
          aria-autocomplete="list"
          aria-expanded={suggestionsOpen && suggestions.length > 0}
          value={searchText}
          onChange={(event) => { setSearchText(event.target.value); setSuggestionsOpen(true); }}
          onFocus={() => setSuggestionsOpen(true)}
          onKeyDown={(event) => {
            if (event.key === "Escape") setSuggestionsOpen(false);
            if (event.key === "Enter") {
              event.preventDefault();
              submitSearch(searchText);
            }
          }}
          placeholder="Buscar jogos..."
        />
      </label>
      {suggestionsOpen && searchText.trim().length >= 2 && (suggestions.length > 0 || suggestionsLoading || suggestionsError) && (
        <div className="game-search-suggestions" role="listbox" aria-label="Sugestões de jogos">
          {suggestionsLoading && !suggestions.length && <span className="game-search-hint">Buscando jogos...</span>}
          {suggestions.map((game) => (
            <button type="button" role="option" aria-selected="false" key={game.id} onMouseDown={(event) => event.preventDefault()} onClick={() => submitSearch(game.title)}>
              <img src={game.image} alt="" />
              <span className="suggestion-game"><strong>{game.title}</strong><small>{game.onSale ? `Em promoção · ${game.price}` : game.price === "Preço indisponível" ? "Sem promoção ativa · preço indisponível" : game.price === "Consultar preço" ? "Nintendo eShop · consultar preço" : `Sem promoção · preço normal ${game.price}`}</small></span>
              {game.onSale && <span className="suggestion-discount">{game.discount}</span>}
            </button>
          ))}
          {suggestionsError && <span className="game-search-hint">{suggestionsError}</span>}
        </div>
      )}
    </div>
  );

  return (
    <header className="header">
      <div className="header-inner">
        <button className="logo" onClick={() => go("home")} aria-label="GamePing início">
          <span className="logo-mark">G</span><span>GAME<span>PING</span></span>
        </button>
        {searchBox()}
        <nav id="primary-navigation" className={open ? "nav nav-open" : "nav"}>
          <button className={page === "home" ? "active" : ""} onClick={() => { go("home"); setOpen(false); }}>Promoções</button>
          <button className={page === "free" ? "active" : ""} onClick={() => { go("free"); setOpen(false); }}>Grátis</button>
          <button className={page === "new" ? "active" : ""} onClick={() => { go("new"); setOpen(false); }}>Destaques</button>
          <button className={page === "wishlist" ? "active" : ""} onClick={() => { go("wishlist"); setOpen(false); }}>Minha lista</button>
          <button className={page === "cart" ? "active" : ""} onClick={() => { go("cart"); setOpen(false); }}>Carrinho ({cartCount})</button>
        </nav>
        <div className="header-actions">
          <Button className="alerts-entry" ariaLabel="Abrir central de alertas" onClick={() => go("alerts")}><Icon name="bell" /><span>Ativar alertas</span></Button>
          {accountEmail ? <button className="account-chip" onClick={onLogout} title="Sair da conta de demonstração" aria-label="Sair da conta de demonstração"><Icon name="user" />Conta · Sair</button> : <button className="avatar" onClick={onLogin} aria-label="Abrir login"><Icon name="user" /></button>}
          <button className="menu-button" onClick={() => setOpen(!open)} aria-label={open ? "Fechar menu" : "Abrir menu"} aria-expanded={open} aria-controls="primary-navigation"><Icon name={open ? "x" : "menu"} /></button>
        </div>
      </div>
    </header>
  );
}

function GameCard({
  game,
  onClick,
  historic = false,
  favorite,
  onFavorite,
  inCart = false,
  onCart,
  removable = false,
}: {
  game: PromoGame;
  onClick: () => void;
  historic?: boolean;
  favorite: boolean;
  onFavorite: () => void;
  inCart?: boolean;
  onCart?: () => void;
  removable?: boolean;
}) {
  const [previewActive, setPreviewActive] = useState(false);
  const preview = useGamePreview(game, previewActive);
  const cardRef = useRef<HTMLElement>(null);
  const [consolePlatforms, setConsolePlatforms] = useState({ playStation: false, xbox: false });
  const [platformLookupError, setPlatformLookupError] = useState("");
  const [steamCloudStatus, setSteamCloudStatus] = useState<"loading" | "supported" | "unsupported" | "error">("loading");
  const setGameCardRef = useCallback((element: HTMLElement | null) => {
    cardRef.current = element;
    preview.warmupRef(element);
  }, [preview.warmupRef]);

  useEffect(() => {
    const element = cardRef.current;
    if (!element) return;
    let cancelled = false;
    let requested = false;
    const loadPlatforms = () => {
      if (requested) return;
      requested = true;
      setConsolePlatforms({ playStation: false, xbox: false });
      setPlatformLookupError("");
      setSteamCloudStatus("loading");
      void fetchGameHunterConsolePlatforms(game.title)
        .then((platforms) => {
          if (!cancelled) setConsolePlatforms(platforms);
        })
        .catch((error: unknown) => {
          if (!cancelled) setPlatformLookupError(`Não foi possível verificar as lojas de console: ${String(error)}`);
        });
      void fetchSteamCloudSupport(game.steamAppId, game.title, AbortSignal.timeout(12000))
        .then((supported) => {
          if (!cancelled) setSteamCloudStatus(supported ? "supported" : "unsupported");
        })
        .catch(() => {
          if (!cancelled) setSteamCloudStatus("error");
        });
    };

    if (!("IntersectionObserver" in window)) {
      loadPlatforms();
      return () => { cancelled = true; };
    }

    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        observer.disconnect();
        loadPlatforms();
      }
    }, { rootMargin: "250px" });
    observer.observe(element);
    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [game.steamAppId, game.title]);

  const officialStoreLinks = [
    ...(game.steamAppId ? [{
      name: "Steam",
      symbol: "S",
      href: `https://store.steampowered.com/app/${encodeURIComponent(game.steamAppId)}`,
      className: "platform-link-steam",
    }] : []),
    ...(consolePlatforms.playStation ? [{
      name: "PlayStation",
      symbol: "PS",
      href: `https://store.playstation.com/pt-br/search/${encodeURIComponent(game.title.toLocaleLowerCase("pt-BR"))}`,
      className: "platform-link-playstation",
    }] : []),
    ...(consolePlatforms.xbox ? [{
      name: "Xbox",
      symbol: "X",
      href: `https://www.xbox.com/pt-BR/Search/Results?q=${encodeURIComponent(game.title)}`,
      className: "platform-link-xbox",
    }] : []),
    ...(game.store === "Epic Games" ? [{
      name: "Epic Games",
      symbol: "E",
      href: `https://store.epicgames.com/pt-BR/browse?q=${encodeURIComponent(game.title)}`,
      className: "platform-link-epic",
    }] : []),
  ];
  const steamCloudUrl = game.steamAppId
    ? `https://store.steampowered.com/app/${encodeURIComponent(game.steamAppId)}`
    : `https://store.steampowered.com/search/?term=${encodeURIComponent(game.title)}`;

  return (
    <article ref={setGameCardRef} className="game-card" onMouseEnter={() => setPreviewActive(true)} onMouseLeave={() => setPreviewActive(false)} onFocus={() => setPreviewActive(true)} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setPreviewActive(false); }}>
      <button className="game-card-open" onClick={onClick}>
        <div className="game-art"><GameArtwork src={game.image} steamAppId={game.steamAppId} />{previewActive && <PreviewPlayer preview={preview} title={game.title} />}{previewActive && <span className="preview-label">{preview.previewLabel}</span>}{game.onSale ? <Discount>{game.discount}</Discount> : <span className="watch-pill">{game.price === "Preço indisponível" ? "PREÇO INDISPONÍVEL" : game.price === "Consultar preço" ? "CONSULTAR PREÇO" : "SEM PROMOÇÃO"}</span>}</div>
        <div className="game-info"><StoreTag>{game.store}</StoreTag><h3>{game.title}</h3><div className="price-row">{game.onSale && <span className="old-price">{game.old}</span>}<strong>{game.price}</strong></div>{!game.onSale && game.price !== "Preço indisponível" && game.price !== "Consultar preço" && <span className="price-status">Preço normal</span>}{historic && <Discount historic>Menor preço histórico</Discount>}</div>
      </button>
      {(officialStoreLinks.length > 0 || steamCloudStatus === "supported" || steamCloudStatus === "error" || platformLookupError) && <div className="official-platform-links" aria-label={`Lojas e recursos oficiais de ${game.title}`}>
        {officialStoreLinks.map((platform) => <a key={platform.name} className={`platform-link ${platform.className}`} href={platform.href} target="_blank" rel="noopener noreferrer" aria-label={`Abrir ${game.title} na loja oficial ${platform.name}`} title={`Abrir loja oficial ${platform.name}`}><span className="platform-mark" aria-hidden="true">{platform.symbol}</span>{platform.name}</a>)}
        {steamCloudStatus === "supported" && <a className="platform-link platform-link-cloud" href={steamCloudUrl} target="_blank" rel="noopener noreferrer" aria-label={`Abrir ${game.title} na Steam; o jogo oferece salvamento Steam Cloud`} title="O jogo oferece salvamento Steam Cloud"><span className="platform-mark" aria-hidden="true">☁</span>Steam Cloud</a>}
        {steamCloudStatus === "error" && <span className="platform-lookup-error" title="Não foi possível consultar os recursos oficiais da Steam">Steam Cloud não verificado</span>}
        {platformLookupError && <span className="platform-lookup-error" title={platformLookupError}>Não foi possível verificar lojas de console</span>}
      </div>}
      <button className={favorite ? "heart favorited" : "heart"} onClick={onFavorite} aria-label={favorite ? "Remover dos favoritos" : "Salvar e avisar quando entrar em promoção"}><Icon name="heart" /></button>
      {onCart && <button className={inCart ? "cart-action in-cart" : "cart-action"} onClick={onCart} aria-label={inCart ? "Remover do carrinho" : "Adicionar ao carrinho"}><Icon name="cart" size={15} />{inCart ? "No carrinho" : "Adicionar ao carrinho"}</button>}
      {removable && <button className="remove-favorite" onClick={onFavorite}>Remover</button>}
    </article>
  );
}

function LiveOfferCard({ game, onVisit }: { game: PromoGame; onVisit: () => void }) {
  const [previewActive, setPreviewActive] = useState(false);
  const preview = useGamePreview(game, previewActive);
  return (
    <button ref={preview.warmupRef} className="live-card" onClick={onVisit} onMouseEnter={() => setPreviewActive(true)} onMouseLeave={() => setPreviewActive(false)} onFocus={() => setPreviewActive(true)} onBlur={() => setPreviewActive(false)}>
      <div className="live-cover">
        <GameArtwork src={game.image} steamAppId={game.steamAppId} />
        {previewActive && <PreviewPlayer preview={preview} title={game.title} />}
        {previewActive && <span className="preview-label">{preview.previewLabel}</span>}
        <span className="live-tag"><i />AGORA</span>
      </div>
      <div className="live-card-info"><StoreTag>{game.store}</StoreTag><strong>{game.title}</strong><div><span>{game.price}</span><Discount>{game.discount}</Discount></div></div>
    </button>
  );
}

function FreeGameCard({ game, onBuy }: { game: FreeGame; onBuy: () => void }) {
  const [previewActive, setPreviewActive] = useState(false);
  const [steamCloudSupported, setSteamCloudSupported] = useState(false);
  const preview = useGamePreview(game, previewActive);
  useEffect(() => {
    if (game.kind !== "limited" || !game.platforms.includes("Steam")) {
      setSteamCloudSupported(false);
      return;
    }
    let cancelled = false;
    void fetchSteamCloudSupport(undefined, game.title, AbortSignal.timeout(12000))
      .then((supported) => {
        if (!cancelled) setSteamCloudSupported(supported);
      })
      .catch((error: unknown) => {
        console.error(`Unable to verify Steam Cloud support for ${game.title}:`, error);
      });
    return () => { cancelled = true; };
  }, [game.kind, game.platforms, game.title]);
  const platformDetails = game.platforms.map((platform) => ({
    name: platform,
    symbol: platform === "Steam" ? "S" : platform === "Epic Games" ? "E" : platform === "Xbox" ? "X" : "PS",
    className: `free-platform-${platform.toLocaleLowerCase("en").replace(/\s+/g, "-")}`,
    url: officialStoreSearchUrl(platform, game.title),
  }));
  return (
    <article className="free-card" onMouseEnter={() => setPreviewActive(true)} onMouseLeave={() => setPreviewActive(false)} onFocus={() => setPreviewActive(true)} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setPreviewActive(false); }}>
      <button ref={preview.warmupRef} className="free-card-main" onClick={onBuy}>
        <GameArtwork src={game.image} steamAppId={game.steamAppId} />
        {previewActive && <PreviewPlayer preview={preview} title={game.title} />}
        {previewActive && <span className="preview-label">{preview.previewLabel}</span>}
        <div className="free-overlay" />
        <div className="free-info"><StoreTag>{game.store}</StoreTag><h3>{game.title}</h3><span className="free-pill">{game.kind === "free-to-play" ? "GRÁTIS PERMANENTE" : "GRÁTIS AGORA"}</span><p>{game.until}</p></div>
      </button>
      <div className="free-platform-links" aria-label={`Plataformas dispon?veis para ${game.title}`}>
        {platformDetails.map((platform) => <a key={platform.name} className={`free-platform-link ${platform.className}`} href={platform.url} target="_blank" rel="noopener noreferrer" aria-label={`Abrir ${game.title} na loja oficial ${platform.name}`} title={`Abrir na loja oficial ${platform.name}`}><span aria-hidden="true">{platform.symbol}</span>{platform.name}</a>)}
        {steamCloudSupported && <a className="free-platform-link free-platform-cloud" href={officialStoreSearchUrl("Steam", game.title)} target="_blank" rel="noopener noreferrer" aria-label={`O jogo ${game.title} tem Steam Cloud; abrir a loja Steam`} title="Salvamento na nuvem Steam"><span aria-hidden="true">?</span>Steam Cloud</a>}
      </div>
    </article>
  );
}

function CatalogControls({ category, onCategoryChange, sortOrder, onSortChange }: { category: GameCategory | "Todos"; onCategoryChange: (category: GameCategory | "Todos") => void; sortOrder: SortOrder; onSortChange: (sort: SortOrder) => void }) {
  return (
    <div className="catalog-controls">
      <div className="category-filters" aria-label="Categorias de jogos">
        {(["Todos", ...gameCategories] as const).map((item) => <button className={category === item ? "active" : ""} key={item} onClick={() => onCategoryChange(item)}>{item}</button>)}
      </div>
      <label className="sort-control">Ordenar por
        <select value={sortOrder} onChange={(event) => onSortChange(event.target.value as SortOrder)} aria-label="Ordenar promoções">
          <option value="popular">Mais populares</option>
          <option value="price-asc">Menor preço</option>
          <option value="price-desc">Maior preço</option>
        </select>
      </label>
    </div>
  );
}

function Home({
  go,
  favorites,
  games,
  freeGames,
  loading,
  error,
  lastUpdated,
  onRefresh,
  recommendations,
  onVisit,
  onBuy,
  onFavorite,
  cartIds,
  toggleCart,
  usdBrl,
  usdBrlUpdatedAt,
  usdBrlStale,
  personalized,
  onCategoryChange,
  onSortChange,
  category,
  sortOrder,
  onViewMore,
}: {
  go: (page: Page) => void;
  favorites: string[];
  games: PromoGame[];
  freeGames: FreeGame[];
  loading: boolean;
  error: string;
  lastUpdated: Date | null;
  onRefresh: () => void;
  recommendations: PromoGame[];
  onVisit: (game: PromoGame) => void;
  onBuy: (url: string) => void;
  onFavorite: (title: string) => void;
  cartIds: string[];
  toggleCart: (game: PromoGame) => void;
  usdBrl: number | null;
  usdBrlUpdatedAt: number | null;
  usdBrlStale: boolean;
  personalized: boolean;
  category: GameCategory | "Todos";
  sortOrder: SortOrder;
  onCategoryChange: (category: GameCategory | "Todos") => void;
  onSortChange: (sort: SortOrder) => void;
  onViewMore: (collection: CollectionKey) => void;
}) {
  const [slide, setSlide] = useState(0);
  const [dealOffset, setDealOffset] = useState(() => Math.floor(Math.random() * 1000));
  const [heroPreviewGameId, setHeroPreviewGameId] = useState<string | null>(null);
  const visibleGames = games.filter((game) => category === "Todos" || game.category === category);
  if (sortOrder !== "popular") {
    visibleGames.sort((a, b) => sortOrder === "price-asc" ? a.priceValue - b.priceValue : b.priceValue - a.priceValue);
  }
  const rotation = visibleGames.length ? dealOffset % visibleGames.length : 0;
  const rotatedGames = [...visibleGames.slice(rotation), ...visibleGames.slice(0, rotation)];
  const visibleRecommendations = recommendations.filter((game) => category === "Todos" || game.category === category);
  if (sortOrder === "price-asc") visibleRecommendations.sort((a, b) => a.priceValue - b.priceValue);
  if (sortOrder === "price-desc") visibleRecommendations.sort((a, b) => b.priceValue - a.priceValue);
  const current = rotatedGames.length ? rotatedGames[slide % rotatedGames.length] : null;
  const heroPreviewReady = Boolean(current && heroPreviewGameId === current.id);
  const heroPreview = useGamePreview(current ?? { title: "" }, heroPreviewReady, heroPreviewReady);

  useEffect(() => {
    if (games.length < 2) return;
    setDealOffset((offset) => offset + 4);
    setSlide(0);
  }, [games]);

  useEffect(() => {
    setHeroPreviewGameId(null);
    if (!current) return;
    const gameId = current.id;
    const timeout = window.setTimeout(() => setHeroPreviewGameId(gameId), 3000);
    return () => window.clearTimeout(timeout);
  }, [current?.id]);

  const showHeroPreview = heroPreviewReady && (heroPreview.previewPlaying || (heroPreview.source?.type === "youtube" && heroPreview.previewLoaded));

  return (
    <>
      <main>
        <section className={showHeroPreview ? "hero hero-preview-visible" : "hero"}>
          {current
            ? <GameArtwork className="hero-image" src={current.image} steamAppId={current.steamAppId} hero />
            : <img className="hero-image" src={images.rider} alt="" />}
          <div className="hero-shade" />
          {heroPreviewReady && heroPreview.source && <div className="hero-preview-layer"><PreviewPlayer preview={heroPreview} title={current?.title ?? ""} /></div>}
          <div className="hero-content container">
            <div className="hero-copy">
              <div className="hero-kicker"><span>Oferta em destaque</span>{current && <span className="countdown">DESCONTO ATIVO <strong>{current.store}</strong></span>}</div>
              <h1>{current?.title ?? (loading ? "Buscando ofertas..." : "Nenhuma oferta ativa")}</h1>
              <p>{current ? `Oferta ativa na ${current.store}. Os preços são consultados novamente a cada 5 minutos.` : "As promoções atuais das lojas aparecerão aqui assim que forem carregadas."}</p>
              {current && <div className="hero-price"><Discount>{current.discount}</Discount><span><small>{current.old}</small><strong>{current.price}</strong></span></div>}
              {current && <div className="hero-buttons"><Button onClick={() => onVisit(current)}>Ver oferta <Icon name="arrow" /></Button><Button variant="secondary" onClick={() => onFavorite(current.title)}><Icon name="heart" />{favorites.includes(current.title) ? "Remover da lista" : "Adicionar à lista"}</Button></div>}
            </div>
{visibleGames.length > 1 && <div className="carousel-controls">
  <button onClick={() => setSlide((index) => (index + visibleGames.length - 1) % visibleGames.length)} aria-label="Anterior"><Icon name="chevron" /></button>
  <span>{slide % visibleGames.length + 1} / {visibleGames.length}</span>
  <button onClick={() => setSlide((index) => (index + 1) % visibleGames.length)} aria-label="Próximo"><Icon name="chevron" /></button>
            </div>}
          </div>
        </section>

        <div className="container content">
          <section className="live-section">
            <SectionHeader eyebrow="ATUALIZADO AUTOMATICAMENTE" title="Ofertas ativas" link="Ver mais" onLink={() => onViewMore("offers")} />
            <div className="sync-status">
              <span>{error || (loading ? "Carregando promoções..." : `Atualização a cada 5 minutos · Conversão estimada de US$ 1 = R$ ${usdBrl?.toFixed(2).replace(".", ",") ?? "—"}${usdBrlUpdatedAt ? ` · Câmbio de ${new Date(usdBrlUpdatedAt).toLocaleDateString("pt-BR")}${usdBrlStale ? " (em cache)" : ""}` : ""}${lastUpdated ? ` · Ofertas consultadas às ${lastUpdated.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}` : ""}`)}</span>
              <button className="text-link" onClick={onRefresh}>Atualizar agora</button>
            </div>
            {error && games.length > 0 && <p className="sync-warning">{error} As ofertas já carregadas continuam disponíveis.</p>}
            <CatalogControls category={category} onCategoryChange={onCategoryChange} sortOrder={sortOrder} onSortChange={onSortChange} />
            <div className="live-grid">
              {rotatedGames.slice(0, 4).map((game) => <LiveOfferCard key={game.id} game={game} onVisit={() => onVisit(game)} />)}
            </div>
            {!visibleGames.length && !loading && !error && <p className="sync-warning">Nenhuma oferta ativa nesta categoria.</p>}
          </section>

          <section>
            <SectionHeader eyebrow="POR TEMPO LIMITADO" title="Jogos grátis" link="Ver mais" onLink={() => onViewMore("free")} />
            <div className="free-grid">
              {freeGames.slice(0, 6).map((game) => <FreeGameCard key={game.id} game={game} onBuy={() => onBuy(game.url)} />)}
            </div>
            {!freeGames.length && !loading && <p className="sync-warning">Nenhum jogo grátis ativo encontrado.</p>}
          </section>

          <section>
            <SectionHeader eyebrow="POPULARIDADE PELO VOLUME DE AVALIAÇÕES" title="Jogos mais populares" link="Ver mais" onLink={() => onViewMore("popular")} />
            <div className="game-grid">{visibleGames.slice(0, 4).map((game) => <GameCard key={game.id} game={game} onClick={() => onVisit(game)} favorite={favorites.includes(game.title)} onFavorite={() => onFavorite(game.title)} inCart={cartIds.includes(game.gameId)} onCart={() => toggleCart(game)} />)}</div>
          </section>

          <section>
            <SectionHeader eyebrow="MAIS OPORTUNIDADES" title="Outras ofertas ativas" link="Ver mais" onLink={() => onViewMore("other")} />
            <div className="game-grid">{visibleGames.slice(4, 8).map((game) => <GameCard key={game.id} game={game} onClick={() => onVisit(game)} favorite={favorites.includes(game.title)} onFavorite={() => onFavorite(game.title)} inCart={cartIds.includes(game.gameId)} onCart={() => toggleCart(game)} />)}</div>
          </section>
          <section>
            <SectionHeader eyebrow={personalized ? "BASEADO NOS SEUS ACESSOS E POPULARIDADE" : "POPULARIDADE PELO VOLUME DE AVALIAÇÕES"} title="Recomendados para você" link="Ver mais" onLink={() => onViewMore("recommended")} />
            {visibleRecommendations.length ? <div className="game-grid">{visibleRecommendations.slice(0, 4).map((game) => <GameCard key={game.id} game={game} onClick={() => onVisit(game)} favorite={favorites.includes(game.title)} onFavorite={() => onFavorite(game.title)} inCart={cartIds.includes(game.gameId)} onCart={() => toggleCart(game)} />)}</div> : <p className="sync-warning">Ainda não há jogos suficientes para recomendar nesta categoria.</p>}
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}

function SearchResults({ query, go, favorites, toggleFavorite, games, loading, error, onVisit, cartIds, toggleCart, usdBrl, category, onCategoryChange, sortOrder, onSortChange }: { query: string; go: (page: Page) => void; favorites: string[]; toggleFavorite: (title: string) => void; games: PromoGame[]; loading: boolean; error: string; onVisit: (game: PromoGame) => void; cartIds: string[]; toggleCart: (game: PromoGame) => void; usdBrl: number | null; category: GameCategory | "Todos"; onCategoryChange: (category: GameCategory | "Todos") => void; sortOrder: SortOrder; onSortChange: (sort: SortOrder) => void }) {
  const [catalogGames, setCatalogGames] = useState<PromoGame[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogError, setCatalogError] = useState("");
  const normalizedQuery = query.trim().toLocaleLowerCase("pt-BR");
  useEffect(() => {
    if (query.trim().length < 2 || usdBrl === null) {
      setCatalogGames([]);
      setCatalogLoading(false);
      return;
    }
    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setCatalogLoading(true);
      setCatalogError("");
      try {
        setCatalogGames(await searchGameCatalog(query.trim(), controller.signal, usdBrl));
      } catch (reason) {
        if (!controller.signal.aborted) setCatalogError(`Não foi possível buscar no catálogo. ${String(reason)}`);
      } finally {
        if (!controller.signal.aborted) setCatalogLoading(false);
      }
    }, 350);
    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [query, usdBrl]);
  const activeResults = games.filter((game) => `${game.title} ${game.store}`.toLocaleLowerCase("pt-BR").includes(normalizedQuery));
  const nintendoResults = searchNintendoCatalog(normalizedQuery);
  const activeNames = new Set(activeResults.map((game) => game.title.toLocaleLowerCase("pt-BR")));
  const existingNames = new Set([...activeResults, ...catalogGames].map((game) => game.title.toLocaleLowerCase("pt-BR")));
  const results = [...activeResults, ...catalogGames.filter((game) => !activeNames.has(game.title.toLocaleLowerCase("pt-BR"))), ...nintendoResults.filter((game) => !existingNames.has(game.title.toLocaleLowerCase("pt-BR")))]
    .filter((game) => category === "Todos" || game.category === category);
  const activeGameCount = new Set(activeResults.map((game) => game.title.toLocaleLowerCase("pt-BR"))).size;
  if (sortOrder === "price-asc") results.sort((a, b) => Number(b.onSale) - Number(a.onSale) || (a.onSale ? a.priceValue - b.priceValue : a.title.localeCompare(b.title)));
  if (sortOrder === "price-desc") results.sort((a, b) => Number(b.onSale) - Number(a.onSale) || (a.onSale ? b.priceValue - a.priceValue : a.title.localeCompare(b.title)));
  if (sortOrder === "popular") results.sort((a, b) => b.popularity - a.popularity);
  return (
    <main className="catalog-page">
      <div className="container">
        <div className="page-title"><span className="eyebrow">BUSCA</span><h1>Resultados para “{query.trim()}”</h1><p>{loading || catalogLoading
          ? "Consultando promoções ativas e catálogo de jogos..."
          : error && activeGameCount === 0
            ? "Não foi possível confirmar se há uma promoção ativa neste momento."
            : activeGameCount > 0
              ? `Encontramos promoções ativas para ${activeGameCount} jogo${activeGameCount === 1 ? "" : "s"}.`
              : results.length > 0
                ? nintendoResults.length > 0
                  ? "Jogos Nintendo do catálogo aparecem junto com resultados de PC. Abra um título Nintendo para consultar o preço oficial em reais."
                  : "Nenhuma promoção ativa encontrada agora. Os jogos abaixo estão no catálogo e podem ser acompanhados."
                : "Busque pelo nome de um jogo para verificar se está em promoção."}</p></div>
        <CatalogControls category={category} onCategoryChange={onCategoryChange} sortOrder={sortOrder} onSortChange={onSortChange} />
        {results.length ? <div className="game-grid">{results.map((game) => <GameCard key={game.id} game={game} onClick={() => onVisit(game)} favorite={favorites.includes(game.title)} onFavorite={() => toggleFavorite(game.title)} inCart={cartIds.includes(game.gameId)} onCart={() => toggleCart(game)} />)}</div> : <div className="empty-list"><h2>{loading || catalogLoading ? "Buscando jogos..." : catalogError ? "Não foi possível buscar os jogos" : error ? "Não foi possível carregar as ofertas" : "Nenhum jogo encontrado"}</h2><p>{catalogError || error || "Tente buscar por outro nome."}</p><Button onClick={() => go("home")}>Voltar às promoções</Button></div>}
        {catalogError && results.length > 0 && <p className="sync-warning">{catalogError}</p>}
      </div>
      <Footer />
    </main>
  );
}

function FreeGamesPage({ freeGames, loading, error, onBuy }: { freeGames: FreeGame[]; loading: boolean; error: string; onBuy: (url: string) => void }) {
  return (
    <main className="catalog-page">
      <div className="container">
        <div className="page-title"><span className="eyebrow">POR TEMPO LIMITADO</span><h1>Jogos grátis</h1><p>Ofertas gratuitas que ainda estão ativas.</p></div>
        <div className="free-grid">{freeGames.map((game) => <FreeGameCard key={game.id} game={game} onBuy={() => onBuy(game.url)} />)}</div>
        {!freeGames.length && <div className="empty-list"><h2>{loading ? "Carregando jogos grátis..." : error ? "Não foi possível carregar os jogos grátis" : "Nenhum jogo grátis ativo"}</h2><p>{error || "As ofertas gratuitas disponíveis aparecerão aqui."}</p></div>}
      </div>
      <Footer />
    </main>
  );
}

function CollectionPage({
  collection,
  games,
  recommendations,
  freeGames,
  favorites,
  cartIds,
  category,
  sortOrder,
  loading,
  error,
  onBack,
  onVisit,
  onBuy,
  onFavorite,
  toggleCart,
}: {
  collection: CollectionKey;
  games: PromoGame[];
  recommendations: PromoGame[];
  freeGames: FreeGame[];
  favorites: string[];
  cartIds: string[];
  category: GameCategory | "Todos";
  sortOrder: SortOrder;
  loading: boolean;
  error: string;
  onBack: () => void;
  onVisit: (game: PromoGame) => void;
  onBuy: (url: string) => void;
  onFavorite: (title: string) => void;
  toggleCart: (game: PromoGame) => void;
}) {
  const titles: Record<CollectionKey, { eyebrow: string; title: string; description: string }> = {
    offers: { eyebrow: "OFERTAS ATUALIZADAS", title: "Todas as ofertas ativas", description: "Confira todas as promoções disponíveis nas lojas acompanhadas." },
    popular: { eyebrow: "POPULARIDADE PELO VOLUME DE AVALIAÇÕES", title: "Jogos mais populares", description: "Mais jogos em promoção, ordenados por popularidade." },
    other: { eyebrow: "MAIS OPORTUNIDADES", title: "Outras ofertas ativas", description: "Explore as demais ofertas além dos primeiros destaques." },
    recommended: { eyebrow: "SELEÇÃO GAMEPING", title: "Recomendados para você", description: "Mais ofertas selecionadas com base na popularidade e nos seus acessos." },
    free: { eyebrow: "POR TEMPO LIMITADO", title: "Jogos grátis", description: "Todas as ofertas gratuitas que ainda estão ativas." },
  };
  const filteredGames = games.filter((game) => category === "Todos" || game.category === category);
  if (sortOrder !== "popular") {
    filteredGames.sort((a, b) => sortOrder === "price-asc" ? a.priceValue - b.priceValue : b.priceValue - a.priceValue);
  }
  let filteredRecommendations = recommendations.filter((game) => category === "Todos" || game.category === category);
  if (sortOrder === "price-asc") filteredRecommendations = [...filteredRecommendations].sort((a, b) => a.priceValue - b.priceValue);
  if (sortOrder === "price-desc") filteredRecommendations = [...filteredRecommendations].sort((a, b) => b.priceValue - a.priceValue);
  const collectionGames = collection === "other"
    ? filteredGames.slice(4)
    : collection === "recommended"
      ? filteredRecommendations
      : filteredGames;
  const title = titles[collection];
  const emptyMessage = loading ? "Carregando jogos..." : error || "Não há jogos disponíveis nesta coleção no momento.";

  return (
    <main className="catalog-page">
      <div className="container">
        <button className="detail-back" onClick={onBack}>← Voltar às promoções</button>
        <div className="page-title"><span className="eyebrow">{title.eyebrow}</span><h1>{title.title}</h1><p>{title.description}</p></div>
        {collection === "free"
          ? freeGames.length
            ? <div className="free-grid">{freeGames.map((game) => <FreeGameCard key={game.id} game={game} onBuy={() => onBuy(game.url)} />)}</div>
            : <div className="empty-list"><h2>{emptyMessage}</h2></div>
          : collectionGames.length
            ? <div className="game-grid">{collectionGames.map((game) => <GameCard key={game.id} game={game} onClick={() => onVisit(game)} favorite={favorites.includes(game.title)} onFavorite={() => onFavorite(game.title)} inCart={cartIds.includes(game.gameId)} onCart={() => toggleCart(game)} />)}</div>
            : <div className="empty-list"><h2>{emptyMessage}</h2></div>}
      </div>
      <Footer />
    </main>
  );
}

function NewReleasesPage({ favorites, toggleFavorite, games, loading, error, onVisit, cartIds, toggleCart }: { favorites: string[]; toggleFavorite: (title: string) => void; games: PromoGame[]; loading: boolean; error: string; onVisit: (game: PromoGame) => void; cartIds: string[]; toggleCart: (game: PromoGame) => void }) {
  const releases = games;
  return (
    <main className="catalog-page">
      <div className="container">
        <div className="page-title"><span className="eyebrow">OFERTAS ATUALIZADAS</span><h1>Destaques das lojas</h1><p>Ofertas ordenadas pela popularidade aproximada do jogo, usando avaliações públicas.</p></div>
        <div className="game-grid">{releases.map((game) => <GameCard key={game.id} game={game} onClick={() => onVisit(game)} favorite={favorites.includes(game.title)} onFavorite={() => toggleFavorite(game.title)} inCart={cartIds.includes(game.gameId)} onCart={() => toggleCart(game)} />)}</div>
        {!releases.length && <div className="empty-list"><h2>{loading ? "Carregando promoções..." : error ? "Não foi possível carregar as ofertas" : "Nenhuma promoção ativa"}</h2><p>{error || "As ofertas disponíveis aparecerão aqui."}</p></div>}
      </div>
      <Footer />
    </main>
  );
}

function GamePage({
  game,
  games,
  usdBrl,
  favorites,
  cartIds,
  onBack,
  onAlert,
  onBuy,
  onFavorite,
  onCart,
  onVisit,
}: {
  game: PromoGame;
  games: PromoGame[];
  usdBrl: number | null;
  favorites: string[];
  cartIds: string[];
  onBack: () => void;
  onAlert: (game: PromoGame) => void;
  onBuy: (url: string) => void;
  onFavorite: (title: string) => void;
  onCart: (game: PromoGame) => void;
  onVisit: (game: PromoGame) => void;
}) {
  const [offers, setOffers] = useState<GameOffer[]>([]);
  const [historicalLow, setHistoricalLow] = useState<{ price: string; date: number } | null>(null);
  const [offersLoading, setOffersLoading] = useState(true);
  const [offersError, setOffersError] = useState("");
  const [storeNamesError, setStoreNamesError] = useState("");
  const [steamDetails, setSteamDetails] = useState<SteamGameDetails | null>(null);
  const [steamDetailsError, setSteamDetailsError] = useState("");
  const [gameHunterOffers, setGameHunterOffers] = useState<GameOffer[]>([]);
  const [gameHunterMatched, setGameHunterMatched] = useState(false);
  const [gameHunterError, setGameHunterError] = useState("");
  const [platformFilter, setPlatformFilter] = useState<GamePlatform>("PC");
  const [storeFilter, setStoreFilter] = useState("Todas");
  const favorite = favorites.includes(game.title);
  const inCart = cartIds.includes(game.gameId);

  useEffect(() => {
    const controller = new AbortController();
    setOffers([]);
    setHistoricalLow(null);
    setOffersLoading(true);
    setOffersError("");
    setStoreNamesError("");
    setSteamDetails(null);
    setSteamDetailsError("");
    setGameHunterOffers([]);
    setGameHunterMatched(false);
    setGameHunterError("");
    const isNintendoCatalogGame = game.gameId.startsWith("nintendo:");
    setPlatformFilter("PC");
    setStoreFilter("Todas");

    void Promise.allSettled([
      isNintendoCatalogGame
        ? Promise.resolve({ offers: [], historicalLow: null, storeNamesError: "" })
        : usdBrl === null
        ? Promise.reject(new Error("A cotação USD/BRL ainda não está disponível para converter ofertas."))
        : fetchGameOffers(game.gameId, usdBrl, controller.signal),
      isNintendoCatalogGame
        ? Promise.resolve(null)
        : fetchSteamGameDetails(game.steamAppId, game.title, controller.signal),
      fetchGameHunterConsoleOffers(game.title, controller.signal),
    ]).then(([offersResult, steamResult, gameHunterResult]) => {
      if (controller.signal.aborted) return;
      if (offersResult.status === "fulfilled") {
        setOffers(offersResult.value.offers);
        setHistoricalLow(offersResult.value.historicalLow);
        setStoreNamesError(offersResult.value.storeNamesError);
      } else {
        setOffersError(`Não foi possível carregar as ofertas comparáveis: ${String(offersResult.reason)}`);
      }
      if (steamResult.status === "fulfilled") setSteamDetails(steamResult.value);
      else setSteamDetailsError(`Não foi possível carregar os detalhes da Steam: ${String(steamResult.reason)}`);
      if (gameHunterResult.status === "fulfilled") {
        setGameHunterOffers(gameHunterResult.value.offers);
        setGameHunterMatched(gameHunterResult.value.matched);
      } else {
        setGameHunterError(`Não foi possível carregar as ofertas de console: ${String(gameHunterResult.reason)}`);
      }
      setOffersLoading(false);
    });

    return () => controller.abort();
  }, [game.gameId, game.steamAppId, game.title, usdBrl]);

  const playStationOffers = gameHunterOffers.filter((offer) => /^ps[345]$/i.test(offer.platform ?? ""));
  const xboxOffers = gameHunterOffers.filter((offer) => /^xbox\b/i.test(offer.platform ?? ""));
  const platformOffers = platformFilter === "PlayStation"
    ? playStationOffers
    : platformFilter === "Xbox"
      ? xboxOffers
      : offers;
  const filteredOffers = platformFilter === "PC" && storeFilter !== "Todas"
    ? platformOffers.filter((offer) => offer.store === storeFilter)
    : platformOffers;
  const stores = [...new Set(offers.map((offer) => offer.store))];
  const cheapestOffer = offers[0];
  const selectedBestOffer = platformFilter === "PC" ? cheapestOffer : platformOffers[0];
  const comparisonPrice = selectedBestOffer?.price ?? (platformFilter === "PC" && !game.gameId.startsWith("nintendo:") ? game.price : "Preço indisponível");
  const consoleOfferCounts: Record<Exclude<GamePlatform, "PC">, number> = {
    PlayStation: playStationOffers.length,
    Xbox: xboxOffers.length,
  };
  const platformTitle = platformFilter === "PC" ? "PC" : platformFilter;
  const platformSourceNote = platformFilter === "PC"
    ? "Somente ofertas das lojas oficiais Steam e Epic Games. Preços convertidos em reais; confira o valor final na loja."
    : "Somente preços atuais das lojas oficiais Xbox Store e PlayStation Store.";
  const imagesToShow = steamDetails?.screenshots.slice(0, 6) ?? [];
  const developer = steamDetails?.developers.join(", ");
  const genreNames = steamDetails?.genres ?? [];

  return (
    <main className="game-page">
      <div className="game-banner"><GameArtwork src={game.image} steamAppId={game.steamAppId} hero /><div /></div>
      <div className="container game-detail">
        <button className="detail-back" onClick={onBack}>← Voltar às promoções</button>
        <div className="breadcrumbs">GamePing <span>/</span> Ofertas <span>/</span> {game.title}</div>
        <section className="game-overview">
          <div className="cover"><GameArtwork src={game.image} steamAppId={game.steamAppId} alt={game.title} />{game.onSale && <Discount>{game.discount}</Discount>}</div>
          <div className="overview-copy">
            {developer && <span className="developer">Desenvolvedora: <strong>{developer}</strong></span>}
            <h1>{game.title}</h1>
            <p>{steamDetails?.description || `Compare as ofertas disponíveis para ${game.title}. Os valores em reais são estimativas convertidas a partir dos preços informados pela fonte.`}</p>
            <div className="meta">{[...new Set([game.category, ...genreNames])].slice(0, 5).map((genre) => <span key={genre}>{genre}</span>)}{steamDetails?.steamCloud && <span>Steam Cloud</span>}</div>
            <div className="detail-price"><div><small>{selectedBestOffer ? `Preço na ${selectedBestOffer.store}` : platformFilter === "PC" ? "Preço informado" : "Preço indisponível"}</small><strong>{comparisonPrice}</strong></div>{selectedBestOffer?.discount && <Discount>{selectedBestOffer.discount}</Discount>}</div>
            <p className="detail-data-note">{platformFilter === "PC" ? offers.length ? `${offers.length} ofertas encontradas na Steam e Epic Games; preços convertidos em reais.` : "Nenhuma oferta atual encontrada na Steam ou Epic Games." : `${platformOffers.length} preços oficiais atuais encontrados na ${platformFilter === "Xbox" ? "Xbox Store" : "PlayStation Store"}.`}</p>
            <div className="overview-actions">
              <Button onClick={() => onAlert(game)}><Icon name="bell" />Criar alerta de preço</Button>
              <Button variant="secondary" className={favorite ? "wishlist-active" : ""} onClick={() => onFavorite(game.title)}><Icon name="heart" />{favorite ? "Na lista de desejos" : "Salvar jogo"}</Button>
              <Button variant="outline" onClick={() => onCart(game)}><Icon name="cart" />{inCart ? "No carrinho" : "Adicionar ao carrinho"}</Button>
            </div>
          </div>
        </section>

        {imagesToShow.length > 0 && <section className="gallery" aria-label={`Imagens de ${game.title}`}>
          {imagesToShow.map((image, index) => <img key={image} src={image} alt={`${game.title} - imagem ${index + 1}`} loading="lazy" />)}
        </section>}
        {steamDetailsError && <p className="sync-warning">{steamDetailsError}</p>}

        <div className="detail-columns">
          <section className="price-panel">
            <SectionHeader eyebrow="COMPARE E ECONOMIZE" title={`Ofertas ${platformTitle} · ${game.title}`} />
            <p className="offer-source-note">{platformSourceNote}{steamDetails?.steamCloud ? " Steam Cloud é um recurso de salvamento na nuvem, não uma loja." : ""}</p>
            <div className="platform-filters" role="group" aria-label="Filtrar ofertas por plataforma">
              {(["PC", "PlayStation", "Xbox"] as const).map((platform) => (
                <button className={platformFilter === platform ? "active" : ""} key={platform} onClick={() => { setPlatformFilter(platform); setStoreFilter("Todas"); }}>
                  {platform}{platform === "PC" ? ` (${offers.length})` : consoleOfferCounts[platform]}
                </button>
              ))}
            </div>
            {platformFilter === "PC" ? <label className="offer-filter">Loja
              <select value={storeFilter} onChange={(event) => setStoreFilter(event.target.value)} aria-label="Filtrar ofertas por loja">
                <option value="Todas">Todas as lojas ({offers.length})</option>
                {stores.map((store) => <option key={store} value={store}>{store}</option>)}
              </select>
            </label> : <p className="offer-source-note">Preços em BRL; a loja, a plataforma exata e o tipo de mídia aparecem em cada oferta.</p>}
            {offersLoading && <p className="sync-warning">Buscando ofertas atuais...</p>}
            {offersError && <p className="sync-warning">{offersError}</p>}
            {storeNamesError && <p className="sync-warning">{storeNamesError}</p>}
            {platformFilter !== "PC" && gameHunterError && <p className="sync-warning">{gameHunterError}</p>}
            <div className="store-list">
              {filteredOffers.map((offer, index) => (
                <div className="store-row" key={`${offer.id}-${offer.store}`}>
                  <div className="store-brand"><span>{offer.store.charAt(0)}</span><div><strong>{offer.store}</strong>{offer.platform && <small>{offer.platform}{offer.type ? ` · ${offer.type === "physical" ? "Mídia física" : "Digital"}` : ""}</small>}{index === 0 && storeFilter === "Todas" && <small>Menor preço encontrado</small>}</div></div>
                  {offer.discount ? <Discount>{offer.discount}</Discount> : <span className="offer-normal-label">Preço atual</span>}
                  <div className="store-price-group">{offer.normalPrice && <small>{offer.normalPrice}</small>}<strong className="store-price">{offer.price}</strong></div>
                  <Button variant="outline" onClick={() => onBuy(offer.url)}>Ver oferta <Icon name="arrow" /></Button>
                </div>
              ))}
            </div>
            {platformFilter !== "PC" && !offersLoading && !gameHunterError && platformOffers.length === 0 && <p className="platform-unavailable">{gameHunterMatched ? `Nenhuma oferta oficial atual da ${platformFilter === "Xbox" ? "Xbox Store" : "PlayStation Store"} encontrada para este jogo.` : `Não encontramos uma correspondência exata para este jogo no catálogo de preços do GameHunter.`}</p>}
            {platformFilter === "PC" && !offersLoading && !offersError && filteredOffers.length === 0 && <p className="sync-warning">{offers.length ? "Não há ofertas desta loja para o jogo." : "Nenhuma oferta ativa foi encontrada na Steam ou Epic Games."}</p>}
          </section>
          <section className="chart-panel">
            <SectionHeader eyebrow="DADOS DISPONÍVEIS" title="Histórico de preço" />
            {platformFilter !== "PC" ? <p className="sync-warning">O GameHunter não disponibiliza histórico de preços por console nesta integração.</p> : historicalLow ? <div className="history-low"><span>Menor preço registrado pela fonte</span><strong>{historicalLow.price}</strong><small>{historicalLow.date ? new Date(historicalLow.date * 1000).toLocaleDateString("pt-BR") : "Data indisponível"}</small></div> : <p className="sync-warning">A fonte atual não disponibiliza uma série histórica completa para este jogo.</p>}
            {platformFilter === "PC" && <p className="offer-source-note">O menor preço registrado pode ser uma conversão estimada e não confirma disponibilidade atual.</p>}
            {steamDetails?.releaseDate && <p className="detail-fact"><span>Lançamento</span><strong>{steamDetails.releaseDate}</strong></p>}
            {steamDetails?.publishers.length ? <p className="detail-fact"><span>Publicadora</span><strong>{steamDetails.publishers.join(", ")}</strong></p> : null}
          </section>
        </div>

        {games.filter((other) => other.gameId !== game.gameId && other.category === game.category).length > 0 && <section><SectionHeader title="Jogos semelhantes" /><div className="game-grid">{games.filter((other) => other.gameId !== game.gameId && other.category === game.category).slice(0, 4).map((other) => <GameCard key={other.id} game={other} onClick={() => onVisit(other)} favorite={favorites.includes(other.title)} onFavorite={() => onFavorite(other.title)} inCart={cartIds.includes(other.gameId)} onCart={() => onCart(other)} />)}</div></section>}
      </div>
      <Footer />
    </main>
  );
}

function WishlistPage({ favorites, toggleFavorite, go, games, onVisit, cartIds, toggleCart }: { favorites: string[]; toggleFavorite: (title: string) => void; go: (page: Page) => void; games: PromoGame[]; onVisit: (game: PromoGame) => void; cartIds: string[]; toggleCart: (game: PromoGame) => void }) {
  const savedTitles = [...new Set(favorites.map((title) => title.trim()).filter(Boolean))];
  const favoriteGames = games.filter((game, index, currentGames) =>
    savedTitles.some((title) => title.toLocaleLowerCase("pt-BR") === game.title.toLocaleLowerCase("pt-BR")) &&
    currentGames.findIndex((candidate) => candidate.title.toLocaleLowerCase("pt-BR") === game.title.toLocaleLowerCase("pt-BR")) === index
  );
  const waitingGames = savedTitles.filter((title) => !favoriteGames.some((game) => game.title.toLocaleLowerCase("pt-BR") === title.toLocaleLowerCase("pt-BR")));
  return (
    <main className="wishlist-page">
      <div className="container">
        <div className="page-title"><span className="title-icon wishlist-title-icon"><Icon name="heart" /></span><div><span className="eyebrow">SEUS JOGOS FAVORITOS</span><h1>Minha Lista</h1><p>Acompanhe os preços dos jogos que você quer jogar.</p></div></div>
        {savedTitles.length ? (
          <><div className="list-summary"><span>{savedTitles.length} {savedTitles.length === 1 ? "jogo salvo" : "jogos salvos"}</span><span>Você receberá um aviso quando um jogo salvo entrar em promoção.</span></div><div className="game-grid wishlist-grid">{favoriteGames.map((game) => <GameCard key={game.id} game={game} onClick={() => onVisit(game)} favorite onFavorite={() => toggleFavorite(game.title)} inCart={cartIds.includes(game.gameId)} onCart={() => toggleCart(game)} removable />)}</div>{waitingGames.length > 0 && <div className="watching-list"><h2>Aguardando promoção</h2>{waitingGames.map((title) => <div key={title}><span><Icon name="bell" />{title}</span><span>Você será avisado quando aparecer uma oferta ativa.</span><button onClick={() => toggleFavorite(title)}>Remover</button></div>)}</div>}</>
        ) : (
          <div className="empty-list" aria-live="polite"><span><Icon name="heart" size={32} /></span><h2>Nenhum jogo salvo</h2><p>Favorite jogos para acompanhar preços e descontos em um só lugar.</p><Button onClick={() => go("home")}>Explorar promoções <Icon name="arrow" /></Button></div>
        )}
      </div>
    </main>
  );
}

function CartPage({ cart, games, removeFromCart, onBuy }: { cart: SavedCartItem[]; games: PromoGame[]; removeFromCart: (gameId: string) => void; onBuy: (url: string) => void }) {
  const activeItems = cart.map((item) => ({ saved: item, game: games.find((game) => game.gameId === item.gameId) }));
  const total = activeItems.reduce((sum, item) => sum + (item.game?.priceValue ?? 0), 0);
  const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
  return (
    <main className="catalog-page">
      <div className="container">
        <div className="page-title"><span className="title-icon"><Icon name="cart" /></span><div><span className="eyebrow">SUA PRÓXIMA COMPRA</span><h1>Carrinho</h1><p>Os preços são estimativas em reais e podem mudar na loja.</p></div></div>
        {cart.length ? <div className="cart-layout"><section className="cart-items">{activeItems.map(({ saved, game }) => <article className={`cart-item ${(game?.appUrl ?? saved.appUrl) ? "has-app-link" : ""}`} key={saved.gameId}><img src={game?.image ?? saved.image} alt="" /><div><h2>{saved.title}</h2><p>{game ? `${game.store} · ${game.price}` : `Sem oferta ativa · ${saved.price}`}</p></div><button className="cart-store-link" onClick={() => onBuy(game?.url ?? saved.url)}>{game?.store === "Steam" || saved.store === "Steam" ? "Ver na Steam" : "Ir para loja"} <Icon name="arrow" /></button>{(game?.appUrl ?? saved.appUrl) && <button className="steam-app-link" onClick={() => onBuy(game?.appUrl ?? saved.appUrl ?? saved.url)}>Abrir no aplicativo Steam</button>}<button aria-label={`Remover ${saved.title} do carrinho`} onClick={() => removeFromCart(saved.gameId)}><Icon name="trash" /></button></article>)}</section><aside className="cart-summary"><h2>Resumo</h2><p><span>Jogos com oferta ativa</span><strong>{activeItems.filter((item) => item.game).length}</strong></p><p><span>Total estimado</span><strong>{brl.format(total)}</strong></p><small>O valor final e a disponibilidade são confirmados na loja.</small></aside></div> : <div className="empty-list"><span><Icon name="cart" size={32} /></span><h2>Seu carrinho está vazio</h2><p>Adicione jogos às ofertas que você quer comprar.</p></div>}
      </div>
    </main>
  );
}

function Toggle({ active, setActive, label = "Ativar" }: { active: boolean; setActive: (value: boolean) => void; label?: string }) {
  return <button className={active ? "toggle active" : "toggle"} onClick={() => setActive(!active)} aria-label={label} aria-pressed={active}><span /></button>;
}

function AlertsPage({ alerts, onCreate, onDelete, games, favorites, notificationsEnabled, notificationMessage, onNotificationsToggle }: { alerts: PriceAlert[]; onCreate: (title: string, target: string) => void; onDelete: (id: string) => void; games: PromoGame[]; favorites: string[]; notificationsEnabled: boolean; notificationMessage: string; onNotificationsToggle: (value: boolean) => void }) {
  const [alertMenu, setAlertMenu] = useState<string | null>(null);
  const [gameTitle, setGameTitle] = useState("");
  const [targetPrice, setTargetPrice] = useState("60,00");
  useEffect(() => {
    if (!gameTitle && (games.length || favorites.length)) setGameTitle(games[0]?.title ?? favorites[0]);
  }, [gameTitle, games, favorites]);
  return (
    <main className="alerts-page">
      <div className="container">
        <div className="page-title"><span className="title-icon"><Icon name="bell" /></span><div><span className="eyebrow">NÃO PERCA NENHUMA OFERTA</span><h1>Central de Alertas</h1><p>Acompanhe preços e receba avisos do seu jeito.</p></div></div>
        <section className="active-alerts">
          <SectionHeader title="Alertas ativos" />
          <div className="alert-cards">
            {alerts.map((alert) => {
              const game = games.find((item) => item.title === alert.title);
              return <div className="alert-card" key={alert.id}><img src={game?.image ?? images.digital} alt="" /><div className="alert-main">{game && <StoreTag>{game.store}</StoreTag>}<h3>{game?.title ?? alert.title}</h3><div className="target"><span>Preço-alvo<strong>R$ {alert.target}</strong></span><Icon name="arrow" /><span>Preço atual<strong>{game?.price ?? "Oferta encerrada"}</strong></span></div></div><div className="alert-status"><span><i />{game ? "ATIVO" : "AGUARDANDO"}</span><button aria-label={`Opções do alerta de ${alert.title}`} aria-expanded={alertMenu === alert.id} onClick={() => setAlertMenu(alertMenu === alert.id ? null : alert.id)}>•••</button>{alertMenu === alert.id && <div className="alert-menu"><button className="danger" onClick={() => { onDelete(alert.id); setAlertMenu(null); }}><Icon name="trash" />Excluir alerta</button></div>}</div></div>;
            })}
            {!alerts.length && <div className="empty-list"><h2>Você ainda não tem alertas</h2><p>Escolha um jogo e defina o preço que gostaria de pagar.</p></div>}
          </div>
        </section>

        <div className="alerts-layout">
          <section className="form-card">
            <div className="form-head"><span><Icon name="plus" /></span><div><h2>Criar novo alerta</h2><p>Você será avisado assim que o preço chegar lá.</p></div></div>
            <label>Jogo<div className="input"><Icon name="search" /><select disabled={!games.length && !favorites.length} value={gameTitle} onChange={(event) => setGameTitle(event.target.value)} aria-label="Jogo para o alerta">{games.map((game) => <option key={game.id} value={game.title}>{game.title}</option>)}{favorites.filter((title) => !games.some((game) => game.title === title)).map((title) => <option key={title} value={title}>{title} (salvo)</option>)}</select></div></label>
            <label>Preço-alvo<div className="input prefix"><span>R$</span><input inputMode="decimal" value={targetPrice} onChange={(event) => setTargetPrice(event.target.value)} aria-label="Preço-alvo em reais" /></div></label>
            <fieldset><legend>Lojas monitoradas</legend><p className="notification-note">Alertas automáticos consultam Steam e Epic Games; disponibilidade oficial de Xbox e PlayStation é consultada na página de cada jogo.</p></fieldset>
            <fieldset><legend>Notificações neste dispositivo</legend><div className="channel-list"><div><span><Icon name="bell" />Avisos de promoções</span><Toggle active={notificationsEnabled} setActive={onNotificationsToggle} label="Ativar ou desativar notificações" /></div></div><p className="notification-note">{notificationMessage || "Os avisos aparecem enquanto o site está aberto e a permissão do navegador está liberada."}</p></fieldset>
            <Button className="full" onClick={() => { if (gameTitle) onCreate(gameTitle, targetPrice); }}><Icon name="bell" />Criar alerta</Button>
          </section>

          <section className="history-card">
            <SectionHeader title="Histórico recente" link="Ver tudo" />
            {games.slice(0, 3).map((game, i) => <div className="history-row" key={game.id}><span className="history-check"><Icon name="check" /></span><div><strong>{game.title}</strong><p>Em promoção por <b>{game.price}</b> na {game.store}</p><small>Oferta ativa</small></div></div>)}
            <div className="history-tip"><Icon name="bell" /><p><strong>Dica GamePing</strong>Alertas com mais lojas encontram ofertas até 3× mais rápido.</p></div>
          </section>
        </div>
      </div>
    </main>
  );
}

function Modal({ type, close, onSuccess, onLogin, alertGame }: { type: "login" | "alert"; close: () => void; onSuccess: (title: string, target: string) => void; onLogin: (email: string) => void; alertGame: PromoGame | null }) {
  const [email, setEmail] = useState("");
  const [targetPrice, setTargetPrice] = useState("60,00");
  useEffect(() => {
    if (alertGame && Number.isFinite(alertGame.priceValue)) {
      setTargetPrice(new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(alertGame.priceValue));
    }
  }, [alertGame]);
  return (
    <div className="modal-backdrop" onMouseDown={close}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={close}><Icon name="x" /></button>
        {type === "login" ? <>
          <span className="modal-logo">G</span><h2>Entrar no GamePing</h2><p>Esta demonstração salva sua sessão somente neste navegador. Nenhuma senha é solicitada.</p>
          <form className="login-form" onSubmit={(event) => { event.preventDefault(); if (email.trim()) onLogin(email.trim()); }}><label>E-mail<div className="input"><Icon name="mail" /><input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="seu@email.com" /></div></label><Button className="full">Continuar</Button></form>
          <small>Login de demonstração local. Não é uma conta real e não sincroniza entre dispositivos.</small>
        </> : <>
          <span className="modal-logo"><Icon name="bell" /></span><h2>Criar alerta de preço</h2><p>Defina o preço que você gostaria de pagar por {alertGame?.title ?? "este jogo"}.</p>
          <label>Preço-alvo<div className="input prefix"><span>R$</span><input inputMode="decimal" value={targetPrice} onChange={(event) => setTargetPrice(event.target.value)} autoFocus /></div></label>
          {alertGame && <div className="modal-summary"><img src={alertGame.image} alt="" /><div><strong>{alertGame.title}</strong><span>Preço atual: {alertGame.price}</span></div></div>}
          <Button className="full" onClick={() => { if (alertGame) onSuccess(alertGame.title, targetPrice); }}><Icon name="bell" />Criar alerta</Button>
        </>}
      </div>
    </div>
  );
}

function Footer() {
  return <footer><div className="container footer-inner"><div><div className="logo"><span className="logo-mark">G</span><span>GAME<span>PING</span></span></div><p>As melhores ofertas de jogos, direto no seu radar.</p><div className="social-links"><button aria-label="Instagram"><Icon name="instagram" /></button><button aria-label="Discord"><Icon name="discord" /></button><button aria-label="X"><span>𝕏</span></button><button aria-label="YouTube"><Icon name="youtube" /></button></div></div><div className="footer-links"><span>EXPLORAR</span><button>Promoções</button><button>Jogos grátis</button><button>Lançamentos</button></div><div className="footer-links"><span>GAMEPING</span><button>Sobre</button><button>Como funciona</button><button>Ajuda</button></div><div className="newsletter"><span>OFERTAS NA SUA CAIXA</span><p>Um resumo semanal. Sem spam.</p><div className="input"><Icon name="mail" /><input placeholder="seu@email.com" /><Button><Icon name="arrow" /></Button></div></div></div><div className="container copyright">© 2026 GamePing. Preços atualizados automaticamente.<span>Brasil · Português</span></div></footer>;
}

export default function App() {
  const [page, setPage] = useState<Page>("home");
  const [collectionKey, setCollectionKey] = useState<CollectionKey>("offers");
  const [query, setQuery] = useState("");
  const [selectedGame, setSelectedGame] = useState<PromoGame | null>(null);
  const [alertGame, setAlertGame] = useState<PromoGame | null>(null);
  const [modal, setModal] = useState<"login" | "alert" | null>(null);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [toast, setToast] = useState(false);
  const [category, setCategory] = useState<GameCategory | "Todos">("Todos");
  const [sortOrder, setSortOrder] = useState<SortOrder>("popular");
  const [games, setGames] = useState<PromoGame[]>([]);
  const [freeGames, setFreeGames] = useState<FreeGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [dealsError, setDealsError] = useState("");
  const [freeGamesError, setFreeGamesError] = useState("");
  const [notificationMessage, setNotificationMessage] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [usdBrl, setUsdBrl] = useState<number | null>(null);
  const [usdBrlUpdatedAt, setUsdBrlUpdatedAt] = useState<number | null>(null);
  const [usdBrlStale, setUsdBrlStale] = useState(false);
  const [favorites, setFavorites] = useState<string[]>(readSavedFavorites);
  const [alerts, setAlerts] = useState<PriceAlert[]>(readSavedAlerts);
  const [cart, setCart] = useState<SavedCartItem[]>(() => readSaved<SavedCartItem[]>("gameping:cart", []).map(normalizeSavedCartItem));
  const [storeVisits, setStoreVisits] = useState<Record<string, number>>(() => readSaved("gameping:store-visits", {}));
  const [gameVisits, setGameVisits] = useState<Record<string, number>>(() => readSaved("gameping:game-visits", {}));
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => readSaved("gameping:notifications-enabled", false));
  const [accountEmail, setAccountEmail] = useState(() => readSaved("gameping:demo-account", ""));
  const requireLogin = (action: () => void) => {
    if (accountEmail) {
      action();
      return;
    }
    setPendingAction(() => action);
    setModal("login");
  };
  const guardedBuy = (url: string) => requireLogin(() => openOffer(url));
  const guardedFavorite = (title: string) => requireLogin(() => toggleFavorite(title));
  const guardedCart = (game: PromoGame) => requireLogin(() => toggleCart(game));
  const guardedAlert = (game: PromoGame) => requireLogin(() => { setAlertGame(game); setModal("alert"); });
  const go = (next: Page) => { setPage(next); setQuery(""); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const viewCollection = (collection: CollectionKey) => {
    setCollectionKey(collection);
    go("collection");
  };
  const toggleFavorite = (title: string) => setFavorites((current) => current.includes(title) ? current.filter((item) => item !== title) : [...current, title]);
  const toggleCart = (game: PromoGame) => setCart((current) => current.some((item) => item.gameId === game.gameId)
    ? current.filter((item) => item.gameId !== game.gameId)
    : [...current, { gameId: game.gameId, title: game.title, image: game.image, url: game.url, appUrl: game.appUrl, store: game.store, price: game.price, priceValue: game.priceValue }]);
  const visitGame = (game: PromoGame) => {
    setStoreVisits((current) => ({ ...current, [game.store]: (current[game.store] ?? 0) + 1 }));
    setGameVisits((current) => ({ ...current, [game.gameId]: (current[game.gameId] ?? 0) + 1 }));
    setSelectedGame(game);
    setQuery("");
    setPage("game");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const recommendations = [...games].sort((a, b) => {
    const score = (game: PromoGame) => (gameVisits[game.gameId] ?? 0) * 100
      + (storeVisits[game.store] ?? 0) * 10
      + Math.log10(game.popularity + 1);
    return score(b) - score(a);
  });
  const toggleNotifications = async (enabled: boolean) => {
    if (!enabled) {
      setNotificationsEnabled(false);
      setNotificationMessage("Notificações desativadas neste dispositivo.");
      return;
    }
    if (!("Notification" in window)) {
      setNotificationMessage("Este navegador não oferece notificações do sistema.");
      return;
    }
    try {
      const permission = await window.Notification.requestPermission();
      if (permission === "granted") {
        setNotificationsEnabled(true);
        setNotificationMessage("Notificações ativadas. Elas funcionam enquanto o site estiver aberto.");
      } else {
        setNotificationsEnabled(false);
        setNotificationMessage("Permissão negada pelo navegador. Altere a permissão do site para ativar avisos.");
      }
    } catch (error) {
      setNotificationsEnabled(false);
      setNotificationMessage(`Não foi possível pedir permissão para notificações: ${String(error)}`);
    }
  };
  const alertSuccess = () => { setModal(null); setAlertGame(null); setToast(true); window.setTimeout(() => setToast(false), 3500); };
  const createAlert = (title: string, target: string) => {
    setAlerts((current) => [{ id: `alert-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, title, target: target.trim() || "60,00" }, ...current]);
    setFavorites((current) => current.includes(title) ? current : [...current, title]);
    alertSuccess();
  };
  useEffect(() => {
    let cancelled = false;
    let refreshing = false;
    let controller: AbortController | undefined;

    const refresh = async () => {
      if (refreshing) return;
      refreshing = true;
      controller = new AbortController();
      const [dealsResult, freeGamesResult] = await Promise.allSettled([
        (async () => {
          const exchangeRate = await fetchUsdBrl(controller.signal);
          return { exchangeRate, feed: await fetchActiveDeals(controller.signal, exchangeRate.rate) };
        })(),
        fetchActiveFreeGames(controller.signal),
      ]);
      if (!cancelled) {
        if (dealsResult.status === "fulfilled") {
          setUsdBrl(dealsResult.value.exchangeRate.rate);
          setUsdBrlUpdatedAt(dealsResult.value.exchangeRate.updatedAt);
          setUsdBrlStale(dealsResult.value.exchangeRate.stale);
          setGames(dealsResult.value.feed.deals);
          const messages = [...dealsResult.value.feed.errors];
          if (dealsResult.value.exchangeRate.stale) messages.unshift("A cotação atualizada não está disponível; usando o último câmbio salvo.");
          setDealsError(messages.join(" "));
        } else {
          setDealsError(`Promoções: ${String(dealsResult.reason)}`);
        }
        if (freeGamesResult.status === "fulfilled") {
          setFreeGames(freeGamesResult.value.games);
          setFreeGamesError(freeGamesResult.value.errors.join(" "));
        } else {
          setFreeGamesError(`Jogos grátis: ${String(freeGamesResult.reason)}`);
        }
        setLastUpdated(new Date());
        setLoading(false);
      }
      refreshing = false;
    };

    void refresh();
    const interval = window.setInterval(() => void refresh(), 5 * 60 * 1000);
    return () => {
      cancelled = true;
      controller?.abort();
      window.clearInterval(interval);
    };
  }, [refreshVersion]);
  useEffect(() => { window.localStorage.setItem("gameping:favorites", JSON.stringify(favorites)); }, [favorites]);
  useEffect(() => { window.localStorage.setItem("gameping:alerts", JSON.stringify(alerts)); }, [alerts]);
  useEffect(() => { window.localStorage.setItem("gameping:cart", JSON.stringify(cart)); }, [cart]);
  useEffect(() => { window.localStorage.setItem("gameping:store-visits", JSON.stringify(storeVisits)); }, [storeVisits]);
  useEffect(() => { window.localStorage.setItem("gameping:game-visits", JSON.stringify(gameVisits)); }, [gameVisits]);
  useEffect(() => { window.localStorage.setItem("gameping:notifications-enabled", JSON.stringify(notificationsEnabled)); }, [notificationsEnabled]);
  useEffect(() => { window.localStorage.setItem("gameping:demo-account", JSON.stringify(accountEmail)); }, [accountEmail]);
  useEffect(() => {
    if (notificationsEnabled && (!("Notification" in window) || window.Notification.permission !== "granted")) {
      setNotificationsEnabled(false);
      setNotificationMessage("Notificações desativadas ou sem permissão neste navegador.");
    }
  }, []);
  useEffect(() => {
    if (!notificationsEnabled || !("Notification" in window) || window.Notification.permission !== "granted") return;
    const notified = readSaved<Record<string, string>>("gameping:notified-deals", {});
    const sendNotification = (key: string, game: PromoGame, message: string) => {
      if (notified[key] === game.id) return;
      const notification = new window.Notification("GamePing: promoção encontrada", { body: `${game.title} por ${game.price} na ${game.store}. ${message}` });
      notification.onclick = () => { window.open(game.url, "_blank", "noopener,noreferrer"); notification.close(); };
      notified[key] = game.id;
    };
    favorites.forEach((title) => {
      const game = games.find((item) => item.title.toLocaleLowerCase("pt-BR") === title.toLocaleLowerCase("pt-BR"));
      if (game) sendNotification(`saved:${title}`, game, "O jogo da sua lista está em oferta.");
    });
    alerts.forEach((alert) => {
      const game = games.find((item) => item.title.toLocaleLowerCase("pt-BR") === alert.title.toLocaleLowerCase("pt-BR"));
      const target = Number(alert.target.replace(/\./g, "").replace(",", "."));
      if (game && Number.isFinite(target) && game.priceValue <= target) {
        sendNotification(`alert:${alert.id}`, game, "O preço chegou ao valor que você definiu.");
      }
    });
    window.localStorage.setItem("gameping:notified-deals", JSON.stringify(notified));
  }, [alerts, favorites, games, notificationsEnabled]);
  useEffect(() => { document.body.style.overflow = modal ? "hidden" : ""; }, [modal]);
  return (
    <div className="app">
      <video className="site-background-video" autoPlay muted loop playsInline aria-hidden="true">
        <source src="/planodefundo.mp4" type="video/mp4" />
      </video>
      <div className="site-background-shade" aria-hidden="true" />
      <Header page={page} go={go} onLogin={() => setModal("login")} query={query} onSearch={setQuery} games={games} usdBrl={usdBrl} cartCount={cart.length} accountEmail={accountEmail} onLogout={() => setAccountEmail("")} />
      {query.trim() ? <SearchResults query={query} go={go} favorites={favorites} toggleFavorite={guardedFavorite} games={games} loading={loading} error={dealsError} onVisit={visitGame} cartIds={cart.map((item) => item.gameId)} toggleCart={guardedCart} usdBrl={usdBrl} category={category} onCategoryChange={setCategory} sortOrder={sortOrder} onSortChange={setSortOrder} /> : page === "home" && <Home go={go} favorites={favorites} games={games} freeGames={freeGames} loading={loading} error={[dealsError, freeGamesError].filter(Boolean).join(" ")} lastUpdated={lastUpdated} onRefresh={() => setRefreshVersion((version) => version + 1)} recommendations={recommendations} onVisit={visitGame} onBuy={guardedBuy} onFavorite={guardedFavorite} cartIds={cart.map((item) => item.gameId)} toggleCart={guardedCart} usdBrl={usdBrl} usdBrlUpdatedAt={usdBrlUpdatedAt} usdBrlStale={usdBrlStale} personalized={Object.values(gameVisits).some((count) => count > 0)} category={category} onCategoryChange={setCategory} sortOrder={sortOrder} onSortChange={setSortOrder} onViewMore={viewCollection} />}
      {!query.trim() && page === "free" && <FreeGamesPage freeGames={freeGames} loading={loading} error={freeGamesError} onBuy={guardedBuy} />}
      {!query.trim() && page === "new" && <NewReleasesPage favorites={favorites} toggleFavorite={guardedFavorite} games={games} loading={loading} error={dealsError} onVisit={visitGame} cartIds={cart.map((item) => item.gameId)} toggleCart={guardedCart} />}
      {!query.trim() && page === "game" && selectedGame && <GamePage game={selectedGame} games={games} usdBrl={usdBrl} favorites={favorites} cartIds={cart.map((item) => item.gameId)} onBack={() => go("home")} onAlert={guardedAlert} onBuy={guardedBuy} onFavorite={guardedFavorite} onCart={guardedCart} onVisit={visitGame} />}
      {!query.trim() && page === "alerts" && <AlertsPage alerts={alerts} onCreate={(title, target) => requireLogin(() => createAlert(title, target))} onDelete={(id) => setAlerts((current) => current.filter((alert) => alert.id !== id))} games={games} favorites={favorites} notificationsEnabled={notificationsEnabled} notificationMessage={notificationMessage} onNotificationsToggle={(value) => void toggleNotifications(value)} />}
      {!query.trim() && page === "wishlist" && <WishlistPage favorites={favorites} toggleFavorite={guardedFavorite} go={go} games={games} onVisit={visitGame} cartIds={cart.map((item) => item.gameId)} toggleCart={guardedCart} />}
      {!query.trim() && page === "cart" && <CartPage cart={cart} games={games} removeFromCart={(gameId) => setCart((current) => current.filter((item) => item.gameId !== gameId))} onBuy={guardedBuy} />}
      {!query.trim() && page === "collection" && <CollectionPage collection={collectionKey} games={games} recommendations={recommendations} freeGames={freeGames} favorites={favorites} cartIds={cart.map((item) => item.gameId)} category={category} sortOrder={sortOrder} loading={loading} error={[dealsError, freeGamesError].filter(Boolean).join(" ")} onBack={() => go("home")} onVisit={visitGame} onBuy={guardedBuy} onFavorite={guardedFavorite} toggleCart={guardedCart} />}
      {modal && <Modal type={modal} close={() => { setModal(null); setAlertGame(null); setPendingAction(null); }} onSuccess={createAlert} onLogin={(email) => { setAccountEmail(email); setModal(null); pendingAction?.(); setPendingAction(null); }} alertGame={alertGame} />}
      <div className={toast ? "toast show" : "toast"}><span><Icon name="check" /></span><div><strong>Alerta criado!</strong><p>Vamos avisar quando o preço baixar.</p></div><button onClick={() => setToast(false)}><Icon name="x" /></button></div>
    </div>
  );
}
