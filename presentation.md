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
| 1 | `title` | game | 2 | Ahoj, jsem Jan. Tohle je příběh o jednom řádku. (krok 2: anotace, přečíst nebo nechat chvíli viset) |
| 2 | `teaser` | game | 2 | Rozcvička. Tady je pull request, asi 800 řádků. Máte 10 sekund, najděte chybu. Klidně hádejte nahlas. (→ spustí odpočet) |
| 3 | `reveal` | game | 2 | Nikdo ji nenašel. A nemohl: chyba není v řádku, který tam je. Chyběl jeden řádek. Co dělal, se dozvíte za chvíli. |
| 4 | `world` | game | 2 | Svět: staré obrazovky na backendových Razor šablonách. Firma je léta přepisuje, je to hodně práce. Nové jsou v Reactu nad REST API. |
| 5 | `why` | game | 2 | Proč to stojí za to: nové UI je konzistentní se zbytkem aplikace, lepší pro uživatele, a šlo přidat inline edit a bulk delete. Háček: dělal jsem to jako side projekt. Vedení se to líbilo, ale nikdo mi na to nedal čas. |
| 6 | `agent` | game | 2 | Tak jsem si vyrobil agenta. Dal jsem mu dokumentaci, jak to lidé dělali dřív. Pro juniory: je to jako onboarding nového kolegy. Pak postup v osmi krocích. (Technické detaily jdou zkrátit, když nezbyde čas.) |
| 7 | `mostly` | game | 2 | A fungovalo to. Obrazovky byly konzistentní, UX šlo iterovat. ...většinou... (pauza, nechat dojít) |
| 8 | `friday` | serious | 2 | Pátek odpoledne. Přijde zpráva od kolegů: duplikují se řádky. [Znění zprávy je zástupné, doplnit skutečné.] |
| 9 | `what-happened` | serious | 5 | Klíčový obrázek. Pokoj má kategorii; vztah je v propojovací tabulce, jeden řádek. Změním kategorii v UI. Mělo se stát: starý řádek smazat, nový vložit. Stalo se: nový přibyl, starý zůstal. A UI ukazuje ten nejstarší, takže to vypadá, že se nic nezměnilo. |
| 10 | `stop-bleeding` | serious | 3 | Krok 1: zastavit krvácení. Vypnul jsem feature flag. Pro juniory: flag je vypínač funkce. A pak: víkend se neřešilo. |
| 11 | `access` | serious | 2 | Krok 2: bojová sada. Přístupy si ověř předem: produkce, observability, databáze. Kolega přístup do produkční databáze měl, já ne. Tenhle slajd si klidně vyfoťte. |
| 12 | `investigate` | serious | 3 | Krok 3: nejdřív zjistit, pak opravit. UI skutečný stav neukazovalo. Napsal jsem jednorázový job: vypíše, co v databázi opravdu je, a umí smazat vybrané řádky. Co smazat, rozhoduje člověk. Deploy trvá, ale rychleji to stejně nezvládnu. |
| 13 | `dont-know` | serious | 3 | Krok 4: komunikace. Nejtěžší věta incidentu je ‚nevím‘. Pomáhá vzorová věta: co nevím, co zjišťuju a kdy dám vědět. [Vzorová věta je návrh, potvrdit znění.] |
| 14 | `switch-to-game` | game | 2 | Jak se tam ten řádek vůbec dostal? Pojďme si to zahrát. Hlavní hrdina celou dobu nebyl tým ani agent. Byl to bug. [Vyprávění bugu v 1. osobě je návrh.] |
| 15 | `level-1` | game | 3 | Level 1, spawn. Agent vygeneruje asi 800 řádků. Starý kód měl skryté chování, načítal stávající data, a nikdo to agentovi neřekl. Bug v diffu není vidět, protože tam chybí. |
| 16 | `level-2` | game | 3 | Level 2: automatické brány. Formátování, lint, spouštění testů, nastavení v Claude. Brány, kterými agent bez kontroly neprojde. Jenže všechny kontrolují formu. Chybějící chování žádná nevidí. |
| 17 | `level-3` | game | 3 | Level 3: testy a Playwright. Testy psané agentem jsou levné, ale pokrývají jen známé problémy. Test ze stejného kontextu má stejná slepá místa jako kód. A screenshot vypadal správně, protože UI ukazovalo nejstarší řádek. |
| 18 | `level-4` | game | 3 | Level 4: PR a review. PR mělo asi 800 řádků, většinu psalo AI. Review z cizího týmu, kde jsem nikoho neznal. Velké PR jsem potřeboval, deset menších místo dvou bych nezvládl. Jenže velké PR se rozumně reviewovat nedá. [Návrh: ironie, pipeline agenta měla vlastní code review, ale ve stejném kontextu.] |
| 19 | `level-5` | game | 3 | Level 5: databáze. Žádný zámek, takže se bug klonuje: každé uložení = nový řádek. Pro juniory: unique constraint je zámek, který duplicitu odmítne. [Otevřená otázka: existoval v DB unique constraint?] |
| 20 | `level-6` | game | 3 | Level 6: feature flag. Flag byl vypnutý, takže bug spal, asi měsíc po mergi. Když se flag zapnul, nic nespadlo. Zapnutou verzi jsme testovali málo. |
| 21 | `level-7` | game | 3 | Level 7: pozdní projev. Nic nespadlo hned. Problém vznikal až při synchronizaci s druhým systémem. [Název druhého systému a jak se selhání poznalo: zatím neznámé, nevymýšlet.] |
| 22 | `boss` | game | 2 | A boss fight? Ten už jste viděli. Byl to páteční odpoledne. |
| 23 | `patch-notes` | game | 2 | Patch notes. Agent nedostal výpověď, dostal patch. Nejdřív databáze a testy, pak agent, pak proces. [Obsah je návrh z brainstormu, vybrat.] |
| 24 | `punchline` | game | 4 | Agent není hloupý, je doslovný. Udělal přesně to, co jsem mu řekl. Řádek, který chybí, neuvidí člověk ani agent, takže ho musí zastavit systém. Závěr: [vybrat jednu ze tří vět; na slajdu je zatím ‚hra na easy‘]. Díky! |
| 25 | `bug-sheet` | game | 1 | DEV ONLY: character sheet hrdiny, před talkem smazat. |
