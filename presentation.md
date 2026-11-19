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
| 18 | `what-happened` | serious | 5 | Klíčový obrázek. Pokoj má kategorii; vztah je v propojovací tabulce, jeden řádek. Změním kategorii v UI. Mělo se stát: starý řádek smazat, nový vložit. Stalo se: nový přibyl, starý zůstal. A UI ukazuje ten nejstarší, takže to vypadá, že se nic nezměnilo. |
| 19 | `teaser` | game | 2 | Rozcvička. Tady je pull request, asi 800 řádků. Máte 10 sekund, najděte chybu. Klidně hádejte nahlas. (→ spustí odpočet) |
| 20 | `reveal` | game | 2 | Nikdo ji nenašel. A nemohl: chyba není v řádku, který tam je. Chyběl jeden řádek, ten, který měl starou vazbu pokoj–kategorie načíst a smazat. |
| 21 | `switch-to-game` | game | 2 | Jak se tam ten řádek vůbec dostal? Pojďme si to zahrát. Hlavní hrdina celou dobu nebyl tým ani agent. Byl to bug. [Vyprávění bugu v 1. osobě je návrh.] |
| 22 | `level-1` | game | 3 | Level 1, spawn. Agent vygeneruje asi 800 řádků. Starý kód měl skryté chování, načítal stávající data, a nikdo to agentovi neřekl. Bug v diffu není vidět, protože tam chybí. |
| 23 | `level-2` | game | 3 | Level 2: automatické brány. Formátování, lint, spouštění testů, nastavení v Claude. Brány, kterými agent bez kontroly neprojde. Jenže všechny kontrolují formu. Chybějící chování žádná nevidí. |
| 24 | `level-3` | game | 3 | Level 3: testy a Playwright. Testy psané agentem jsou levné, ale pokrývají jen známé problémy. Test ze stejného kontextu má stejná slepá místa jako kód. A screenshot vypadal správně, protože UI ukazovalo nejstarší řádek. |
| 25 | `level-4` | game | 3 | Level 4: PR a review. PR mělo asi 800 řádků, většinu psalo AI. Review z cizího týmu, kde jsem nikoho neznal. Velké PR jsem potřeboval, deset menších místo dvou bych nezvládl. Jenže velké PR se rozumně reviewovat nedá. [Návrh: ironie, pipeline agenta měla vlastní code review, ale ve stejném kontextu.] |
| 26 | `level-5` | game | 3 | Level 5: databáze. Žádný zámek, takže se bug klonuje: každé uložení = nový řádek. Pro juniory: unique constraint je zámek, který duplicitu odmítne. [Otevřená otázka: existoval v DB unique constraint?] |
| 27 | `level-6` | game | 3 | Level 6: feature flag. Flag byl vypnutý, takže bug spal, asi měsíc po mergi. Když se flag zapnul, nic nespadlo. Zapnutou verzi jsme testovali málo. |
| 28 | `level-7` | game | 3 | Level 7: pozdní projev. Nic nespadlo hned. Problém vznikal až při synchronizaci s druhým systémem. [Název druhého systému a jak se selhání poznalo: zatím neznámé, nevymýšlet.] |
| 29 | `boss` | game | 2 | A boss fight? Ten už jste viděli. Byl to páteční odpoledne. |
| 30 | `patch-notes` | game | 2 | Patch notes. Agent nedostal výpověď, dostal patch. Nejdřív databáze a testy, pak agent, pak proces. [Obsah je návrh z brainstormu, vybrat.] |
| 31 | `punchline` | game | 4 | Agent není hloupý, je doslovný. Udělal přesně to, co jsem mu řekl. Řádek, který chybí, neuvidí člověk ani agent, takže ho musí zastavit systém. Závěr: [vybrat jednu ze tří vět; na slajdu je zatím ‚hra na easy‘]. Díky! |
| 32 | `bug-sheet` | game | 1 | DEV ONLY: character sheet hrdiny, před talkem smazat. |
