# Cafe Paradise — Service Manager

React aplikácia (Vite) v MediaVolt dizajne s prihlasovaním, rolami a zdieľanou databázou (Supabase).
Nasaditeľná na Vercel.

## Štruktúra

```
cafedelparadise/
├─ index.html                 # vstupný HTML
├─ package.json               # závislosti + skripty
├─ vite.config.js
├─ .env.example               # vzor premenných prostredia
├─ CafeDelParadise_App.jsx    # samotná aplikácia
├─ src/
│  ├─ main.jsx                # pripojenie appky + AuthProvider
│  ├─ auth.jsx                # prihlasovanie, načítanie profilu a dát
│  └─ lib/
│     ├─ supabase.js          # klient databázy
│     └─ store.js             # zdieľané dáta (čítanie/zápis do DB)
├─ api/
│  ├─ anthropic.js            # proxy na AI (Anthropic)
│  └─ admin/users.js          # správa používateľov (len admin)
└─ supabase/
   └─ schema.sql              # databáza: tabuľky, práva (RLS), trigger
```

## 1) Založenie databázy (Supabase)

1. Na https://supabase.com vytvor projekt (zadarmo).
2. V projekte choď do **SQL Editor → New query**, vlož celý obsah `supabase/schema.sql` a daj **Run**.
3. **Authentication → Providers → Email**: nech je zapnuté. Pre jednoduchosť odporúčam vypnúť
   „Confirm email" (Authentication → Providers → Email → *Confirm email* OFF), aby sa noví
   používatelia vedeli hneď prihlásiť.
4. **Project Settings → API** — odtiaľ si vezmeš kľúče do premenných (nižšie).

### Prvý admin

1. **Authentication → Users → Add user** → vytvor svoj účet (email + heslo).
2. V **SQL Editor** spusti (zmeň email na svoj):

   ```sql
   update public.profiles set role = 'admin' where email = 'tvoj@email.sk';
   ```

Odteraz ďalších ľudí pridávaš priamo v appke v sekcii **Správa → Používatelia**.

## 2) Premenné prostredia

| Premenná | Kde | Hodnota (Supabase → Settings → API) |
|---|---|---|
| `VITE_SUPABASE_URL` | klient | Project URL |
| `VITE_SUPABASE_ANON_KEY` | klient | `anon` `public` key |
| `SUPABASE_URL` | server | rovnaké Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | server | `service_role` key — **TAJNÝ** |
| `ANTHROPIC_API_KEY` | server | kľúč pre AI funkcie (voliteľné) |

Lokálne: skopíruj `.env.example` → `.env` a vyplň. Na Verceli: **Settings → Environment Variables**.

## 3) Nasadenie na Vercel

1. Nahraj priečinok do GitHub repozitára.
2. Na https://vercel.com → **Add New… → Project** → vyber repo (rozpozná **Vite**).
3. Pridaj všetkých 5 premenných z tabuľky vyššie.
4. **Deploy.**

Alebo cez CLI: `npm i -g vercel` → `vercel` → `vercel --prod`.

## Prihlasovanie, role a práva

- Každý sa prihlasuje **emailom a heslom**. Dáta sú **spoločné pre všetkých** (jedna prevádzka).
- **Role** (prednastavia práva, dajú sa doladiť):
  - **Admin** — prístup ku všetkému + správa používateľov.
  - **Manažér** — prevádzka, tím, sklad, plánovanie (financie len na čítanie).
  - **Personál** — základné sekcie (sklad/objednávky/zmeny/pokladňa…).
- Admin v sekcii **Používatelia** vie: pridať používateľa, zmeniť rolu, **pri každej sekcii nastaviť
  bez prístupu / len čítať / upravovať**, deaktivovať účet, zmeniť heslo, zmazať používateľa.
- Kto má sekciu „len čítať", vidí ju, ale needituje (formuláre a tlačidlá sú zablokované).

## Ukladanie dát

- Dáta sa ukladajú do **Supabase databázy** — zdieľané medzi všetkými používateľmi a zariadeniami,
  automaticky pri každej zmene.
- Pozn.: pri súčasnej úprave tej istej položky dvomi ľuďmi platí „posledný zápis vyhráva".
  Nové dáta od kolegov sa načítajú pri ďalšom otvorení/obnovení stránky.

## Napojenie na Google Kalendár

Appka poskytuje **odoberateľný kalendárový feed** (`/api/calendar`) — pridáš ho raz do Google
Kalendára a všetky udalosti aj termíny z plánu sa tam zobrazia a **samy aktualizujú** (jednosmerne,
appka → Google; Google obnovuje cca raz za deň).

Postup: v appke otvor **Kalendár → Napojiť na Google Kalendár**, skopíruj adresu, potom v Google
Kalendári (web) → vľavo pri „Ďalšie kalendáre" klikni **＋ → Z adresy URL** → vlož → **Pridať kalendár**.

Voliteľné zabezpečenie: ak nastavíš env 