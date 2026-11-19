# Jeden řádek

**Akce:** ReactGirls meetup, 19. 11. 2026, 18:00, Praha
**Formát:** HTML/CSS/JS prezentace, herní styl s pixel-art spritem, hrdina je bug
**Vzhled:** barvy meetupu (krémová, korálová, tyrkysová, levandulová, žlutá), font Poppins
**Spuštění:** otevřít `index.html` v prohlížeči
**Ovládání:** `→` / `↓` / `Space` dopředu · `←` / `↑` zpět · `Home` / `End`
Jen klávesnice, klik nic neposouvá.

Zadání, fakta a plán: [`docs/brief.md`](docs/brief.md).

**Stav: první nástřel celého obsahu (iter 2).** Vážný svět (`serious`) = tmavé
pozadí, incident. Herní svět (`game`) = krémová + bug. Poznámky v hranatých
závorkách jsou zástupné texty nebo návrhy k potvrzení.

> Tabulka se generuje ze `scenes.js` (pole `notes`). Poznámky upravuj tam
> a tabulku přegeneruj, ať se to nerozjede.

---

## Scény a poznámky pro mluvčího

| # | id | svět | kroky | Poznámky |
|---|----|------|-------|----------|
| 1 | `title` | game | 1 | Ahoj, jsem Jan. Tohle je příběh o jednom řádku. |
| 2 | `true-story` | game | 4 | Bug přijde domů a pustí si televizi: Věřte nevěřte. (→) …tohle se opravdu stalo. (→) Pracoval jsem v Mews, (→) firma dělá software pro hotely. |
| 3 | `mews-pms` | game | 3 | Mews PMS je hlavní produkt. Firma existuje 14 let. Většina obrazovek je v Reactu nad REST API. Ale jsou tam i starší části: ty renderuje backend pomocí Razor šablon. Říkali jsme jim backend rendered pages. |
| 4 | `whats-wrong` | game | 4 | Co je na tom špatně? Jiná technologie, takže stránky vypadají jinak než zbytek aplikace a špatně se rozvíjejí. A pak přijde dilema: potřebuju na takové stránce doplnit něco malého. Doplním to po staru, nebo přepíšu celou stránku? |
| 5 | `named-problem` | game | 5 | Proč se s tím něco neudělá? Ve firmě to byl problém pojmenovaný už několik let. Jenže postaru bylo napsaných nižší stovky stránek. A co zákazníkovi přinese přepis? Oproti novým funkcím nic moc. Přesto se o to pokoušelo mnoho lidí a byl to jeden z cílů firmy v oblasti technických vylepšení. Tak jsem se rozhodl, že to zkusím taky. (Počet čárek je ilustrační.) |
| 6 | `agent` | game | 12 | Vyrobil jsem refaktorovacího agenta. Nebylo to těžké: navázal jsem na práci ostatních lidí, kteří napsali dobrou dokumentaci a některé věci částečně automatizovali. Jejich práce taky poskytla příklady, jak se to má dělat. K tomu jsem dodal svou představu, jak má agent postupovat: analýza kódu, specifikace, API, frontendové komponenty, propojit API a frontend, a samozřejmě code review a opravit chyby. |
| 7 | `worked` | game | 6 | A fungovalo to. (→) Agent vytvořil dobrý základ v produkční kvalitě. (→) Lepší UX, (→) vzhled konzistentní se zbytkem aplikace, (→) dalo se to dál vylepšovat (→) a přibyly nové funkce: inline edit a bulk delete. |
| 8 | `mostly` | game | 2 | …většinou… (pauza, nechat dojít) (→) Pátek 13. srpna, 16:00. Přijde zpráva na Slacku: Řešíme incident, pojď nám pomoct. |
| 9 | `slack` | serious | 4 | Astrid: Nefunguje mi synchronizace do našeho systému. (→) Padá to, hotelové pokoje se objevují ve více kategoriích. (→) Janse: Potvrzuji, v databázi vidím 140 duplicit. (→) Hector: To bude naše nová stránka, vypnu to. |
| 10 | `panic` | serious | 8 | Co se děje? (→) Máš přístup do produkční aplikace? (→) K logům a metrikám? (→) Umíš zjistit, co je v produkční databázi? (→) Máme dost informací? (→) Víš, jak pracovat se systémem na správu incidentů? (→) Jak jsem na tom byl já: produkce ano, logy ano, produkční databáze ne, informace ne, incidenty ano. (→) Příprava je důležitá. Ale když něco nebude optimální, příště to zvládneš líp. |
| 11 | `react` | serious | 4 | Jak reagovat na incident? (→) Feature flag: vypnout. Pro juniory: flag je vypínač funkce, kód zůstane nasazený. (→) Chladná hlava: když nevím, co se děje, první krok je zjistit, co se děje. (→) Informovat. A to je těžké. |
| 12 | `room-edit` | serious | 5 | Co bylo rozbité? Obyčejná stránka: seznam pokojů, u každého tlačítko Upravit. (→) Otevře se formulář v bočním panelu: číslo pokoje, patro a hlavně kategorie. (→) Změním kategorii ze Standard na Deluxe (→) a uložím. Uloženo. (→) A kategorie je pořád Standard. |
| 13 | `db-tables` | serious | 3 | Jak to vypadalo v databázi. Tabulka pokojů a tabulka kategorií. (→) Mezi nimi propojovací tabulka room_category_assignments: který pokoj má kterou kategorii, kdo a kdy vazbu založil a jestli je smazaná. (→) Uložení přidalo nový řádek, ale ten starý zůstal. |
| 14 | `find-bug` | serious | 5 | Oprava kódu. Soubor s logikou pokojů. (→) A tady je funkce updateRoom. Najdete chybu? (→) Chyba není v žádném řádku, který tam je. Chyběl jeden řádek: loadCategories. Bez něj je room.categories prázdné, takže se stará vazba nikdy nesmaže a vždycky se jen přidá nová. (→) Opraveno. (→) …opraveno? |
| 15 | `damage` | serious | 4 | Napravení škod. Oprava kódu nestačila: (→) v databázi byl pořád nepořádek. (→) Co přesně se musí smazat a jak to zjistit? (→) A jakým způsobem to vyčistit? |
| 16 | `cleanup-poll` | serious | 5 | Anketa: jak byste to vyčistili? A) naklikat v UI, B) poslat SQL přímo do databáze, C) napsat uklízecí job. Hlasujte rukama. (→) UI: možná by stačilo stávající UI. Jenže nejde to, není v něm vidět ani chyba, ani která kategorie je správná. (→) SQL: není potřeba nic vyrábět, oprava hned. Ale je to velmi nebezpečné a stejně jsem na to neměl práva. (→) Job: pomalé, musím napsat kód a čekat na deploy. Ale rychleji bych to bezpečně stejně nezvládl. Je bezpečný, ukáže rozsah problému a nechá mě rozhodnout. (→) Takže job. |
| 17 | `job` | serious | 3 | Byly to dva joby s jednoduchým UI. První, InvestigateDuplicateRoomCategoryAssignments, dostal JSON se seznamem hotelů. (→) Run job a vyplivl JSON s duplicitními vazbami i s dalšími daty: jsou to stejné kategorie, nebo jiné? Která vazba je starší? (→) Podle toho jsem vybral, co smazat, a dal to druhému jobu, DeleteDuplicateRoomCategoryAssignments. Co smazat, rozhoduje člověk. |
| 18 | `switch-to-game` | game | 4 | Jak se tam ten řádek vůbec dostal? Pojďme si to zahrát. (→) Přijde agent (→) a vyrobí pět bugů. (→) Běžte a zničte produkci! |
| 19 | `level-1` | game | 4 | Level 1: statické kontroly. Code format, lint, type checking. Fungují jako buchary. (→) Prvního bugu rozmáčknou. (→) Druhý projde, protože kontrolují formu, ne chování. (→) Dají se nastavit třeba v Claude jako post-edit nebo stop hook. |
| 20 | `level-2` | game | 5 | Level 2: testy. Unit testy a integrační testy, dvě díry, které musí bug přeskočit. (→) Dřív to byla velmi silná ochrana. (→) První díru bug přeskočí, druhá je moc široká. (→) Jenže dnes mají testy menší hodnotu, pokud je píše stejný agent jako kód. (→) Agent přijde a bugovi postaví most. |
| 21 | `level-3` | game | 4 | Level 3: automatizované code review. (→) Agent měl vlastní krok code review. (→) Je specializované na známé chyby. (→) Jenže tenhle bug nebyl známý, takže se pastem prostě vyhnul. |
| 22 | `level-4` | game | 6 | Level 4: testování uživatelem. (→) Proklikat aplikaci, jestli vypadá v pořádku. (→) Dá se trochu automatizovat: agent pustí Playwright, pořídí screenshoty a podívá se na ně. (→) Je to nedeterministické. (→) Dva bugy chytíme, třetí se schová. (→) Problém: chyba byla vizuálně nenápadná, a když jsem vybral stejnou kategorii, UI vypadalo správně. |
| 23 | `level-5` | game | 4 | Level 5: feature flag. (→) Díky flagu jde funkci zapnout a vypnout, kdyby byl problém. (→) Bug na flag naskočí, trochu se zneviditelní a dostane se na druhou stranu. (→) Ale právě kvůli tomu se na chybu přišlo později. |
| 24 | `level-6` | game | 4 | Level 6: neznámá doména. (→) Refaktoroval jsem cizí část aplikace a nevěděl jsem přesně, jak všechno funguje. (→) A hůř se shání člověk na review, když nevím ani, který tým to má na starosti. (→) Bug se tu vyzná líp než já. |
| 25 | `level-7` | game | 4 | Level 7: code review. (→) Abych projekt posouval dopředu, musel jsem posílat velká PR. (→) A ve velkém PR se bugy schovají snadno. (→) Deset malých PR by se ověřilo snáz než jedno velké, ale je v tom organizační overhead. |
| 26 | `level-8` | game | 3 | Level 8: bug nezpůsoboval crash. Většina pole je odkrytá a nic nevybuchlo. (→) Padající kód bychom si všimli hned. (→) Tenhle bug nic neshodil. Jen tiše čekal. |
| 27 | `bug-wins` | game | 2 | Bug došel až na produkci. (→) Bum. Bug vyhrál. |
| 28 | `takeaways` | game | 5 | Co tedy s tím? (→) Možná by nebylo od věci držet se best practices, třeba malých PR. (→) Refaktorovacího agenta jsme vylepšili, aby se přesně tohle příště už nestalo. (→) Jde o to zmenšit pravděpodobnost chyby. Na sto procent úspěšní nikdy nebudeme. (→) Díky! |
| 29 | `bug-sheet` | game | 1 | DEV ONLY: character sheet hrdiny, před talkem smazat. |
