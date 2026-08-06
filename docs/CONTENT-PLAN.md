# CONTENT PLAN — Maren Beauty

Service inventory, blog taxonomy, 50 planned posts and the internal linking
map. All titles are Turkish and written to the copy rules in `CLAUDE.md` §9 —
no treatment language, no efficacy claims, no numbers we cannot stand behind.

---

## 1. Service inventory — 20 pages

All 20 services get a full page. No prices anywhere, not even ranges.

Route: `/hizmetler/<slug>` · file: `content/services/<slug>.mdx`

**The "Related services" column was revised at M8 so the graph is fully
reciprocal** — every link has a matching link back, with each service holding
3–4 siblings. The first draft of this table contained sixteen one-way links,
which §5 called a warning; a warning nobody reads is worse than a constraint, so
the graph was authored symmetric instead and a unit test asserts it stays that
way. The changes are only in this column: no service moved group, and no slug
changed.

### Group: Cilt Bakımı (`cilt-bakimi`)

| #   | Service                | Slug                     | Search intent                                         | Related services                                                               |
| --- | ---------------------- | ------------------------ | ----------------------------------------------------- | ------------------------------------------------------------------------------ |
| 1   | Cilt Bakımı            | `cilt-bakimi`            | Informational → commercial. The category entry point. | `hydrafacial` · `nemlendirme-bakimi` · `hucre-yenileme` · `gelin-bakim-paketi` |
| 2   | Akne Bakımı            | `akne-bakimi`            | High-intent, problem-led.                             | `kimyasal-peeling` · `gozenek-sikilastirma` · `karbon-peeling`                 |
| 3   | Yaşlanma Karşıtı Bakım | `yaslanma-karsiti-bakim` | Commercial, considered.                               | `kolajen-bakimi` · `dermapen` · `leke-bakimi`                                  |
| 4   | Leke Bakımı            | `leke-bakimi`            | High-intent, seasonal peak late summer.               | `yaslanma-karsiti-bakim` · `kimyasal-peeling` · `bb-glow`                      |
| 5   | Hassas Cilt Bakımı     | `hassas-cilt-bakimi`     | Reassurance-led.                                      | `nemlendirme-bakimi` · `kolajen-bakimi` · `lazer-epilasyon`                    |
| 6   | Kolajen Bakımı         | `kolajen-bakimi`         | Informational, name-led search.                       | `yaslanma-karsiti-bakim` · `hassas-cilt-bakimi` · `dermapen`                   |
| 7   | Nemlendirme Bakımı     | `nemlendirme-bakimi`     | Informational, winter peak.                           | `cilt-bakimi` · `hassas-cilt-bakimi` · `hydrafacial` · `lazer-epilasyon`       |
| 8   | Gözenek Sıkılaştırma   | `gozenek-sikilastirma`   | Problem-led.                                          | `akne-bakimi` · `karbon-peeling` · `hydrafacial`                               |
| 9   | Hücre Yenileme         | `hucre-yenileme`         | Informational, low volume, supports cluster.          | `cilt-bakimi` · `dermapen` · `kimyasal-peeling`                                |

### Group: Epilasyon (`epilasyon`)

| #   | Service         | Slug              | Search intent                                      | Related services                                                   |
| --- | --------------- | ----------------- | -------------------------------------------------- | ------------------------------------------------------------------ |
| 10  | Lazer Epilasyon | `lazer-epilasyon` | **Highest volume on the site.** Commercial, local. | `hassas-cilt-bakimi` · `nemlendirme-bakimi` · `gelin-bakim-paketi` |

### Group: Cilt Yenileme Uygulamaları (`cilt-yenileme`)

