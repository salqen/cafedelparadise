// Vercel serverless funkcia — generuje .ics kalendárový feed pre Google Kalendár.
// Google si tento URL "odoberá" a zobrazuje udalosti aj termíny z plánu (jednosmerne, auto-aktualizácia ~1x denne).
//
// Env premenné (Vercel → Settings → Environment Variables):
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY  (povinné — číta zdieľané dáta)
//   CALENDAR_TOKEN  (voliteľné — ak nastavíš, feed vyžaduje ?token=... ; klient ho berie z VITE_CALENDAR_TOKEN)

import { createClient } from "@supabase/supabase-js";

const URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const SK_MONTHS_IDX = { januar:0, februar:1, marec:2, april:3, maj:4, jun:5, jul:6, august:7, september:8, oktober:9, november:10, december:11 };
function skMonthIdx(w){ if(!w) return null; const n=w.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,""); return (n in SK_MONTHS_IDX)?SK_MONTHS_IDX[n]:null; }
function parsePlanRange(str){
  if(!str) return null;
  const parts=String(str).split(/[–—-]/);
  const side=s=>{ if(!s) return {}; const dm=s.match(/(\d{1,2})\s*\./)||s.match(/\b(\d{1,2})\b/); const ym=s.match(/\b(\d{4})\b/); let month=null; for(const w of s.split(/[\s.]+/)){ const mi=skMonthIdx(w); if(mi!=null){ month=mi; break; } } return { day:dm?parseInt(dm[1],10):null, month, year:ym?parseInt(ym[1],10):null }; };
  const L=side(parts[0]); const R=parts.length>1?side(parts[1]):L;
  const year=L.year??R.year; const lMonth=L.month??R.month;
  if(L.day==null||lMonth==null||year==null) return null;
  const start=new Date(year,lMonth,L.day);
  const end=new Date(R.year??year, R.month??lMonth, R.day??L.day);
  return { start, end };
}
const pad=n=>String(n).padStart(2,"0");
const icsDate=d=>`${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}`;
const esc=s=>String(s||"").replace(/([\\,;])/g,"\\$1").replace(/\n/g,"\\n");

export default async function handler(req, res){
  if(!URL || !KEY){ res.status(500).send("Chýba SUPABASE_URL alebo SUPABASE_SERVICE_ROLE_KEY."); return; }
  if(process.env.CALENDAR_TOKEN && req.query.token !== process.env.CALENDAR_TOKEN){ res.status(403).send("Neplatný token."); return; }

  try{
    const db = createClient(URL, KEY, { auth:{ persistSession:false } });
    const { data } = await db.from("app_data").select("key,value").in("key",["cp_meetings","cp_planCols"]);
    const map = {}; (data||[]).forEach(r=>{ map[r.key]=r.value; });
    const events = Array.isArray(map.cp_meetings) ? map.cp_meetings : [];
    const cols = Array.isArray(map.cp_planCols) ? map.cp_planCols : [];

    const L = ["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//Cafe Paradise//Kalendar//SK","CALSCALE:GREGORIAN","METHOD:PUBLISH","X-WR-CALNAME:Cafe Paradise","X-WR-TIMEZONE:Europe/Bratislava"];

    events.forEach((ev,i)=>{
      const ymd = String(ev.date||"").replace(/-/g,"");
      if(ymd.length!==8) return;
      L.push("BEGIN:VEVENT","UID:cp-ev-"+(ev.id||i)+"@cafeparadise");
      if(ev.time && /^\d{2}:\d{2}$/.test(ev.time)){
        const [h,m]=ev.time.split(":").map(Number);
        const eh=pad((h+1)%24);
        L.push("DTSTART:"+ymd+"T"+pad(h)+pad(m)+"00","DTEND:"+ymd+"T"+eh+pad(m)+"00");
      } else {
        L.push("DTSTART;VALUE=DATE:"+ymd);
      }
      L.push("SUMMARY:"+esc(ev.title||"Udalosť"));
      const desc=[ev.place,ev.note].filter(Boolean).join(" — ");
      if(desc) L.push("DESCRIPTION:"+esc(desc));
      L.push("END:VEVENT");
    });

    cols.forEach((c,i)=>{
      const r=parsePlanRange(c.dates);
      if(!r) return;
      const sk=icsDate(r.start), ek=icsDate(r.end);
      L.push("BEGIN:VEVENT","UID:cp-plan-"+(c.id||i)+"-s@cafeparadise","DTSTART;VALUE=DATE:"+sk,"SUMMARY:"+esc("▶ Začiatok: "+(c.title||"Fáza")),"END:VEVENT");
      if(ek!==sk) L.push("BEGIN:VEVENT","UID:cp-plan-"+(c.id||i)+"-e@cafeparadise","DTSTART;VALUE=DATE:"+ek,"SUMMARY:"+esc("⏹ Koniec: "+(c.title||"Fáza")),"END:VEVENT");
    });

    L.push("END:VCALENDAR");
    res.setHeader("Content-Type","text/calendar; charset=utf-8");
    res.setHeader("Cache-Control","public, max-age=3600");
    res.status(200).send(L.join("\r\n"));
  }catch(e){
    res.status(500).send("Chyba feedu: "+(e.message||String(e)));
  }
}
