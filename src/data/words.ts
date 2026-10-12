/**
 * Built-in English word lists (common vocabulary, original selection).
 * Kept as space-separated strings: smaller bundle and faster to parse.
 */
const EASY = `the be to of and a in that have it for not on with he as you do at this but his by from they we say her
she or an will my one all would there their what so up out if about who get which go me when make can like time no
just him know take people into year your good some could them see other than then now look only come its over think
also back after use two how our work first well way even new want because any these give day most us is was are has
had did said made went find here thing many such long down little own old right big high small large next early young
few still last keep let begin seem help show hear play run move live hold bring write sit stand lose pay meet set learn
lead read add spend grow open walk win offer love wait serve die send build stay fall cut reach kill remain`;

const MEDIUM = `world school state family student group country problem hand part place case week company system program
question government number night point home water room mother area money story fact month lot study book eye job word
business issue side kind head house service friend father power hour game line end member law car city community name
president team minute idea kid body information back parent face others level office door health person art war history
party result change morning reason research girl guy moment air teacher force education foot boy age policy process
music market sense nation plan college interest death experience effect class control care field development role effort
rate heart drug leader light voice wife police mind price report decision son view relationship town road arm difference
value building action model season society tax director position player record paper space ground form event official
matter center couple site project activity star table need court oil situation cost industry figure street image phone
data picture practice piece land product doctor wall patient worker news test movie north love support technology step
baby computer type attention film tree source organization hair window evidence population`;

const HARD = `acknowledge ambiguous anonymous apparatus arbitrary benevolent bureaucracy catastrophe circumference
coincidence colleague competitive comprehensive conscientious consequence contemporary controversy correspondence
curriculum deliberate dilemma discipline eccentric efficiency eloquent embarrass entrepreneur environment equivalent
exaggerate exhilarate extraordinary facilitate fluorescent foreign gauge guarantee harass hierarchy hypothesis idiosyncrasy
immediately independent indispensable infrastructure inoculate intelligence jeopardize kaleidoscope knowledgeable
labyrinth liaison maintenance maneuver mediocre millennium miniature mischievous necessary neighbor noticeable occasion
occurrence omniscient opportunity parallel parliament perseverance phenomenon playwright possession prejudice privilege
pronunciation psychology questionnaire quintessential receive recommend reconnaissance rehearsal relevant rhythm
sacrilegious schedule separate silhouette sovereign spontaneous strategy subtle supersede surveillance symmetry
temperament threshold tomorrow tyranny unanimous unnecessary vacuum vengeance vigilant whimsical withhold xylophone
yacht zealous algorithm asynchronous bandwidth benchmark compiler concurrency cryptography deterministic encapsulation
heuristic idempotent immutable inheritance iteration latency middleware polymorphism recursion refactor serialization
throughput virtualization`;

const toList = (s: string): readonly string[] => s.split(/\s+/).filter(Boolean);

export const WORD_LISTS = {
  easy: toList(EASY),
  medium: [...new Set([...toList(EASY).slice(0, 120), ...toList(MEDIUM)])],
  hard: [...new Set([...toList(MEDIUM).slice(0, 80), ...toList(HARD)])],
} satisfies Record<'easy' | 'medium' | 'hard', readonly string[]>;