| #   | Service          | Slug               | Search intent                                          | Related services                                                           |
| --- | ---------------- | ------------------ | ------------------------------------------------------ | -------------------------------------------------------------------------- |
| 11  | Hydrafacial      | `hydrafacial`      | Brand-name search, high commercial intent.             | `cilt-bakimi` · `nemlendirme-bakimi` · `gozenek-sikilastirma` · `bb-glow`  |
| 12  | Karbon Peeling   | `karbon-peeling`   | Name-led, curiosity → commercial.                      | `akne-bakimi` · `gozenek-sikilastirma` · `kimyasal-peeling`                |
| 13  | Kimyasal Peeling | `kimyasal-peeling` | Informational, needs careful wording.                  | `akne-bakimi` · `leke-bakimi` · `hucre-yenileme` · `karbon-peeling`        |
| 14  | Dermapen         | `dermapen`         | Name-led, high intent. ⚠️ See `docs/OPEN-QUESTIONS.md` | `yaslanma-karsiti-bakim` · `kolajen-bakimi` · `hucre-yenileme` · `bb-glow` |
| 15  | BB Glow          | `bb-glow`          | Trend-led. ⚠️ See `docs/OPEN-QUESTIONS.md`             | `leke-bakimi` · `hydrafacial` · `dermapen`                                 |

### Group: Kaş & Kirpik (`kas-kirpik`)

| #   | Service        | Slug             | Search intent                                          | Related services                                                          |
| --- | -------------- | ---------------- | ------------------------------------------------------ | ------------------------------------------------------------------------- |
| 16  | Kalıcı Makyaj  | `kalici-makyaj`  | Commercial, local. ⚠️ See `docs/OPEN-QUESTIONS.md`     | `microblading` · `kas-tasarimi` · `kirpik-lifting` · `gelin-bakim-paketi` |
| 17  | Microblading   | `microblading`   | Name-led, high intent. ⚠️ See `docs/OPEN-QUESTIONS.md` | `kalici-makyaj` · `kas-tasarimi` · `kirpik-lifting`                       |
| 18  | Kirpik Lifting | `kirpik-lifting` | Commercial, growing.                                   | `kas-tasarimi` · `kalici-makyaj` · `microblading` · `gelin-bakim-paketi`  |
| 19  | Kaş Tasarımı   | `kas-tasarimi`   | Everyday, repeat-visit driver.                         | `kalici-makyaj` · `microblading` · `kirpik-lifting`                       |

### Group: Özel Paketler (`ozel-paket`)

| #   | Service            | Slug                 | Search intent                         | Related services                                                       |
| --- | ------------------ | -------------------- | ------------------------------------- | ---------------------------------------------------------------------- |
| 20  | Gelin Bakım Paketi | `gelin-bakim-paketi` | Seasonal, high value, group decision. | `cilt-bakimi` · `lazer-epilasyon` · `kalici-makyaj` · `kirpik-lifting` |

---

## 2. Service page structure

Every service page follows the same skeleton so the 20 read as one system.
Structured fields come from frontmatter (`docs/ARCHITECTURE.md` §3.1); prose
comes from the MDX body.

| Block                | Source              | Notes                                      |
| -------------------- | ------------------- | ------------------------------------------ |
| Eyebrow + `h1`       | `eyebrow`, `title`  | View Transition target from the card       |
| Lead paragraph       | `summary`           | 60–165 chars, doubles as meta description  |
| Hero image           | `heroImageId`       | Manifest-resolved. View Transition target  |
| "Bu uygulama nedir?" | MDX body            | The whole body, `h3` subheadings           |
| "Nasıl ilerler?"     | `steps[]`           | 2–6 steps. **What happens in the room.**   |
| "Kimler için uygun?" | `suitableFor[]`     | Suitability, never diagnosis               |
| "Sonrasında"         | `aftercare[]`       | Practical aftercare notes. **No numbers.** |
| SSS                  | `faq[]`             | Up to 8. Feeds `FAQPage` schema            |
| İlgili hizmetler     | `relatedServices[]` | 3–4, referential-checked at build          |
| İlgili yazılar       | derived             | Posts whose `service` matches              |
| CTA                  | shared              | WhatsApp-first, degrading to the form      |

**Never on a service page:** prices, ranges, "starting from", before/after
imagery, percentages, session-count promises, testimonials, medical framing —
and, per the content posture below, **no durations, device or product brand
names, staff credentials, equipment claims, depths, concentrations or machine
settings.**

