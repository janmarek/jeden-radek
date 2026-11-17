# Jeden řádek: zadání prezentace

> **Stav:** výstup z brainstormingu, **brát s rezervou.** Je to dobrý základ,
> ale autor příběh ještě dotváří. Některé věci se změní, hlavně jestli a jak je
> prezentovat. Když je tento dokument v rozporu s novějším pokynem autora,
> platí autor.

## Zadání pro agenta

Vytvoř 20minutovou prezentaci „Jeden řádek“ pro programátorský meetup, kde bude
hodně juniorů. Osnova příběhu, fakta a pointa jsou dané. Vizuální zpracování
vychází z autorových nápadů v sekci [Moje nápady](#moje-nápady-ke-tvůrčímu-zpracování).

- **Výstup:** sada slajdů s poznámkami pro mluvčího v češtině. Formát:
  ručně psaný HTML/CSS/JS deck ve stylu předchozí prezentace
  (`~/Documents/dev/bdd`), bez frameworku pro slajdy.
- **Pevné:** osnova dějství, fakta příběhu, pointa a hlavní hlášky.
- **Volné:** přesné formulace slajdů a vizuální detaily, vždy v duchu autorových
  nápadů. Položky označené *(návrh)* je potřeba potvrdit, nejsou závazné.
- **Nesmíš:** vymýšlet čísla, jména, názvy firem ani technické detaily, které
  nejsou v sekci [Fakta](#fakta-příběhu). Když nějaký fakt chybí, nech na slajdu
  zástupný text a zapiš otázku do [Otevřených otázek](#otevřené-otázky).
- Autor příběh ještě dotváří. Drž se osnovy a nepřepisuj ji, jen ji naplň.

## Téma, publikum a pointa

Talk je poctivý příběh o incidentu, který způsobil jeden chybějící řádek v kódu
vygenerovaném AI. Ukazuje, jak u něj zachovat chladnou hlavu a jak postavit
systém, který chybu zastaví dřív, než se dostane na produkci.

- **Název:** Jeden řádek
- **Anotace (pevná):** Někdy stačí jeden špatný řádek, aby nastal produkční
  problém. Jak si zachovat chladnou hlavu při jeho řešení? A ještě lépe, jak
  zabránit tomu hloupému agentovi, který za nás píše kód, aby dělal chyby?
- **Akce:** ReactGirls meetup, 19. 11. 2026 v 18:00, Praha.
- **Publikum:** programátorský meetup, hodně juniorů. Každý pojem, který není
  samozřejmý, vysvětli jedním obrázkem, ne definicí.
- **Délka:** 20 minut.
- **Tón:** zábava místo nudného poučování. Příběh má pointu a z každé části si
  publikum odnese jednu jasnou větu.

**Pointa:** chyby musí zastavit sám systém, protože řádek, který chybí, neuvidí
lidské oko ani agent. Agent není hloupý, je doslovný. Udělal přesně to, co mu
bylo řečeno, jenže mu nikdo neřekl o skrytém chování starého kódu.

Pomocné věty pro závěr (autor vybere):

- Bug nevyhrál, protože byl chytrý. Vyhrál, protože hra byla na easy.
- Agent udělal přesně to, co jsem mu řekl. Problém byl, že jsem nevěděl, co
  všechno vlastně chci říct.
- Agent nedostal výpověď, dostal patch.

## Příběh

Pořadí je záměrně nelineární: nejdřív incident, potom flashback v podobě hry
o tom, jak se chyba dostala do produkce.

1. **Teaser (0–1 min).** 800řádkový diff, „najděte chybu za 10 sekund“. Nikdo
   ji nenajde, protože jeden řádek chybí. Co ten řádek dělal, se publikum dozví
   až v incidentu.
2. **Svět (1–2,5 min).** Staré obrazovky na Razor šablonách, které se firma
   léta snaží přepsat. Nové obrazovky v Reactu nad REST API jsou konzistentní
   a pro uživatele lepší (inline edit, bulk delete). Autor to dělá jako side
   projekt. Vedení se to líbilo, ale nikdo mu na to nevyhradil čas.
3. **Agent (2,5–5 min).** Autor vyrobil agenta: dal mu dokumentaci, jak to lidé
   dělali dřív, a pipeline analýza kódu → specifikace → API → backend → klient
   → frontend → feature flag → code review. Fungovalo to dobře, obrazovky byly
   konzistentní a UX se dalo iterovat. „…většinou…“
4. **Incident (5–11 min).** V pátek odpoledne přišla zpráva, že se duplikují
   řádky. Feature flag se vypnul a přes víkend se nic neřešilo. Kolega má
   přístup do produkční databáze, autor ne. Jednorázový job vypíše, co v databázi
   skutečně je (UI to neukazuje), a umožní smazat vybrané řádky. Komunikace: je
   těžké přiznat, že nevím.
5. **Flashback: hra (11–17 min).** Jak se bug dostal na produkci. Bug je hrdina,
   každý level je jedna obranná vrstva a bug projde všemi: automatické kontroly,
   testy a Playwright, velké PR a review z cizího týmu, databáze bez zámku,
   feature flag, pozdní projev při synchronizaci. Boss fight už publikum vidělo:
   byl to incident.
6. **Patch notes a pointa (17–20 min).** Seznam vylepšení pro agenta i pro
   systém, na závěr pointa.

## Fakta příběhu

Tohle je zdroj pravdy. Co tu není, se nesmí prezentovat jako fakt.

### Potvrzeno autorem

- **Refaktoring:** staré obrazovky byly na backendových Razor šablonách, nové
  jsou React + REST API. Firma se je léta snaží přepsat, je to hodně práce.
- Nové UI stojí na lepších technologiích, je konzistentní se zbytkem aplikace,
  je lepší pro uživatele a umožnilo přidat inline edit a bulk delete.
- Práce vznikla jako side projekt. Vedení se líbila, ale nikdo autorovi neřekl,
  že mu na ni dá měsíc času.
- Autor vyrobil agenta: dal mu dokumentaci, jak to lidé dělali dřív, a popsal
  postup. Pipeline: analýza kódu, specifikace, napsat API, spustit backend,
  vygenerovat API klienta, napsat frontend, feature flag, code review.
- Bug byl v novém API. Konvertor/agent neověřil, že se nové API chová stejně
  jako staré. Požadavek, že se musí načíst stávající data, v zadání nebyl. Starý
  kód to dělal skrytě.
- Kód ukládal vztah mezi pokojem a jeho kategorií do propojovací tabulky. Místo
  aby smazal starý řádek a vytvořil nový, zakládal duplicitní řádky. UI
  zobrazovalo ten nejstarší, takže se kategorie navenek neměnila.
- PR mělo přibližně 800 řádků a většinu napsalo AI. Review bylo špatné, skoro
  žádné: velký rozsah a k tomu doména cizího týmu, kde autor nikoho neznal.
- Incident se objevil asi měsíc po mergi. Feature flag byl nejdřív vypnutý,
  a když se pak zapnul, chyba nic hned neshodila. Problém vznikal až při
  synchronizaci s druhým systémem.
- **Incident:** v pátek odpoledne přišla od kolegů zpráva o duplikaci řádků.
  Feature flag se vypnul, přes víkend se nic neřešilo. Kolega měl přístup do
  produkční databáze, autor ne.
- Autor napsal jednorázový job, který vypíše skutečný stav databáze (v UI to
  nebylo vidět) a umí smazat vybrané řádky podle úsudku člověka.
- **Poučení autora:** když nevím, nejdřív zjišťuju, i když deploy trvá (rychleji
  to stejně nezvládnu). Přístupy (produkce, observability, databáze) je potřeba
  ověřit předem. Přiznat „nevím“ je těžké.
- Testy psané agentem jsou levné, ale mají menší hodnotu než dřív, protože
  pokrývají jen známé problémy. Agent, který píše testy, proto musí mít jiný
  kontext než agent, který píše kód. Autor velká PR potřeboval: deset menších
  místo dvou by nezvládl. Velké PR se ale rozumně reviewovat nedá.

### Doplněno autorem (17. 11.)

- Firma: **Mews**, dělá software pro hotely, existuje 14 let. Autor tam pracoval
  (už ne). Jméno firmy smí na slajd, logo a firemní barvy ne.
- Talk otevírá „Věřte nevěřte“: příběh se opravdu stal.
- Většina obrazovek byla React + REST API. Ty starší renderoval backend pomocí
  Razor šablon; interně se jim říkalo **backend rendered pages**. Jiná technologie,
  takže vypadaly trochu jinak a nedaly se snadno rozvíjet.
- Dilema: na staré stránce něco malého doplnit, nebo celou stránku přepsat?
- Pojmenovaný problém už několik let, docela dost lidí se s tím snažilo něco
  udělat. Stránek byly nižší stovky, takže hodně práce bez priority: co z toho
  bude mít zákazník oproti jiným věcem?
- Pořadí: rozcvička (diff) a odhalení jsou až **po incidentu**, před přepnutím do
  hry. Titulka bez anotace a bez „stiskni“, se jménem autora.
- Aktuální pořadí slajdů je v `presentation.md`; tabulka níže je původní plán.

### Nevymýšlet (zatím neznámé)

- Název produktu a druhého systému, se kterým se synchronizovalo.
- Počet duplicit, počet zasažených záznamů, přesná délka incidentu a dopad na
  zákazníky.
- Jak přesně se na produkci poznalo, že druhý systém selhává.
- Jestli v databázi existoval unique constraint (viz Otevřené otázky).

## Seznam slajdů

24 slajdů na 20 minut. Časy jsou orientační začátky slajdů. Sloupec *Vizuál
a hláška* obsahuje pevný obsah i *(návrhy)*, které je potřeba potvrdit.

| #  | Čas   | Slajd                      | Obsah | Vizuál a hláška |
|----|-------|----------------------------|-------|-----------------|
| 1  | 0:00  | Titulka                    | Název „Jeden řádek“ a anotace | Úvodní obrazovka retro hry *(návrh)* |
| 2  | 0:30  | Teaser: diff               | 800 řádků změn, odpočet 10 sekund | „Najděte chybu.“ Publikum hádá nahlas |
| 3  | 1:00  | Odhalení                   | Nikdo ji nenajde, protože jeden řádek chybí | Slovní hříčka: řádek kódu vs. řádek v databázi *(návrh)* |
| 4  | 1:30  | Svět                       | Staré Razor obrazovky vs. nové v Reactu; „léta se to přepisuje“ | Dvě obrazovky vedle sebe |
| 5  | 2:15  | Proč to stojí za to        | Konzistence, lepší UX, inline edit, bulk delete; side projekt bez vyhrazeného času | Ikony nových funkcí |
| 6  | 3:00  | Agent                      | Pipeline osmi kroků: analýza, specifikace, API, backend, klient, frontend, flag, review | Schéma. Pro juniory: dokumentace = onboarding nového kolegy |
| 7  | 4:30  | „…většinou…“               | Fungovalo to: konzistentní obrazovky, iterace UX. Pak zlom | Komický zlom, pauza |
| 8  | 5:00  | Páteční odpoledne          | Zpráva, že máme incident | Mockup chatu |
| 9  | 5:45  | Co se stalo                | Pokoj a kategorie, propojovací tabulka: 1 řádek vs. 2, UI ukáže nejstarší | Klíčový vizuál, před a po |
| 10 | 6:45  | Krok 1: zastavit krvácení  | Vypnout flag, víkend se neřeší | Vypínač. Pro juniory: feature flag = vypínač funkce |
| 11 | 7:45  | Krok 2: bojová sada        | Přístupy předem: produkce, observability, databáze. Kolega je měl, já ne | Checklist, který si publikum vyfotí |
| 12 | 8:45  | Krok 3: zjistit, pak opravit | Jednorázový job: výpis skutečného stavu + mazání vybraných řádků | Hláška: rychleji to stejně nezvládnu |
| 13 | 9:45  | Krok 4: „nevím“            | Jak komunikovat, když nevím | Vzorová věta: „Zatím nevím, zjišťuju X, update v 15:00“ *(návrh)* |
| 14 | 10:45 | Přepnutí do hry            | „Jak se tam ten řádek dostal?“ Představení hrdiny | Vizuální styl se přepne na 8bit |
| 15 | 11:15 | Level 1: Spawn             | Agent vygeneruje 800 řádků; starý kód měl skryté chování a nikdo ho nezmínil | Bug je v diffu neviditelný |
| 16 | 12:00 | Level 2: Automatické brány | Formátování, lint, spouštění testů, nastavení v Claude | Brány, kterými agent bez kontroly neprojde |
| 17 | 12:45 | Level 3: Testy a Playwright | Testy ze stejného kontextu mají stejná slepá místa; screenshot vypadá správně, protože UI ukazuje nejstarší řádek | Screenshot, který prošel |
| 18 | 13:45 | Level 4: PR a review       | Velké PR (deset PR místo dvou by autor nezvládl), cizí tým, nikoho tam nezná | Zeď řádků, boss: reviewer |
| 19 | 14:45 | Level 5: Databáze          | Bez zámku, bug se klonuje (ověřit, jestli constraint existoval) | Klonování hrdiny |
| 20 | 15:15 | Level 6: Feature flag      | Vypnutý flag, bug měsíc spí, málo otestováno | Jeskyně, save point |
| 21 | 16:00 | Level 7: Pozdní projev     | Nic nespadlo hned, problém se projevil až při synchronizaci s druhým systémem | Bug nakazil jiný svět |
| 22 | 16:45 | Boss fight                 | Boss fight už jste viděli: byl to páteční odpoledne | Odkaz zpět na slajd 8 |
| 23 | 17:15 | Patch notes                | Verze 1.1 a další, viz níže | Formát changelogu |
| 24 | 19:00 | Pointa                     | Závěrečná věta a poděkování | Bug na easy |

## Moje nápady ke tvůrčímu zpracování

Základní koncept je autorův: přednáška jako hra, jejímž hrdinou je bug, který se
snaží dostat na produkci. Níže je oddělený pevný autorův záměr od návrhů
z brainstormingu, které autor ještě nepotvrdil.

### Autorovy nápady (pevné)

- Prezentace jako hra: hlavní hrdina je bug a každý level je jedna překážka na
  cestě na produkci.
- Příběh s pointou. Zábava má přednost před nudným poučováním.
- Struktura: svět, agent, „…většinou…“, incident, potom hra o tom, jak bug
  vznikl, na závěr poučení a vylepšení agenta.
- Technické detaily (výroba agenta, statické kontroly, Playwright) jsou
  zajímavé, ale dají se zkrátit nebo vyhodit, když nezbyde čas.
- Pojmy pro juniory: jeden obrázek místo definice.
- Poučení z incidentu pro publikum: ověřit přístupy předem, nejdřív zjišťovat
  a pak opravovat, nestydět se přiznat „nevím“.

### Návrhy z brainstormingu (k potvrzení)

- Bug jako hrdina, který vypráví v první osobě, trochu sebevědomě a naivně
  („Jsem jeden chybějící řádek. Můj cíl je produkce.“). Jeho schopnost je
  stealth: v diffu ho nikdo nevidí.
- Hra s názvem: „jeden řádek“ kódu chyběl a v databázi z něj vzniklo víc řádků.
  Zahrát si s tím.
- Teaser hned na začátku: 800řádkový diff a „najděte chybu za 10 sekund“.
- Hlasování publika u každého levelu (ruce nebo Slido): projde bug, nebo ho to
  zastaví?
- Vizuál: originální 8bitový pixel art. Žádné existující postavy, žádné známé
  herní ikony.
- Část s incidentem je vizuálně vážná, potom se na slajdu 14 styl překlopí do
  hry. Publikum si uvědomí, že hrdinou byl celou dobu bug.
- Odkaz zpět: na slajdu 22 „Boss fight už jste viděli“ (incident = boss fight).
- Ironie: pipeline agenta měla i krok code review, jenže ve stejném kontextu,
  který kód psal.
- Herní slovník pro incident: pause menu / load last save = rollback nebo
  vypnutí flagu; kill cam = postmortem.
- Hlavní vizuál pro juniory: propojovací tabulka před a po (1 řádek vs.
  2 řádky) a pod ní UI, které ukáže jen ten nejstarší.

### Patch notes na závěr (návrh obsahu)

- **v1.1:** unique constraint na vazbě pokoj–kategorie, aby databáze duplicitu
  odmítla.
- **v1.2:** testy na změnu a mazání, nejen na vytvoření; „uložit dvakrát“.
- **v1.3:** agent nejdřív sepíše inventář skrytého chování starého kódu a teprve
  potom implementuje.
- **v1.4:** porovnávací test staré a nové verze, včetně stavu databáze po
  operaci.
- **v1.5:** testy a review dělá agent s nezávislým kontextem a úkolem „co tu
  chybí?“.
- **v1.6:** menší PR, vlastníkům domény předem vysvětlit kontext, vyhrazený čas.
- **v1.7:** feature flag se nejdřív otestuje zapnutý na stagingu, teprve pak se
  zapne na produkci.
- **v1.8:** kontrola konzistence dat mezi systémy a alert na pomalu rostoucí
  nesoulad.

## Pravidla a otevřené otázky

Pravidla platí pro celou implementaci. Otázky zatím nemají odpověď, proto je
agent nerozhoduje sám.

### Pravidla

- Jazyk slajdů a poznámek: čeština, nepoučující a lehce hravý tón, publiku
  tykat.
- Na slajdu nejvýš jedna myšlenka a krátký text. Podrobnosti patří do poznámek
  mluvčího.
- Žádné existující postavy, maskoti, loga ani herní ikony. Všechny vizuály jsou
  originální.
- Žádné názvy firem ani konkrétní čísla, která nejsou v sekci Fakta (Mews
  jmenovat smí, viz Doplněno autorem).
- Pojmy pro juniory vysvětluj obrázkem: propojovací tabulka, feature flag,
  unique constraint, review a PR.
- Hlasování a hrátky z *(návrhů)* jen po potvrzení autorem. Do té doby připrav
  slajd bez nich.

### Otevřené otázky

- Existoval v databázi unique constraint na vazbě pokoj–kategorie? (slajd 19,
  patch v1.1)
- Hlasování publika: ano/ne, ruce nebo Slido?
- Kterou závěrečnou větu použít? (slajd 24)
- Vizuál titulky a přepnutí do 8bit stylu: kdy přesně (slajd 1 vs. 14)?
- Vzorová věta pro komunikaci „nevím“ (slajd 13): potvrdit znění.
- Přesné znění páteční zprávy od kolegů (slajd 8, callback na slajdu 22): na
  slajdu je zatím zástupné „Hele, duplikují se nám řádky. Můžeš se mrknout?“.
- Vyprávění bugu v první osobě (slajd 14, bublina): ponechat?
- Patch notes (slajd 23): všech osm, nebo vybrat?
- Vážný tmavý styl pro incident (slajdy 8–13) a přepnutí do hry na slajdu 14:
  v nástřelu je použit, potvrdit.
