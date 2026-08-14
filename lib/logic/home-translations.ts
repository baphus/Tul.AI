import type { Language } from "./locale";

export type HomeCopy = {
  heroTitle: string;
  heroBody: string;
  heroCta: string;
  heroImageAlt: string;
  statsTitle: string;
  stats: string[];
  sourcesTitle: string;
  sources: { label: string; title: string; body: string; explore: string; imageAlt: string }[];
  providersTitle: string;
  providersBody: (count: number) => string;
  providersCta: string;
  supportTitle: string;
  supportBody: string;
  supportItems: { title: string; body: string }[];
  supportCta: string;
  coverageTitle: string;
  coverageBody: (count: number) => string;
  coverageCta: string;
  closeTitle: string;
  closeBody: string;
  closeCta: string;
  tierSource: (tier: number) => string;
};

export const homeTranslations: Record<Language, HomeCopy> = {
  ENG: {
    heroTitle: "Your next opportunity is closer than you think.",
    heroBody: "Finding support for school can feel overwhelming. Tul.AI helps you explore opportunities with more clarity, one step at a time.",
    heroCta: "Find my scholarships",
    heroImageAlt: "Four students walking together on a campus path, looking at a phone one of them is holding.",
    statsTitle: "You deserve a clearer path forward.",
    stats: [
      "Discover scholarship opportunities that may fit your path.",
      "Understand each opportunity in clear, simple language.",
      "Move to the provider's official page when you are ready to apply.",
    ],
    sourcesTitle: "Scholarships for Filipino students anywhere",
    sources: [
      { label: "Government", title: "Public support, published openly", body: "Scholarships from national agencies and local governments, with the official notice kept close at hand.", explore: "Explore government scholarships", imageAlt: "Historic public building in Manila" },
      { label: "Schools", title: "Opportunities through schools", body: "Programs offered by schools and education partners for students taking the next step in their studies.", explore: "Explore school scholarships", imageAlt: "Three Filipino students studying together" },
      { label: "Foundations", title: "Backing from mission-led partners", body: "Foundation, nonprofit, corporate, and international programs that invest in students and communities.", explore: "Explore foundation scholarships", imageAlt: "Filipino children walking to school" },
    ],
    providersTitle: "A small index. Real sources.",
    providersBody: (count) => `${count} opportunities across national agencies, LGUs, universities and foundations.`,
    providersCta: "See all records",
    supportTitle: "You don't have to figure it all out alone.",
    supportBody: "Looking for support can bring a lot of questions at once. Tul.AI gives you one clear place to explore what's out there, understand the details, and decide what feels worth pursuing.",
    supportItems: [
      { title: "Find opportunities that fit your path", body: "Start with what you know about yourself, your studies and the support you are looking for." },
      { title: "Understand why each one appears", body: "See the published requirements alongside what your profile can confirm and what still needs checking." },
      { title: "Keep official information close", body: "Read the source and its verification state before you rely on it." },
      { title: "Move forward at your own pace", body: "Save opportunities for later, then go to the provider's official page whenever you are ready to apply." },
    ],
    supportCta: "Find my starting point",
    coverageTitle: "Every institution we cover, and what they publish.",
    coverageBody: (count) => `All ${count} records we hold today — not a sample of a larger index. Coverage is deliberately Cebu-first while we prove the quality of each record, and it is small enough to print in full, so we print it in full.`,
    coverageCta: "Open the full directory",
    closeTitle: "Find the scholarships you can actually pursue.",
    closeBody: "Answer five questions. See verified opportunities with the published requirements behind every match.",
    closeCta: "Find my scholarships",
    tierSource: (tier) => `Tier ${tier} source`,
  },
  FIL: {
    heroTitle: "Mas malapit sa iyo ang susunod mong oportunidad kaysa sa iniisip mo.",
    heroBody: "Maaaring nakakalito ang paghahanap ng tulong para sa pag-aaral. Tinutulungan ka ng Tul.AI na tuklasin ang mga oportunidad nang mas malinaw, isang hakbang bawat pagkakataon.",
    heroCta: "Hanapin ang mga scholarships",
    heroImageAlt: "Apat na estudyanteng naglalakad sa campus habang tinitingnan ang telepono ng isa sa kanila.",
    statsTitle: "Karapat-dapat ka sa mas malinaw na direksyon.",
    stats: [
      "Tuklasin ang mga scholarship na maaaring angkop sa iyong landas.",
      "Unawain ang bawat oportunidad sa malinaw at simpleng paraan.",
      "Pumunta sa opisyal na pahina ng provider kapag handa ka nang mag-apply.",
    ],
    sourcesTitle: "Mga scholarship para sa mga estudyanteng Pilipino",
    sources: [
      { label: "Pamahalaan", title: "Malinaw na pampublikong suporta", body: "Mga scholarship mula sa pambansang ahensya at lokal na pamahalaan, kasama ang opisyal na anunsyo.", explore: "Tingnan ang government scholarships", imageAlt: "Makasaysayang gusaling pampubliko sa Maynila" },
      { label: "Mga Paaralan", title: "Mga oportunidad sa pamamagitan ng paaralan", body: "Mga programa mula sa mga paaralan at education partner para sa susunod mong hakbang sa pag-aaral.", explore: "Tingnan ang school scholarships", imageAlt: "Tatlong estudyanteng Pilipino na sama-samang nag-aaral" },
      { label: "Mga Foundation", title: "Suporta mula sa mga katuwang", body: "Mga programang mula sa foundation, nonprofit, kumpanya, at international partner para sa mga estudyante at komunidad.", explore: "Tingnan ang foundation scholarships", imageAlt: "Mga batang Pilipino na naglalakad papunta sa paaralan" },
    ],
    providersTitle: "Maliit na talaan. Tunay na sources.",
    providersBody: (count) => `${count} oportunidad mula sa pambansang ahensya, LGU, unibersidad, at foundation.`,
    providersCta: "Tingnan ang lahat ng tala",
    supportTitle: "Hindi mo kailangang alamin ang lahat nang mag-isa.",
    supportBody: "Maraming tanong ang maaaring lumitaw kapag naghahanap ng suporta. Binibigyan ka ng Tul.AI ng isang malinaw na lugar para tuklasin ang mga oportunidad, unawain ang detalye, at piliin ang sulit subukan.",
    supportItems: [
      { title: "Humanap ng angkop sa iyong landas", body: "Magsimula sa mga alam mo tungkol sa iyong sarili, pag-aaral, at suportang kailangan mo." },
      { title: "Unawain kung bakit ito lumabas", body: "Makita ang inilathalang requirements, kung ano ang tugma sa profile mo, at kung ano pa ang kailangang kumpirmahin." },
      { title: "Panatilihing malapit ang opisyal na impormasyon", body: "Basahin ang source at verification status bago ito pagkatiwalaan." },
      { title: "Sumulong sa sarili mong bilis", body: "I-save ang oportunidad para balikan, at pumunta sa opisyal na page kapag handa ka nang mag-apply." },
    ],
    supportCta: "Magsimula rito",
    coverageTitle: "Bawat institusyong sakop namin at ang kanilang inilalathala.",
    coverageBody: (count) => `Lahat ng ${count} tala na hawak namin ngayon — hindi sample ng mas malaking index. Cebu-first muna ang coverage habang pinatutunayan namin ang kalidad ng bawat tala.`,
    coverageCta: "Buksan ang buong directory",
    closeTitle: "Hanapin ang mga scholarship na maaari mong subukan.",
    closeBody: "Sagutin ang limang tanong. Tingnan ang mga verified na oportunidad at ang requirements sa likod ng bawat match.",
    closeCta: "Hanapin ang mga scholarships",
    tierSource: (tier) => `Tier ${tier} na source`,
  },
};
