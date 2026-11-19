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
| 2 | `true-story` | game | 5 | Bug přijde domů a pustí si televizi: Věřte nevěřte. (→) …tohle se opravdu stalo. (→) Pracoval jsem v Mews, (→) firma dělá software pro hotely. (→) Přes tisíc zaměstnanců, stovky vývojářů. |
| 3 | `mews-pms` | game | 5 | Mews PMS je hlavní produkt. (→) Většina obrazovek je v Reactu nad REST API. (→) Ale jsou tam i starší části: ty renderuje backend pomocí Razor šablon. (→) Firma existuje 14 let. (→) Říkali jsme jim backend rendered pages. |
| 4 | `whats-wrong` | game | 4 | Co je na tom špatně? Vypadají trochu jinak než zbytek aplikace. (→) Je to legacy kód, vývojáři do toho neradi sahají. (→) Způsobuje technické problémy. (→) A pak přijde dilema: potřebuju na takové stránce doplnit něco malého. Doplním to postaru, nebo přepíšu celou stránku? |
| 5 | `named-problem` | game | 6 | Proč se s tím nic nedělá? (→) Ve firmě to byl problém pojmenovaný už několik let. (→) Jenže postaru bylo napsaných nižší stovky stránek. (→) A co zákazníkovi přinese přepis? Oproti novým funkcím nic moc. (→) Přesto se o to pokoušelo mnoho lidí a byl to jeden z cílů firmy v oblasti technických vylepšení. (→) Tak jsem se rozhodl, že to zkusím taky. (Počet čárek je ilustrační.) |
| 6 | `agent` | game | 12 | Vyrobil jsem refaktorovacího agenta. Nebylo to těžké: (→) navázal jsem na práci ostatních. (→) Napsali dobrou dokumentaci a některé věci částečně zautomatizovali. (→) Jejich práci jsem použil jako příklad. (→) K tomu jsem dodal svou představu fungování: (→) zanalyzovat kód, napsat specifikaci, napsat API, napsat frontendové komponenty, propojit API a frontend, udělat code review a opravit chyby. |
| 7 | `worked` | game | 6 | A fungovalo to. (→) Agent vytvořil dobrý základ v produkční kvalitě. (→) Lepší UX, (→) jednotný vzhled se zbytkem aplikace, (→) snadné další vylepšování (→) a přibyly nové funkce: inline edit a bulk delete. |
| 8 | `mostly` | game | 2 | …většinou… (pauza, nechat dojít) (→) Pátek 13. srpna, 16:00. Přijde zpráva na Slacku: Řešíme incident, pojď nám pomoct. |
| 9 | `slack` | serious | 4 | Astrid: Nefunguje synchronizace do našeho systému. (→) Padá to, hotelové pokoje mají více kategorií. (→) Janse: Potvrzuji, v databázi vidím 140 duplicit. (→) Hector: To bude naše nová stránka, vypnu to. |
| 10 | `panic` | serious | 8 | Co se děje? (→) Přístup do produkční aplikace. (→) Přístup k logům a metrikám. (→) Přístup do produkční databáze. (→) Dost informací. (→) Znalost systému na správu incidentů. (→) Jak jsem na tom byl já: produkce ano, logy ano, produkční databáze ne, informace ne, incidenty ano. (→) Příprava je důležitá. Ale buď v klidu, příště to zvládneš líp. |
| 11 | `react` | serious | 4 | Jak reagovat? (→) Feature flag: vypnout. Pro juniory: flag je vypínač funkce, kód zůstane nasazený. (→) Chladná hlava: když nevím, co se děje, první krok je zjistit, co se děje. (→) Informovat. A to je těžké. |
| 12 | `room-edit` | serious | 5 | Co bylo rozbité? Obyčejná stránka: seznam pokojů, u každého tlačítko Upravit. (→) Otevře se formulář v bočním panelu: číslo pokoje, patro a hlavně kategorie. (→) Změním kategorii ze Standard na Deluxe (→) a uložím. Uloženo. (→) A kategorie je pořád Standard. |
| 13 | `db-tables` | serious | 3 | Jak to vypadalo v databázi. Tabulka pokojů a tabulka kategorií. (→) Mezi nimi propojovací tabulka room_category_assignments: který pokoj má kterou kategorii, kdo a kdy vazbu založil a jestli je smazaná. (→) Uložení přidalo nový řádek, ale ten starý zůstal. |
| 14 | `find-bug` | serious | 5 | Oprava kódu. Soubor s logikou pokojů. (→) A tady je funkce updateRoom. Najdete chybu? (→) Chyba není v žádném řádku, který tam je. Chyběl jeden řádek: loadCategories. Bez něj je room.categories prázdné, takže se stará vazba nikdy nesmaže a vždycky se jen přidá nová. (→) Opraveno. (→) …opraveno? |
| 15 | `damage` | serious | 4 | Napravení škod. Oprava kódu nestačila: (→) v databázi zůstal nepořádek. (→) Co přesně smazat? (→) A jakým způsobem to vyčistit? |
| 16 | `cleanup-poll` | serious | 8 | Anketa: jak byste to vyčistili? (→) A) naklikat v UI, (→) B) pustit SQL v databázi, (→) C) uklízecí job. Hlasujte rukama. (→) UI: možná by stačilo stávající UI. Jenže v něm není vidět ani chyba, ani která kategorie je správná. (→) SQL: oprava hned. Ale je to velmi nebezpečné a stejně jsem na to neměl práva. (→) Job: pomalé, musím napsat kód a čekat na deploy. Ale je bezpečný, ukáže rozsah problému a nechá mě rozhodnout. (→) Takže job. |
| 17 | `job` | serious | 4 | Byly to dva joby s jednoduchým UI. První, InvestigateDuplicateRoomCategoryAssignments, dostal JSON se seznamem hotelů. (→) Run job a vyplivl JSON s duplicitními vazbami i s dalšími daty: jsou to stejné kategorie, nebo jiné? Která vazba je starší? (→) Podle toho jsem vybral, co smazat, a dal to druhému jobu, DeleteDuplicateRoomCategoryAssignments. Co smazat, rozhoduje člověk. (→) Hotovo. |
| 18 | `switch-to-game` | game | 2 | Proč se to tedy stalo? Pojďme si to zahrát. Přijde agent (→) a vyrobí pět bugů: Běžte a zničte produkci! |
| 19 | `level-1` | game | 4 | Level 1: statické kontroly. Code format, lint, type checking. Fungují jako buchary. (→) Prvního bugu rozmázne lint. (→) Druhý projde, protože kontrolují formu, ne chování. (→) Dají se nastavit třeba v Claude jako post-edit nebo stop hook. |
| 20 | `level-2` | game | 4 | Level 2: testy. Unit testy a integrační testy, dvě díry, které musí bug přeskočit. (→) Dřív to byla velmi silná ochrana. (→) První díru bug přeskočí, druhá je moc široká. (→) Jenže dnes mají testy menší hodnotu, pokud je píše stejný agent jako kód. Agent přijde a bugovi postaví most. |
| 21 | `level-3` | game | 4 | Level 3: automatizované code review. (→) Agent měl vlastní krok code review. (→) Řeší především známé chyby. (→) Jenže tenhle bug nebyl známý, takže se pastem prostě vyhnul. |
| 22 | `level-4` | game | 6 | Level 4: testování uživatelem. (→) Proklikej aplikaci. Vypadá ok? (→) Lze částečně automatizovat: agent pustí Playwright, pořídí screenshoty a podívá se na ně. (→) Je to nedeterministické. (→) Dva bugy chytíme, třetí se schová. (→) Problém: chyba byla vizuálně nenápadná, a když jsem vybral stejnou kategorii, UI vypadalo správně. |
| 23 | `level-5` | game | 3 | Level 5: feature flag. (→) Díky flagu jde funkci zapnout a vypnout, kdyby byl problém. (→) Ale právě kvůli tomu se na chybu přišlo později: bug na flag naskočí, trochu se zneviditelní a dostane se na druhou stranu. |
| 24 | `level-6` | game | 4 | Level 6: znalost domény. Tou by se bug zastavil. (→) Jenže já refaktoroval cizí část aplikace a nevěděl jsem přesně, jak všechno funguje. (→) Vím, kdo mi udělá review? Hůř se shání, když nevím ani, který tým to má na starosti. (→) Bug se tu vyzná líp než já. |
| 25 | `level-7` | game | 3 | Level 7: code review. Ve velkém PR se bugy schovají snadno. (→) Posílal jsem velké PR, aby projekt běžel dopředu rychleji. (→) Deset malých PR se ověří snáz než jedno velké. |
| 26 | `level-8` | game | 3 | Level 8: sledování pádů. Jenže bug nezpůsoboval crash. Bug tu hraje hledání min: většina pole je odkrytá. (→) Odkryje další políčka a zase nic nevybuchlo. (→) Padajícího kódu bychom si všimli hned. |
| 27 | `bug-wins` | game | 2 | Bug došel až na produkci. (→) Bum. Bug vyhrál. |
| 28 | `takeaways` | game | 6 | Co tedy s tím? (→) Možná by nebylo od věci držet se best practices, třeba malých PR. (→) Refaktorovacího agenta jsme vylepšili, aby se přesně tohle příště už nestalo. (→) Nestačí skoro dobře, jeden řádek může všechno pokazit. (→) Jde o to zmenšit pravděpodobnost chyby. Na sto procent úspěšní nikdy nebudeme. (→) Díky! |
