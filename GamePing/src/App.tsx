import { useEffect, useState, type ReactNode } from "react";

type Page = "home" | "free" | "new" | "game" | "alerts" | "wishlist";
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
  | "trash";

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

const games = [
  { title: "NEON REQUIEM", store: "Steam", old: "R$ 249,90", price: "R$ 62,47", discount: "-75%", image: images.rider },
  { title: "VOID RUNNER", store: "Epic", old: "R$ 149,90", price: "R$ 29,98", discount: "-80%", image: images.purple },
  { title: "NIGHT PROTOCOL", store: "GOG", old: "R$ 199,90", price: "R$ 59,97", discount: "-70%", image: images.alley },
  { title: "CHROMA DISTRICT", store: "Xbox", old: "R$ 299,90", price: "R$ 89,97", discount: "-70%", image: images.neon },
  { title: "DUST LEGACY", store: "Steam", old: "R$ 179,90", price: "R$ 44,97", discount: "-75%", image: images.soldier },
  { title: "OUTER STAGE", store: "PlayStation", old: "R$ 249,50", price: "R$ 99,80", discount: "-60%", image: images.stage },
];

type PriceAlert = { id: string; title: string; target: string };
const initialAlerts: PriceAlert[] = games.slice(0, 3).map((game, index) => ({
  id: `demo-${game.title}`,
  title: game.title,
  target: ["70,00", "40,00", "65,00"][index],
}));

function readSaved<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const saved = window.localStorage.getItem(key);
    return saved ? JSON.parse(saved) as T : fallback;
  } catch {
    return fallback;
  }
}

const freeGames = [
  { title: "Shadow Tactics", store: "Epic Games", until: "Grátis até 23 mai", image: images.digital },
  { title: "Neon Divide", store: "GOG", until: "Grátis por 2 dias", image: images.neon },
  { title: "Dustfront", store: "Steam", until: "Fim de semana grátis", image: images.soldier },
];

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
  };
  return <svg aria-hidden="true" className="icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">{paths[name]}</svg>;
}

function Button({
  children,
  variant = "primary",
  onClick,
  className = "",
}: {
  children: ReactNode;
  variant?: "primary" | "secondary" | "outline";
  onClick?: () => void;
  className?: string;
}) {
  return <button className={`button button-${variant} ${className}`} onClick={onClick}>{children}</button>;
}

function StoreTag({ children }: { children: ReactNode }) {
  return <span className="store-tag"><span className="store-dot" />{children}</span>;
}

function Discount({ children, historic = false }: { children: ReactNode; historic?: boolean }) {
  return <span className={historic ? "discount historic" : "discount"}>{historic && <Icon name="chart" size={13} />}{children}</span>;
}

function SectionHeader({ eyebrow, title, link }: { eyebrow?: string; title: string; link?: string }) {
  return (
    <div className="section-heading">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h2>{title}</h2>
      </div>
      {link && <button className="text-link">{link}<Icon name="arrow" /></button>}
    </div>
  );
}

