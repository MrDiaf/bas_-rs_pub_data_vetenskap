# Vad lär du dig egentligen?

En interaktiv presentation (på svenska) om kurserna i datavetenskap: IPC, OOP Java, App Java, Systemnära programmering, Introduktion till databaser, Inbyggda system och PVT.

Det är en vanlig webbsida: `index.html` + `assets/`. Den har inget byggsteg, ingen server-kod och ingen databas, så den kan läggas direkt i `~/public_html/` på `people.cs.umu.se`.

Varje bild har något att klicka på:

| Bild | Demo |
| --- | --- |
| IPC | Game of Life som körs live, plus samma loop i C, Python och Java |
| OOP Java | Refaktorering i tre steg: spagetti → klass → återanvänd i ett nytt projekt |
| Git | Plattformsspel där du fastnar i en grop: 💾 Spara (`git add` + `git commit`) och ↩ Återställ (`git restore`) |
| App Java | En att-göra-app med en "röntgen" som visar datan bakom |
| make | Terminal med `make up/down/help` för ett bogosort-projekt, som öppnas i ett eget fönster |
| Trådar | Mandelbrot som räknas ut av 1–8 simulerade trådar |
| Signaler | Signal/slot som i spelmotorer, där du kopplar in och ur lyssnare |
| Databaser | Hästinder: swipea på hästar och se `swipes` och `matches` fyllas i databasen live |
| Inbyggda | 8 lysdioder som ett register, och en servo som slår till väckarklockan |
| PVT 1/3 | En git-graf för ett team, steg för steg |
| PVT 2/3 | Docker som matlåda: fyra datorer, "funkar på min dator" utan Docker, alla funkar med |
| PVT 3/3 | Vibekodning: promptarna bakom presentationen, och presentationen inuti sig själv (inception) |

## Förutsättningar

- `python3` för den lokala servern (förinstallerat på de flesta Linux/macOS)
- `node` (valfritt) för syntaxkollen i `make test`
- `rsync` och ett CS-konto för `make deploy`

## Användning

```bash
make up       # starta lokalt
```

Öppna http://127.0.0.1:8080/ och bläddra med `←` `→`, mellanslag eller knapparna nere till höger. `F` växlar helskärm, och `#3` i adressen hoppar direkt till bild 3.

```bash
make down     # stoppa
make help     # visa alla kommandon
```

Porten ändras med `make up PORT=9000`.

Lokalt används `python3 -m http.server` i stället för `php -S`, eftersom sidan är helt statisk. Det betyder att `.htaccess` inte gäller lokalt, och README/Makefile kan då hämtas. På servern blockeras de.

## Publicera på people.cs.umu.se

```bash
make deploy CS_USER=c23abc                     # → ~/public_html/presentation/
make deploy CS_USER=c23abc PROJECT=kurser      # annan katalog
```

Sidan blir då live på `https://people.cs.umu.se/<CS_USER>/<PROJECT>/`. Alla länkar är relativa, så katalogen får heta vad som helst. Du kan också `git clone` repot direkt i `~/public_html/` på itchy.

Efter deploy: kontrollera att sidan laddar med stilar, och att `.../README.md` ger 403.

## Filer

```text
index.html        alla bilder
assets/style.css  utseende
assets/app.js     navigering + alla demos
.htaccess         stänger av kataloglistning, blockerar README/Makefile
Makefile          up / down / status / test / deploy / help
guidelines/       projektregler (deployas inte)
```