Target length: **350–600 words** of body prose. Deliberately shorter than a
typical service page, because that is the honest length for what is actually
known before the centre opens.

Two notes from building it at M8. The hero is the **View Transition target**, so
it does not also get `ImageReveal` — a `clip-path` wipe and a morph would
animate the same element from two different start states. And the MDX body is
the whole "Bu uygulama nedir?" section rather than a capped opening paragraph:
the template renders that heading as `h2`, so subheadings inside the body are
`h3` and heading order stays intact.

### Content posture

`CLAUDE.md` §9 and `docs/OPEN-QUESTIONS.md` §H, restated here because it binds
every one of the 20 pages:

> Copy stays general and non-specific. Never invent specifics to fill space.
> **Where a section would need a fact we do not have, cut the section rather
> than pad it.**

The `durationLabel` field remains in the schema and stays `null` (C4), but there
is no longer a "Süre" block in the page structure — the field is unrendered, not
rendering empty. `suitableFor` and `aftercare` stay general and may not carry a
number.

**Written at M8.** All twenty bodies landed at 350–420 words: at the floor
rather than the ceiling, which is what the posture predicts. Reaching even 350
honestly meant writing about what the page deliberately does **not** say — why
there is no session count, why no device is named, why there are no before/after
photographs — and that turned out to be the most useful material on the pages.
Where a section would have needed a fact we do not have, it was cut.

A page that is 350 honest words is finished. Padding it to 800 with plausible
detail is a defect, not an improvement.

---

## 3. Blog taxonomy

Flat, six categories. Every post has exactly one category, one mapped service,
and up to five tags.

| Category                   | Slug                    | Covers                                                          |
| -------------------------- | ----------------------- | --------------------------------------------------------------- |
| Cilt Bakımı Rehberi        | `cilt-bakimi-rehberi`   | Routines, skin types, in-centre vs at home                      |
| Cilt Yenileme Uygulamaları | `cilt-yenileme-rehberi` | Hydrafacial, peelings, dermapen, BB glow                        |
| Epilasyon Rehberi          | `epilasyon-rehberi`     | Laser hair removal, planning, aftercare                         |
| Cilt İhtiyaçları           | `cilt-ihtiyaclari`      | Acne-prone, pigmentation, sensitivity, ageing, pores, hydration |
| Kaş & Kirpik               | `kas-kirpik-rehberi`    | Brow design, lash lift, permanent make-up, microblading         |
| Özel Gün & Mevsim          | `ozel-gun-ve-mevsim`    | Bridal timelines, seasonal care                                 |

**Tags** are descriptive, lower-case, ASCII-folded, and reused — not invented
per post. Seed set: `cilt-tipi`, `rutin`, `sonrasi-bakim`, `oncesi-hazirlik`,
`mevsimsel`, `gelin`, `kas`, `kirpik`, `nem`, `leke`, `akne`, `gozenek`,
`kolajen`, `hassasiyet`, `planlama`.

No `author` byline until the owner supplies a real name — the schema enforces
`'PENDING'` (`docs/ARCHITECTURE.md` §3.3). The post template never reads the
field at all, so a byline cannot appear by accident; adding one is a deliberate
edit.

**Built at M9.** All six archives exist from the start, even while every one is
empty — they are the confirmed taxonomy, not a reflection of what happens to be
published. Each category's Turkish label and one-line scope description live in
`src/config/blog.ts`, along with the empty states. **Hero images are one per
category, not one per post**: fifty posts across six categories do not need
fifty pieces of artwork, and a per-post image would mean inventing one every
time a post is written.

---

## 4. The 50 posts

**Batch 1 (12) is written now**, one per distinct service. Batch 2 (38) is
planned and sequenced but not written.

Intent key: **I** = informational · **C** = commercial · **S** = seasonal.

### Batch 1 — write now

