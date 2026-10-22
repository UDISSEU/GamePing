export type NintendoProduct = {
  title: string;
  titleId: string;
  storeUrl: string;
  imageUrl: string;
};

export const nintendoProductsByTitle: Readonly<Record<string, NintendoProduct>> = {
  "the legend of zelda tears of the kingdom": {
    title: "The Legend of Zelda: Tears of the Kingdom",
    titleId: "70010000063714",
    storeUrl: "https://www.nintendo.com/pt-br/store/products/the-legend-of-zelda-tears-of-the-kingdom-switch/",
    imageUrl: "https://assets.nintendo.com/image/upload/f_auto,q_auto/store/software/switch/70010000063714/e4f70326509c24713c7c8d90388bdb6df04f4e9b51414c5e5f4044d4841a50e8",
  },
  "mario kart 8 deluxe": {
    title: "Mario Kart 8 Deluxe",
    titleId: "70010000000153",
    storeUrl: "https://www.nintendo.com/pt-br/store/products/mario-kart-8-deluxe-switch/",
    imageUrl: "https://assets.nintendo.com/image/upload/f_auto,q_auto/store/software/switch/70010000000153/de697f487a36d802dd9a5ff0341f717c8486221f2f1219b675af37aca63bc453",
  },
  "animal crossing new horizons": {
    title: "Animal Crossing: New Horizons",
    titleId: "70010000027619",
    storeUrl: "https://www.nintendo.com/pt-br/store/products/animal-crossing-new-horizons-switch/",
    imageUrl: "https://assets.nintendo.com/image/upload/f_auto,q_auto/store/software/switch/70010000027619/9989957eae3a6b545194c42fec2071675c34aadacd65e6b33fdfe7b3b6a86c3a",
  },
  "super mario bros wonder": {
    title: "Super Mario Bros. Wonder",
    titleId: "70010000068688",
    storeUrl: "https://www.nintendo.com/pt-br/store/products/super-mario-bros-wonder-switch/",
    imageUrl: "https://assets.nintendo.com/image/upload/f_auto,q_auto/store/software/switch/70010000068688/1b2766c7a82e706d1465b6e138b1d96d4de7bd7cd7f52831ea149c9afb072250",
  },
  "pokemon scarlet": {
    title: "Pokémon Scarlet",
    titleId: "70010000053966",
    storeUrl: "https://www.nintendo.com/pt-br/store/products/pokemon-scarlet-switch/",
    imageUrl: "https://assets.nintendo.com/image/upload/f_auto,q_auto/store/software/switch/70010000053966/849c234de8df7265201d26d9d72f88eed3f32438d3dca12fc135beb4c3befc85",
  },
};
