/**
 * The launch photography set — 48 images, chosen and committed.
 *
 * This file is the record of WHICH photographs were selected and WHY they are
 * allowed to be used. `scripts/fetch-images.mjs` downloads and converts them;
 * `src/config/images.ts` is generated from the same data, so the manifest, the
 * files on disk and the attribution can never disagree.
 *
 * Selection was done by looking at contact sheets built by
 * `scripts/research-images.mjs` from 450 mechanically-filtered candidates
 * across Unsplash and Pexels. The mechanical filter enforced warm dominant
 * colour, mid luminance and landscape orientation. The rest was judgement,
 * against `CLAUDE.md` §8:
 *
 *   - one narrow warm family — warm temperature, soft light, shallow depth;
 *   - no cool tones and no clinical white;
 *   - **no direct-to-camera portrait**, and no photograph in which a person's
 *     face is identifiable. That rules out most stock "spa" imagery, which is
 *     almost entirely a model on a treatment couch — precisely the picture that
 *     would read as a client of this centre;
 *   - **no visible foreign-language product packaging**. A legible English
 *     label is a product claim the business has not made;
 *   - no before/after, and nothing that reads as a device or a clinic.
 *
 * Every entry is `replaceable: true`. Real photography swaps this file and
 * nothing else.
 *
 * Licences: the **Unsplash Licence** and the **Pexels Licence** both permit
 * commercial use without attribution. Attribution is recorded anyway — it costs
 * one field, it is the courteous reading of both licences, and it is the only
 * way the owner can later find the original of an image she wants at higher
 * resolution.
 */

/** Everything ships at one size; `next/image` derives the rest. */
export const IMAGE_WIDTH = 1600;
export const IMAGE_HEIGHT = 1200;

const unsplash = (photoId) => ({
  source: 'unsplash',
  base: `https://images.unsplash.com/photo-${photoId}`,
  licence: 'Unsplash Licence',
});

const pexels = (path) => ({
  source: 'pexels',
  base: `https://images.pexels.com/photos/${path}`,
  licence: 'Pexels Licence',
});

/**
 * @typedef {{
 *   id: string,
 *   file: string,
 *   group: 'service' | 'blog' | 'page' | 'gallery',
 *   alt: string,
 *   credit: string,
 *   sourceUrl: string,
 *   licence: string,
 *   remote: { source: string, base: string, licence: string },
 * }} SelectedImage
 */

/**
 * Alt text is Turkish and describes **the photograph**, never the premises.
 * "Sıcak ışıkta katlanmış havlular" is a description; "merkezimizin havluları"
 * would be a claim about a room nobody has photographed yet.
 */