| #   | Title (TR)                                             | Slug                              | Target keyword         | Intent | Service              | Category                |
| --- | ------------------------------------------------------ | --------------------------------- | ---------------------- | ------ | -------------------- | ----------------------- |
| 1   | Lazer Epilasyon Nedir? Uygulama Nasıl İlerler          | `lazer-epilasyon-nedir`           | lazer epilasyon nedir  | I      | `lazer-epilasyon`    | `epilasyon-rehberi`     |
| 2   | Profesyonel Cilt Bakımı Nedir? Seans Adım Adım         | `cilt-bakimi-nedir`               | cilt bakımı nedir      | I      | `cilt-bakimi`        | `cilt-bakimi-rehberi`   |
| 3   | Hydrafacial Nedir? Uygulamanın Adımları ve Beklentiler | `hydrafacial-nedir`               | hydrafacial nedir      | I      | `hydrafacial`        | `cilt-yenileme-rehberi` |
| 4   | Kimyasal Peeling Nedir? Yüzeysel Uygulamalar Üzerine   | `kimyasal-peeling-nedir`          | kimyasal peeling nedir | I      | `kimyasal-peeling`   | `cilt-yenileme-rehberi` |
| 5   | Dermapen Nedir? Uygulama Süreci ve Sonrası             | `dermapen-nedir`                  | dermapen nedir         | I      | `dermapen`           | `cilt-yenileme-rehberi` |
| 6   | Kalıcı Makyaj Nedir? Uygulama Türleri ve Süreç         | `kalici-makyaj-nedir`             | kalıcı makyaj nedir    | I      | `kalici-makyaj`      | `kas-kirpik-rehberi`    |
| 7   | Microblading Nedir? Kaş Tasarımında Teknik             | `microblading-nedir`              | microblading nedir     | I      | `microblading`       | `kas-kirpik-rehberi`    |
| 8   | Akne Eğilimli Ciltlerde Bakım Yaklaşımı                | `akne-egilimli-ciltlerde-bakim`   | akneli cilt bakımı     | I      | `akne-bakimi`        | `cilt-ihtiyaclari`      |
| 9   | Cilt Lekesi Görünümü: Yaygın Nedenler ve Bakım         | `leke-gorunumu-nedenler-ve-bakim` | cilt lekesi nedenleri  | I      | `leke-bakimi`        | `cilt-ihtiyaclari`      |
| 10  | Kirpik Lifting Nedir? Uygulama ve Kalıcılık            | `kirpik-lifting-nedir`            | kirpik lifting nedir   | I      | `kirpik-lifting`     | `kas-kirpik-rehberi`    |
| 11  | Kaş Tasarımı Nedir? Yüz Hatlarına Göre Kaş             | `kas-tasarimi-nedir`              | kaş tasarımı           | I      | `kas-tasarimi`       | `kas-kirpik-rehberi`    |
| 12  | Gelin Bakım Takvimi: Düğüne Kaç Ay Kala Ne Planlanır   | `gelin-bakim-takvimi`             | gelin bakım takvimi    | C      | `gelin-bakim-paketi` | `ozel-gun-ve-mevsim`    |

### Batch 2 — planned

