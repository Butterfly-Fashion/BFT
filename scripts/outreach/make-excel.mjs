/**
 * Generate B2B Outreach Excel file
 * Run: node scripts/outreach/make-excel.mjs
 */

import { writeFileSync, readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const sent = JSON.parse(readFileSync(join(__dirname, "sent.json"), "utf8"));

const prospects = [
  // ── 카드샵 (Card Shop) ─────────────────────────────────────────────────────
  { no:1,  name:"Elite Cards Toronto",       category:"카드샵",     address:"Vaughan",                          phone:"905-303-2290", email:"elitecardstoronto@gmail.com",         website:"elitecardstoronto.com",       priority:"★★★", notes:"Panini 전문" },
  { no:2,  name:"Clutch Games",              category:"카드샵",     address:"530 Yonge St, Toronto",            phone:"",             email:"clutchgamestoronto@gmail.com",        website:"clutchgames.ca",              priority:"★★★", notes:"" },
  { no:3,  name:"Hope Club Collectibles",    category:"카드샵",     address:"1530 Albion Rd, Etobicoke",        phone:"647-721-4673", email:"online@hopeclubshop.ca",             website:"hopeclubshop.ca",             priority:"★★★", notes:"Upper Deck 취급" },
  { no:4,  name:"Cardboard Classics",        category:"카드샵",     address:"31 Disera Dr, Thornhill",          phone:"905-597-7270", email:"cardboardclassicgames@gmail.com",     website:"cardboardclassics.ca",        priority:"★★★", notes:"" },
  { no:5,  name:"Fastball Collectibles",     category:"카드샵",     address:"44 Saint Joseph St, Toronto",      phone:"416-910-7717", email:"info@fastballcollectibles.com",       website:"fastballcollectibles.com",    priority:"★★★", notes:"" },
  { no:6,  name:"Hogtown Cards",             category:"카드샵",     address:"Toronto",                          phone:"",             email:"hogtowncardsinc@gmail.com",           website:"hogtowncards.com",            priority:"★★★", notes:"" },
  { no:7,  name:"Pastime Sports & Games",    category:"카드샵",     address:"Toronto",                          phone:"",             email:"info@pastimesports.ca",              website:"pastimesports.ca",            priority:"★★★", notes:"" },
  { no:8,  name:"Banana Games & Hobby",      category:"카드샵",     address:"384 Yonge St, Toronto",            phone:"",             email:"bananagames.hobby@gmail.com",         website:"bananagames.ca",              priority:"★★★", notes:"" },
  { no:9,  name:"NexPack Collectibles",      category:"카드샵",     address:"7225 Woodbine Ave, Markham",       phone:"",             email:"customer@npcollectibles.com",         website:"npcollectibles.com",          priority:"★★★", notes:"" },
  { no:10, name:"Cardboard Memories",        category:"카드샵",     address:"Brampton",                         phone:"",             email:"info@cardboardmemories.ca",           website:"cardboardmemories.ca",        priority:"★★★", notes:"" },
  { no:11, name:"Collectors Dreams",         category:"카드샵",     address:"10520 Yonge St, Richmond Hill",    phone:"905-508-6935", email:"CollectorsDreams@rogers.com",         website:"collectorsdreams.ca",         priority:"★★★", notes:"" },
  { no:12, name:"401 Games",                 category:"카드샵",     address:"431 Yonge St, Toronto",            phone:"416-599-6446", email:"info@401games.ca",                   website:"store.401games.ca",           priority:"★★★", notes:"토론토 최대 카드샵" },
  { no:13, name:"The Upper Hand TCG",        category:"카드샵",     address:"2150 Burnhamthorpe Rd W, Mississauga", phone:"905-607-1116", email:"theupperhandtradingcards@gmail.com", website:"theupperhand.ca",          priority:"★★★", notes:"" },
  { no:14, name:"Mintink Trading Cards",     category:"카드샵",     address:"8555 Jane St, Vaughan",            phone:"416-827-9141", email:"info@mintink.ca",                    website:"mintink.ca",                 priority:"★★★", notes:"PSA 딜러" },
  { no:15, name:"Wax Box Club",              category:"카드샵",     address:"145 Hawkview Blvd, Vaughan",       phone:"647-498-2056", email:"waxboxclub@gmail.com",               website:"waxboxclub.com",              priority:"★★★", notes:"" },
  { no:16, name:"Flip Collectibles",         category:"카드샵",     address:"80 Bass Pro Mills Dr, Vaughan",    phone:"416-294-4601", email:"info@flipcollect.com",               website:"flipcollect.com",             priority:"★★★", notes:"Vaughan Mills 근처" },
  { no:17, name:"Esper Cards & Games",       category:"카드샵",     address:"380 Old Kingston Rd, Scarborough", phone:"416-724-4668", email:"hello@espercardsandgames.com",        website:"shop.espercardsandgames.com", priority:"★★★", notes:"" },
  { no:18, name:"Pro League Sports",         category:"카드샵",     address:"136 River St, Toronto",            phone:"416-699-2097", email:"proleaguesports@hotmail.com",         website:"proleaguesports.ca",          priority:"★★",  notes:"" },
  { no:19, name:"CloutsnChara Sports Cards", category:"카드샵",     address:"645 Victoria St N, Kitchener",     phone:"519-954-8278", email:"cloutsnchara@gmail.com",              website:"cloutsnchara.com",            priority:"★★",  notes:"Kitchener (GTA 외)" },
  { no:20, name:"Rednails2",                 category:"카드샵",     address:"18A Jane St / 1700 Wilson Ave, Toronto", phone:"416-762-7899", email:"rednails_ii@yahoo.ca",         website:"rednails2.com",               priority:"★★★", notes:"2개 지점" },
  { no:21, name:"DD Sports",                 category:"카드샵",     address:"131 Whitmore Rd, Woodbridge",      phone:"416-677-2132", email:"info@ddsports.ca",                   website:"ddsports.ca",                 priority:"★★★", notes:"" },

  // ── 축구 전문점 (Soccer Store) ─────────────────────────────────────────────
  { no:22, name:"Soccer Maxx",               category:"축구 매장",  address:"2273 Dundas St W, Mississauga",    phone:"905-608-8558", email:"info@soccermaxx.ca",                 website:"soccermaxx.ca",               priority:"★★★", notes:"여러 지점" },
  { no:23, name:"Ital Sport",                category:"축구 매장",  address:"1339 St Clair Ave W, Toronto",     phone:"416-654-8272", email:"italsport@rogers.com",               website:"italsport.ca",                priority:"★★★", notes:"Little Italy" },
  { no:24, name:"L&M Taylor Soccer",         category:"축구 매장",  address:"2046 Yonge St, Toronto",           phone:"",             email:"TaylorSoccerToronto@rogers.com",     website:"taylorsoccer.ca",             priority:"★★★", notes:"" },
  { no:25, name:"Evangelista Sports",        category:"축구 매장",  address:"3120 Rutherford Rd, Maple/Vaughan",phone:"905-832-5961", email:"maple@evangelistasports.com",         website:"evangelistasports.com",       priority:"★★★", notes:"캐나다 축구 전문점" },
  { no:26, name:"Soccer World Central",      category:"축구 매장",  address:"521 North Service Rd E, Oakville", phone:"905-815-8939", email:"anthony@soccerworldcentral.com",     website:"soccerworldcentral.com",      priority:"★★★", notes:"" },
  { no:27, name:"SVP Sports Brampton",       category:"축구 매장",  address:"539 Steeles Ave E, Brampton",      phone:"905-451-4414", email:"brampton@svpsports.net",             website:"svpsports.ca",                priority:"★★",  notes:"" },
  { no:28, name:"SVP Sports Steeles",        category:"축구 매장",  address:"6931 Steeles Ave W, Etobicoke",    phone:"416-675-9235", email:"steeles@svpsports.net",              website:"svpsports.ca",                priority:"★★",  notes:"" },
  { no:29, name:"SVP Sports Dufferin",       category:"축구 매장",  address:"3240 Dufferin St, Toronto",        phone:"437-880-8872", email:"dufferin@svpsports.net",             website:"svpsports.ca",                priority:"★★",  notes:"" },
  { no:30, name:"AC Soccer",                 category:"축구 매장",  address:"5130 Dixie Rd, Mississauga",       phone:"905-238-5336", email:"frankl@acsoccer.com",                website:"acsoccer.com",                priority:"★★★", notes:"담당자: Frank LiTrenta" },
  { no:31, name:"Play It Again Sports",      category:"축구 매장",  address:"Whitby",                           phone:"",             email:"whitbypias@hotmail.com",             website:"playitagainsports.com",       priority:"★",   notes:"GTA 외곽" },

  // ── 스포츠 바 (Sports Bar) ─────────────────────────────────────────────────
  { no:32, name:"Real Sports Bar",           category:"스포츠 바",  address:"15 York St, Toronto",              phone:"416-815-5464", email:"info@realsports.ca",                 website:"realsports.ca",               priority:"★★★", notes:"Scotia Bank Arena 옆, 대규모" },
  { no:33, name:"Scotland Yard Pub",         category:"스포츠 바",  address:"56 The Esplanade, Toronto",        phone:"",             email:"info@scotlandyard.ca",               website:"scotlandyard.ca",             priority:"★★",  notes:"" },
  { no:34, name:"The Queen and Beaver",      category:"스포츠 바",  address:"35 Elm St, Toronto",               phone:"647-347-2712", email:"jamieson@queenandbeaverpub.ca",      website:"queenandbeaverpub.ca",        priority:"★★",  notes:"담당자: Jamieson" },
  { no:35, name:"Saint John's Tavern",       category:"스포츠 바",  address:"117 John St, Toronto",             phone:"",             email:"events@saintjohnstavern.com",        website:"saintjohnstavern.com",        priority:"★★",  notes:"이벤트 이메일" },
  { no:36, name:"Dublin Calling",            category:"스포츠 바",  address:"250 Adelaide St W, Toronto",       phone:"647-344-1234", email:"toronto@dublincalling.com",          website:"dublincalling.com",           priority:"★★",  notes:"여러 지점" },
  { no:37, name:"Cafe Diplomatico",          category:"스포츠 바",  address:"594 College St, Toronto",          phone:"416-534-4637", email:"info@cafediplomatico.ca",            website:"cafediplomatico.ca",          priority:"★★★", notes:"Little Italy, 월드컵 핫스팟" },
  { no:38, name:"Hemingway's",               category:"스포츠 바",  address:"142 Cumberland St, Toronto",       phone:"416-968-2828", email:"info@hemingways.to",                 website:"hemingways.to",               priority:"★★",  notes:"Yorkville" },
  { no:39, name:"One Eyed Jack",             category:"스포츠 바",  address:"287 Richmond St W, Toronto",       phone:"416-953-9300", email:"toronto@oneeyedjackpub.com",         website:"oneeyedjackpub.com",          priority:"★★",  notes:"" },
  { no:40, name:"Score on Queen",            category:"스포츠 바",  address:"298 Queen St W, Toronto",          phone:"",             email:"info@scoreonqueen.com",              website:"scoreonqueen.com",            priority:"★★★", notes:"이름부터 스포츠 전문" },
  { no:41, name:"Elephant & Castle",         category:"스포츠 바",  address:"212 King St W, Toronto",           phone:"416-598-4455", email:"gmtoronto@elephantcastle.com",       website:"elephantcastle.com",          priority:"★★",  notes:"British pub, 축구 방영" },
  { no:42, name:"Lucky Clover Sports Pub",   category:"스포츠 바",  address:"17 Lower Simcoe, Toronto",         phone:"647-348-5825", email:"info@luckycloverpub.ca",             website:"luckycloverpub.ca",           priority:"★★",  notes:"" },
  { no:43, name:"Amigos da Dundas",          category:"스포츠 바",  address:"1570 Dundas St W, Toronto",        phone:"647-350-7711", email:"(이메일 없음)",                       website:"amigosdadundas.ca",           priority:"★★★", notes:"이메일 미발송 — 전화/방문 필요" },

  // ── 축구 아카데미 (Soccer Academy) ────────────────────────────────────────
  { no:44, name:"Gladiator Soccer Academy",  category:"축구 아카데미", address:"272 Banbury Rd, North York",    phone:"647-981-7169", email:"segev.rabinoviz@gmail.com",          website:"gladiatorsocceracademy.com",  priority:"★★",  notes:"담당자: Segev" },
  { no:45, name:"GTA Lions Soccer Academy",  category:"축구 아카데미", address:"3085 Kingston Rd, Scarborough", phone:"416-876-0493", email:"matinocamp@yahoo.ca",                website:"gtalions.com",                priority:"★★",  notes:"" },
  { no:46, name:"Canada First Academy",      category:"축구 아카데미", address:"628 Milverton Blvd, Toronto",   phone:"",             email:"info@canadafirstacademy.com",         website:"canadafirstacademy.com",      priority:"★★",  notes:"" },
  { no:47, name:"Toronto Skillz FC",         category:"축구 아카데미", address:"4 Burridge Rd, Scarborough",    phone:"416-850-8518", email:"info@torontoskillz.com",             website:"torontoskillz.club",          priority:"★★",  notes:"" },
  { no:48, name:"Richmond Hill Soccer Club", category:"축구 아카데미", address:"Richmond Hill",                 phone:"905-883-4990", email:"info@richmondhillsoccer.com",        website:"richmondhillsoccer.com",      priority:"★★",  notes:"" },
  { no:49, name:"Toronto FC Academy",        category:"축구 아카데미", address:"Vaughan (Ontario Soccer Centre)",phone:"",             email:"TFCCamps@mlse.com",                  website:"torontofc.ca",                priority:"★",   notes:"MLSE 산하, 대형 조직" },
  { no:50, name:"Sporting FC Toronto",       category:"축구 아카데미", address:"515 Brock Ave, Toronto",        phone:"416-755-2852", email:"info@sportingfctoronto.com",         website:"sportingfctoronto.com",       priority:"★★",  notes:"Sporting CP 제휴" },
  { no:51, name:"Power Soccer Academy",      category:"축구 아카데미", address:"201 Wicksteed Ave, Toronto",    phone:"416-425-6062", email:"info@powersoccer.ca",                website:"powersoccer.ca",              priority:"★★",  notes:"" },
  { no:52, name:"TAC Academy",               category:"축구 아카데미", address:"3377 Bayview Ave, Toronto",     phone:"416-627-1092", email:"info@tacsports.ca",                  website:"tacacademy.ca",               priority:"★★",  notes:"" },
];

// Add sent date from sent.json
const rows = prospects.map(p => {
  const emailKey = Object.keys(sent).find(k => k.toLowerCase() === p.email.toLowerCase());
  const sentDate = emailKey ? sent[emailKey].replace("T", " ").slice(0, 16) + " (UTC)" : (p.email === "(이메일 없음)" ? "이메일 없음" : "미발송");
  return {
    ...p,
    sentDate,
    status: emailKey ? "✅ 발송완료" : (p.email === "(이메일 없음)" ? "📞 전화/방문" : "❌ 미발송"),
  };
});

// Build CSV with BOM for Excel Korean support
const headers = ["번호","매장명","카테고리","주소","전화번호","이메일","웹사이트","우선순위","발송상태","발송일시","비고/담당자"];
const csvRows = rows.map(r => [
  r.no, r.name, r.category, r.address, r.phone, r.email,
  r.website, r.priority, r.status, r.sentDate, r.notes
].map(v => `"${String(v).replace(/"/g, '""')}"`).join(","));

const csv = "﻿" + [headers.join(","), ...csvRows].join("\r\n");
const outPath = join(__dirname, "B2B_Outreach_List.csv");
writeFileSync(outPath, csv, "utf8");
console.log(`✅ 파일 생성: ${outPath}`);
console.log(`   총 ${rows.length}곳`);
console.log(`   발송완료: ${rows.filter(r => r.status.includes("발송완료")).length}곳`);
console.log(`   전화/방문 필요: ${rows.filter(r => r.status.includes("전화")).length}곳`);
