import type { Language } from "./locale";

export const ASSISTANT_COPY: Record<Language, {
  answerContext: string;
  aiGrounded: string;
  aiGroundedWithSources: string;
  recordGrounded: string;
  thinking: string;
  askPlaceholder: string;
  chatGreeting: (total: number, buckets: string) => string;
  noMatchesGreeting: string;
  foundMatches: string;
  askList: string;
  chatEvidence: string;
  verify: { action: string; subtitle: string; complete: string; checking: string; found: string; sources: (count: number) => string; done: string };
  apply: { title: string; description: (provider: string) => string; official: string; check: string; continue: (host: string) => string; noLink: string };
}> = {
  ENG: {
    answerContext: "Answers use the published record. For current facts, Tul.AI may research the provider's official sources and show citations; anything it can't confirm stays unknown.",
    aiGrounded: "AI response grounded in the published record",
    aiGroundedWithSources: "AI response grounded in the published record and official web sources",
    recordGrounded: "Based on the scholarship record",
    thinking: "Thinking…",
    askPlaceholder: "Ask about scholarships…",
    chatGreeting: (total, buckets) => `You've found ${total} match${total === 1 ? "" : "es"}: ${buckets}. Ask me to clarify any match or research scholarship questions. Provider sources still decide eligibility, deadlines, and applications.`,
    noMatchesGreeting: "You've finished your current list. No eligible or possible matches appeared in this verified set yet. I can help you review your profile or research broader opportunities—without treating a search result as a confirmed match.",
    foundMatches: "You've found your matches",
    askList: "Ask about your list",
    chatEvidence: "Published records, with cited live research when needed",
    verify: { action: "Ask Tul.AI to verify", subtitle: "Re-check the provider's published information", complete: "Research complete", checking: "Checking official sources…", found: "What Tul.AI found", sources: (count) => `${count} official ${count === 1 ? "source" : "sources"} available to review`, done: "Done" },
    apply: { title: "You're heading to the official scholarship provider.", description: (provider) => `Tul.AI helps you discover and understand opportunities. Your application is completed directly with ${provider}, who makes the final decision.`, official: "Official", check: "Check the programme page for the current application form — published requirements can change after our last check.", continue: (host) => `Continue to ${host}`, noLink: "The provider has not published a direct application link. Use its official source to check the current process." },
  },
  FIL: {
    answerContext: "Batay ang mga sagot sa inilathalang rekord. Para sa kasalukuyang impormasyon, maaaring magsaliksik ang Tul.AI sa opisyal na source ng provider at magpakita ng citation; anumang hindi makumpirma ay mananatiling unknown.",
    aiGrounded: "Sagot ng AI na nakabatay sa inilathalang rekord",
    aiGroundedWithSources: "Sagot ng AI na nakabatay sa inilathalang rekord at opisyal na web source",
    recordGrounded: "Batay sa rekord ng scholarship",
    thinking: "Nag-iisip…",
    askPlaceholder: "Magtanong tungkol sa mga scholarship…",
    chatGreeting: (total, buckets) => `Mayroon kang ${total} match${total === 1 ? "" : "es"}: ${buckets}. Maaari kang magtanong para linawin ang anumang match o magsaliksik tungkol sa scholarship. Ang provider pa rin ang nagpapasya sa eligibility, deadline, at aplikasyon.`,
    noMatchesGreeting: "Natapos mo na ang kasalukuyan mong listahan. Wala pang eligible o possible match sa verified na set na ito. Maaari kitang tulungang suriin ang profile mo o maghanap ng mas malawak na oportunidad—ngunit hindi ituturing na kumpirmadong match ang resulta ng paghahanap.",
    foundMatches: "Nahanap mo ang iyong mga match",
    askList: "Magtanong tungkol sa iyong listahan",
    chatEvidence: "Mga inilathalang rekord, kasama ang cited na live research kung kailangan",
    verify: { action: "Hilingin sa Tul.AI na mag-verify", subtitle: "Suriing muli ang inilathalang impormasyon ng provider", complete: "Tapos na ang pananaliksik", checking: "Sinusuri ang mga opisyal na source…", found: "Nalaman ng Tul.AI", sources: (count) => `${count} opisyal na ${count === 1 ? "source" : "source"} ang maaaring suriin`, done: "Tapos" },
    apply: { title: "Pupunta ka sa opisyal na scholarship provider.", description: (provider) => `Tinutulungan ka ng Tul.AI na makatuklas at makaunawa ng mga oportunidad. Direktang kukumpletuhin ang iyong aplikasyon sa ${provider}, na siyang magpapasya.`, official: "Opisyal", check: "Tingnan ang pahina ng programa para sa kasalukuyang application form—maaaring magbago ang requirements pagkatapos ng huli naming pagsusuri.", continue: (host) => `Magpatuloy sa ${host}`, noLink: "Wala pang inilathalang direktang application link ang provider. Gamitin ang opisyal nitong source para tingnan ang kasalukuyang proseso." },
  },
  BIS: {
    answerContext: "Ang mga tubag gibase sa gipatik nga rekord. Para sa kasamtangang impormasyon, mahimong mosusi ang Tul.AI sa opisyal nga tinubdan sa provider ug magpakita og citation; ang dili makumpirma magpabiling unknown.",
    aiGrounded: "Tubag sa AI nga gibase sa gipatik nga rekord",
    aiGroundedWithSources: "Tubag sa AI nga gibase sa gipatik nga rekord ug opisyal nga mga tinubdan sa web",
    recordGrounded: "Gibase sa rekord sa scholarship",
    thinking: "Naghunahuna…",
    askPlaceholder: "Pangutana bahin sa mga scholarship…",
    chatGreeting: (total, buckets) => `Nakaplagan nimo ang ${total} ka match${total === 1 ? "" : "es"}: ${buckets}. Pangutana lang aron masabtan ang bisan unsang match o bahin sa scholarship. Ang provider gihapon ang magbuot sa eligibility, deadline, ug aplikasyon.`,
    noMatchesGreeting: "Nahuman na nimo ang imong kasamtangang lista. Wala pay eligible o possible nga match sa niining verified nga set. Matabangan tika pagsusi sa imong profile o pagpangita og mas halapad nga oportunidad—apan dili namo tawgon og kumpirmadong match ang resulta sa pagpangita.",
    foundMatches: "Nakaplagan nimo ang imong mga match",
    askList: "Pangutana bahin sa imong lista",
    chatEvidence: "Gipatik nga mga rekord, uban sa cited nga live research kon gikinahanglan",
    verify: { action: "Hangyoa ang Tul.AI sa pagpamatuod", subtitle: "Susihon pag-usab ang gipatik nga impormasyon sa provider", complete: "Nahuman ang panukiduki", checking: "Gisusi ang opisyal nga mga tinubdan…", found: "Nakaplagan sa Tul.AI", sources: (count) => `${count} ka opisyal nga tinubdan ang masusi`, done: "Human" },
    apply: { title: "Padulong ka sa opisyal nga scholarship provider.", description: (provider) => `Gitabangan ka sa Tul.AI sa pagsusi ug pagsabot sa mga oportunidad. Direkta nimong humanon ang aplikasyon sa ${provider}, nga maoy magbuot sa kataposang desisyon.`, official: "Opisyal", check: "Susiha ang pahina sa programa para sa kasamtangang application form—mausab ang mga kinahanglanon human sa among kataposang pagsusi.", continue: (host) => `Padayon sa ${host}`, noLink: "Wala pa nagpatik ang provider og diretsong application link. Gamita ang opisyal nga tinubdan aron susihon ang kasamtangang proseso." },
  },
};