| #   | Title (TR)                                                 | Slug                                   | Target keyword                      | Intent | Service                  | Category                |
| --- | ---------------------------------------------------------- | -------------------------------------- | ----------------------------------- | ------ | ------------------------ | ----------------------- |
| 13  | Lazer Epilasyon Öncesi Hazırlık ve Sonrasında Cilt Bakımı  | `lazer-epilasyon-oncesi-ve-sonrasi`    | lazer epilasyon öncesi ne yapılmalı | I      | `lazer-epilasyon`        | `epilasyon-rehberi`     |
| 14  | Lazer Epilasyon Seansları Neden Aralıklarla Planlanır      | `lazer-epilasyon-seans-araliklari`     | lazer epilasyon seans aralığı       | I      | `lazer-epilasyon`        | `epilasyon-rehberi`     |
| 15  | Kış Aylarında Lazer Epilasyon Planlamak                    | `kis-aylarinda-lazer-epilasyon`        | kışın lazer epilasyon               | S      | `lazer-epilasyon`        | `ozel-gun-ve-mevsim`    |
| 16  | Cilt Tipinizi Nasıl Anlarsınız? Kuru, Yağlı, Karma, Hassas | `cilt-tipi-nasil-anlasilir`            | cilt tipi nasıl anlaşılır           | I      | `cilt-bakimi`            | `cilt-bakimi-rehberi`   |
| 17  | Evde Bakım ile Merkezde Cilt Bakımı Arasındaki Farklar     | `evde-ve-merkezde-cilt-bakimi`         | evde cilt bakımı merkez farkı       | C      | `cilt-bakimi`            | `cilt-bakimi-rehberi`   |
| 18  | Cilt Bakımı Ne Sıklıkla Planlanmalı?                       | `cilt-bakimi-ne-siklikla`              | cilt bakımı ne sıklıkla yapılmalı   | I      | `cilt-bakimi`            | `cilt-bakimi-rehberi`   |
| 19  | Hydrafacial Kimler İçin Uygundur?                          | `hydrafacial-kimler-icin-uygun`        | hydrafacial kimlere uygun           | C      | `hydrafacial`            | `cilt-yenileme-rehberi` |
| 20  | Hydrafacial Sonrası Cilt Bakım Rutini                      | `hydrafacial-sonrasi-bakim`            | hydrafacial sonrası bakım           | I      | `hydrafacial`            | `cilt-yenileme-rehberi` |
| 21  | Karbon Peeling Nedir? Uygulama Nasıl Yapılır               | `karbon-peeling-nedir`                 | karbon peeling nedir                | I      | `karbon-peeling`         | `cilt-yenileme-rehberi` |
| 22  | Karbon Peeling Sonrasında Ne Beklenmeli                    | `karbon-peeling-sonrasinda`            | karbon peeling sonrası              | I      | `karbon-peeling`         | `cilt-yenileme-rehberi` |
| 23  | Kimyasal Peeling Sonrasında Nelere Dikkat Edilmeli         | `kimyasal-peeling-sonrasi-dikkat`      | kimyasal peeling sonrası bakım      | I      | `kimyasal-peeling`       | `cilt-yenileme-rehberi` |
| 24  | Peeling Çeşitleri: Kimyasal, Karbon ve Mekanik Farkları    | `peeling-cesitleri-farklari`           | peeling çeşitleri                   | I      | `kimyasal-peeling`       | `cilt-yenileme-rehberi` |
| 25  | Dermapen Öncesi Hazırlık Rehberi                           | `dermapen-oncesi-hazirlik`             | dermapen öncesi hazırlık            | I      | `dermapen`               | `cilt-yenileme-rehberi` |
| 26  | Dermapen Sonrasında Cilt Bakımında Dikkat Edilecekler      | `dermapen-sonrasi-bakim`               | dermapen sonrası bakım              | I      | `dermapen`               | `cilt-yenileme-rehberi` |
| 27  | BB Glow Nedir? Uygulama ve Beklentiler                     | `bb-glow-nedir`                        | bb glow nedir                       | I      | `bb-glow`                | `cilt-yenileme-rehberi` |
| 28  | BB Glow Sonrasında Cilt Bakımı                             | `bb-glow-sonrasi-bakim`                | bb glow sonrası bakım               | I      | `bb-glow`                | `cilt-yenileme-rehberi` |
| 29  | Kalıcı Makyaj Öncesinde Bilinmesi Gerekenler               | `kalici-makyaj-oncesi`                 | kalıcı makyaj öncesi                | I      | `kalici-makyaj`          | `kas-kirpik-rehberi`    |
| 30  | Kalıcı Makyajda Renk Nasıl Seçilir?                        | `kalici-makyaj-renk-secimi`            | kalıcı makyaj renk seçimi           | I      | `kalici-makyaj`          | `kas-kirpik-rehberi`    |
| 31  | Microblading ve Pudra Kaş Arasındaki Farklar               | `microblading-ve-pudra-kas-farki`      | microblading pudra kaş farkı        | C      | `microblading`           | `kas-kirpik-rehberi`    |
| 32  | Microblading Sonrasında Bakım Süreci                       | `microblading-sonrasi-bakim`           | microblading sonrası bakım          | I      | `microblading`           | `kas-kirpik-rehberi`    |
| 33  | Akne İzi Görünümü ve Cilt Bakımı Rutini                    | `akne-izi-gorunumu-ve-bakim`           | akne izi bakımı                     | I      | `akne-bakimi`            | `cilt-ihtiyaclari`      |
| 34  | Yaşlanma Karşıtı Bakım Nedir?                              | `yaslanma-karsiti-bakim-nedir`         | yaşlanma karşıtı bakım              | I      | `yaslanma-karsiti-bakim` | `cilt-ihtiyaclari`      |
| 35  | İnce Çizgi Görünümü İçin Bakım Alışkanlıkları              | `ince-cizgi-gorunumu-icin-bakim`       | ince çizgiler için bakım            | I      | `yaslanma-karsiti-bakim` | `cilt-ihtiyaclari`      |
| 36  | Güneş Koruması ve Leke Görünümü                            | `gunes-korumasi-ve-leke-gorunumu`      | güneş koruması leke                 | I      | `leke-bakimi`            | `cilt-ihtiyaclari`      |
| 37  | Yaz Sonrasında Cilt: Leke Görünümüne Yönelik Bakım         | `yaz-sonrasi-leke-bakimi`              | yaz sonrası cilt bakımı             | S      | `leke-bakimi`            | `ozel-gun-ve-mevsim`    |
| 38  | Hassas Ciltte Bakım: Nelere Dikkat Edilmeli                | `hassas-ciltte-bakim`                  | hassas cilt bakımı                  | I      | `hassas-cilt-bakimi`     | `cilt-ihtiyaclari`      |
| 39  | Kızarıklığa Eğilimli Ciltlerde Günlük Rutin                | `kizarikliga-egilimli-cilt-rutini`     | kızarıklık cilt bakımı              | I      | `hassas-cilt-bakimi`     | `cilt-ihtiyaclari`      |
| 40  | Kolajen Bakımı Nedir? Uygulamanın Amacı                    | `kolajen-bakimi-nedir`                 | kolajen bakımı nedir                | I      | `kolajen-bakimi`         | `cilt-bakimi-rehberi`   |
| 41  | Cilt Sıkılığı Görünümü İçin Bakım Alışkanlıkları           | `cilt-sikiligi-gorunumu-icin-bakim`    | cilt sıkılığı bakım                 | I      | `kolajen-bakimi`         | `cilt-ihtiyaclari`      |
| 42  | Kirpik Lifting Sonrasında Bakım Önerileri                  | `kirpik-lifting-sonrasi-bakim`         | kirpik lifting sonrası              | I      | `kirpik-lifting`         | `kas-kirpik-rehberi`    |
| 43  | Kaş Şekli Yüz Tipine Göre Nasıl Belirlenir                 | `kas-sekli-yuz-tipine-gore`            | yüz tipine göre kaş                 | I      | `kas-tasarimi`           | `kas-kirpik-rehberi`    |
| 44  | Düğün Öncesinde Cilt Bakımı Rutini                         | `dugun-oncesi-cilt-bakimi`             | düğün öncesi cilt bakımı            | I      | `gelin-bakim-paketi`     | `ozel-gun-ve-mevsim`    |
| 45  | Nikah ve Kına İçin Kaş & Kirpik Hazırlığı                  | `nikah-kina-kas-kirpik-hazirligi`      | gelin kaş kirpik                    | C      | `gelin-bakim-paketi`     | `ozel-gun-ve-mevsim`    |
| 46  | Hücre Yenileme Bakımı Nedir?                               | `hucre-yenileme-bakimi-nedir`          | hücre yenileme bakımı               | I      | `hucre-yenileme`         | `cilt-yenileme-rehberi` |
| 47  | Cilt Nemi Neden Azalır? Nemlendirme Bakımına Genel Bakış   | `cilt-nemi-ve-nemlendirme-bakimi`      | cilt nemlendirme bakımı             | I      | `nemlendirme-bakimi`     | `cilt-bakimi-rehberi`   |
| 48  | Kış Aylarında Cilt Nemini Korumak                          | `kis-aylarinda-cilt-nemi`              | kışın cilt bakımı                   | S      | `nemlendirme-bakimi`     | `ozel-gun-ve-mevsim`    |
| 49  | Gözenek Görünümü Neden Belirginleşir?                      | `gozenek-gorunumu-neden-belirginlesir` | gözenek görünümü                    | I      | `gozenek-sikilastirma`   | `cilt-ihtiyaclari`      |
| 50  | Yağlı ve Karma Ciltlerde Günlük Rutin                      | `yagli-ve-karma-cilt-rutini`           | yağlı cilt bakım rutini             | I      | `gozenek-sikilastirma`   | `cilt-ihtiyaclari`      |

