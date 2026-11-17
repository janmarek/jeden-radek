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
| 2 | `true-story` | serious | 2 | Věřte nevěřte, tohle se opravdu stalo. Pracoval jsem v Mews, firma dělá software pro hotely. |
| 3 | `mews-pms` | game | 3 | Mews PMS je hlavní produkt. Firma existuje 14 let. Většina obrazovek je v Reactu nad REST API. Ale jsou tam i starší části: ty renderuje backend pomocí Razor šablon. Říkali jsme jim backend rendered pages. |
| 4 | `whats-wrong` | game | 4 | Co je na tom špatně? Jiná technologie, takže stránky vypadají jinak než zbytek aplikace a špatně se rozvíjejí. A pak přijde dilema: potřebuju na takové stránce doplnit něco malého. Doplním to po staru, nebo přepíšu celou stránku? |
| 5 | `named-problem` | game | 2 | Byl to pojmenovaný problém už několik let a docela dost lidí se s tím snažilo něco udělat. Jenže stránek byly nižší stovky. Hodně práce, která neměla prioritu: co z toho bude mít zákazník oproti jiným věcem? |
| 6 | `why` | game | 2 | Proč to stojí za to: nové UI je konzistentní se zbytkem aplikace, lepší pro uživatele, a šlo přidat inline edit a bulk delete. Háček: dělal jsem to jako side projekt. Vedení se to líbilo, ale nikdo mi na to nedal čas. |
| 7 | `agent` | game | 2 | Tak jsem si vyrobil agenta. Dal jsem mu dokumentaci, jak to lidé dělali dřív. Pro juniory: je to jako onboarding nového kolegy. Pak postup v osmi krocích. (Technické detaily jdou zkrátit, když nezbyde čas.) |
| 8 | `mostly` | game | 2 | A fungovalo to. Obrazovky byly konzistentní, UX šlo iterovat. ...většinou... (pauza, nechat dojít) |
| 9 | `friday` | serious | 2 | Pátek odpoledne. Přijde zpráva od kolegů: duplikují se řádky. [Znění zprávy je zástupné, doplnit skutečné.] |
| 10 | `what-happened` | serious | 5 | Klíčový obrázek. Pokoj má kategorii; vztah je v propojovací tabulce, jeden řádek. Změním kategorii v UI. Mělo se stát: starý řádek smazat, nový vložit. Stalo se: nový přibyl, starý zůstal. A UI ukazuje ten nejstarší, takže to vypadá, že se nic nezměnilo. |
| 11 | `stop-bleeding` | serious | 3 | Krok 1: zastavit krvácení. Vypnul jsem feature flag. Pro juniory: flag je vypínač funkce. A pak: víkend se neřešilo. |
| 12 | `access` | serious | 2 | Krok 2: bojová sada. Přístupy si ověř předem: produkce, observability, databáze. Kolega přístup do produkční databáze měl, já ne. Tenhle slajd si klidně vyfoťte. |
| 13 | `investigate` | serious | 3 | Krok 3: nejdřív zjistit, pak opravit. UI skutečný stav neukazovalo. Napsal jsem jednorázový job: vypíše, co v databázi opravdu je, a umí smazat vybrané řádky. Co smazat, rozhoduje člověk. Deploy trvá, ale rychleji to stejně nezvládnu. |
| 14 | `dont-know` | serious | 3 | Krok 4: komunikace. Nejtěžší věta incidentu je ‚nevím‘. Pomáhá vzorová věta: co nevím, co zjišťuju a kdy dám vědět. [Vzorová věta je návrh, potvrdit znění.] |
| 15 | `teaser` | game | 2 | Rozcvička. Tady je pull request, asi 800 řádků. Máte 10 sekund, najděte chybu. Klidně hádejte nahlas. (→ spustí odpočet) |
| 16 | `reveal` | game | 2 | Nikdo ji nenašel. A nemohl: chyba není v řádku, který tam je. Chyběl jeden řádek, ten, který měl starou vazbu pokoj–kategorie načíst a smazat. |
| 17 | `switch-to-game` | game | 2 | Jak se tam ten řádek vůbec dostal? Pojďme si to zahrát. Hlavní hrdina celou dobu nebyl tým ani agent. Byl to bug. [Vyprávění bugu v 1. osobě je návrh.] |
| 18 | `level-1` | game | 3 | Level 1, spawn. Agent vygeneruje asi 800 řádků. Starý kód měl skryté chování, načítal stávající data, a nikdo to agentovi neřekl. Bug v diffu není vidět, protože tam chybí. |
| 19 | `level-2` | game | 3 | Level 2: automatické brány. Formátování, lint, spouštění testů, nastavení v Claude. Brány, kterými agent bez kontroly neprojde. Jenže všechny kontrolují formu. Chybějící chování žádná nevidí. |
| 20 | `level-3` | game | 3 | Level 3: testy a Playwright. Testy psané agentem jsou levné, ale pokrývají jen známé problémy. Test ze stejného kontextu má stejná slepá místa jako kód. A screenshot vypadal správně, protože UI ukazovalo nejstarší řádek. |
| 21 | `level-4` | game | 3 | Level 4: PR a review. PR mělo asi 800 řádků, většinu psalo AI. Review z cizího týmu, kde jsem nikoho neznal. Velké PR jsem potřeboval, deset menších místo dvou bych nezvládl. Jenže velké PR se rozumně reviewovat nedá. [Návrh: ironie, pipeline agenta měla vlastní code review, ale ve stejném kontextu.] |
| 22 | `level-5` | game | 3 | Level 5: databáze. Žádný zámek, takže se bug klonuje: každé uložení = nový řádek. Pro juniory: unique constraint je zámek, který duplicitu odmítne. [Otevřená otázka: existoval v DB unique constraint?] |
| 23 | `level-6` | game | 3 | Level 6: feature flag. Flag byl vypnutý, takže bug spal, asi měsíc po mergi. Když se flag zapnul, nic nespadlo. Zapnutou verzi jsme testovali málo. |
| 24 | `level-7` | game | 3 | Level 7: pozdní projev. Nic nespadlo hned. Problém vznikal až při synchronizaci s druhým systémem. [Název druhého systému a jak se selhání poznalo: zatím neznámé, nevymýšlet.] |
| 25 | `boss` | game | 2 | A boss fight? Ten už jste viděli. Byl to páteční odpoledne. |
| 26 | `patch-notes` | game | 2 | Patch notes. Agent nedostal výpověď, dostal patch. Nejdřív databáze a testy, pak agent, pak proces. [Obsah je návrh z brainstormu, vybrat.] |
| 27 | `punchline` | game | 4 | Agent není hloupý, je doslovný. Udělal přesně to, co jsem mu řekl. Řádek, který chybí, neuvidí člověk ani agent, takže ho musí zastavit systém. Závěr: [vybrat jednu ze tří vět; na slajdu je zatím ‚hra na easy‘]. Díky! |
| 28 | `bug-sheet` | game | 1 | DEV ONLY: character sheet hrdiny, před talkem smazat. |
