# Flowfield — OLED Wallpaper Generator

Browser-based generativna art orodje za ustvarjanje OLED desktop/phone
wallpaperjev. Tri generativne moda risejo na true-black (`#000000`) ozadje.
Brez build koraka — odpri `index.html` v brskalniku.

## Struktura

```
index.html          vstopna točka, layout (canvas + kontrolna plošča)
css/style.css        temni "industrijski panel" videz
js/noise.js          seedani PRNG (mulberry32) + 2D value noise + barvni ramp helperji
js/flowfield.js       simulacija delcev flow-field moda (preview IN export)
js/attractor.js       simulacija strange-attractor moda (preview IN export)
js/bloom.js           simulacija bloom/gradient-blob moda (preview IN export)
js/app.js             UI wiring, mode switching, priljubljeni, state, PNG/batch export
wrangler.toml         Cloudflare Workers static-asset deploy config
```

## Zagon

Samo odpri `index.html` v brskalniku. Za lokalni strežnik (ni nujno potreben):

```
npx serve .
```

## Trenutne funkcionalnosti

- Trije generativni modi, izberljivi preko dropdown-a ("Generativni mode"):
  - **Flow field** — Perlin/value noise polje + delci
  - **Attractor** — kaotični 2D atraktorji (Clifford, De Jong, Svensson)
  - **Bloom** — mehki gradient blobs, ki počasi lezejo po noise polju
- Flow field parametri: gostota, merilo polja, curl, hitrost, dolžina sledi,
  debelina črte, prosojnost
- Attractor parametri: vrsta atraktorja, gostota sledi, hitrost, velikost
  pike, prosojnost pike
- Bloom parametri: število blobov, velikost blobov, hitrost, prosojnost
- Dvo-barvni gradient (začetna/končna barva), skupen vsem modom
- Seed sistem — isti seed + parametri (+ mode) = ponovljiv rezultat
- Priljubljeni — shrani trenutni mode/seed/parametre pod imenom v
  localStorage, naloži ali izbriši kasneje
- Live preview (960×540) + sinhroni full-res export (do 4K, ležeče ali
  pokončno za telefone) v PNG
- Batch export — izvozi N naključnih variacij naenkrat v enem kliku
- Kompozicija se ohranja med preview in export resolucijo — flow field in
  bloom normalizirata koordinate glede na canvas, attractor pa avtomatsko
  poišče bounding box trajektorije in jo skalira/centrira

## Cloudflare Workers deploy

`wrangler.toml` postreže repo root kot statične datoteke (`[assets]
directory = "."`) — git-integration build na Cloudflare Workers/Pages deluje
brez dodatnega build koraka.

## Roadmap / ideje za nadaljevanje

- [x] Dodatni generativni mode: particle bloom/gradient blobs
- [ ] Dodatni generativni mode: cellular automata
- [x] Shranjevanje/nalaganje priljubljenih seedov + parametrov (localStorage)
- [x] Batch export — več variacij naenkrat v en klik
- [ ] WebGL renderer za večjo gostoto delcev pri boljši performansi
- [x] Dvo-barvni gradient namesto ene accent barve
- [x] Portrait/phone resolucije