### Coverage check

Every one of the 20 services has at least one post; no service has more than
four. Distribution: `lazer-epilasyon` 4 · `cilt-bakimi` 4 · `hydrafacial` 3 ·
`kimyasal-peeling` 3 · `dermapen` 3 · `kalici-makyaj` 3 · `microblading` 3 ·
`leke-bakimi` 3 · `gelin-bakim-paketi` 3 · `karbon-peeling` 2 · `bb-glow` 2 ·
`akne-bakimi` 2 · `yaslanma-karsiti-bakim` 2 · `hassas-cilt-bakimi` 2 ·
`kolajen-bakimi` 2 · `kirpik-lifting` 2 · `kas-tasarimi` 2 ·
`nemlendirme-bakimi` 2 · `gozenek-sikilastirma` 2 · `hucre-yenileme` 1.

---

## 5. Internal linking map

Hub-and-spoke. **Service pages are hubs. Posts are spokes.** The map is
generated from frontmatter, not hand-maintained — `service` and
`relatedServices` are the only inputs, and the build fails on a dangling
reference (`docs/ARCHITECTURE.md` §3.4).

```
                    /  (home)
                     │
        ┌────────────┼────────────┐
        ▼            ▼            ▼
   /hizmetler      /blog     /iletisim
        │            │            ▲
        ▼            ▼            │
  service HUB ◄──► post SPOKE ────┘
        │  ▲          │
        │  └──────────┘  every post links up to its hub
        ▼
  3–4 sibling services (relatedServices)
```

