# 🍲 Kuzhina Kosovare

Receta tradicionale kosovare (flija, pite, tavë Prizreni, trileçe…) me menynë e javës dhe listën e blerjeve. E shkruar në JavaScript të pastër (ES modules, pa framework, pa librari). Të gjitha të dhënat ruhen në **localStorage**, pa databazë.

## Funksionet
- 📖 **13 receta tradicionale**. Kërkon edhe sipas përbërësit ("spinaq", "arra"), dhe filtron sipas kategorisë, kohës e vështirësisë.
- 🎲 **"Çfarë të gatuaj sot?"** zgjedh një recetë të rastësishme.
- ⚖️ **Porcionet**: sasitë llogariten automatikisht (½, ¼, g → kg).
- 👨‍🍳 **Mënyra e gatimit**:
  - një hap në ekran, me tekst të madh
  - shigjetat e tastierës për të kaluar hapat
  - ekrani nuk fiket (Wake Lock)
- ⏱ **Kohëmatës** për çdo hap:
  - bie zile dhe dridhet kur mbaron
  - mbijeton edhe rifreskimin e faqes
- 📅 **Menyja e javës**: 7 ditë × 3 vakte, mbushje e rastësishme e vakteve bosh.
- 🛒 **Lista e blerjeve**:
  - krijohet nga një recetë ose nga e gjithë java
  - përbërësit e njëjtë mblidhen (3 + 2 thelpinj hudhër = 5)
  - kopjohet si tekst për Viber/WhatsApp
- ✍️ **Recetat e mia**: shto, ndrysho, fshi.
- ❤️ Të preferuarat, ✅ "E gatova" (numëron sa herë), ✍️ shënime personale për çdo recetë.
- 💾 Kopje rezervë (eksport/import JSON), temë e errët / e çelët, printim.

## Si ta hapësh
```bash
node serve.js
```
Pastaj hap http://localhost:5174

## Struktura
```
index.html            – faqja (shell)
css/style.css         – stilet
js/main.js            – router, kohëmatësit, kopja rezervë
js/store.js           – "databaza" mbi localStorage
js/data.js            – recetat
js/actions.js         – të preferuarat, lista e blerjeve, menyja, kohëmatësit
js/utils.js           – formatimi i sasive, leximi i përbërësve, tingulli
js/views/*.js         – faqet: list, recipe, cook, plan, shopping, editor
serve.js              – server statik për zhvillim
```