/** @type {SelectedImage[]} */
export const IMAGE_SET = [
  {
    id: 'service-cilt-bakimi',
    file: 'services/cilt-bakimi.webp',
    group: 'service',
    alt: 'Cam tabaklara ayrılmış, farklı yoğunluklarda saydam bakım jelleri.',
    credit: 'ibnu ihza',
    sourceUrl:
      'https://unsplash.com/photos/cosmetic-serums-arranged-on-clear-circular-plates-QbHwPe1HE84',
    remote: unsplash('1748543668646-e81cda0890f3'),
  },
  {
    id: 'service-akne-bakimi',
    file: 'services/akne-bakimi.webp',
    group: 'service',
    alt: 'Açık pembe bir yüzeyde yan yana duran üç sabun kalıbı.',
    credit: 'Nazir Ahmad',
    sourceUrl:
      'https://unsplash.com/photos/three-different-types-of-soap-on-a-pink-surface-A1gPNi60BlI',
    remote: unsplash('1694147185194-f91cd8a50680'),
  },
  {
    id: 'service-yaslanma-karsiti-bakim',
    file: 'services/yaslanma-karsiti-bakim.webp',
    group: 'service',
    alt: 'Bej bir zeminde yumuşak kıvrımlar oluşturan ışık ve gölge.',
    credit: 'Pawel Czerwinski',
    sourceUrl:
      'https://unsplash.com/photos/soft-curved-lines-on-a-beige-background-RpSROCi8iJ8',
    remote: unsplash('1746132730694-92a72b5dc843'),
  },
  {
    id: 'service-leke-bakimi',
    file: 'services/leke-bakimi.webp',
    group: 'service',
    alt: 'Yakın çekimde, dokusu belirgin bej bir yüzey.',
    credit: 'Stepan Sargsyan',
    sourceUrl:
      'https://unsplash.com/photos/a-beige-background-with-a-rough-texture-hxk3iYQyjG0',
    remote: unsplash('1538645731800-4640c639bba7'),
  },
  {
    id: 'service-hassas-cilt-bakimi',
    file: 'services/hassas-cilt-bakimi.webp',
    group: 'service',
    alt: 'Işığı süzen ince keten bir perdenin yakın görünümü.',
    credit: 'Se. Tsuchiya',
    sourceUrl:
      'https://unsplash.com/photos/a-close-up-of-a-curtain-with-a-white-background-tfazediSzU8',
    remote: unsplash('1644316551857-8096d9b2304c'),
  },
  {
    id: 'service-kolajen-bakimi',
    file: 'services/kolajen-bakimi.webp',
    group: 'service',
    alt: 'Kıvrılmış sayfaların oluşturduğu katmanlı, krem rengi bir doku.',
    credit: 'Pawel Czerwinski',
    sourceUrl:
      'https://unsplash.com/photos/a-close-up-of-a-book-with-curved-pages-TV4yJcHQ6eY',
    remote: unsplash('1646600950096-0489e2a461cc'),
  },
  {
    id: 'service-nemlendirme-bakimi',
    file: 'services/nemlendirme-bakimi.webp',
    group: 'service',
    alt: 'Bej bir yüzeyde bakım şişeleri ve yeşil yapraklar.',
    credit: 'ibnu ihza',
    sourceUrl:
      'https://unsplash.com/photos/skincare-products-with-green-leaves-on-a-beige-surface-Z7u2bpbE65Q',
    remote: unsplash('1748543668751-902d6461890d'),
  },
  {
    id: 'service-gozenek-sikilastirma',
    file: 'services/gozenek-sikilastirma.webp',
    group: 'service',
    alt: 'Sıcak ışık alan, ince dokulu bir duvar yüzeyi.',
    credit: 'JKalina',
    sourceUrl:
      'https://unsplash.com/photos/a-close-up-of-a-wall-with-a-clock-on-it-p2dAyl15BpU',
    remote: unsplash('1692613480057-6b514c30f0e9'),
  },
  {
    id: 'service-hucre-yenileme',
    file: 'services/hucre-yenileme.webp',
    group: 'service',
    alt: 'Üst üste binen dalgalı bej katmanlar.',
    credit: 'Pawel Czerwinski',
    sourceUrl:
      'https://unsplash.com/photos/stacked-wavy-beige-abstract-layers-EaZ0rkqXr-k',
    remote: unsplash('1664037109833-5230a4640662'),
  },
  {
    id: 'service-lazer-epilasyon',
    file: 'services/lazer-epilasyon.webp',
    group: 'service',
    alt: 'Kahverengi ve bej çizgili bir kumaşın yakın çekimi.',
    credit: 'Kier in Sight Archives',
    sourceUrl:
      'https://unsplash.com/photos/brown-and-beige-striped-textile-I6Sqy9qh3Iw',
    remote: unsplash('1615225502559-842cbc296205'),
  },
  {
    id: 'service-hydrafacial',
    file: 'services/hydrafacial.webp',
    group: 'service',
    alt: 'Ahşap bir tabakta duran damlalıklı şişe ve doğal nesneler.',
    credit: 'Andrzej Gdula',
    sourceUrl:
      'https://www.pexels.com/photo/natural-oil-in-brown-bottle-laying-on-wooden-plate/',
    remote: pexels('11159174/pexels-photo-11159174.jpeg'),
  },
  {
    id: 'service-karbon-peeling',
    file: 'services/karbon-peeling.webp',
    group: 'service',
    alt: 'Duvara yaslanmış kuru çiçekler ve dallar.',
    credit: 'Peppered Pixels Design Studio',
    sourceUrl:
      'https://unsplash.com/photos/dry-flowers-and-branches-are-arranged-against-a-wall-Fwvpv1SYeOo',
    remote: unsplash('1753583572865-7f75623c3114'),
  },
  {
    id: 'service-kimyasal-peeling',
    file: 'services/kimyasal-peeling.webp',
    group: 'service',
    alt: 'Açık zeminde yumuşak, dalgalı çizgiler.',
    credit: 'Pawel Czerwinski',
    sourceUrl:
      'https://unsplash.com/photos/a-white-background-with-a-wavy-design-q-3pnV8MKWE',
    remote: unsplash('1714636608872-048fc9231892'),
  },
  {
    id: 'service-dermapen',
    file: 'services/dermapen.webp',
    group: 'service',
    alt: 'Yıpranmış bej bir duvarın dokusu.',
    credit: 'Plato Terentev',
    sourceUrl: 'https://www.pexels.com/photo/beige-and-white-worn-down-wall/',
    remote: pexels('9809060/pexels-photo-9809060.jpeg'),
  },
  {
    id: 'service-bb-glow',
    file: 'services/bb-glow.webp',
    group: 'service',
    alt: 'Bej bir zeminde katlanmış, pembe çizgili bir havlu.',
    credit: 'Karen Laårk Boshoff',
    sourceUrl:
      'https://www.pexels.com/photo/folded-pink-striped-towel-on-beige-surface/',
    remote: pexels('30982829/pexels-photo-30982829.jpeg'),
  },
  {
    id: 'service-kalici-makyaj',
    file: 'services/kalici-makyaj.webp',
    group: 'service',
    alt: 'Turuncu bir yüzeyde dağınık duran makyaj fırçaları.',
    credit: 'Rauf Alvi',
    sourceUrl:
      'https://unsplash.com/photos/a-group-of-black-pens-sitting-on-top-of-an-orange-surface-vWX9VIl5w-s',
    remote: unsplash('1631872112096-7b1b700237f6'),
  },
  {
    id: 'service-microblading',
    file: 'services/microblading.webp',
    group: 'service',
    alt: 'Etiketsiz kahverengi bir damlalık şişe, ahşap bir yüzeyde.',
    credit: 'Andrzej Gdula',
    sourceUrl: 'https://www.pexels.com/photo/close-up-of-flask-and-wood/',
    remote: pexels('12572315/pexels-photo-12572315.jpeg'),
  },
  {
    id: 'service-kirpik-lifting',
    file: 'services/kirpik-lifting.webp',
    group: 'service',
    alt: 'Yumuşak kıvrımlar yapan bej bir kumaşın yakın çekimi.',
    credit: 'Kier in Sight Archives',
    sourceUrl:
      'https://unsplash.com/photos/a-close-up-of-a-piece-of-cloth-kwepwyvPWmM',
    remote: unsplash('1705290304455-35ffb433f560'),
  },
  {
    id: 'service-kas-tasarimi',
    file: 'services/kas-tasarimi.webp',
    group: 'service',
    alt: 'Ahşap bir masada duran kahverengi dokuma kumaş.',
    credit: 'Scarbor Siu',
    sourceUrl:
      'https://unsplash.com/photos/brown-textile-on-brown-wooden-table-LevnxEuhev8',
    remote: unsplash('1616980540857-80cd9b1276c8'),
  },
  {
    id: 'service-gelin-bakim-paketi',
    file: 'services/gelin-bakim-paketi.webp',
    group: 'service',
    alt: 'Beyaz kâğıtların yanında duran gül buketi.',
    credit: 'Pongracz Noemi',
    sourceUrl:
      'https://unsplash.com/photos/red-rose-bouquet-beside-white-printer-paper-GGdN6qANl5Y',
    remote: unsplash('1627386252729-2c1d6534f447'),
  },
  {
    id: 'blog-cilt-bakimi-rehberi',
    file: 'blog/cilt-bakimi-rehberi.webp',
    group: 'blog',
    alt: 'Yuvarlak bir aynanın yanında duran kahverengi cam şişeler ve havlular.',
    credit: 'Alesia Kozik',
    sourceUrl:
      'https://www.pexels.com/photo/brown-glass-bottles-near-a-round-mirror/',
    remote: pexels('7795406/pexels-photo-7795406.jpeg'),
  },
  {
    id: 'blog-cilt-yenileme-rehberi',
    file: 'blog/cilt-yenileme-rehberi.webp',
    group: 'blog',
    alt: 'Beyaz bir kavanozun yanında buğday başakları ve katlanmış havlular.',
    credit: 'Andrzej Gdula',
    sourceUrl:
      'https://www.pexels.com/photo/wheat-stalks-near-white-container/',
    remote: pexels('11741344/pexels-photo-11741344.jpeg'),
  },
  {
    id: 'blog-epilasyon-rehberi',
    file: 'blog/epilasyon-rehberi.webp',
    group: 'blog',
    alt: 'Ahşap raflarda düzgün katlanmış bej tekstiller.',
    credit: 'Hai Nguyen',
    sourceUrl:
      'https://unsplash.com/photos/neatly-folded-shirts-stacked-on-wooden-shelves-4JeCx1lZAQQ',
    remote: unsplash('1753369232904-a8a888319d28'),
  },
  {
    id: 'blog-cilt-ihtiyaclari',
    file: 'blog/cilt-ihtiyaclari.webp',
    group: 'blog',
    alt: 'Seramik tabaklarda turunçgiller ve dokuma bir altlık.',
    credit: 'Tara Winstead',
    sourceUrl: 'https://www.pexels.com/photo/citrus-fruits-on-the-table/',
    remote: pexels('6489735/pexels-photo-6489735.jpeg'),
  },
  {
    id: 'blog-kas-kirpik-rehberi',
    file: 'blog/kas-kirpik-rehberi.webp',
    group: 'blog',
    alt: 'Bej bir fonun önünde kurutulmuş ince dallar.',
    credit: 'le john',
    sourceUrl: 'https://www.pexels.com/photo/dry-twig-on-beige-background/',
    remote: pexels('10016635/pexels-photo-10016635.jpeg'),
  },
  {
    id: 'blog-ozel-gun-ve-mevsim',
    file: 'blog/ozel-gun-ve-mevsim.webp',
    group: 'blog',
    alt: 'Hasır bir sepetin yanında kurutulmuş sarı çiçekler.',
    credit: 'Marina M',
    sourceUrl:
      'https://www.pexels.com/photo/dried-pycnosorus-flower-on-woven-basket/',
    remote: pexels('8356223/pexels-photo-8356223.jpeg'),
  },
  {
    id: 'page-home-venue',
    file: 'pages/home-venue.webp',
    group: 'page',
    alt: 'Geniş, sıcak tonlu bir karşılama alanı ve oturma grubu.',
    credit: 'Aalo Lens',
    sourceUrl:
      'https://unsplash.com/photos/modern-lobby-with-reception-desk-and-seating-area-Ypv0MH4izf8',
    remote: unsplash('1758448093806-88b2089068ab'),
  },
  {
    id: 'page-home-detail',
    file: 'pages/home-detail.webp',
    group: 'page',
    alt: 'Gün ışığı alan bir köşede bej koltuk ve ahşap sehpada bir mum.',
    credit: 'Sami Raad',
    sourceUrl:
      'https://www.pexels.com/photo/cozy-living-room-corner-with-armchair-and-candle/',
    remote: pexels('34016409/pexels-photo-34016409.png'),
  },
  {
    id: 'page-home-texture',
    file: 'pages/home-texture.webp',
    group: 'page',
    alt: 'Ahşap bir yüzeyin yakın çekimi.',
    credit: 'Mark Stenglein',
    sourceUrl:
      'https://unsplash.com/photos/a-close-up-view-of-a-wooden-bench-i6hDsZ-WksU',
    remote: unsplash('1635737775897-cbc4c19a697d'),
  },
  {
    id: 'page-about-hero',
    file: 'pages/about-hero.webp',
    group: 'page',
    alt: 'Kavisli ahşap duvarlar ve yuvarlak oturma alanı.',
    credit: 'Declan Sun',
    sourceUrl:
      'https://unsplash.com/photos/curved-wooden-walls-with-orange-circular-seating-IIavGesRDcc',
    remote: unsplash('1781967652468-81a56c3d478d'),
  },
  {
    id: 'page-about-space',
    file: 'pages/about-space.webp',
    group: 'page',
    alt: 'Sade döşenmiş, bej tonlarda bir oturma alanı.',
    credit: 'Thới Nam Cao',
    sourceUrl:
      'https://www.pexels.com/photo/furniture-in-minimalist-interior-design/',
    remote: pexels('15867424/pexels-photo-15867424.png'),
  },
  {
    id: 'page-about-detail',
    file: 'pages/about-detail.webp',
    group: 'page',
    alt: 'Ahşap bir rafta duran modern bir lamba ve çerçeveli baskı.',
    credit: 'Caroline Badran',
    sourceUrl:
      'https://unsplash.com/photos/modern-lamp-on-a-wooden-shelf-with-art-x2AMuYTZvuM',
    remote: unsplash('1765371512501-d25a6af94c91'),
  },
  {
    id: 'gallery-saksi',
    file: 'gallery/saksi.webp',
    group: 'gallery',
    alt: 'Ahşap bir kaidede duran saksı bitkisi.',
    credit: 'Daesun Kim',
    sourceUrl:
      'https://unsplash.com/photos/a-potted-plant-sitting-on-top-of-a-wooden-block-0mMTS_wGYdk',
    remote: unsplash('1646054346214-2c20bc25b86f'),
  },
  {
    id: 'gallery-mumlar',
    file: 'gallery/mumlar.webp',
    group: 'gallery',
    alt: 'Kurutulmuş çiçeklerin iki yanında duran iki mum.',
    credit: 'mdreza jalali',
    sourceUrl:
      'https://unsplash.com/photos/two-candles-flank-a-vase-of-dried-flowers-IXPwBIaqEY4',
    remote: unsplash('1760766145053-dc13d298dc18'),
  },
  {
    id: 'gallery-eller-dinlenme',
    file: 'gallery/eller-dinlenme.webp',
    group: 'gallery',
    alt: 'Kucakta dinlenen bir elin yakın çekimi.',
    credit: 'THLT LCX',
    sourceUrl:
      'https://unsplash.com/photos/persons-hand-on-persons-lap-ubeslMfS1lk',
    remote: unsplash('1611073615830-9f76902c10fe'),
  },
  {
    id: 'gallery-eller-bakim',
    file: 'gallery/eller-bakim.webp',
    group: 'gallery',
    alt: 'Bakım sırasında yakın çekilmiş eller.',
    credit: 'Wagner Santos',
    sourceUrl:
      'https://unsplash.com/photos/persons-hand-on-womans-lap-mBWMvIuVnso',
    remote: unsplash('1612288258805-b33a633dcbc8'),
  },
  {
    id: 'gallery-beyaz-cicek',
    file: 'gallery/beyaz-cicek.webp',
    group: 'gallery',
    alt: 'Beyaz çiçeklerin yakın çekimi.',
    credit: 'Sixteen Miles Out',
    sourceUrl:
      'https://unsplash.com/photos/a-close-up-of-a-bunch-of-white-flowers-JqYtgeQCtTk',
    remote: unsplash('1700146958186-f7d5b8774c8b'),
  },
  {
    id: 'gallery-yesil-yaprak',
    file: 'gallery/yesil-yaprak.webp',
    group: 'gallery',
    alt: 'Işığın süzüldüğü bir pencere önünde yeşil yapraklı bir bitki.',
    credit: 'Yue Iris',
    sourceUrl: 'https://unsplash.com/photos/green-leafed-plant-Ah7BaPsEsUc',
    remote: unsplash('1574334205675-7d582bbc677c'),
  },
  {
    id: 'gallery-kuru-ot',
    file: 'gallery/kuru-ot.webp',
    group: 'gallery',
    alt: 'Kurutulmuş bej otların yakın çekimi.',
    credit: 'Katsia Jazwinska',
    sourceUrl: 'https://unsplash.com/photos/brown-grass-decor-QBqlYTO353w',
    remote: unsplash('1578500407234-8885e502d309'),
  },
  {
    id: 'gallery-lavabo-ahsap',
    file: 'gallery/lavabo-ahsap.webp',
    group: 'gallery',
    alt: 'Ahşap ve taşın bir arada kullanıldığı bir lavabo köşesi.',
    credit: 'Peter Muniz',
    sourceUrl:
      'https://unsplash.com/photos/modern-bathroom-sink-with-soap-dispenser-and-towel-EwghVOVXmgU',
    remote: unsplash('1763485956366-8cca552c85c6'),
  },
  {
    id: 'gallery-kuru-dal',
    file: 'gallery/kuru-dal.webp',
    group: 'gallery',
    alt: 'Sıcak tonlu bir sıva duvarda dal gölgeleri.',
    credit: 'Tim Mossholder',
    sourceUrl:
      'https://unsplash.com/photos/a-black-and-white-photo-of-a-shadow-of-a-tree-Kjy0Q_S_2xg',
    remote: unsplash('1709878455013-33700da90501'),
  },
  {
    id: 'gallery-perde-pencere',
    file: 'gallery/perde-pencere.webp',
    group: 'gallery',
    alt: 'Pencere kenarında ışığı süzen bir perde.',
    credit: 'the blowup',
    sourceUrl:
      'https://unsplash.com/photos/a-close-up-of-a-curtain-on-a-window-sill-uY2VYKZRk2Y',
    remote: unsplash('1623658423238-8307df454e11'),
  },
  {
    id: 'gallery-lavabo-beton',
    file: 'gallery/lavabo-beton.webp',
    group: 'gallery',
    alt: 'Beton bir lavabo ve mat siyah armatür.',
    credit: 'Peter Muniz',
    sourceUrl:
      'https://unsplash.com/photos/modern-bathroom-with-concrete-sink-and-black-faucet-Uq1Sa_lHmSA',
    remote: unsplash('1763485956070-431fca7bc030'),
  },
  {
    id: 'gallery-terrakota-raf',
    file: 'gallery/terrakota-raf.webp',
    group: 'gallery',
    alt: 'Rustik bir rafta duran terrakota testiler.',
    credit: 'The Daphne Lens',
    sourceUrl:
      'https://www.pexels.com/photo/rustic-wall-shelf-with-terracotta-vases-and-lamp/',
    remote: pexels('34565299/pexels-photo-34565299.jpeg'),
  },
  {
    id: 'gallery-serum-bilek',
    file: 'gallery/serum-bilek.webp',
    group: 'gallery',
    alt: 'Bileğe bakım yağı uygulayan eller.',
    credit: 'Yaroslav Shuraev',
    sourceUrl: 'https://www.pexels.com/photo/hands-relaxation-girl-blur/',
    remote: pexels('6793172/pexels-photo-6793172.jpeg'),
  },
  {
    id: 'gallery-kil-testi',
    file: 'gallery/kil-testi.webp',
    group: 'gallery',
    alt: 'Sıcak ışıkla aydınlatılmış bir nişte duran kil testi.',
    credit: 'Jan van der Wolf',
    sourceUrl: 'https://www.pexels.com/photo/ancient-clay-jar-on-a-shelf/',
    remote: pexels('14734823/pexels-photo-14734823.jpeg'),
  },
  {
    id: 'gallery-kil-vazolar',
    file: 'gallery/kil-vazolar.webp',
    group: 'gallery',
    alt: 'Bir rafta yan yana dizilmiş kil vazolar.',
    credit: 'ROMAN ODINTSOV',
    sourceUrl: 'https://www.pexels.com/photo/clay-containers-on-shelf/',
    remote: pexels('8063848/pexels-photo-8063848.jpeg'),
  },
  {
    id: 'gallery-havlular',
    file: 'gallery/havlular.webp',
    group: 'gallery',
    alt: 'Fayans duvarda çerçeveli bir baskı ve dokulu havlular.',
    credit: 'Cup of Couple',
    sourceUrl: 'https://www.pexels.com/photo/bathroom-with-mirror-and-drawing/',
    remote: pexels('7303916/pexels-photo-7303916.jpeg'),
  },
];