### Rules

| Rule                   | Detail                                                                                                                                                                                                                                   |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Up**                 | Every post links to its mapped service hub — once in the body, in context, and once in the closing block. Never a bare "tıklayın".                                                                                                       |
| **Down**               | Every service hub lists its posts under "İlgili yazılar", newest first.                                                                                                                                                                  |
| **Lateral (services)** | Each hub links to 3–4 sibling services via `relatedServices`. **Reciprocity is asserted by a unit test** (M8): a one-way link fails `npm run test`, not a warning nobody reads. Adding a service means adding it to its siblings' lists. |
| **Lateral (posts)**    | Each post links to 2–3 posts, preferring same service, then same category.                                                                                                                                                               |
| **Bridges**            | Cross-group links only where genuinely useful: `lazer-epilasyon` ↔ `gelin-bakim-paketi`, `akne-bakimi` ↔ `gozenek-sikilastirma`, `leke-bakimi` ↔ `kimyasal-peeling`, `kolajen-bakimi` ↔ `yaslanma-karsiti-bakim`.                        |
| **Conversion**         | Every post ends with exactly one CTA to `/iletisim`. One, not two.                                                                                                                                                                       |
| **Anchor text**        | Descriptive and natural — "lazer epilasyon uygulaması", never "buraya tıklayın", never an exact-match keyword stuffed mid-sentence.                                                                                                      |
| **Depth**              | Every page reachable within 3 clicks of `/`.                                                                                                                                                                                             |
| **Orphans**            | Zero. A page with no inbound internal link fails review.                                                                                                                                                                                 |

