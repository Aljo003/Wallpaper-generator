# Flowfield — OLED Wallpaper Generator

Browser-based generativna art orodje za ustvarjanje OLED desktop wallpaperjev.
Delci se gibljejo skozi Perlin/value noise polje in puščajo sledi na true-black
(`#000000`) ozadju. Brez build koraka — odpri `index.html` v brskalniku.

## Struktura

```
index.html          vstopna točka, layout (canvas + kontrolna plošča)
css/style.css        temni "industrijski panel" videz
js/noise.js          seedani PRNG (mulberry32) + 2D value noise
js/flowfield.js       simulacija delcev flow-field moda (preview IN export)
js/attractor.js       simulacija strange-attractor moda (preview IN export)
js/app.js             UI wiring, mode switching, state, PNG export
```

## Zagon

Samo odpri `index.html` v brskalniku. Za kasnejše funkcije (npr. nalaganje
shranjenih seedov iz datoteke) bo morda treba pognati lokalni strežnik:

```
npx serve .
```

## Trenutne funkcionalnosti

- Dva generativna moda, izberljiva preko dropdown-a ("Generativni mode"):
  - **Flow field** — Perlin/value noise polje + delci
  - **Attractor** — kaotični 2D atraktorji (Clifford, De Jong, Svensson)
- Flow field parametri: gostota, merilo polja, curl, hitrost, dolžina sledi,
  debelina črte, prosojnost, barva
- Attractor parametri: vrsta atraktorja, gostota sledi, hitrost, velikost
  pike, prosojnost pike, barva
- Seed sistem — isti seed + parametri (+ mode) = ponovljiv rezultat
- Live preview (960×540) + sinhroni full-res export (do 4K) v PNG
- Kompozicija se ohranja med preview in export resolucijo — flow field
  normalizira koordinate v noise polju, attractor pa avtomatsko poišče
  bounding box trajektorije in jo skalira/centrira na canvas

## Roadmap / ideje za nadaljevanje

- [ ] Dodatni generativni modi: particle bloom/gradient blobs, cellular
      automata
- [x] Shranjevanje/nalaganje priljubljenih seedov + parametrov (localStorage)
- [ ] Batch export — več variacij naenkrat v en klik
- [ ] WebGL renderer za večjo gostoto delcev pri boljši performansi
- [ ] Dvo-barvni gradient namesto ene accent barve
- [x] Portrait/phone resolucije
