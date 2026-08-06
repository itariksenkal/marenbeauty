import { COSMETIC_DISCLAIMER } from '@/config/legal';
import { site } from '@/config/site';

/**
 * `/sss` — the questions the centre can answer today.
 *
 * Every answer here is checkable against something already true: a decision
 * recorded in `docs/OPEN-QUESTIONS.md`, a page that exists, or the fact that
 * the centre has not opened. Nothing describes a session length, a product, a
 * device, a result, or a date (`CLAUDE.md` §9).
 *
 * Several answers say what the site deliberately does NOT publish and why.
 * That is not evasion — it is the most distinctive material the site has, and
 * a visitor who asks "why are there no before/after photos" deserves the real
 * reason rather than silence.
 *
 * The per-service questions are NOT copied here. Each service page carries its
 * own `faq` frontmatter and its own `FAQPage` markup; duplicating them would
 * put the same question on two indexable URLs. This page links to them instead.
 */
export type FaqItem = {
  readonly question: string;
  readonly answer: string;
};

export const faqPage = {
  eyebrow: 'SSS',
  headingLines: ['Sık sorulan', 'sorular.'],
  lead: 'Merkez henüz açılmadı, dolayısıyla bazı soruların cevabı "henüz belli değil". Bunları tahmin etmek yerine olduğu gibi yazdık.',

  generalHeading: 'Genel sorular',

  servicesHeading: 'Uygulamalarla ilgili sorular',
  servicesLead:
    'Her uygulamanın kendi sayfasında, o uygulamaya özel sorular var. Aşağıdaki başlıklardan ilgilendiğiniz sayfaya geçebilirsiniz.',

  contactHeading: 'Cevabını burada bulamadınız mı?',
  contactBody:
    'Sorunuzu iletişim formundan yazın. Mesajınız merkeze ulaşır ve açılışla birlikte yanıtlanır.',
} as const;

export const generalFaq: readonly FaqItem[] = [
  {
    question: 'Maren Beauty ne zaman açılıyor?',
    answer:
      'Kesin bir tarih paylaşmıyoruz, çünkü henüz elimizde kesin bir tarih yok. Açılış yaklaştığında bu sitede ve sosyal hesaplarımızda duyuracağız. Şimdiden yazarsanız mesajınız bize ulaşır ve açılışla birlikte size dönüş yapıyoruz.',
  },
  {
    question: 'Şimdiden randevu alabilir miyim?',
    answer:
      'Randevu defteri henüz açılmadı. İletişim formundan ya da WhatsApp’tan yazdıklarınız bize ulaşıyor; açılışla birlikte sırayla dönüş yapıyoruz. Gönderdiğiniz mesaj bir yer ayırtmaz, ama sıraya girmenizi sağlar.',
  },
  {
    question: 'Fiyatları nereden öğrenebilirim?',
    answer:
      'Fiyatları sitede yayımlamıyoruz — ne tek tek ne de aralık olarak. Hangi uygulamanın size uygun olduğuna görüşmede birlikte karar verdiğimiz için, fiyatı da o görüşmede paylaşıyoruz. Bir sayfadan seçilen fiyat, çoğu zaman doğru olmayan bir uygulamanın fiyatıdır.',
  },
  {
    question: 'Merkez tam olarak nerede?',
    answer: `${site.address.region}, ${site.address.locality}. Açık adresi, kapılar açıldığında bu sayfaya ve iletişim sayfasına ekleyeceğiz. Şu anda yazsaydık, doğruluğundan emin olmadığımız bir adres yazmış olurduk.`,
  },
  {
    question: 'Hangi uygulamalar yapılıyor?',
    answer:
      'Yirmi başlık var ve hepsi hizmetler sayfasında gruplar hâlinde listeleniyor: cilt bakımı, epilasyon, cilt yenileme, kaş & kirpik ve özel paketler. Her başlığın kendi sayfasında o uygulamanın ne olduğu anlatılıyor.',
  },
  {
    question: 'Bu uygulamalar tıbbi bir işlem mi?',
    answer: `Hayır. Maren Beauty bir güzellik merkezidir, sağlık kuruluşu değildir. ${COSMETIC_DISCLAIMER} Cildinizle ilgili bir endişeniz varsa önce ilgili uzmana danışmanız gerekir.`,
  },
  {
    question: 'Sitede neden öncesi–sonrası fotoğrafı yok?',
    answer:
      'Çünkü öncesi–sonrası görselleri, bir sonucun herkeste tekrar edeceğini ima eder. Işık, açı ve zamanlama değiştiğinde aynı cilt iki farklı fotoğrafta iki farklı cilt gibi görünür. Bu yüzden yayımlamıyoruz — kendi görsellerimizle de yapmayacağız.',
  },
  {
    question: 'Neden hiçbir sayfada süre ya da seans sayısı yazmıyor?',
    answer:
      'Aynı sebeple: yazdığımız an bir söz vermiş oluruz. Bir uygulamanın kaç seans süreceği kişiye göre değişir ve bunu ancak sizi gördükten sonra konuşabiliriz. Bilmediğimiz bir sayıyı sayfaya yazmak yerine boş bırakmayı tercih ediyoruz.',
  },
  {
    question: 'İlk kez geleceğim. Nasıl ilerliyor?',
    answer:
      'Önce oturup konuşuyoruz: ne için geldiğinizi ve neyi merak ettiğinizi dinliyoruz. Sonra cildinize birlikte bakıp hangi uygulamanın uygun olduğuna karar veriyoruz. Uygulama sırasında ne yaptığımızı anlatıyoruz ve rahatsız olduğunuz an duruyoruz.',
  },
  {
    question: 'Formdan yazdığımda kişisel verilerim ne oluyor?',
    answer:
      'Formdaki bilgiler bir e-postaya dönüştürülüp merkezin adresine iletiliyor. Sitede bir veri tabanına, bir dosyaya ya da bir kayda yazılmıyor. Ayrıntısı KVKK Aydınlatma Metni sayfasında, hangi alanın neden istendiğiyle birlikte yazılı.',
  },
];
