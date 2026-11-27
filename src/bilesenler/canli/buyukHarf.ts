// Türkçe büyük harf, Latin özel adları bozmadan (04.11, E-05: "COİNBASE", "LİVERPOOL" görünüyordu).
// Türkçe sözcük tr kuralıyla büyür (i → İ); İngilizce/Latin özel ad (Coinbase, Bitcoin, Liverpool…) İngilizce kuralıyla (i → I).
// Ek kesme işaretinden sonra Türkçe kalır: "Coinbase'in" → "COINBASE'İN". Aynı kural site/ekonomi/ekonomi.js buyuk() ile.
const LATIN_AD_RE = /^(?:coinbase|bitcoin|ethereum|binance|blackrock|ripple|solana|dogecoin|litecoin|cardano|polygon|chainlink|stablecoin|tether|kraken|robinhood|nvidia|microsoft|apple|amazon|alphabet|google|openai|meta|netflix|intel|disney|boeing|oracle|paypal|visa|mastercard|spotify|airbnb|reuters|bloomberg|nasdaq|fitch|moody|goldman|citigroup|swift|fifa|uefa|iphone|youtube|facebook|instagram|twitter|tiktok|linkedin|whatsapp|chatgpt|gemini|nikkei|liverpool|tottenham|villarreal|girona|fiorentina|lazio|brighton|wolfsburg|freiburg|leipzig|bilbao|athletic|celtic|rangers|benfica|sporting|olympiakos|olympique|midtjylland|ferencvaros|virtus|olimpia|partizan|crvena|zvezda|maccabi|panathinaikos|baskonia|saint|germain|david|michael|vitalik|satoshi|biden|ceo|cfo|ipo|etf|nft)(?=$|['’])/i;
const LATIN_DESEN_RE = /[wqx]|th|ck|ee|oi|sh(?!i)|ph/i;
export function latinMi(k: string) {
  return /^\p{Lu}/u.test(k) && /^[A-Za-z]+(?:['’]\p{L}*)?$/u.test(k) && /i/i.test(k) && (LATIN_AD_RE.test(k) || LATIN_DESEN_RE.test(k.replace(/['’].*$/, '')));
}
export function buyukHarf(s: string) {
  return String(s ?? '').replace(/[\p{L}'’]+/gu, (k) => {
    if (!latinMi(k)) return k.toLocaleUpperCase('tr-TR');
    const i = k.search(/['’]/);
    return i < 0 ? k.toUpperCase() : k.slice(0, i).toUpperCase() + k.slice(i).toLocaleUpperCase('tr-TR');
  });
}