function Header({
  page,
  go,
  onLogin,
  query,
  onSearch,
}: {
  page: Page;
  go: (page: Page) => void;
  onLogin: () => void;
  query: string;
  onSearch: (query: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <header className="header">
      <div className="header-inner">
        <button className="logo" onClick={() => go("home")} aria-label="GamePing início">
          <span className="logo-mark">G</span><span>GAME<span>PING</span></span>
        </button>
        <label className="search"><Icon name="search" /><input aria-label="Buscar jogos e lojas" value={query} onChange={(event) => onSearch(event.target.value)} placeholder="Buscar jogos, lojas e ofertas..." /></label>
        <nav className={open ? "nav nav-open" : "nav"}>
          <label className="search mobile-search"><Icon name="search" /><input aria-label="Buscar jogos e lojas" value={query} onChange={(event) => onSearch(event.target.value)} placeholder="Buscar jogos, lojas e ofertas..." /></label>
          <button className={page === "home" ? "active" : ""} onClick={() => { go("home"); setOpen(false); }}>Promoções</button>
          <button className={page === "free" ? "active" : ""} onClick={() => { go("free"); setOpen(false); }}>Grátis</button>
          <button className={page === "new" ? "active" : ""} onClick={() => { go("new"); setOpen(false); }}>Lançamentos</button>
          <button className={page === "wishlist" ? "active" : ""} onClick={() => { go("wishlist"); setOpen(false); }}>Minha lista</button>
        </nav>
        <div className="header-actions">
          <Button onClick={() => go("alerts")}><Icon name="bell" />Ativar alertas</Button>
          <button className="avatar" onClick={onLogin} aria-label="Abrir login"><Icon name="user" /></button>
          <button className="menu-button" onClick={() => setOpen(!open)} aria-label="Menu"><Icon name={open ? "x" : "menu"} /></button>
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
  removable = false,
}: {
  game: typeof games[0];
  onClick: () => void;
  historic?: boolean;
  favorite: boolean;
  onFavorite: () => void;
  removable?: boolean;
}) {
  return (
    <button className="game-card" onClick={onClick}>
      <div className="game-art"><img src={game.image} alt="" /><Discount>{game.discount}</Discount><span className={favorite ? "heart favorited" : "heart"} role="button" tabIndex={0} onClick={(event) => { event.stopPropagation(); onFavorite(); }} onKeyDown={(event) => { if (event.key === "Enter") { event.stopPropagation(); onFavorite(); } }} aria-label={favorite ? "Remover dos favoritos" : "Favoritar"}><Icon name="heart" /></span></div>
      <div className="game-info">
        <StoreTag>{game.store}</StoreTag>
        <h3>{game.title}</h3>
        <div className="price-row"><span className="old-price">{game.old}</span><strong>{game.price}</strong></div>
        {historic && <Discount historic>Menor preço histórico</Discount>}
        {removable && <span className="remove-favorite" onClick={(event) => { event.stopPropagation(); onFavorite(); }}>Remover</span>}
      </div>
    </button>
  );
}

function Home({ go, favorites, toggleFavorite }: { go: (page: Page) => void; favorites: string[]; toggleFavorite: (title: string) => void }) {
  const [slide, setSlide] = useState(0);
  const [remaining, setRemaining] = useState(8 * 60 * 60 + 42 * 60 + 16);
  useEffect(() => {
    const timer = window.setInterval(() => setRemaining((value) => value > 0 ? value - 1 : 0), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const countdown = [Math.floor(remaining / 3600), Math.floor((remaining % 3600) / 60), remaining % 60].map((value) => String(value).padStart(2, "0")).join(":");
  const slides = [
    { title: "NEON REQUIEM", copy: "A cidade nunca dorme. Seu preço acaba em breve.", image: images.rider, discount: "-75%", price: "R$ 62,47" },
    { title: "THE LAST SIGNAL", copy: "Decifre o desconhecido antes que o sinal desapareça.", image: images.digital, discount: "-60%", price: "R$ 79,90" },
  ];
  const current = slides[slide];
  return (
    <>
      <main>
        <section className="hero">
          <img className="hero-image" src={current.image} alt="" />
          <div className="hero-shade" />
          <div className="hero-content container">
            <div className="hero-copy">
              <div className="hero-kicker"><span>Oferta em destaque</span><span className="countdown">TERMINA EM <strong>{countdown}</strong></span></div>
              <h1>{current.title}</h1>
              <p>{current.copy}</p>
              <div className="hero-price"><Discount>{current.discount}</Discount><span><small>R$ 249,90</small><strong>{current.price}</strong></span></div>
              <div className="hero-buttons"><Button onClick={() => go("game")}>Ver oferta <Icon name="arrow" /></Button><Button variant="secondary"><Icon name="heart" />Adicionar à lista</Button></div>
            </div>
            <div className="carousel-controls">
              <button onClick={() => setSlide((slide + slides.length - 1) % slides.length)} aria-label="Anterior"><Icon name="chevron" /></button>
              <span>{slide + 1} / {slides.length}</span>
              <button onClick={() => setSlide((slide + 1) % slides.length)} aria-label="Próximo"><Icon name="chevron" /></button>
            </div>
          </div>
        </section>

        <div className="container content">
          <section className="live-section">
            <SectionHeader eyebrow="ATUALIZADO EM TEMPO REAL" title="Alertas ao vivo" link="Ver todos" />
            <div className="live-grid">
              {games.slice(0, 4).map((game, index) => (
                <button className="live-card" key={game.title} onClick={() => go("game")}>
                  <div className="live-cover"><img src={game.image} alt="" /><span className="live-tag"><i />AGORA</span></div>
                  <div className="live-card-info"><StoreTag>{game.store}</StoreTag><strong>{game.title}</strong><div><span>{game.price}</span><Discount>{game.discount}</Discount></div><small>há {index + 1} min</small></div>
                </button>
              ))}
            </div>
          </section>

          <section>
            <SectionHeader eyebrow="POR TEMPO LIMITADO" title="Jogos grátis" link="Ver todos" />
            <div className="free-grid">
              {freeGames.map((game) => <button className="free-card" key={game.title} onClick={() => go("game")}><img src={game.image} alt="" /><div className="free-overlay" /><div className="free-info"><StoreTag>{game.store}</StoreTag><h3>{game.title}</h3><span className="free-pill">GRÁTIS AGORA</span><p>{game.until}</p></div></button>)}
            </div>
          </section>

          <section>
            <SectionHeader eyebrow="AS MELHORES OFERTAS" title="Maiores descontos" link="Explorar ofertas" />
            <div className="game-grid">{games.slice(0, 4).map((game) => <GameCard key={game.title} game={game} onClick={() => go("game")} favorite={favorites.includes(game.title)} onFavorite={() => toggleFavorite(game.title)} />)}</div>
          </section>

          <section>
            <SectionHeader eyebrow="VALE A PENA" title="Menor preço histórico" link="Ver todos" />
            <div className="game-grid">{games.slice(2, 6).map((game) => <GameCard key={game.title} game={game} onClick={() => go("game")} historic favorite={favorites.includes(game.title)} onFavorite={() => toggleFavorite(game.title)} />)}</div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}

function SearchResults({ query, go, favorites, toggleFavorite }: { query: string; go: (page: Page) => void; favorites: string[]; toggleFavorite: (title: string) => void }) {
  const normalizedQuery = query.trim().toLocaleLowerCase("pt-BR");
  const results = games.filter((game) => `${game.title} ${game.store}`.toLocaleLowerCase("pt-BR").includes(normalizedQuery));
  return (
    <main className="catalog-page">
      <div className="container">
        <div className="page-title"><span className="eyebrow">BUSCA</span><h1>Resultados para “{query.trim()}”</h1><p>{results.length} {results.length === 1 ? "jogo encontrado" : "jogos encontrados"} no catálogo demonstrativo.</p></div>
        {results.length ? <div className="game-grid">{results.map((game) => <GameCard key={game.title} game={game} onClick={() => go("game")} favorite={favorites.includes(game.title)} onFavorite={() => toggleFavorite(game.title)} />)}</div> : <div className="empty-list"><h2>Nenhum jogo encontrado</h2><p>Tente buscar pelo nome do jogo ou pela loja.</p><Button onClick={() => go("home")}>Voltar às promoções</Button></div>}
      </div>
      <Footer />
    </main>
  );
}

function FreeGamesPage({ go }: { go: (page: Page) => void }) {
  return (
    <main className="catalog-page">
      <div className="container">
        <div className="page-title"><span className="eyebrow">POR TEMPO LIMITADO</span><h1>Jogos grátis</h1><p>Ofertas gratuitas do catálogo demonstrativo.</p></div>
        <div className="free-grid">{freeGames.map((game) => <button className="free-card" key={game.title} onClick={() => go("game")}><img src={game.image} alt="" /><div className="free-overlay" /><div className="free-info"><StoreTag>{game.store}</StoreTag><h3>{game.title}</h3><span className="free-pill">GRÁTIS AGORA</span><p>{game.until}</p></div></button>)}</div>
      </div>
      <Footer />
    </main>
  );
}

function NewReleasesPage({ go, favorites, toggleFavorite }: { go: (page: Page) => void; favorites: string[]; toggleFavorite: (title: string) => void }) {
  const releases = games.slice(3, 6);
  return (
    <main className="catalog-page">
      <div className="container">
        <div className="page-title"><span className="eyebrow">EXPLORE O CATÁLOGO</span><h1>Lançamentos</h1><p>Jogos em destaque no catálogo demonstrativo.</p></div>
        <div className="game-grid">{releases.map((game) => <GameCard key={game.title} game={game} onClick={() => go("game")} favorite={favorites.includes(game.title)} onFavorite={() => toggleFavorite(game.title)} />)}</div>
      </div>
      <Footer />
    </main>
  );
}

function PriceChart() {
  const data = [
    { month: "Mai", price: "R$ 249,90", x: 0, y: 45 },
    { month: "Jun", price: "R$ 249,90", x: 70, y: 42 },
    { month: "Jul", price: "R$ 199,90", x: 110, y: 72 },
    { month: "Ago", price: "R$ 199,90", x: 180, y: 70 },
    { month: "Set", price: "R$ 149,90", x: 220, y: 105 },
    { month: "Out", price: "R$ 149,90", x: 290, y: 102 },
    { month: "Nov", price: "R$ 99,90", x: 340, y: 145 },
    { month: "Dez", price: "R$ 119,90", x: 410, y: 130 },
    { month: "Jan", price: "R$ 79,90", x: 465, y: 170 },
    { month: "Fev", price: "R$ 79,90", x: 520, y: 168 },
    { month: "Mai", price: "R$ 62,47", x: 600, y: 190 },
  ];
  const [hovered, setHovered] = useState<number | null>(null);
  const point = hovered === null ? null : data[hovered];
  return (
    <div className="chart-wrap" onMouseLeave={() => setHovered(null)}>
      {point && <div className="chart-tooltip" style={{ left: `${Math.min(91, Math.max(9, point.x / 6))}%`, top: `${point.y / 2.2}px` }}><strong>{point.price}</strong><span>{point.month} 2025</span></div>}
      <svg className="price-chart" viewBox="0 0 600 220" preserveAspectRatio="none">
        <defs><linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FF7A1A" stopOpacity=".3" /><stop offset="1" stopColor="#FF7A1A" stopOpacity="0" /></linearGradient></defs>
        <path className="grid-lines" d="M0 40H600M0 100H600M0 160H600" />
        <path className="chart-fill" d="M0 45 L70 42 L110 72 L180 70 L220 105 L290 102 L340 145 L410 130 L465 170 L520 168 L600 190 V220 H0Z" />
        <path className="chart-line" d="M0 45 L70 42 L110 72 L180 70 L220 105 L290 102 L340 145 L410 130 L465 170 L520 168 L600 190" />
        {data.map((item, index) => <rect key={`${item.month}-${index}`} x={Math.max(0, item.x - 28)} y="0" width="56" height="220" fill="transparent" onMouseEnter={() => setHovered(index)} />)}
        {point && <circle className="chart-point" cx={point.x} cy={point.y} r="7" />}
      </svg>
    </div>
  );
}

function GamePage({ onAlert, favorites, toggleFavorite }: { onAlert: () => void; favorites: string[]; toggleFavorite: (title: string) => void }) {
  const favorite = favorites.includes("NEON REQUIEM");
  const stores = [
    ["Steam", "R$ 62,47", "-75%", "Melhor preço"],
    ["Epic Games", "R$ 74,90", "-70%", ""],
    ["GOG", "R$ 99,95", "-60%", ""],
    ["Xbox", "R$ 124,95", "-50%", ""],
  ];
  return (
    <main className="game-page">
      <div className="game-banner"><img src={images.rider} alt="" /><div /></div>
      <div className="container game-detail">
        <div className="breadcrumbs">Início <span>/</span> Promoções <span>/</span> Neon Requiem</div>
        <section className="game-overview">
          <div className="cover"><img src={images.purple} alt="Neon Requiem" /><Discount>-75%</Discount></div>
          <div className="overview-copy">
            <span className="developer">Desenvolvedora: <strong>Moonbyte Studios</strong></span>
            <h1>NEON REQUIEM</h1>
            <p>Uma jornada de ação e escolhas em uma metrópole à beira do colapso. Encontre o sinal. Mude o destino.</p>
            <div className="meta"><span>Ação</span><span>RPG</span><span>Cyberpunk</span></div>
            <div className="detail-price"><div><small>A partir de</small><strong>R$ 62,47</strong></div><Discount historic>Menor preço histórico</Discount></div>
            <div className="overview-actions"><Button onClick={onAlert}><Icon name="bell" />Criar alerta de preço</Button><Button variant="secondary" className={favorite ? "wishlist-active" : ""} onClick={() => toggleFavorite("NEON REQUIEM")}><Icon name="heart" />{favorite ? "Na lista de desejos" : "Lista de desejos"}</Button></div>
          </div>
        </section>

        <div className="gallery">
          {[images.stage, images.digital, images.soldier].map((image, index) => <img key={image} src={image} alt={`Cena do jogo ${index + 1}`} />)}
        </div>

        <div className="detail-columns">
          <section className="price-panel">
            <SectionHeader eyebrow="COMPARE E ECONOMIZE" title="Preços por loja" />
            <div className="store-list">
              {stores.map(([store, price, discount, best]) => (
                <div className="store-row" key={store}>
                  <div className="store-brand"><span>{store[0]}</span><div><strong>{store}</strong>{best && <small>{best}</small>}</div></div>
                  <Discount>{discount}</Discount>
                  <strong className="store-price">{price}</strong>
                  <Button variant="outline">Ir para loja <Icon name="arrow" /></Button>
                </div>
              ))}
            </div>
          </section>
          <section className="chart-panel">
            <SectionHeader eyebrow="ÚLTIMOS 12 MESES" title="Histórico de preço" />
            <div className="chart-stats"><div><span>Menor</span><strong>R$ 62,47</strong></div><div><span>Média</span><strong>R$ 132,80</strong></div></div>
            <PriceChart />
            <div className="chart-months"><span>MAI</span><span>AGO</span><span>NOV</span><span>FEV</span><span>MAI</span></div>
          </section>
        </div>

        <section><SectionHeader title="Jogos semelhantes" link="Ver todos" /><div className="game-grid">{games.slice(1, 5).map((game) => <GameCard key={game.title} game={game} onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} favorite={favorites.includes(game.title)} onFavorite={() => toggleFavorite(game.title)} />)}</div></section>
      </div>
    </main>
  );
}

function WishlistPage({ favorites, toggleFavorite, go }: { favorites: string[]; toggleFavorite: (title: string) => void; go: (page: Page) => void }) {
  const favoriteGames = games.filter((game) => favorites.includes(game.title));
  return (
    <main className="wishlist-page">
      <div className="container">
        <div className="page-title"><span className="title-icon wishlist-title-icon"><Icon name="heart" /></span><div><span className="eyebrow">SEUS JOGOS FAVORITOS</span><h1>Minha Lista</h1><p>Acompanhe os preços dos jogos que você quer jogar.</p></div></div>
        {favoriteGames.length ? (
          <><div className="list-summary"><span>{favoriteGames.length} {favoriteGames.length === 1 ? "jogo salvo" : "jogos salvos"}</span><span>Os preços são atualizados automaticamente</span></div><div className="game-grid wishlist-grid">{favoriteGames.map((game) => <GameCard key={game.title} game={game} onClick={() => go("game")} favorite onFavorite={() => toggleFavorite(game.title)} removable />)}</div></>
        ) : (
          <div className="empty-list"><span><Icon name="heart" size={32} /></span><h2>Sua lista está vazia</h2><p>Favorite jogos para acompanhar preços e descontos em um só lugar.</p><Button onClick={() => go("home")}>Explorar promoções <Icon name="arrow" /></Button></div>
        )}
      </div>
    </main>
  );
}

function Toggle({ active, setActive }: { active: boolean; setActive: (value: boolean) => void }) {
  return <button className={active ? "toggle active" : "toggle"} onClick={() => setActive(!active)} aria-label="Alternar"><span /></button>;
}

function AlertsPage({ alerts, onCreate, onDelete }: { alerts: PriceAlert[]; onCreate: (title: string, target: string) => void; onDelete: (id: string) => void }) {
  const [channels, setChannels] = useState({ email: true, telegram: false, discord: true, push: true });
  const [stores, setStores] = useState({ Steam: true, Epic: true, GOG: false, Xbox: false, PlayStation: false });
  const [alertMenu, setAlertMenu] = useState<string | null>(null);
  const [gameTitle, setGameTitle] = useState("NEON REQUIEM");
  const [targetPrice, setTargetPrice] = useState("60,00");
  const channelIcons: Record<string, IconName> = { email: "mail", telegram: "telegram", discord: "discord", push: "phone" };
  return (
    <main className="alerts-page">
      <div className="container">
        <div className="page-title"><span className="title-icon"><Icon name="bell" /></span><div><span className="eyebrow">NÃO PERCA NENHUMA OFERTA</span><h1>Central de Alertas</h1><p>Acompanhe preços e receba avisos do seu jeito.</p></div></div>
        <section className="active-alerts">
          <SectionHeader title="Alertas ativos" />
          <div className="alert-cards">
            {alerts.map((alert) => {
              const game = games.find((item) => item.title === alert.title) ?? games[0];
              return <div className="alert-card" key={alert.id}><img src={game.image} alt="" /><div className="alert-main"><StoreTag>{game.store}</StoreTag><h3>{game.title}</h3><div className="target"><span>Preço-alvo<strong>R$ {alert.target}</strong></span><Icon name="arrow" /><span>Preço atual<strong>{game.price}</strong></span></div></div><div className="alert-status"><span><i />ATIVO</span><button aria-label={`Opções do alerta de ${game.title}`} aria-expanded={alertMenu === alert.id} onClick={() => setAlertMenu(alertMenu === alert.id ? null : alert.id)}>•••</button>{alertMenu === alert.id && <div className="alert-menu"><button className="danger" onClick={() => { onDelete(alert.id); setAlertMenu(null); }}><Icon name="trash" />Excluir alerta</button></div>}</div></div>;
            })}
            {!alerts.length && <div className="empty-list"><h2>Você ainda não tem alertas</h2><p>Escolha um jogo e defina o preço que gostaria de pagar.</p></div>}
          </div>
        </section>

        <div className="alerts-layout">
          <section className="form-card">
            <div className="form-head"><span><Icon name="plus" /></span><div><h2>Criar novo alerta</h2><p>Você será avisado assim que o preço chegar lá.</p></div></div>
            <label>Jogo<div className="input"><Icon name="search" /><select value={gameTitle} onChange={(event) => setGameTitle(event.target.value)} aria-label="Jogo para o alerta">{games.map((game) => <option key={game.title} value={game.title}>{game.title}</option>)}</select></div></label>
            <label>Preço-alvo<div className="input prefix"><span>R$</span><input inputMode="decimal" value={targetPrice} onChange={(event) => setTargetPrice(event.target.value)} aria-label="Preço-alvo em reais" /></div></label>
            <fieldset><legend>Lojas</legend><div className="checks">{Object.entries(stores).map(([name, checked]) => <button className={checked ? "check active" : "check"} key={name} onClick={() => setStores({ ...stores, [name]: !checked })}><span>{checked && <Icon name="check" size={14} />}</span>{name}</button>)}</div></fieldset>
            <fieldset><legend>Canais de aviso</legend><div className="channel-list">{Object.entries(channels).map(([name, active]) => <div key={name}><span><Icon name={channelIcons[name]} />{name === "email" ? "E-mail" : name[0].toUpperCase() + name.slice(1)}</span><Toggle active={active} setActive={(value) => setChannels({ ...channels, [name]: value })} /></div>)}</div></fieldset>
            <Button className="full" onClick={() => { onCreate(gameTitle, targetPrice); }}><Icon name="bell" />Criar alerta</Button>
          </section>

          <section className="history-card">
            <SectionHeader title="Histórico recente" link="Ver tudo" />
            {games.slice(3, 6).map((game, i) => <div className="history-row" key={game.title}><span className="history-check"><Icon name="check" /></span><div><strong>{game.title}</strong><p>Atingiu <b>{game.price}</b> na {game.store}</p><small>{i + 1} dia{i ? "s" : ""} atrás</small></div></div>)}
            <div className="history-tip"><Icon name="bell" /><p><strong>Dica GamePing</strong>Alertas com mais lojas encontram ofertas até 3× mais rápido.</p></div>
          </section>
        </div>
      </div>
    </main>
  );
}

function Modal({ type, close, onSuccess }: { type: "login" | "alert"; close: () => void; onSuccess: (title: string, target: string) => void }) {
  return (
    <div className="modal-backdrop" onMouseDown={close}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={close}><Icon name="x" /></button>
        {type === "login" ? <>
          <span className="modal-logo">G</span><h2>Entre no GamePing</h2><p>Salve jogos, sincronize sua lista e nunca perca uma promoção.</p>
          <div className="login-form"><label>E-mail<div className="input"><Icon name="mail" /><input type="email" placeholder="seu@email.com" /></div></label><label>Senha<div className="input"><input type="password" placeholder="Sua senha" /></div></label><Button className="full">Entrar</Button><button className="create-account">Criar conta</button></div>
          <div className="login-divider"><span>ou continue com</span></div>
          <div className="socials"><Button variant="secondary"><span className="social google">G</span>Continuar com Google</Button><Button variant="secondary"><span className="social steam">S</span>Continuar com Steam</Button><Button variant="secondary"><span className="social discord">D</span>Continuar com Discord</Button></div>
          <small>Ao continuar, você concorda com nossos Termos e Política de Privacidade.</small>
        </> : <>
          <span className="modal-logo"><Icon name="bell" /></span><h2>Criar alerta de preço</h2><p>Defina seu preço ideal para Neon Requiem.</p>
          <label>Preço-alvo<div className="input prefix"><span>R$</span><input defaultValue="60,00" autoFocus /></div></label>
          <div className="modal-summary"><img src={images.rider} alt="" /><div><strong>Neon Requiem</strong><span>Preço atual: R$ 62,47</span></div></div>
          <Button className="full" onClick={() => onSuccess("NEON REQUIEM", "60,00")}><Icon name="bell" />Criar alerta</Button>
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
  const [query, setQuery] = useState("");
  const [modal, setModal] = useState<"login" | "alert" | null>(null);
  const [toast, setToast] = useState(false);
  const [favorites, setFavorites] = useState<string[]>(() => readSaved("gameping:favorites", ["NEON REQUIEM", "NIGHT PROTOCOL"]));
  const [alerts, setAlerts] = useState<PriceAlert[]>(() => readSaved("gameping:alerts", initialAlerts));
  const go = (next: Page) => { setPage(next); setQuery(""); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const toggleFavorite = (title: string) => setFavorites((current) => current.includes(title) ? current.filter((item) => item !== title) : [...current, title]);
  const alertSuccess = () => { setModal(null); setToast(true); window.setTimeout(() => setToast(false), 3500); };
  const createAlert = (title: string, target: string) => {
    setAlerts((current) => [{ id: `alert-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, title, target: target.trim() || "60,00" }, ...current]);
    alertSuccess();
  };
  useEffect(() => { window.localStorage.setItem("gameping:favorites", JSON.stringify(favorites)); }, [favorites]);
  useEffect(() => { window.localStorage.setItem("gameping:alerts", JSON.stringify(alerts)); }, [alerts]);
  useEffect(() => { document.body.style.overflow = modal ? "hidden" : ""; }, [modal]);
  return (
    <div className="app">
      <Header page={page} go={go} onLogin={() => setModal("login")} query={query} onSearch={setQuery} />
      {query.trim() ? <SearchResults query={query} go={go} favorites={favorites} toggleFavorite={toggleFavorite} /> : page === "home" && <Home go={go} favorites={favorites} toggleFavorite={toggleFavorite} />}
      {!query.trim() && page === "free" && <FreeGamesPage go={go} />}
      {!query.trim() && page === "new" && <NewReleasesPage go={go} favorites={favorites} toggleFavorite={toggleFavorite} />}
      {!query.trim() && page === "game" && <GamePage onAlert={() => setModal("alert")} favorites={favorites} toggleFavorite={toggleFavorite} />}
      {!query.trim() && page === "alerts" && <AlertsPage alerts={alerts} onCreate={createAlert} onDelete={(id) => setAlerts((current) => current.filter((alert) => alert.id !== id))} />}
      {!query.trim() && page === "wishlist" && <WishlistPage favorites={favorites} toggleFavorite={toggleFavorite} go={go} />}
      {modal && <Modal type={modal} close={() => setModal(null)} onSuccess={createAlert} />}
      <div className={toast ? "toast show" : "toast"}><span><Icon name="check" /></span><div><strong>Alerta criado!</strong><p>Vamos avisar quando o preço baixar.</p></div><button onClick={() => setToast(false)}><Icon name="x" /></button></div>
    </div>
  );
}
