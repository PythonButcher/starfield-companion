const STAR_TYPES = {
    G: { color: 'var(--color-star-g, #f5e6a1)', radius: 6 },
    K: { color: 'var(--color-star-k, #f0a45d)', radius: 5 },
    M: { color: 'var(--color-star-m, #ff6b6b)', radius: 4 },
    default: { color: 'var(--color-star-white)', radius: 5 },
};

const FACTION_COLORS = {
    Freestar: 'var(--color-freestar, #9cd9ff)',
    Crimson: 'var(--color-crimson, #ff8fb1)',
};

export const getStarAppearance = (type, faction) => {
    const base = STAR_TYPES[type?.toUpperCase()] || STAR_TYPES.default;
    const factionColor = faction ? FACTION_COLORS[faction] : null;
    return {
        color: factionColor || base.color,
        radius: base.radius,
    };
};

export const getLegendEntries = () => ([
    { label: 'G-Class', color: STAR_TYPES.G.color, radius: STAR_TYPES.G.radius },
    { label: 'K-Class', color: STAR_TYPES.K.color, radius: STAR_TYPES.K.radius },
    { label: 'M-Class', color: STAR_TYPES.M.color, radius: STAR_TYPES.M.radius },
    { label: 'Neutral/Other', color: STAR_TYPES.default.color, radius: STAR_TYPES.default.radius },
]);

export default getStarAppearance;