### Cluster shape (example: `lazer-epilasyon`)

```
/hizmetler/lazer-epilasyon                     ← hub
 ├─ /blog/lazer-epilasyon-nedir                (Batch 1)
 ├─ /blog/lazer-epilasyon-oncesi-ve-sonrasi
 ├─ /blog/lazer-epilasyon-seans-araliklari
 ├─ /blog/kis-aylarinda-lazer-epilasyon        (seasonal bridge)
 └─ siblings: /hizmetler/cilt-bakimi · /hassas-cilt-bakimi · /gelin-bakim-paketi
```

The same shape repeats for all 20. Posts within a cluster link to each other in
publication order; the seasonal post links laterally to the other seasonal posts
in `ozel-gun-ve-mevsim`.

---

## 6. Post structure

| Block          | Length         | Notes                                                     |
| -------------- | -------------- | --------------------------------------------------------- |
| `h1`           | ≤ 70 chars     | Matches the planned title                                 |
| Lead           | 2–3 sentences  | **Answers the question immediately.** No throat-clearing. |
| Body           | 900–1400 words | `h2` per section, `h3` sparingly                          |
| "Kısaca"       | 3–5 bullets    | Scannable summary                                         |
| SSS            | 2–4 Q&A        | Only genuine questions; feeds `FAQPage` schema            |
| İlgili hizmet  | 1 link         | To the mapped hub                                         |
| İlgili yazılar | 2–3 links      | Same cluster                                              |
| CTA            | 1              | To `/iletisim`                                            |

**"Kısaca" and SSS are frontmatter, not prose** (added at M9). The template
places them from `keyPoints` and `faq`, so they cannot drift into a second,
longer conclusion, and M13's `FAQPage` JSON-LD has question/answer pairs rather
than headings parsed back out of the body. Both may be empty; an empty list
renders nothing.

### Non-negotiables per post

- No banned lexicon (`CLAUDE.md` §9) — `npm run guard` blocks the build.
- No percentages, no session-count promises, no invented statistics.
- No before/after imagery or any layout implying progression.
- No diagnosis. Suitability framing only: "uygunluk seans öncesinde
  değerlendirilir".
- Every claim is about **appearance and support**, never outcome.
- Real Turkish copy from the first draft. No lorem ipsum at any stage.
- `author: 'PENDING'` until a real name exists.

---

## 7. Publication sequence

| Phase | What                  | When                                                      |
| ----- | --------------------- | --------------------------------------------------------- |
| 1     | 20 service pages      | Roadmap M8                                                |
| 2     | Batch 1 — 12 posts    | Roadmap M10                                               |
| 3     | Batch 2 — posts 13–24 | Post-launch, ~2 per week                                  |
| 4     | Batch 2 — posts 25–38 | Ongoing                                                   |
| 5     | Batch 2 — posts 39–50 | Ongoing                                                   |
| 6     | Seasonal refresh      | Annually: 15, 37, 48 updated in place, `updatedAt` bumped |

Posts 15, 37 and 48 are seasonal and should publish ahead of their window —
late autumn, late summer and early winter respectively.

---

## 8. What is deliberately absent

| Absent                                      | Why                                                            |
| ------------------------------------------- | -------------------------------------------------------------- |
| Prices, ranges, "başlangıç fiyatı"          | Owner decision. No prices anywhere.                            |
| Testimonials, reviews, ratings              | None exist. Fabricating them is out of the question.           |
| Before/after galleries                      | Prohibited by the brief and inappropriate for a beauty centre. |
| Team bios and staff photos                  | No names or photography yet.                                   |
| Case studies, session counts, success rates | Would require claims we cannot support.                        |
| A "Kampanyalar" page                        | Discount-led promotion contradicts the positioning.            |
| Comments                                    | Moderation burden, spam surface, KVKK exposure, no benefit.    |
