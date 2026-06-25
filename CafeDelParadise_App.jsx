import React, { useState, useRef, useEffect } from "react";
import { getCached, setCached } from "./src/lib/store.js";
import { useAuth } from "./src/auth.jsx";
import { supabase } from "./src/lib/supabase.js";
// Paleta zladená s MediaVolt webom — oranžové akcenty na teplej tmavej/svetlej ploche.
// POZN.: 'espresso' = tmavá (text + tmavé panely), 'crema'/'latte' = svetlá (pozadia + text na tmavom).
const BRAND = {
espresso: "#241C16", arabica: "#8C7B6F", caramel: "#FF6A00",
crema: "#FBF5EE", latte: "#F7F2EC", olive: "#159B6E",
terracotta: "#E0452F", adriatic: "#B8460E", sand: "#FFB36B",
};
// MediaVolt dizajn — tmavý "OS / holografický" štýl pre hlavičku a navigáciu
const MV = {
bg: "#05060d", panel: "#0B0E1A", panel2: "#070A14",
line: "rgba(255,150,80,.22)", neon: "#FF6A00", neon2: "#FFB36B",
violet: "#FF3D00", text: "#F3ECE6", dim: "#A89486",
};
// Trvalé ukladanie do prehliadača (localStorage). Dáta prežijú obnovenie aj zatvorenie stránky.
function usePersistentState(key, initial) {
const [val, setVal] = useState(() => getCached(key, initial));
const setPersist = React.useCallback((updater) => {
setVal(prev => {
const next = typeof updater === "function" ? updater(prev) : updater;
setCached(key, next);
return next;
});
}, [key]);
return [val, setPersist];
}
const PRIOS = [
{ key:"waiting", label:"⏳ Čaká",     bg:"#E0E7FF", color:"#3730A3" },
{ key:"low",     label:"🟢 Nízka",    bg:"#D1FAE5", color:"#065F46" },
{ key:"med",     label:"🟡 Stredná",  bg:"#FEF3C7", color:"#8B6F00" },
{ key:"high",    label:"🟠 Vysoká",   bg:"#FEE9D1", color:"#9A3412" },
{ key:"urgent",  label:"🔴 Urgentné", bg:"#FEE2E2", color:"#C0392B" },
{ key:"review",  label:"👁 Kontrola", bg:"#E0F2FE", color:"#0369A1" },
];
const CATS = [
{ key:"admin",   label:"Admin",     bg:"#EDE9FE", color:"#5B21B6" },
{ key:"ops",     label:"Prevádzka", bg:"#FFF7ED", color:"#9A3412" },
{ key:"wellness",label:"Wellness",  bg:"#F0FDF4", color:"#065F46" },
{ key:"brand",   label:"Branding",  bg:"#FDF2F8", color:"#9D174D" },
{ key:"mkt",     label:"Marketing", bg:"#FEF9C3", color:"#713F12" },
{ key:"fin",     label:"Financie",  bg:"#ECFDF5", color:"#065F46" },
{ key:"tech",    label:"Tech",      bg:"#DBEAFE", color:"#1E40AF" },
];
const getPrio  = k => PRIOS.find(p=>p.key===k)||PRIOS[0];
const getCat   = k => CATS.find(c=>c.key===k)||CATS[0];
const nextPrio = k => { const i=PRIOS.findIndex(p=>p.key===k); return PRIOS[(i+1)%PRIOS.length].key; };
const nextCat  = k => { const i=CATS.findIndex(c=>c.key===k);  return CATS[(i+1)%CATS.length].key; };
const COLS0 = [
{ id:"c0", title:"Prevzatie prevádzky", color:"#5B21B6", dates:"24.–31. máj 2026", cards:[
{ id:"p00", title:"Dohoda nájomnej zmluvy", cat:"admin", prio:"waiting", note:"Finálne odsúhlasenie a podpis. Skontrolovať výšku nájmu, zálohu, výpovednú lehotu a povolenie úprav." },
{ id:"p0",  title:"Podpis zmluvy a odovzdávací protokol", cat:"admin", prio:"waiting", note:"Zdokumentovať stav priestorov. Prevziať kľúče a prístupové kódy." },
{ id:"p1",  title:"Inventúra — kontrola stavu zariadenia", cat:"ops", prio:"waiting", note:"Funkčnosť kávovaru, chladničiek, baru. Zdokumentovať nedostatky." },
{ id:"p2",  title:"Overenie SRO povolení a živnostenského listu", cat:"admin", prio:"waiting", note:"Platnosť všetkých povolení na pohostinstvo." },
{ id:"p3",  title:"Ohlásenie prevádzkovej doby — mestský úrad Prievidza", cat:"admin", prio:"waiting", note:"Formulár na prievidza.sk alebo osobne na úrade." },
{ id:"p4",  title:"Kontakt dodávateľov — káva, suroviny, zákusky", cat:"ops", prio:"waiting", note:"Dohodnúť dodávateľa. Prvá objednávka min. 3 dni pred otvorením." },
{ id:"p5",  title:"Nastavenie eKasy a platobného terminálu", cat:"tech", prio:"waiting", note:"Aktivovať eKasu, nastaviť PLU položky, otestovať terminál." },
{ id:"p6",  title:"Nastavenie cien a interného cenníka", cat:"fin", prio:"waiting", note:"Ceny podľa nákladov a miestneho trhu. Porovnať s konkurenciou." },
]},
{ id:"c1", title:"Terasa", color:"#C4965A", dates:"24. máj – 7. jún 2026", cards:[
{ id:"t0", title:"Ohlásenie terasy — mestský úrad Prievidza", cat:"admin", prio:"waiting", note:"Žiadosť o zvláštne užívanie verejného priestranstva. Daň za m²/deň. Podať čo najskôr!" },
{ id:"t1", title:"Nákup sedenia — stoličky, kreslá, pohovky", cat:"ops", prio:"waiting", note:"Exteriérové, odolné voči počasiu. Ratan alebo kov s textilom." },
{ id:"t2", title:"Stoly pre terasu — exteriérové, odolné", cat:"ops", prio:"waiting", note:"Zvážiť skladateľné pre prípad dažďa a nočného uloženia." },
{ id:"t3", title:"Tienenie — slnečníky / markíza / pergola", cat:"ops", prio:"waiting", note:"Slnečníky = najrýchlejšie riešenie. Pergola vyžaduje stavebné povolenie." },
{ id:"t4", title:"Dekorácie — kvetináče, svietidlá, textil", cat:"ops", prio:"waiting", note:"Mediteránsky štýl — hlinené kvetináče, Edison bulbs, farebné vankúše." },
{ id:"t5", title:"Osvetlenie terasy pre večerné posedenie", cat:"ops", prio:"waiting", note:"Fairy lights, lampy pri stoloch. 2700K. Nutný externý el. vývod." },
{ id:"t6", title:"Finálna kontrola a fotenie terasy", cat:"ops", prio:"waiting", note:"Záverečná kontrola + fotenie pre Instagram a Google Maps." },
]},
{ id:"c2", title:"Wellness / Apartmán", color:"#2E6B4F", dates:"24. máj – 10. jún 2026", cards:[
{ id:"w0", title:"Prevoz parnej sprchy z Trenčianskych Teplíc", cat:"wellness", prio:"waiting", note:"Bazos.sk · 250 € · dohodnúť dátum a dodávku. Overiť rozmery vstupu." },
{ id:"w1", title:"Inštalácia parnej sprchy (voda, elektrina, odpad)", cat:"wellness", prio:"waiting", note:"Inštalatér + elektrikár. 230V/400V, odpad DN50, prívod teplej aj studenej vody." },
{ id:"w2", title:"Dovoz a inštalácia výrivkovej vane", cat:"wellness", prio:"waiting", note:"Overiť rozmery miestnosti a šírku dverí. 200–400 kg — statická kontrola podlahy." },
{ id:"w3", title:"Plumbing výrivky — prívod, odpad, el.", cat:"wellness", prio:"waiting", note:"Prívod 3/4\", odpad DN50-75, el. 230V s GFCI." },
{ id:"w4", title:"Zariadenie wellness izby — nábytok", cat:"wellness", prio:"waiting", note:"Väčšina k dispozícii. Doplniť leňošku, stolík, vešiak na uteráky." },
{ id:"w5", title:"Osvetlenie + atmosféra (difuzéry, audio)", cat:"wellness", prio:"waiting", note:"Tlmené svetlo + RGB podsvietenie. Levanduľa difuzér. BT reproduktor." },
{ id:"w6", title:"Textil — uteráky, župany, prestieranie", cat:"wellness", prio:"waiting", note:"Min. 10 párov uterákov, 4–6 županov. Froté bavlna." },
{ id:"w7", title:"Cenník a rezervačný systém wellness", cat:"fin", prio:"waiting", note:"Hodinový prenájom, balíčky. Rezervácie cez WhatsApp alebo Bookio." },
{ id:"w8", title:"Finálna kontrola + fotenie wellness", cat:"ops", prio:"waiting", note:"Fotenie pre Instagram a Google. Wellness = kľúčový diferenciátor." },
]},
{ id:"c3", title:"Branding & Online", color:"#8B6F47", dates:"26. máj – 1. jún 2026", cards:[
{ id:"b0", title:"Finalizácia loga — SVG, PNG, PDF, favicon", cat:"brand", prio:"waiting", note:"3 verzie: svetlá (tlač), tmavá (šálky), favicon 64×64px." },
{ id:"b1", title:"Instagram profil — bio, profilovka, highlights", cat:"mkt", prio:"waiting", note:"Bio s emojis, adresou a hodinami. Highlights: Menu, Wellness, Terasa." },
{ id:"b2", title:"Google My Business — nastavenie a fotky", cat:"mkt", prio:"waiting", note:"Kľúčové pre 'kaviareň Prievidza'. Min. 10 fotiek. Hodiny presne." },
{ id:"b3", title:"Facebook stránka — cover, info, poloha", cat:"mkt", prio:"waiting", note:"Cover 820×312px. Kategória Kaviareň. Poloha, hodiny, tel." },
{ id:"b4", title:"Teaser príspevky — zákulisie, atmosféra", cat:"mkt", prio:"waiting", note:"Min. 3–5 príspevkov pred otvorením. Reels zo zákulisia, Stories." },
{ id:"b5", title:"Menu karty — tlač (káva + zákusky)", cat:"brand", prio:"waiting", note:"A5 alebo skladané A4. Espresso & Caramel paleta. Min. 50 ks." },
{ id:"b6", title:"Cenník wellness — tlač / digitál", cat:"brand", prio:"waiting", note:"Leták alebo digitál pre Stories / WhatsApp." },
{ id:"b7", title:"Stories / Reels — zákulisie príprav", cat:"mkt", prio:"waiting", note:"15–30 sek. videá z montáže terasy a wellness. S hudbou." },
]},
{ id:"c4", title:"Otvorenie 1.–15. 6.", color:"#C0392B", dates:"1. – 15. júna 2026", cards:[
{ id:"o0", title:"Grand Opening — živá hudba a špeciálna ponuka", cat:"ops", prio:"waiting", note:"Potvrdiť umelca/kapelu. Prvé kafe zdarma, zľava na zákusky." },
{ id:"o1", title:"PR lokálne médiá — Prievidza24, MojePrevidza", cat:"mkt", prio:"waiting", note:"Tlačová správa s fotkami min. 5 dní pred otvorením." },
{ id:"o2", title:"Wellness izba — spustenie rezervácií", cat:"wellness", prio:"waiting", note:"WhatsApp alebo Bookio. Prvý týždeň uvítacia zľava." },
{ id:"o3", title:"Instagram / FB — príspevok otvorenia + Live", cat:"mkt", prio:"waiting", note:"Príspevok + Stories s odpočtom. Live video z eventu." },
{ id:"o4", title:"Google recenzie — zbieranie po otvorení", cat:"mkt", prio:"waiting", note:"QR kód s odkazom na recenziu na každom stole." },
{ id:"o5", title:"Terasa — fotenie pre sociálne siete", cat:"mkt", prio:"waiting", note:"Zlatá hodina. Obsah na 2–3 týždne dopredu." },
{ id:"o6", title:"Vyhodnotenie prvého týždňa — tržby, feedback", cat:"fin", prio:"waiting", note:"Porovnať s plánom. Upraviť menu/ceny ak treba. Do 8. júna." },
{ id:"o7", title:"Vernostné kartičky — spustenie programu", cat:"mkt", prio:"waiting", note:"9 káv = 1 zadarmo. Min. 200 ks." },
]},
];
const uid2=()=>"a"+Date.now()+Math.random().toString(36).slice(2,5);
const USERS=["Martin","Jana","Peter","Zuzka","Admin"];
const SLINKS=[{id:"plan",l:"📋 Plán"},{id:"brand",l:"🎨 Branding"},{id:"menu",l:"☕ Menu"},{id:"finance",l:"📊 Financie"}];
const fmtSz=b=>b>1048576?(b/1048576).toFixed(1)+"MB":b>1024?(b/1024).toFixed(0)+"KB":b+"B";
function Attachments({attachments=[],onChange,onNavigate}){
const[add,setAdd]=useState(null);const[url,setUrl]=useState("");const[lbl,setLbl]=useState("");
const pRef=useRef();const dRef=useRef();const[lb,setLb]=useState(null);
const del=id=>onChange(attachments.filter(a=>a.id!==id));
const push=att=>{onChange([...attachments,att]);setAdd(null);setUrl("");setLbl("");};
const rdFile=(f,t)=>{const r=new FileReader();r.onload=ev=>push({id:uid2(),type:t,name:f.name,size:f.size,dataUrl:ev.target.result});r.readAsDataURL(f);};
const photos=attachments.filter(a=>a.type==="photo");
const docs=attachments.filter(a=>a.type==="doc");
const vids=attachments.filter(a=>a.type==="video");
const secs=attachments.filter(a=>a.type==="section");
const rowStyle={display:"flex",alignItems:"center",gap:6,background:"#F5EDD8",borderRadius:6,padding:"4px 8px",marginBottom:3,border:"1px solid #E8D0A0"};
const xBtn=id=><button onClick={()=>del(id)} style={{fontSize:10,color:"#C8BFB0",background:"none",border:"none",cursor:"pointer"}}>✕</button>;
return(
<div style={{marginTop:6}}>
{lb&&<div onClick={()=>setLb(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.88)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",cursor:"zoom-out"}}>
<img src={lb} alt="" style={{maxWidth:"92vw",maxHeight:"88vh",borderRadius:10}}/>
<button onClick={()=>setLb(null)} style={{position:"absolute",top:14,right:18,background:"none",border:"none",color:"#fff",fontSize:26,cursor:"pointer"}}>✕</button>
</div>}
{photos.length>0&&<div style={{marginBottom:6}}>
<div style={{fontSize:10,color:"#A08060",marginBottom:4}}>📷 FOTKY</div>
<div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
{photos.map(a=><div key={a.id} style={{position:"relative"}}>
<img src={a.dataUrl} alt={a.name} onClick={()=>setLb(a.dataUrl)} style={{width:56,height:56,objectFit:"cover",borderRadius:7,border:"1px solid #E8E0D0",cursor:"zoom-in"}}/>
<button onClick={()=>del(a.id)} style={{position:"absolute",top:-5,right:-5,width:17,height:17,borderRadius:"50%",background:"#C0392B",border:"none",color:"#fff",fontSize:9,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
</div>)}
</div>
</div>}
{docs.length>0&&<div style={{marginBottom:5}}><div style={{fontSize:10,color:"#A08060",marginBottom:3}}>📄 DOKUMENTY</div>
{docs.map(a=><div key={a.id} style={rowStyle}><span>📄</span><span style={{fontSize:11,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{a.name}</span><span style={{fontSize:10,color:"#A08060"}}>{fmtSz(a.size)}</span>{xBtn(a.id)}</div>)}
</div>}
{vids.length>0&&<div style={{marginBottom:5}}><div style={{fontSize:10,color:"#A08060",marginBottom:3}}>🎬 VIDEÁ</div>
{vids.map(a=><div key={a.id} style={rowStyle}><span>🎬</span><span onClick={()=>window.open(a.url,"_blank")} style={{fontSize:11,flex:1,color:"#1A5276",cursor:"pointer",textDecoration:"underline",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{a.lbl||a.url}</span>{xBtn(a.id)}</div>)}
</div>}
{secs.length>0&&<div style={{marginBottom:5}}>
{secs.map(a=><div key={a.id} style={rowStyle}><span onClick={()=>onNavigate&&onNavigate(a.sid)} style={{fontSize:11,flex:1,color:"#1A5276",cursor:"pointer",textDecoration:"underline"}}>{a.lbl}</span>{xBtn(a.id)}</div>)}
</div>}
{!add&&<div style={{display:"flex",gap:4,flexWrap:"wrap",marginTop:4}}>
{[["photo","📷 Foto"],["doc","📄 Dok."],["video","🎬 Video"],["section","🔗 Sekcia"]].map(([t,l])=>(
<button key={t} onClick={()=>setAdd(t)} style={{fontSize:10,padding:"3px 8px",borderRadius:5,border:"1px solid #E8E0D0",background:"#FAFAFA",color:"#8B6F47",cursor:"pointer"}}>{l}</button>
))}
</div>}
{add==="photo"&&<><input ref={pRef} type="file" accept="image/*" multiple onChange={e=>{Array.from(e.target.files).forEach(f=>rdFile(f,"photo"));e.target.value="";setAdd(null);}} style={{display:"none"}}/>
<div style={{display:"flex",gap:5,marginTop:4}}><button onClick={()=>pRef.current.click()} style={{fontSize:11,padding:"5px 10px",borderRadius:6,border:"none",background:"#C4965A",color:"#2C1A0E",cursor:"pointer",fontWeight:600}}>📷 Vybrať</button><button onClick={()=>setAdd(null)} style={{fontSize:11,padding:"5px 8px",borderRadius:6,border:"1px solid #E8E0D0",background:"none",color:"#A08060",cursor:"pointer"}}>Zrušiť</button></div></>}
{add==="doc"&&<><input ref={dRef} type="file" multiple onChange={e=>{Array.from(e.target.files).forEach(f=>rdFile(f,"doc"));e.target.value="";setAdd(null);}} style={{display:"none"}}/>
<div style={{display:"flex",gap:5,marginTop:4}}><button onClick={()=>dRef.current.click()} style={{fontSize:11,padding:"5px 10px",borderRadius:6,border:"none",background:"#C4965A",color:"#2C1A0E",cursor:"pointer",fontWeight:600}}>📄 Vybrať</button><button onClick={()=>setAdd(null)} style={{fontSize:11,padding:"5px 8px",borderRadius:6,border:"1px solid #E8E0D0",background:"none",color:"#A08060",cursor:"pointer"}}>Zrušiť</button></div></>}
{add==="video"&&<div style={{marginTop:4,display:"flex",flexDirection:"column",gap:5}}>
<input value={url} onChange={e=>setUrl(e.target.value)} placeholder="YouTube / Vimeo URL…" style={{fontSize:12,padding:"6px 9px",borderRadius:6,border:"1px solid #E8D0A0",background:"#fff",outline:"none",fontFamily:"inherit"}}/>
<input value={lbl} onChange={e=>setLbl(e.target.value)} placeholder="Popis (voliteľné)" style={{fontSize:12,padding:"6px 9px",borderRadius:6,border:"1px solid #E8D0A0",background:"#fff",outline:"none",fontFamily:"inherit"}}/>
<div style={{display:"flex",gap:5}}><button onClick={()=>url&&push({id:uid2(),type:"video",url,lbl:lbl||url})} style={{fontSize:11,padding:"5px 12px",borderRadius:6,border:"none",background:"#C4965A",color:"#2C1A0E",fontWeight:600,cursor:"pointer"}}>Pridať</button><button onClick={()=>setAdd(null)} style={{fontSize:11,padding:"5px 8px",borderRadius:6,border:"1px solid #E8E0D0",background:"none",color:"#A08060",cursor:"pointer"}}>Zrušiť</button></div>
</div>}
{add==="section"&&<div style={{marginTop:4,display:"flex",flexDirection:"column",gap:4}}>
{SLINKS.map(s=><button key={s.id} onClick={()=>push({id:uid2(),type:"section",lbl:s.l,sid:s.id})} style={{fontSize:12,padding:"6px 12px",borderRadius:6,border:"1px solid #E8D0A0",background:"#fff",color:"#2C1A0E",cursor:"pointer",textAlign:"left"}}>{s.l}</button>)}
<button onClick={()=>setAdd(null)} style={{fontSize:11,padding:"4px 8px",borderRadius:6,border:"1px solid #E8E0D0",background:"none",color:"#A08060",cursor:"pointer",alignSelf:"flex-start"}}>Zrušiť</button>
</div>}
</div>
);
}
function Comments({comments=[],onChange}){
const[open,setOpen]=useState(false);const[user,setUser]=useState(USERS[0]);const[text,setText]=useState("");const[custom,setCustom]=useState(false);
const AC=["#C4965A","#2E6B4F","#1A5276","#C0392B","#5B21B6","#8B6F47"];
const av=n=>AC[Math.abs([...n].reduce((a,c)=>a+c.charCodeAt(0),0))%AC.length];
const add=()=>{if(!text.trim())return;const now=new Date();onChange([...comments,{id:uid2(),user,text:text.trim(),time:now.toLocaleDateString("sk")+", "+now.toLocaleTimeString("sk",{hour:"2-digit",minute:"2-digit"})}]);setText("");};
const del=id=>onChange(comments.filter(c=>c.id!==id));
const Av=({name})=><div style={{width:26,height:26,borderRadius:"50%",background:av(name),color:"#fff",fontSize:10,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{name.slice(0,2).toUpperCase()}</div>;
return(
<div style={{marginTop:8}}>
<button onClick={()=>setOpen(v=>!v)} style={{fontSize:11,color:"#A08060",background:"none",border:"none",cursor:"pointer",padding:"3px 2px",display:"flex",alignItems:"center",gap:4}}>
💬 {comments.length>0?`Komentáre (${comments.length})`:"Pridať komentár"} {open?"▾":"▸"}
</button>
{open&&<div style={{marginTop:6,display:"flex",flexDirection:"column",gap:6}}>
{comments.map(c=><div key={c.id} style={{display:"flex",gap:7,alignItems:"flex-start"}}>
<Av name={c.user}/>
<div style={{flex:1,background:"#F5EDD8",borderRadius:"0 8px 8px 8px",padding:"6px 9px",border:"1px solid #E8D0A0"}}>
<div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}><span style={{fontSize:11,fontWeight:700,color:"#2C1A0E"}}>{c.user}</span><span style={{fontSize:10,color:"#A08060"}}>{c.time}</span></div>
<div style={{fontSize:12,color:"#2C1A0E",lineHeight:1.5}}>{c.text}</div>
</div>
<button onClick={()=>del(c.id)} style={{fontSize:10,color:"#D0C8C0",background:"none",border:"none",cursor:"pointer"}}>✕</button>
</div>)}
<div style={{display:"flex",gap:7,alignItems:"flex-start"}}>
<Av name={user}/>
<div style={{flex:1,display:"flex",flexDirection:"column",gap:5}}>
<div style={{display:"flex",gap:5}}>
{!custom?<select value={user} onChange={e=>{if(e.target.value==="__c")setCustom(true);else setUser(e.target.value);}} style={{fontSize:11,padding:"3px 6px",borderRadius:5,border:"1px solid #E8D0A0",background:"#fff",flex:1,fontFamily:"inherit"}}>
{USERS.map(u=><option key={u}>{u}</option>)}<option value="__c">+ Vlastné…</option>
</select>:<input value={user} onChange={e=>setUser(e.target.value)} placeholder="Vaše meno" style={{fontSize:11,padding:"3px 6px",borderRadius:5,border:"1px solid #E8D0A0",background:"#fff",flex:1,fontFamily:"inherit",outline:"none"}}/>}
<button onClick={()=>{setCustom(v=>!v);if(custom)setUser(USERS[0]);}} style={{fontSize:10,padding:"3px 7px",borderRadius:5,border:"1px solid #E8D0A0",background:"none",color:"#A08060",cursor:"pointer"}}>{custom?"↩":"✎"}</button>
</div>
<textarea value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&e.ctrlKey){e.preventDefault();add();}}} placeholder="Komentár… (Ctrl+Enter)" rows={2} style={{fontSize:12,padding:"6px 9px",borderRadius:6,border:"1px solid #E8D0A0",background:"#fff",outline:"none",resize:"none",fontFamily:"inherit",lineHeight:1.5}}/>
<button onClick={add} disabled={!text.trim()} style={{fontSize:11,padding:"5px 12px",borderRadius:6,border:"none",background:text.trim()?"#C4965A":"#E8E0D0",color:text.trim()?"#2C1A0E":"#A08060",cursor:text.trim()?"pointer":"default",fontWeight:600,alignSelf:"flex-end"}}>💬 Odoslať</button>
</div>
</div>
</div>}
</div>
);
}
function SubTasks({ subtasks, onChange }) {
const [adding, setAdding] = useState(false);
const [newText, setNewText] = useState("");
const active = subtasks.filter(s=>!s.done);
const done   = subtasks.filter(s=>s.done);
const toggle = (id) => {
onChange(subtasks.map(s=>s.id===id?{...s,done:!s.done}:s));
};
const addSub = () => {
const t=newText.trim(); if(!t)return;
onChange([...subtasks,{id:"s"+Date.now(),text:t,done:false}]);
setNewText(""); setAdding(false);
};
const delSub = (id) => onChange(subtasks.filter(s=>s.id!==id));
const editSub = (id,text) => onChange(subtasks.map(s=>s.id===id?{...s,text}:s));
return (
<div style={{marginTop:8,marginBottom:2}}>
{active.map(s=>(
<div key={s.id} style={{display:"flex",alignItems:"flex-start",gap:7,padding:"4px 2px",borderRadius:5,marginBottom:2}}>
<button onClick={()=>toggle(s.id)}
style={{width:16,height:16,borderRadius:3,border:"1.5px solid #C4965A",background:"#fff",cursor:"pointer",flexShrink:0,marginTop:2,display:"flex",alignItems:"center",justifyContent:"center",padding:0}}>
</button>
<div contentEditable suppressContentEditableWarning
onBlur={e=>{const v=e.target.innerText.trim();if(v)editSub(s.id,v);}}
style={{fontSize:12,color:"#2C1A0E",flex:1,outline:"none",lineHeight:1.5,padding:"1px 2px",borderRadius:3,border:"1px solid transparent"}}
onFocus={e=>e.target.style.borderColor="#E8D0A0"}
onBlurCapture={e=>e.target.style.borderColor="transparent"}>
{s.text}
</div>
<button onClick={()=>delSub(s.id)} style={{fontSize:10,color:"#C8BFB0",background:"none",border:"none",cursor:"pointer",padding:"0 2px",flexShrink:0,lineHeight:1}}>✕</button>
</div>
))}
{done.map(s=>(
<div key={s.id} style={{display:"flex",alignItems:"flex-start",gap:7,padding:"4px 2px",marginBottom:2,opacity:.55}}>
<button onClick={()=>toggle(s.id)}
style={{width:16,height:16,borderRadius:3,border:"1.5px solid #2E6B4F",background:"#2E6B4F",cursor:"pointer",flexShrink:0,marginTop:2,display:"flex",alignItems:"center",justifyContent:"center",padding:0,fontSize:10,color:"#fff",lineHeight:1}}>
✓
</button>
<span style={{fontSize:12,color:"#A08060",flex:1,textDecoration:"line-through",lineHeight:1.5}}>{s.text}</span>
<button onClick={()=>delSub(s.id)} style={{fontSize:10,color:"#C8BFB0",background:"none",border:"none",cursor:"pointer",padding:"0 2px",flexShrink:0,lineHeight:1}}>✕</button>
</div>
))}
{adding ? (
<div style={{display:"flex",alignItems:"center",gap:5,marginTop:4}}>
<div style={{width:16,height:16,borderRadius:3,border:"1.5px solid #E8D0A0",background:"#fff",flexShrink:0}}/>
<input autoFocus value={newText} onChange={e=>setNewText(e.target.value)}
onKeyDown={e=>{if(e.key==="Enter")addSub();if(e.key==="Escape"){setAdding(false);setNewText("");}}}
placeholder="Text podúlohy… (Enter)"
style={{flex:1,fontSize:12,padding:"3px 6px",borderRadius:5,border:"1px solid #E8D0A0",background:"#fff",color:"#2C1A0E",fontFamily:"inherit",outline:"none"}}
/>
<button onClick={addSub} style={{fontSize:11,padding:"2px 8px",borderRadius:5,border:"none",background:BRAND.caramel,color:BRAND.espresso,fontWeight:700,cursor:"pointer"}}>+</button>
<button onClick={()=>{setAdding(false);setNewText("");}} style={{fontSize:11,padding:"2px 6px",borderRadius:5,border:"1px solid #E8D0A0",background:"none",color:"#A08060",cursor:"pointer"}}>✕</button>
</div>
) : (
<button onClick={()=>setAdding(true)}
style={{fontSize:11,color:"#A08060",background:"none",border:"none",cursor:"pointer",padding:"3px 2px",display:"flex",alignItems:"center",gap:4,marginTop:2}}>
<span style={{fontSize:13,lineHeight:1}}>＋</span> Pridať podúlohu
</button>
)}
</div>
);
}
function AiRollbar({ prompt, setPrompt, aiText, aiLoading, onRun }) {
const [open, setOpen] = useState(true);
return (
<div style={{marginTop:8,border:"1px solid #E8D0A0",borderRadius:8,overflow:"hidden"}}>
<button onClick={()=>setOpen(v=>!v)}
style={{width:"100%",display:"flex",alignItems:"center",gap:8,padding:"8px 11px",background:"#FFF8EE",border:"none",cursor:"pointer",textAlign:"left"}}>
<span style={{fontSize:13}}>{open?"▾":"▸"}</span>
<span style={{fontSize:10,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",color:BRAND.caramel,flex:1}}>✨ AI asistent</span>
{aiLoading&&<span style={{fontSize:10,color:BRAND.arabica}}>píše…</span>}
{!aiLoading&&aiText&&<span style={{fontSize:10,color:"#A08060"}}>{aiText.length} znakov</span>}
</button>
<div style={{
maxHeight: open ? "600px" : "0px",
overflow:"hidden",
transition:"max-height .3s cubic-bezier(.4,0,.2,1)",
background:"#FFFBF4",
}}>
<div style={{padding:"8px 11px 11px"}}>
<div style={{display:"flex",gap:6,marginBottom:8}}>
<input
value={prompt}
onChange={e=>setPrompt(e.target.value)}
onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();onRun();}}}
placeholder="Napíš otázku… (Enter = odoslať)"
style={{flex:1,fontSize:12,padding:"6px 9px",borderRadius:6,border:"1px solid #E8D0A0",background:"#fff",color:"#2C1A0E",fontFamily:"inherit",outline:"none"}}
/>
<button onClick={onRun} disabled={aiLoading}
style={{fontSize:13,padding:"5px 11px",borderRadius:6,border:"none",background:aiLoading?"#E8E0D0":BRAND.caramel,color:aiLoading?"#A08060":BRAND.espresso,fontWeight:700,cursor:aiLoading?"default":"pointer",flexShrink:0}}>
{aiLoading?"⏳":"→"}
</button>
</div>
{aiText!==null&&(
<div
contentEditable={!aiLoading}
suppressContentEditableWarning
style={{fontSize:12,color:"#2C1A0E",lineHeight:1.7,whiteSpace:"pre-wrap",borderRadius:6,padding:"7px 9px",border:"1px solid #E8D0A0",background:"#fff",outline:"none",minHeight:44,transition:"border-color .15s"}}
onFocus={e=>e.target.style.borderColor=BRAND.caramel}
onBlurCapture={e=>e.target.style.borderColor="#E8D0A0"}>
{aiText}{aiLoading&&<span style={{opacity:.7}}>▌</span>}
</div>
)}
</div>
</div>
</div>
);
}
function Card({ card, colTitle, onUpdate, onDelete, onMoveUp, onMoveDown }) {
const [aiText, setAiText] = useState(null);
const [aiLoading, setAiLoading] = useState(false);
const [confirmDone, setConfirmDone] = useState(false);
const [prompt, setPrompt] = useState("");
const [showPrompt, setShowPrompt] = useState(false);
const p = getPrio(card.prio);
const c = getCat(card.cat);
const bl = card.prio === "done" ? BRAND.olive : p.color;
const handlePrio = () => { if (card.prio==="done") return; onUpdate({...card, prio:nextPrio(card.prio)}); };
const handleDoneClick = () => {
if (card.prio==="done") { onUpdate({...card, prio:"waiting"}); return; }
if (!confirmDone) { setConfirmDone(true); return; }
setConfirmDone(false);
onUpdate({...card, prio:"done"});
};
const runAI = async (customPrompt) => {
setAiLoading(true); setAiText("🔍 Pracujem…");
const baseContext = `Si asistent pre kaviareň Cafe Paradise v Prievidzi. Odpovedaj v slovenčine, max 200 slov, bez markdown formátovania.\nKaviareň + bar + wellness (parná sprcha 250€, výrivka). Mediteránsky štýl. Otvorenie 1.–15. júna 2026.\nStĺpec: ${colTitle}\nÚloha: ${card.title}\nPoznámka: ${card.note||"—"}`;
const finalPrompt = customPrompt?.trim()
? `${baseContext}\n\nOtázka: ${customPrompt}`
: `${baseContext}\n\nKonkrétne rady a upozornenia k tejto úlohe.`;
try {
const res = await fetch("/api/anthropic", {
method:"POST", headers:{"Content-Type":"application/json"},
body: JSON.stringify({
model:"claude-sonnet-4-20250514",
max_tokens:600,
tools:[{type:"web_search_20250305",name:"web_search"}],
messages:[{role:"user",content:finalPrompt}]
})
});
const data = await res.json();
if(data.error){ setAiText("Chyba: "+data.error.message); }
else {
const txt = data.content?.filter(b=>b.type==="text").map(b=>b.text).join("\n") || "Žiadna odpoveď.";
setAiText(txt);
}
} catch(e){ setAiText("Chyba: "+e.message); }
setAiLoading(false);
};
const handleAIBtn = () => {
if (aiText!==null && !showPrompt) { setAiText(null); setShowPrompt(false); return; }
setShowPrompt(v=>!v);
if (!showPrompt && aiText===null) runAI("");
};
return (
<div style={{background:card.prio==="done"?"#F5F5F2":"#FAF7F0",border:"1px solid #E8E0D0",borderLeft:`4px solid ${bl}`,borderRadius:10,padding:"10px 11px",opacity:card.prio==="done"?0.45:1}}>
<div style={{display:"flex",alignItems:"flex-start",gap:6,marginBottom:5}}>
<button onClick={()=>onUpdate({...card,cat:nextCat(card.cat)})}
style={{fontSize:9,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",padding:"2px 6px",borderRadius:4,border:"none",cursor:"pointer",background:c.bg,color:c.color,flexShrink:0}}>
{c.label}
</button>
<div style={{display:"flex",gap:4,marginLeft:"auto"}}>
<button onClick={handleAIBtn} style={{fontSize:11,padding:"2px 7px",borderRadius:5,border:"1px solid #E8D0A0",background:"none",color:"#8B6F47",cursor:"pointer"}}>
{aiLoading?"⏳":showPrompt||aiText!==null?"✕ AI":"✨ AI"}
</button>
<button onClick={onMoveUp} style={{fontSize:12,padding:"2px 5px",borderRadius:4,border:"none",background:"none",color:"#A08060",cursor:"pointer"}}>▲</button>
<button onClick={onMoveDown} style={{fontSize:12,padding:"2px 5px",borderRadius:4,border:"none",background:"none",color:"#A08060",cursor:"pointer"}}>▼</button>
<button onClick={onDelete} style={{fontSize:12,padding:"2px 5px",borderRadius:4,border:"none",background:"none",color:"#A08060",cursor:"pointer"}}>✕</button>
</div>
</div>
<div contentEditable suppressContentEditableWarning
onBlur={e=>{const v=e.target.innerText.trim();if(v)onUpdate({...card,title:v});}}
style={{fontSize:13,fontWeight:600,color:card.prio==="done"?"#A0978C":"#2C1A0E",textDecoration:card.prio==="done"?"line-through":"none",lineHeight:1.4,wordBreak:"break-word",borderRadius:4,padding:"2px 3px",marginBottom:5,outline:"none",border:"1.5px solid transparent"}}
onFocus={e=>e.target.style.borderColor="#C4965A"} onBlurCapture={e=>e.target.style.borderColor="transparent"}>
{card.title}
</div>
<div style={{display:"flex",alignItems:"flex-start",gap:5,marginBottom:4}}>
<span style={{fontSize:12,color:BRAND.caramel,flexShrink:0,marginTop:2}}>🗒</span>
<div contentEditable suppressContentEditableWarning
onBlur={e=>onUpdate({...card,note:e.target.innerText.trim()})}
style={{fontSize:12,color:"#3D2B1A",lineHeight:1.5,wordBreak:"break-word",flex:1,borderRadius:4,padding:"2px 3px",outline:"none",border:"1.5px solid transparent",minHeight:16}}
onFocus={e=>e.target.style.borderColor="#C4965A"} onBlurCapture={e=>e.target.style.borderColor="transparent"}>
{card.note||""}
</div>
</div>
<SubTasks subtasks={card.subtasks||[]} onChange={subs=>onUpdate({...card,subtasks:subs})}/>
<Attachments attachments={card.attachments||[]} onChange={atts=>onUpdate({...card,attachments:atts})} onNavigate={()=>{}}/>
<Comments comments={card.comments||[]} onChange={cmts=>onUpdate({...card,comments:cmts})}/>
<div style={{display:"flex",alignItems:"center",gap:5,marginTop:5,justifyContent:"flex-end"}}>
{confirmDone&&<>
<span style={{fontSize:11,color:BRAND.terracotta,fontWeight:600}}>Istý si?</span>
<button onClick={()=>setConfirmDone(false)} style={{fontSize:11,padding:"3px 8px",borderRadius:4,border:"1px solid #E8E0D0",background:"none",color:"#A08060",cursor:"pointer"}}>Zrušiť</button>
</>}
<button onClick={handleDoneClick}
style={{fontSize:11,padding:"3px 10px",borderRadius:4,fontWeight:700,border:"none",cursor:"pointer",
background:card.prio==="done"?"#E8E0D0":confirmDone?BRAND.terracotta:BRAND.olive,
color:card.prio==="done"?"#A0978C":"#fff"}}>
{card.prio==="done"?"↩ Vrátiť":confirmDone?"✓ Áno":"✓ Dokončené"}
</button>
{card.prio!=="done"&&
<button onClick={handlePrio} style={{fontSize:11,padding:"3px 9px",borderRadius:4,fontWeight:700,border:"none",cursor:"pointer",background:p.bg,color:p.color}}>
{p.label}
</button>}
</div>
{(showPrompt||aiText!==null)&&(
<AiRollbar
prompt={prompt} setPrompt={setPrompt}
aiText={aiText} aiLoading={aiLoading}
onRun={()=>runAI(prompt)}
/>
)}
</div>
);
}
function Col({ col, onUpdate }) {
const active=col.cards.filter(c=>c.prio!=="done");
const done=col.cards.filter(c=>c.prio==="done");
const pct=col.cards.length>0?Math.round(done.length/col.cards.length*100):0;
const upd=u=>{const nc=col.cards.map(c=>c.id===u.id?u:c);onUpdate({...col,cards:[...nc.filter(c=>c.prio!=="done"),...nc.filter(c=>c.prio==="done")]});};
const del=id=>onUpdate({...col,cards:col.cards.filter(c=>c.id!==id)});
const mv=id=>{const i=col.cards.findIndex(c=>c.id===id);if(i<=0)return;const a=[...col.cards];[a[i-1],a[i]]=[a[i],a[i-1]];onUpdate({...col,cards:a});};
const mvDown=id=>{const i=col.cards.findIndex(c=>c.id===id);if(i<0||i>=col.cards.length-1)return;const a=[...col.cards];[a[i],a[i+1]]=[a[i+1],a[i]];onUpdate({...col,cards:a});};
const add=()=>{const nc={id:"n"+Date.now(),title:"Nová úloha",cat:"ops",prio:"waiting",note:""};onUpdate({...col,cards:[nc,...col.cards]});};
return (
<div style={{flex:"0 0 100%",width:"100%",background:"#fff",minHeight:"60vh",paddingBottom:60}}>
<div style={{padding:"10px 14px 7px",borderBottom:"1px solid #E8E0D0",display:"flex",alignItems:"center",gap:8}}>
<span style={{width:10,height:10,borderRadius:"50%",background:col.color,flexShrink:0,display:"inline-block"}}/>
<span style={{fontSize:13,fontWeight:700,flex:1}}>{col.title}</span>
<span style={{fontSize:11,color:"#A08060",background:BRAND.latte,borderRadius:99,padding:"2px 8px",border:"1px solid #E8E0D0"}}>{done.length}/{col.cards.length}</span>
</div>
<div style={{fontSize:10,color:"#fff",padding:"4px 14px",background:col.color,fontWeight:600}}>📅 {col.dates}</div>
<div style={{padding:"5px 14px 0"}}><div style={{height:4,background:"#E8E0D0",borderRadius:99,overflow:"hidden"}}><div style={{height:"100%",width:pct+"%",background:col.color,borderRadius:99,transition:"width .3s"}}/></div></div>
<button onClick={add} style={{margin:"8px 14px 2px",padding:7,border:"none",borderRadius:7,background:BRAND.crema,color:BRAND.arabica,fontSize:12,cursor:"pointer",fontWeight:600,width:"calc(100% - 28px)"}}>+ Pridať úlohu</button>
<div style={{padding:"8px 10px 4px",display:"flex",flexDirection:"column",gap:8}}>
{active.map(card=><Card key={card.id} card={card} colTitle={col.title} onUpdate={upd} onDelete={()=>del(card.id)} onMoveUp={()=>mv(card.id)} onMoveDown={()=>mvDown(card.id)}/>)}
{done.length>0&&<>
<div style={{display:"flex",alignItems:"center",gap:6,padding:"4px 0"}}>
<div style={{flex:1,height:1,background:"#E8E0D0"}}/><span style={{fontSize:10,color:"#B0A898",letterSpacing:".08em",textTransform:"uppercase"}}>✓ Hotovo ({done.length})</span><div style={{flex:1,height:1,background:"#E8E0D0"}}/>
</div>
{done.map(card=><Card key={card.id} card={card} colTitle={col.title} onUpdate={upd} onDelete={()=>del(card.id)} onMoveUp={()=>mv(card.id)} onMoveDown={()=>mvDown(card.id)}/>)}
</>}
</div>
<button onClick={add} style={{margin:"4px 14px 12px",padding:7,border:"1.5px dashed #E8E0D0",borderRadius:8,background:"transparent",color:"#A08060",fontSize:12,cursor:"pointer",width:"calc(100% - 28px)"}}>+ Pridať úlohu</button>
</div>
);
}
function ColDesktop({ col, onUpdate }) {
const active=col.cards.filter(c=>c.prio!=="done");
const done=col.cards.filter(c=>c.prio==="done");
const pct=col.cards.length>0?Math.round(done.length/col.cards.length*100):0;
const upd=u=>{const nc=col.cards.map(c=>c.id===u.id?u:c);onUpdate({...col,cards:[...nc.filter(c=>c.prio!=="done"),...nc.filter(c=>c.prio==="done")]});};
const del=id=>onUpdate({...col,cards:col.cards.filter(c=>c.id!==id)});
const mv=id=>{const i=col.cards.findIndex(c=>c.id===id);if(i<=0)return;const a=[...col.cards];[a[i-1],a[i]]=[a[i],a[i-1]];onUpdate({...col,cards:a});};
const mvDown=id=>{const i=col.cards.findIndex(c=>c.id===id);if(i<0||i>=col.cards.length-1)return;const a=[...col.cards];[a[i],a[i+1]]=[a[i+1],a[i]];onUpdate({...col,cards:a});};
const add=()=>{const nc={id:"n"+Date.now(),title:"Nová úloha",cat:"ops",prio:"waiting",note:""};onUpdate({...col,cards:[nc,...col.cards]});};
return (
<div style={{flex:"0 0 300px",width:300,background:"#fff",borderRight:"1px solid #E8E0D0",minHeight:"70vh"}}>
<div style={{padding:"10px 14px 7px",borderBottom:"1px solid #E8E0D0",display:"flex",alignItems:"center",gap:8,background:col.color+"18"}}>
<span style={{width:10,height:10,borderRadius:"50%",background:col.color,flexShrink:0,display:"inline-block"}}/>
<span style={{fontSize:13,fontWeight:700,flex:1,color:"#2C1A0E"}}>{col.title}</span>
<span style={{fontSize:11,color:"#A08060",background:"#FAF7F0",borderRadius:99,padding:"2px 8px",border:"1px solid #E8E0D0"}}>{done.length}/{col.cards.length}</span>
</div>
<div style={{fontSize:10,color:"#fff",padding:"3px 14px",background:col.color,fontWeight:600}}>📅 {col.dates}</div>
<div style={{padding:"5px 14px 0"}}><div style={{height:4,background:"#E8E0D0",borderRadius:99,overflow:"hidden"}}><div style={{height:"100%",width:pct+"%",background:col.color,borderRadius:99,transition:"width .3s"}}/></div></div>
<button onClick={add} style={{margin:"8px 14px 2px",padding:6,border:"none",borderRadius:7,background:"#F5EDD8",color:"#8B6F47",fontSize:12,cursor:"pointer",fontWeight:600,width:"calc(100% - 28px)"}}>+ Pridať úlohu</button>
<div style={{padding:"8px 10px 4px",display:"flex",flexDirection:"column",gap:8,overflowY:"auto",maxHeight:"calc(100vh - 280px)"}}>
{active.map(card=><Card key={card.id} card={card} colTitle={col.title} onUpdate={upd} onDelete={()=>del(card.id)} onMoveUp={()=>mv(card.id)} onMoveDown={()=>mvDown(card.id)}/>)}
{done.length>0&&<>
<div style={{display:"flex",alignItems:"center",gap:6,padding:"4px 0"}}>
<div style={{flex:1,height:1,background:"#E8E0D0"}}/><span style={{fontSize:10,color:"#B0A898",letterSpacing:".08em",textTransform:"uppercase"}}>✓ Hotovo ({done.length})</span><div style={{flex:1,height:1,background:"#E8E0D0"}}/>
</div>
{done.map(card=><Card key={card.id} card={card} colTitle={col.title} onUpdate={upd} onDelete={()=>del(card.id)} onMoveUp={()=>mv(card.id)} onMoveDown={()=>mvDown(card.id)}/>)}
</>}
</div>
</div>
);
}
const SK_MONTHS_IDX={januar:0,februar:1,marec:2,april:3,maj:4,jun:5,jul:6,august:7,september:8,oktober:9,november:10,december:11};
function skMonthIdx(w){ if(!w) return null; const n=w.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,""); return (n in SK_MONTHS_IDX)?SK_MONTHS_IDX[n]:null; }
function dkOfDate(dt){ return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,"0")}-${String(dt.getDate()).padStart(2,"0")}`; }
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
function planEventsFrom(cols){
const out=[];
(cols||[]).forEach(c=>{
const r=parsePlanRange(c.dates);
if(!r) return;
const sk=dkOfDate(r.start), ek=dkOfDate(r.end);
out.push({ id:"plan-"+c.id+"-s", date:sk, title:c.title, place:"Začiatok fázy", note:"", time:"", fromPlan:true, color:c.color||MV.neon });
if(ek!==sk) out.push({ id:"plan-"+c.id+"-e", date:ek, title:c.title, place:"Koniec fázy", note:"", time:"", fromPlan:true, color:c.color||MV.neon });
});
return out;
}
function CalendarTab() {
const MONTHS=["Január","Február","Marec","Apríl","Máj","Jún","Júl","August","September","Október","November","December"];
const DOW=["Po","Ut","St","Št","Pi","So","Ne"];
const today=new Date();
const todayKey=`${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`;
const [events,setEvents]=usePersistentState("cp_meetings",[]);
const planEvents=planEventsFrom(getCached("cp_planCols",COLS0));
const all=[...events.map(e=>({...e,fromPlan:false})),...planEvents];
const [view,setView]=useState({y:today.getFullYear(),m:today.getMonth()});
const [sel,setSel]=useState(null);
const [form,setForm]=useState({time:"",title:"",place:"",note:""});
const [gOpen,setGOpen]=useState(false);
const dk=(y,m,d)=>`${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
const daysIn=new Date(view.y,view.m+1,0).getDate();
const lead=(new Date(view.y,view.m,1).getDay()+6)%7; // pondelok-prvý
const cells=[...Array(lead).fill(null),...Array.from({length:daysIn},(_,i)=>i+1)];
const prevM=()=>setView(v=>{const d=new Date(v.y,v.m-1,1);return{y:d.getFullYear(),m:d.getMonth()};});
const nextM=()=>setView(v=>{const d=new Date(v.y,v.m+1,1);return{y:d.getFullYear(),m:d.getMonth()};});
const byDay=all.reduce((a,m)=>{(a[m.date]=a[m.date]||[]).push(m);return a;},{});
const addEvent=()=>{
if(!sel||!form.title.trim())return;
setEvents(ms=>[...ms,{id:Date.now()+"-"+Math.random().toString(36).slice(2,6),date:sel,...form,title:form.title.trim()}]);
setForm({time:"",title:"",place:"",note:""});
};
const rem=id=>setEvents(ms=>ms.filter(m=>m.id!==id));
const upcoming=[...all].sort((a,b)=>(a.date+("T"+(a.time||"99"))).localeCompare(b.date+("T"+(b.time||"99")))).filter(m=>m.date>=todayKey);
const selList=sel?[...(byDay[sel]||[])].sort((a,b)=>(a.time||"99").localeCompare(b.time||"99")):[];
const labelDate=s=>{if(!s)return"";const[y,m,d]=s.split("-").map(Number);return `${d}. ${MONTHS[m-1]} ${y}`;};
const inp={padding:"8px 9px",borderRadius:7,border:"1px solid #E0D6C2",fontSize:12,background:"#fff",color:BRAND.espresso,outline:"none"};
const feedToken=(import.meta.env&&import.meta.env.VITE_CALENDAR_TOKEN)||"";
const feedUrl=(typeof window!=="undefined"?window.location.origin:"")+"/api/calendar"+(feedToken?("?token="+feedToken):"");
return (
<div style={{padding:"10px 12px 22px"}}>
<div style={{display:"flex",alignItems:"center",gap:9,marginBottom:12}}>
<div style={{width:26,height:26,borderRadius:7,background:`linear-gradient(135deg,${MV.neon},${MV.violet})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>📅</div>
<div>
<div style={{fontSize:14,fontWeight:800,color:BRAND.espresso}}>Kalendár</div>
<div style={{fontSize:9.5,color:BRAND.arabica,letterSpacing:".06em"}}>Udalosti a termíny z plánu na jednom mieste</div>
</div>
</div>
<div style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:"#fff",border:"1px solid #E8E0D0",borderRadius:10,padding:"8px 10px",marginBottom:8}}>
<button onClick={prevM} style={{background:"none",border:"1px solid #E0D6C2",borderRadius:7,padding:"4px 12px",fontSize:15,cursor:"pointer",color:BRAND.espresso}}>‹</button>
<div style={{fontSize:13,fontWeight:700,color:BRAND.espresso}}>{MONTHS[view.m]} {view.y}</div>
<button onClick={nextM} style={{background:"none",border:"1px solid #E0D6C2",borderRadius:7,padding:"4px 12px",fontSize:15,cursor:"pointer",color:BRAND.espresso}}>›</button>
</div>
<div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2}}>
{DOW.map(d=><div key={d} style={{textAlign:"center",fontSize:9,fontWeight:700,color:"#A08060",textTransform:"uppercase",padding:"2px 0"}}>{d}</div>)}
{cells.map((d,i)=>{
if(d===null)return <div key={"e"+i}/>;
const key=dk(view.y,view.m,d);
const dayItems=byDay[key]||[];
const cnt=dayItems.length;
const hasUser=dayItems.some(x=>!x.fromPlan);
const dotColor=hasUser?MV.neon:((dayItems[0]&&dayItems[0].color)||MV.neon2);
const isToday=key===todayKey, isSel=key===sel;
return (
<button key={key} onClick={()=>setSel(isSel?null:key)}
style={{position:"relative",minHeight:52,borderRadius:4,cursor:"pointer",overflow:"hidden",textAlign:"left",
border:isSel?`2px solid ${MV.neon}`:"1px solid #E8E0D0",
background:isSel?"rgba(255,106,0,.06)":"#fff",
display:"flex",flexDirection:"column",gap:1.5,padding:"3px 2px 2px"}}>
<span style={{alignSelf:"flex-start",fontSize:9.5,fontWeight:700,lineHeight:1,minWidth:15,height:15,display:"flex",alignItems:"center",justifyContent:"center",borderRadius:"50%",color:isToday?"#fff":BRAND.espresso,background:isToday?MV.neon:"transparent"}}>{d}</span>
{dayItems.slice(0,3).map((it,ix)=>(
<span key={ix} title={it.title} style={{fontSize:8,lineHeight:1.25,fontWeight:600,color:"#fff",background:it.fromPlan?it.color:MV.neon,borderRadius:3,padding:"0 3px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:"100%"}}>{it.time?it.time+" ":""}{it.title}</span>
))}
{cnt>3&&<span style={{fontSize:7.5,color:"#A08060",fontWeight:700,lineHeight:1,paddingLeft:2}}>+{cnt-3}</span>}
</button>
);
})}
</div>
{sel&&(
<div style={{marginTop:12,background:"#fff",border:"1px solid #E8E0D0",borderRadius:10,padding:12}}>
<div style={{fontSize:12,fontWeight:700,color:BRAND.espresso,marginBottom:8}}>📌 {labelDate(sel)}</div>
{selList.length>0&&(
<div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:10}}>
{selList.map(m=>(
<div key={m.id} style={{display:"flex",alignItems:"center",gap:8,background:BRAND.latte,borderRadius:8,padding:"7px 9px",borderLeft:m.fromPlan?`3px solid ${m.color}`:"3px solid transparent"}}>
<div style={{fontSize:m.fromPlan?9:11,fontWeight:800,color:m.fromPlan?m.color:MV.neon,minWidth:38}}>{m.fromPlan?"PLÁN":(m.time||"—")}</div>
<div style={{flex:1}}>
<div style={{fontSize:12,fontWeight:600,color:BRAND.espresso}}>{m.title}</div>
{(m.place||m.note)&&<div style={{fontSize:10,color:"#A08060"}}>{[m.place&&(m.fromPlan?m.place:("📍 "+m.place)),m.note].filter(Boolean).join(" · ")}</div>}
</div>
{!m.fromPlan&&<button onClick={()=>rem(m.id)} style={{fontSize:11,color:"#C0B0A0",background:"none",border:"none",cursor:"pointer"}}>✕</button>}
</div>
))}
</div>
)}
<div style={{display:"grid",gridTemplateColumns:"1fr 2fr",gap:7,marginBottom:7}}>
<input style={inp} type="time" value={form.time} onChange={e=>setForm(f=>({...f,time:e.target.value}))}/>
<input style={inp} placeholder="Názov udalosti" value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))}/>
</div>
<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7,marginBottom:8}}>
<input style={inp} placeholder="Miesto" value={form.place} onChange={e=>setForm(f=>({...f,place:e.target.value}))}/>
<input style={inp} placeholder="Poznámka" value={form.note} onChange={e=>setForm(f=>({...f,note:e.target.value}))}/>
</div>
<button onClick={addEvent} disabled={!form.title.trim()}
style={{width:"100%",padding:9,borderRadius:8,border:"none",fontWeight:700,fontSize:12,cursor:form.title.trim()?"pointer":"default",opacity:form.title.trim()?1:0.5,color:"#fff",background:`linear-gradient(135deg,${MV.neon},${MV.violet})`}}>
＋ Pridať udalosť
</button>
</div>
)}
<div style={{marginTop:14}}>
<div style={{fontSize:11,fontWeight:700,color:BRAND.arabica,textTransform:"uppercase",letterSpacing:".06em",marginBottom:7}}>Nadchádzajúce udalosti</div>
{upcoming.length===0
?<div style={{textAlign:"center",color:"#A08060",fontSize:12,padding:16,background:"#fff",border:"1px dashed #E0D6C2",borderRadius:10}}>Žiadne udalosti. Klikni na deň a pridaj udalosť — termíny z Plánu sa zobrazia automaticky.</div>
:<div style={{display:"flex",flexDirection:"column",gap:6}}>
{upcoming.slice(0,12).map(m=>(
<div key={m.id} style={{display:"flex",alignItems:"center",gap:9,background:"#fff",border:"1px solid #E8E0D0",borderLeft:m.fromPlan?`3px solid ${m.color}`:"1px solid #E8E0D0",borderRadius:9,padding:"8px 10px"}}>
<div style={{textAlign:"center",minWidth:42}}>
<div style={{fontSize:9,color:"#A08060"}}>{m.date.slice(5).split("-").reverse().join(".")}.</div>
<div style={{fontSize:m.fromPlan?9:12,fontWeight:800,color:m.fromPlan?m.color:MV.neon}}>{m.fromPlan?"PLÁN":(m.time||"—")}</div>
</div>
<div style={{flex:1}}>
<div style={{fontSize:12,fontWeight:600,color:BRAND.espresso}}>{m.title}</div>
{(m.place||m.note)&&<div style={{fontSize:10,color:"#A08060"}}>{[m.place&&(m.fromPlan?m.place:("📍 "+m.place)),m.note].filter(Boolean).join(" · ")}</div>}
</div>
{!m.fromPlan&&<button onClick={()=>rem(m.id)} style={{fontSize:11,color:"#C0B0A0",background:"none",border:"none",cursor:"pointer"}}>✕</button>}
</div>
))}
</div>}
</div>
<div style={{marginTop:14,borderTop:"1px solid #EFE7DA",paddingTop:12}}>
<button onClick={()=>setGOpen(o=>!o)} style={{display:"flex",alignItems:"center",gap:8,width:"100%",background:"#fff",border:"1px solid #E8E0D0",borderRadius:9,padding:"9px 11px",cursor:"pointer"}}>
<span style={{width:20,height:20,borderRadius:5,background:"#1A73E8",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800}}>G</span>
<span style={{flex:1,textAlign:"left",fontSize:12,fontWeight:700,color:BRAND.espresso}}>Napojiť na Google Kalendár</span>
<span style={{color:BRAND.arabica,fontSize:12}}>{gOpen?"▲":"▼"}</span>
</button>
{gOpen&&(
<div style={{marginTop:8,background:"#fff",border:"1px solid #E8E0D0",borderRadius:9,padding:11}}>
<div style={{marginBottom:7,color:BRAND.arabica,fontSize:11,lineHeight:1.6}}>Pridaj túto adresu raz do Google Kalendára — všetky udalosti aj termíny z plánu sa tam budú zobrazovať a samy aktualizovať.</div>
<div style={{display:"flex",gap:6,marginBottom:9}}>
<input readOnly value={feedUrl} onFocus={e=>e.target.select()} style={{flex:1,minWidth:0,padding:"7px 8px",borderRadius:7,border:"1px solid #E0D6C2",fontSize:10.5,color:BRAND.espresso,background:"#FBF7F0"}}/>
<button onClick={()=>{ if(navigator.clipboard) navigator.clipboard.writeText(feedUrl); }} style={{padding:"7px 11px",borderRadius:7,border:"none",background:MV.neon,color:"#fff",fontWeight:700,fontSize:11,cursor:"pointer",whiteSpace:"nowrap"}}>Kopírovať</button>
</div>
<div style={{color:BRAND.arabica,fontSize:10.5,lineHeight:1.7}}>Otvor Google Kalendár (web) → vľavo pri <b>„Ďalšie kalendáre"</b> klikni <b>＋</b> → <b>Z adresy URL</b> → vlož adresu → <b>Pridať kalendár</b>. Google ju obnovuje približne raz za deň.</div>
</div>
)}
</div>
</div>
);
}
function PlanTab() {
const [cols,setCols]=usePersistentState("cp_planCols",COLS0);
const [cur,setCur]=useState(0);
const [isMobile,setIsMobile]=useState(window.innerWidth<=768);
const tx=useRef(0),ty=useRef(0),sw=useRef(false);
const total=cols.reduce((a,c)=>a+c.cards.length,0);
const done=cols.reduce((a,c)=>a+c.cards.filter(x=>x.prio==="done").length,0);
const pct=total>0?Math.round(done/total*100):0;
const goTo=i=>setCur(Math.max(0,Math.min(cols.length-1,i)));
const updCol=u=>setCols(cs=>cs.map(c=>c.id===u.id?u:c));
const ts=e=>{tx.current=e.touches[0].clientX;ty.current=e.touches[0].clientY;sw.current=false;};
const tm=e=>{const dx=e.touches[0].clientX-tx.current,dy=e.touches[0].clientY-ty.current;if(!sw.current&&Math.abs(dx)>Math.abs(dy)&&Math.abs(dx)>10)sw.current=true;};
const te=e=>{if(!sw.current)return;const dx=e.changedTouches[0].clientX-tx.current;if(Math.abs(dx)>50)goTo(dx<0?cur+1:cur-1);sw.current=false;};
return (
<div>
<div style={{background:"#fff",borderBottom:"1px solid #E8E0D0",padding:"8px 16px",display:"flex",alignItems:"center",gap:10}}>
<span style={{fontSize:11,color:BRAND.arabica,whiteSpace:"nowrap"}}>Celkový progres</span>
<div style={{flex:1,height:7,background:"#E8E0D0",borderRadius:99,overflow:"hidden"}}><div style={{height:"100%",width:pct+"%",background:`linear-gradient(90deg,${BRAND.arabica},${BRAND.caramel})`,borderRadius:99,transition:"width .4s"}}/></div>
<span style={{fontSize:13,fontWeight:700,color:BRAND.espresso,minWidth:36}}>{pct} %</span>
</div>
<div style={{display:"flex",background:"#fff",borderBottom:"1px solid #E8E0D0"}}>
{[["Úloh",total],["Hotovo",done],["Zostáva",total-done]].map(([l,v])=>(
<div key={l} style={{flex:1,padding:"8px 6px",borderRight:"1px solid #E8E0D0",textAlign:"center"}}>
<div style={{fontSize:16,fontWeight:700,color:BRAND.espresso}}>{v}</div>
<div style={{fontSize:9,color:"#A08060",letterSpacing:".07em",textTransform:"uppercase"}}>{l}</div>
</div>
))}
</div>
{isMobile&&(
<div style={{background:BRAND.espresso,display:"flex",alignItems:"center",padding:"8px 10px",gap:8,position:"sticky",top:48,zIndex:9}}>
<button onClick={()=>goTo(cur-1)} disabled={cur===0} style={{background:"none",border:"1px solid #555",borderRadius:6,color:"#F5EDD8",fontSize:16,padding:"4px 12px",cursor:"pointer",opacity:cur===0?0.3:1}}>‹</button>
<div style={{display:"flex",gap:6,flex:1,justifyContent:"center"}}>
{cols.map((col,i)=><button key={col.id} onClick={()=>goTo(i)} style={{width:10,height:10,borderRadius:"50%",border:"none",cursor:"pointer",padding:0,background:i===cur?col.color:"#555",transform:i===cur?"scale(1.35)":"scale(1)",transition:"all .2s"}}/>)}
</div>
<button onClick={()=>goTo(cur+1)} disabled={cur===cols.length-1} style={{background:"none",border:"1px solid #555",borderRadius:6,color:"#F5EDD8",fontSize:16,padding:"4px 12px",cursor:"pointer",opacity:cur===cols.length-1?0.3:1}}>›</button>
</div>
)}
{isMobile&&(
<div style={{overflow:"hidden",width:"100%"}} onTouchStart={ts} onTouchMove={tm} onTouchEnd={te}>
<div style={{display:"flex",transform:`translateX(-${cur*100}%)`,transition:"transform .32s cubic-bezier(.4,0,.2,1)"}}>
{cols.map(col=><Col key={col.id} col={col} onUpdate={updCol}/>)}
</div>
</div>
)}
{!isMobile&&(
<div style={{display:"flex",gap:0,overflowX:"auto",alignItems:"flex-start",minHeight:"70vh"}}>
{cols.map(col=><ColDesktop key={col.id} col={col} onUpdate={updCol}/>)}
</div>
)}
</div>
);
}
function BrandingTab() {
const palette = [
{name:"Espresso", hex:BRAND.espresso, desc:"Logo, nadpisy, tmavé pozadie"},
{name:"Arabica",  hex:BRAND.arabica,  desc:"Sekundárny text, ikony"},
{name:"Caramel",  hex:BRAND.caramel,  desc:"Akcenty, tlačidlá, zvýraznenia"},
{name:"Crema",    hex:BRAND.crema,    desc:"Svetlé pozadie, menu karty"},
{name:"Latte",    hex:BRAND.latte,    desc:"Hlavné pozadie, packaging"},
];
const accents = [
{name:"Olive",      hex:BRAND.olive,      desc:"Wellness, letná kolekcia"},
{name:"Terracotta", hex:BRAND.terracotta, desc:"Grand Opening, urgentné"},
{name:"Adriatic",   hex:BRAND.adriatic,   desc:"Špeciálne podujatia"},
{name:"Sand",       hex:BRAND.sand,       desc:"Mediteránske detaily"},
];
return (
<div style={{padding:16,display:"flex",flexDirection:"column",gap:20}}>
<div style={{background:BRAND.espresso,borderRadius:12,padding:"28px 20px",textAlign:"center"}}>
<div style={{fontSize:11,color:BRAND.caramel,letterSpacing:".2em",textTransform:"uppercase",marginBottom:6}}>Prievidza · Est. 2026</div>
<div style={{fontFamily:"Georgia,serif",fontSize:36,color:BRAND.crema,fontStyle:"italic",lineHeight:1.1}}>
Cafe <br/>Paradise
</div>
<div style={{fontSize:10,color:BRAND.arabica,letterSpacing:".28em",textTransform:"uppercase",marginTop:8}}>Coffee &amp; Sweets</div>
</div>
<div style={{background:"#fff",borderRadius:12,padding:"20px 16px",textAlign:"center",border:`1px solid #E8E0D0`}}>
<div style={{fontSize:11,color:BRAND.arabica,letterSpacing:".2em",textTransform:"uppercase",marginBottom:6}}>Prievidza · Est. 2026</div>
<div style={{fontFamily:"Georgia,serif",fontSize:36,color:BRAND.espresso,fontStyle:"italic",lineHeight:1.1}}>
Cafe <br/>Paradise
</div>
<div style={{fontSize:10,color:BRAND.arabica,letterSpacing:".28em",textTransform:"uppercase",marginTop:8}}>Coffee &amp; Sweets</div>
</div>
<div>
<div style={{fontSize:10,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",color:"#A08060",marginBottom:10}}>Primárna paleta</div>
<div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:8}}>
{palette.map(s=>(
<div key={s.name}>
<div style={{height:52,background:s.hex,borderRadius:8,border:"1px solid #E8E0D0",marginBottom:5}}/>
<div style={{fontSize:11,fontWeight:600,color:BRAND.espresso}}>{s.name}</div>
<div style={{fontSize:9,color:"#A08060",fontFamily:"monospace"}}>{s.hex}</div>
</div>
))}
</div>
</div>
<div>
<div style={{fontSize:10,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",color:"#A08060",marginBottom:10}}>Mediteránne akcenty</div>
<div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
{accents.map(s=>(
<div key={s.name}>
<div style={{height:44,background:s.hex,borderRadius:8,marginBottom:5}}/>
<div style={{fontSize:11,fontWeight:600,color:BRAND.espresso}}>{s.name}</div>
<div style={{fontSize:9,color:"#A08060",fontFamily:"monospace"}}>{s.hex}</div>
</div>
))}
</div>
</div>
<div style={{background:BRAND.crema,borderRadius:12,padding:"16px"}}>
<div style={{fontSize:10,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",color:"#A08060",marginBottom:12}}>Typografia</div>
<div style={{fontFamily:"Georgia,serif",fontSize:26,color:BRAND.espresso,marginBottom:4}}>Playfair Display — <em>Display</em></div>
<div style={{fontSize:14,color:BRAND.arabica,fontWeight:300,marginBottom:4,lineHeight:1.7}}>Helvetica Neue Light — texty menu, popisky, sociálne siete</div>
<div style={{fontSize:10,color:"#A08060",letterSpacing:".2em",textTransform:"uppercase"}}>LATO — nápisy, ceny, malé detaily</div>
</div>
</div>
);
}
function MenuTab() {
const sections = [
{ title:"☕ Káva", color:BRAND.espresso, items:[
{name:"Espresso",         price:"1.80 €", note:"Single origin, denná rotácia"},
{name:"Doppio",           price:"2.20 €", note:"Dvojitý espresso"},
{name:"Americano",        price:"2.20 €", note:"Espresso + horúca voda"},
{name:"Cappuccino",       price:"2.80 €", note:"Espresso + napeneným mlieko"},
{name:"Flat White",       price:"3.00 €", note:"Dvojitý ristretto + mikropena"},
{name:"Latte",            price:"3.20 €", note:"Espresso + veľa mlieka"},
{name:"Cortado",          price:"2.50 €", note:"Espresso + rovnaké množstvo mlieka"},
{name:"Filtrovaná káva",  price:"2.50 €", note:"Pour over, V60"},
{name:"Sezónna špeciality",price:"3.50 €",note:"Podľa aktuálnej ponuky"},
]},
{ title:"🍰 Zákusky & Torty", color:BRAND.caramel, items:[
{name:"Cheesecake",       price:"3.50 €", note:"New York štýl, sezónny topping"},
{name:"Tiramisu",         price:"3.80 €", note:"Domáce, klasická receptúra"},
{name:"Croissant",        price:"2.20 €", note:"Čerstvý, maslo"},
{name:"Croissant plnený", price:"2.80 €", note:"Šunka & syr alebo Nutella"},
{name:"Brownies",         price:"2.80 €", note:"Belgická čokoláda"},
{name:"Torta na zákazku", price:"od 35 €",note:"Objednávka min. 3 dni vopred"},
{name:"Sezónny zákusok",  price:"2.50 €", note:"Podľa aktuálnej ponuky"},
]},
{ title:"🥤 Nápoje", color:BRAND.adriatic, items:[
{name:"Horúca čokoláda",  price:"3.00 €", note:"Belgická, s šľahačkou"},
{name:"Čaj",              price:"2.50 €", note:"Výber zo 6 druhov"},
{name:"Fresh džús",       price:"3.50 €", note:"Pomaranč, jablko, mrkva"},
{name:"Limonáda",         price:"3.00 €", note:"Domáca, sezónna príchuť"},
{name:"Minerálna voda",   price:"1.20 €", note:"0.33 l"},
]},
{ title:"🌿 Wellness balíčky", color:BRAND.olive, items:[
{name:"Parná sprcha",     price:"15 €/hod", note:"Vrátane osušky"},
{name:"Výrivka",          price:"20 €/hod", note:"Max 2 osoby, vrátane osušiek"},
{name:"Romantický večer", price:"45 €",     note:"Výrivka 1h + 2x káva + zákusok"},
{name:"Deň krásy",        price:"35 €",     note:"Parná sprcha + výrivka 30 min každá"},
]},
];
return (
<div style={{padding:16,display:"flex",flexDirection:"column",gap:16}}>
{sections.map(sec=>(
<div key={sec.title} style={{borderRadius:12,overflow:"hidden",border:"1px solid #E8E0D0"}}>
<div style={{background:sec.color,padding:"10px 14px"}}>
<span style={{fontSize:14,fontWeight:700,color:"#fff"}}>{sec.title}</span>
</div>
{sec.items.map((item,i)=>(
<div key={item.name} style={{padding:"10px 14px",borderBottom:i<sec.items.length-1?"1px solid #F0EAE0":"none",display:"flex",alignItems:"flex-start",gap:8,background:i%2===0?"#fff":"#FDFAF7"}}>
<div style={{flex:1}}>
<div style={{fontSize:13,fontWeight:600,color:BRAND.espresso}}>{item.name}</div>
<div style={{fontSize:11,color:"#A08060",marginTop:2}}>{item.note}</div>
</div>
<div style={{fontSize:13,fontWeight:700,color:sec.color,flexShrink:0}}>{item.price}</div>
</div>
))}
</div>
))}
<div style={{background:BRAND.crema,borderRadius:12,padding:14,fontSize:11,color:BRAND.arabica,textAlign:"center"}}>
Ceny sú orientačné · Aktualizovať pred otvorením · Dátum: jún 2026
</div>
</div>
);
}
function FinanceTab() {
const startup = [
{item:"Espresso kávovar (dvojpákový)", cost:"3 000 – 4 000 €", pct:38},
{item:"Rekonštrukcia interiéru",       cost:"1 000 – 2 500 €", pct:20},
{item:"Terasa — sedenie, dekor",       cost:"800 – 1 500 €",   pct:13},
{item:"Mlynček + zmäkčovač vody",      cost:"700 – 1 200 €",   pct:10},
{item:"Parná sprcha (Bazos)",          cost:"250 €",             pct:3},
{item:"eKasa + platobný terminál",     cost:"400 – 600 €",     pct:5},
{item:"Branding + tlač",              cost:"500 – 800 €",     pct:6},
{item:"Počiatočné zásoby",             cost:"500 – 800 €",     pct:6},
{item:"Rezervný fond",                 cost:"500 – 1 000 €",   pct:8},
];
const monthly = [
{item:"Nájomné",                    cost:"600 – 900 €",   type:"fix"},
{item:"Energie (el., voda, plyn)",  cost:"300 – 500 €",   type:"fix"},
{item:"Suroviny (káva, zákusky)",   cost:"800 – 1 200 €", type:"var"},
{item:"Mzdy (1–2 zamestnanci)",     cost:"1 500 – 2 500 €",type:"fix"},
{item:"Marketing & sociálne siete", cost:"100 – 200 €",   type:"var"},
{item:"Ostatné (odpad, servis…)",   cost:"150 – 250 €",   type:"var"},
];
const scenarios = [
{label:"Minimálny",     customers:60, revenue:"7 800 €",  color:BRAND.terracotta},
{label:"Realistický",   customers:80, revenue:"10 400 €", color:BRAND.caramel},
{label:"Optimistický",  customers:110,revenue:"14 300 €", color:BRAND.olive},
];
return (
<div style={{padding:16,display:"flex",flexDirection:"column",gap:16}}>
<div style={{borderRadius:12,overflow:"hidden",border:"1px solid #E8E0D0"}}>
<div style={{background:BRAND.espresso,padding:"10px 14px"}}>
<span style={{fontSize:14,fontWeight:700,color:"#fff"}}>💰 Štartovací rozpočet (do 10 000 €)</span>
</div>
{startup.map((r,i)=>(
<div key={r.item} style={{padding:"9px 14px",borderBottom:i<startup.length-1?"1px solid #F0EAE0":"none",background:i%2===0?"#fff":"#FDFAF7"}}>
<div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
<span style={{fontSize:12,color:BRAND.espresso}}>{r.item}</span>
<span style={{fontSize:12,fontWeight:700,color:BRAND.arabica,flexShrink:0,marginLeft:8}}>{r.cost}</span>
</div>
<div style={{height:4,background:"#E8E0D0",borderRadius:99,overflow:"hidden"}}>
<div style={{height:"100%",width:r.pct+"%",background:BRAND.caramel,borderRadius:99}}/>
</div>
</div>
))}
</div>
<div style={{borderRadius:12,overflow:"hidden",border:"1px solid #E8E0D0"}}>
<div style={{background:BRAND.arabica,padding:"10px 14px"}}>
<span style={{fontSize:14,fontWeight:700,color:"#fff"}}>📆 Mesačné náklady</span>
</div>
{monthly.map((r,i)=>(
<div key={r.item} style={{padding:"9px 14px",borderBottom:i<monthly.length-1?"1px solid #F0EAE0":"none",display:"flex",alignItems:"center",justifyContent:"space-between",background:i%2===0?"#fff":"#FDFAF7"}}>
<div style={{flex:1}}>
<span style={{fontSize:12,color:BRAND.espresso}}>{r.item}</span>
<span style={{fontSize:9,marginLeft:6,padding:"1px 5px",borderRadius:4,background:r.type==="fix"?"#E0E7FF":"#FEF9C3",color:r.type==="fix"?"#3730A3":"#713F12",fontWeight:700,textTransform:"uppercase"}}>{r.type==="fix"?"Fixné":"Variab."}</span>
</div>
<span style={{fontSize:12,fontWeight:700,color:BRAND.arabica}}>{r.cost}</span>
</div>
))}
<div style={{padding:"10px 14px",background:BRAND.crema,display:"flex",justifyContent:"space-between"}}>
<span style={{fontSize:13,fontWeight:700,color:BRAND.espresso}}>Spolu mesačne</span>
<span style={{fontSize:13,fontWeight:700,color:BRAND.espresso}}>3 450 – 5 550 €</span>
</div>
</div>
<div style={{borderRadius:12,overflow:"hidden",border:"1px solid #E8E0D0"}}>
<div style={{background:BRAND.olive,padding:"10px 14px"}}>
<span style={{fontSize:14,fontWeight:700,color:"#fff"}}>📈 Odhadované tržby (5 € / zákazník)</span>
</div>
{scenarios.map((s,i)=>(
<div key={s.label} style={{padding:"12px 14px",borderBottom:i<scenarios.length-1?"1px solid #F0EAE0":"none",background:i%2===0?"#fff":"#FDFAF7"}}>
<div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
<div>
<span style={{fontSize:13,fontWeight:700,color:BRAND.espresso}}>{s.label}</span>
<span style={{fontSize:11,color:"#A08060",marginLeft:8}}>{s.customers} zákazníkov/deň × 26 dní</span>
</div>
<span style={{fontSize:14,fontWeight:700,color:s.color}}>{s.revenue}</span>
</div>
</div>
))}
<div style={{padding:"10px 14px",background:BRAND.crema,fontSize:11,color:BRAND.arabica}}>
Break-even: ~45 zákazníkov/deň · Zisk očakávaný od 3.–6. mesiaca
</div>
</div>
</div>
);
}
const KOM=`3272|GIN BEEFEATER PINK 37.5% 0.7l|fl|6|13.80|16.97|Gin
3688|GIN BEEFEATER 40% 1L|fl|12|15.25|18.76|Gin
5850|GIN BOMBAY SAPPHIRE 40% 1L|fl|1|23.23|28.57|Gin
6813|GIN MALFY ORIGINAL 41% 0.7L|fl|6|19.70|24.23|Gin
4709|GIN MONKEY 47 47% 0.5L|fl|1|33.48|41.18|Gin
4321|GIN TANQUERAY 43.1% 0.7l|fl|1|15.48|19.04|Gin
8133|GIN WHITLEY NEILL BLOOD ORANGE 43% 0.7l|fl|6|18.23|22.42|Gin
8131|GIN WHITLEY NEILL PINK GRAPEFRUIT 43% 0.7l|fl|6|18.23|22.42|Gin
6908|GIN MARE 42.7% 0.7l|fl|1|28.30|34.81|Gin
2182|GIN KENSINGTON SILVER 37.5% 0.7l|fl|6|8.05|9.90|Gin
4389|ZIZAK GIN 45% 0.7L|fl|1|22.17|27.27|Gin
8172|GIN TOISON ALCOHOL FREE 0% 0.7l|fl|1|13.42|15.97|Gin
9215|BACARDI CARTA NEGRA 37.5% 0.7L|fl|1|13.20|16.24|Rum
2406|BACARDI CARTA ORO 37.5% 0.7l|fl|1|12.28|15.10|Rum
8787|HAVANA CLUB ESPECIAL 37.5% 0.7l|fl|1|14.43|17.75|Rum
2216|CAPTAIN MORGAN SPICED GOLD 35% 0.7l|fl|6|10.10|12.42|Rum
5461|KRAKEN BLACK SPICED RUM 40% 0.7L|fl|1|18.70|23.00|Rum
13016|RUM DON PAPA BAROKO 40% 0.7l|fl|6|30.55|37.58|Rum
2123|VODKA ABSOLUT 40% 1l|fl|12|14.44|17.76|Vodka
2180|VODKA FINLANDIA 40% 1l|fl|12|14.45|17.77|Vodka
9292|VODKA BELUGA NOBLE 40% 1l|fl|6|39.36|48.41|Vodka
5590|NEMIROFF ORIGINAL VODKA 40% 1L|fl|1|10.89|13.39|Vodka
2114|JACK DANIEL'S 40% 0.7l|fl|6|17.78|21.87|Whisky
2062|JAMESON 40% 0.7l|fl|6|13.95|17.16|Whisky
6976|WHISKY JIM BEAM 40% 0.7l|fl|6|13.30|16.36|Whisky
2195|CHIVAS REGAL 40% 12r. 0.7l|fl|12|23.74|29.20|Whisky
4608|WHISKY WOODFORD RESERVE 43.2% 0.7L|fl|1|28.61|35.19|Whisky
1857|APEROL LIKER 11% 1l|fl|6|14.60|17.96|Likér
2117|BAILEYS 17% 0.7l|fl|12|12.90|15.87|Likér
2168|CAMPARI 25% 1l|fl|1|17.79|21.88|Likér
5767|JAGERMEISTER 35% 0.7L|fl|6|11.31|13.91|Likér
8523|AMARETTO DISARONNO 28% 0.7L|fl|1|19.06|23.44|Likér
2051|BECHEROVKA 38% 1l|fl|9|13.74|16.90|Likér
1090|MONIN SIRUP KARAMEL 1l|fl|6|9.10|10.83|Sirup
1219|MONIN SIRUP JAHODA 1l|fl|1|8.69|10.34|Sirup
741|MONIN SIRUP HAZELNUT 1l|fl|1|8.38|9.97|Sirup
3828|MONIN SIRUP MANGO 0.7L|fl|1|9.91|11.79|Sirup
570|BERNARD 12sv. 30l KEG|keg|1|47.15|57.99|Pivo KEG
155|STEIGER 12sv. 30l KEG|keg|1|44.80|55.10|Pivo KEG
607|URPINER 12sv. 30l KEG|keg|1|49.50|60.89|Pivo KEG
992|KOFOLA SANTA 20l KEG|keg|1|33.60|39.98|Pivo KEG
618|BERNARD 12sv. 0.5l|fl|20|0.67|0.82|Pivo fľ.
150|STEIGER 12sv. 0.5l|fl|20|0.56|0.69|Pivo fľ.
533|BIRELL NEALKO 0.5l|fl|20|0.61|0.73|Pivo fľ.
1038|KINLEY TONIC 0.25l|fl|24|1.00|1.19|Tonic & Mix
8153|FRANKLIN SONS INDIAN TONIC 0.2L|fl|24|1.12|1.33|Tonic & Mix
1047|COCA COLA 0.33l|fl|24|1.05|1.25|Nealko
1027|COCA COLA ZERO 0.33l|fl|24|1.05|1.25|Nealko
5305|RED BULL 0.25l|ks|24|1.08|1.29|Nealko
774|VINEA BIELA 0.25l|ks|24|0.95|1.13|Nealko
746|BUDIS 0.33l PERLIVA|fl|24|0.39|0.46|Voda
712|BUDIS 0.7L PERLIVA SKLO|fl|12|0.80|0.95|Voda
767|RAJEC VODA 0.33l sytena|fl|24|0.58|0.69|Voda
3548|KAVA ZRNO FRIENDS 70/30 1KG|ks|1|25.20|29.99|Káva
3100|CUKOR HYGIENICKY 1000 ks|ks|1|11.40|13.57|Doplnky
4330|ARASIDY SOL 100g KRAJCI|ks|12|0.60|0.71|Pochutiny
4329|KESU SOL 60g KRAJCI|ks|12|1.09|1.30|Pochutiny`.split('\n').map(l=>{const[scm,name,unit,boxQty,price,priceDPH,cat]=l.split('|');return{scm,name,unit,boxQty:+boxQty,price:+price,priceDPH:+priceDPH,cat,sid:"komatop"};});
const PIM=`pa001|Absint Green 80% 0.7l|fl|1|22.38|26.63|Absinth
pa002|Absinth Hill's 70% 0.7l|fl|1|21.44|25.51|Absinth
pb001|Koniferum Borovicka Pink 37.5% 0.7l|fl|1|6.98|8.31|Borovička
pb002|Koniferum Borovicka Slovenska 37.5% 1l|fl|1|10.94|13.02|Borovička
pb003|Borec Borovicka Grep 35% 0.7l|fl|1|7.01|8.34|Borovička
pb004|Spiaska Borovicka 38% 0.7l|fl|1|7.82|9.31|Borovička
pb005|Juniperus Borovicka 40% 0.7l|fl|1|9.52|11.33|Borovička
pb006|Domovina Borovicka 45% 0.7l|fl|1|25.09|29.86|Borovička
pbd001|Metaxa 12* 40% 0.7l|fl|1|24.78|29.49|Brandy
pbd002|Ararat 7y 40% 0.7l|fl|1|13.49|16.05|Brandy
pbd003|Soberano 36% 0.7l|fl|1|10.15|12.08|Brandy
pg001|JJ London Dry Gin 38% 0.7l|fl|1|11.93|14.19|Gin
pg002|Beefeater Pink 37.5% 1l|fl|1|17.97|21.38|Gin
pg003|Hendricks Another Gin 41.4% 0.7l|fl|1|22.99|27.36|Gin
pg004|Bombay Sapphire 40% 1l|fl|1|24.81|29.52|Gin
pg005|Malfy Gin Rosa 41% 0.7l|fl|1|26.37|31.38|Gin
pd001|R.Jelinek Slivovica Zlata 50% 0.7l|fl|1|15.12|17.99|Destilát
pd002|Bosacka Slivovica 52% 0.7l|fl|1|16.37|19.48|Destilát
pd003|Zbojnicka Hruskovica 42% 0.7l|fl|1|14.12|16.81|Destilát`.split('\n').map(l=>{const[scm,name,unit,boxQty,price,priceDPH,cat]=l.split('|');return{scm,name,unit,boxQty:+boxQty,price:+price,priceDPH:+priceDPH,cat,sid:"pima"};});
const ADR=`709049|Torta Harlekýn 22cm 930g 12p|ks|1|18.50|22.24|Torta
709046|Torta Malinová s vanilkovým krémom 22cm 1350g|ks|1|20.50|24.60|Torta
709042|Torta Paríž 22cm 1150g 12p|ks|1|19.50|23.40|Torta
709040|Torta Schwarzwald 22cm 1170g 12p|ks|1|20.50|24.60|Torta
709050|Torta Tvarohový Macko 22cm 1080g 12p|ks|1|20.50|24.60|Torta
709084|Torta Machová 22cm 1200g 12p|ks|1|20.50|24.60|Torta
709076|Torta Marhuľová BEZ LEPKU 22cm 1150g 12p|ks|1|22.50|27.00|Torta
709077|Torta Rozprávková BEZ LEPKU 22cm 1200g 12p|ks|1|22.50|27.00|Torta
25175|Torta Biely sen Prague 24cm 1250g 12p|ks|1|21.00|25.20|Torta
25173|Torta Jahodový Red Velvet 24cm 1800g 14p|ks|1|23.50|28.20|Torta
25174|Torta Orechový medovník 24cm 1600g 12p|ks|1|20.00|24.00|Torta
MH0008|Torta Zelená rozprávka s malinou 1350g 16p porciovaná|ks|1|32.00|38.40|Torta
MH0006|Torta Mangovo-tvarohová 1540g 14p porciovaná|ks|1|26.00|31.20|Torta
MH0020|Torta Malinovo-tvarohová 1540g 14p porciovaná|ks|1|26.00|31.20|Torta
MH0013|Torta Čoko-TRIO 1680g 14p porciovaná|ks|1|34.00|40.80|Torta
MH0002|Torta Punčová 1920g 16p porciovaná|ks|1|32.00|38.40|Torta
MH0019|Torta MIX 1400g 12p porciovaná|ks|1|26.00|31.20|Torta
000220|Torta Monte 1350g 14p porciovaná|ks|1|30.00|36.00|Torta
000258|Torta Biela čokoláda s lesným ovocím 1700g 14p|ks|1|31.00|37.20|Torta
000131|Torta Mascarpone Jahoda 1400g 14p porciovaná|ks|1|30.00|36.00|Torta
000355|Torta Bounty BEZ LEPKU 1680g 14p porciovaná|ks|1|31.00|37.20|Torta
000221|Torta Oblíž prst 1200g 14p porciovaná|ks|1|29.00|34.80|Torta
000352|Torta Oblíž prst pistácia 1200g 14p porciovaná|ks|1|29.00|34.80|Torta
000223|Raw torta Malina banán BEZ LEPKU BEZ MLIEKA 1350g 14p|ks|1|33.00|39.60|Torta
000224|Raw torta Malina BEZ LEPKU BEZ MLIEKA 1350g 14p|ks|1|33.00|39.60|Torta
000225|Raw torta Kokos BEZ LEPKU BEZ MLIEKA 1350g 14p|ks|1|33.00|39.60|Torta
709054|Cheesecake Jahoda 23cm 1300g 12p|ks|2|19.50|23.40|Cheesecake
709074|Cheesecake Slaný karamel 23cm 850g 12p|ks|2|19.50|23.40|Cheesecake
709088|Cheesecake Pistácie 23cm 850g 12p|ks|2|22.00|26.40|Cheesecake
MH0004|Cheesecake Nutela 1400g 14p porciovaný|ks|1|32.00|38.40|Cheesecake
25176|Cheesecake Jablko s chrumkavou posýpkou 1600g 12p|ks|1|19.50|23.40|Cheesecake
25178|Cheesecake Čučoriedka 1600g 12p|ks|1|19.50|23.40|Cheesecake
25177|Cheesecake Jahoda Prémium 1450g 12p|ks|1|17.00|20.40|Cheesecake
000323|Cheesecake Dubajská čokoláda 1400g 14p|ks|1|43.00|51.60|Cheesecake
25184|Cheesecake Jahoda RETAIL 510g 6p|ks|1|6.20|7.44|Cheesecake
709060|Rez Crème brûlée BEZ LEPKU 1000g 10p|ks|1|21.50|25.80|Rez
709061|Rez Čokokokos BEZ LEPKU 1600g 10p|ks|1|21.50|25.80|Rez
709007|Rez Toffifé 900g 10p|ks|1|17.50|21.00|Rez
709078|Rez Írsky krém BEZ LEPKU 1100g 10p|ks|1|21.50|25.80|Rez
709003|Rez Malina 900g 10p|ks|1|17.50|21.00|Rez
25170|Rez Čokoládový sen PRAGUE 2100g 24p|ks|1|37.00|44.40|Rez
25171|Rez Čučoriedkový Red Velvet 2100g 24p|ks|1|27.00|32.40|Rez
25172|Rez Mango Passion 2600g 24p|ks|1|27.00|32.40|Rez
25179|Rez Banánový chlebík 950g 10p|ks|1|10.00|12.00|Rez
701024|Zmrzlina GRANDE Vanilka 6.5L|van|1|40.50|48.60|Zmrzlina
701004|Zmrzlina GRANDE Čokoláda 6.5L|van|1|40.50|48.60|Zmrzlina
701022|Zmrzlina GRANDE Šmolková 6.5L|van|1|40.50|48.60|Zmrzlina
701003|Zmrzlina GRANDE Cookies 6.5L|van|1|40.50|48.60|Zmrzlina
702026|Zmrzlina PLUS Vanilka 5L|van|1|30.00|36.00|Zmrzlina
702006|Zmrzlina PLUS Čokoláda 5L|van|1|30.50|36.60|Zmrzlina
702021|Zmrzlina PLUS Pistácie 5L|van|1|30.00|36.00|Zmrzlina
702053|Zmrzlina PLUS Pistácie 100% 5L|van|1|35.00|42.00|Zmrzlina
702069|Zmrzlina PLUS Slaný karamel 5L|van|1|34.50|41.40|Zmrzlina
702011|Zmrzlina PLUS Jahoda NATUR 5L|van|1|30.00|36.00|Zmrzlina
702016|Zmrzlina PLUS Malina NATUR 5L|van|1|30.00|36.00|Zmrzlina
702060|Zmrzlina PLUS Mango NATUR 5L|van|1|30.00|36.00|Zmrzlina
702008|Zmrzlina PLUS Cheesecake s jahodami 5L|van|1|30.00|36.00|Zmrzlina
702064|Zmrzlina PLUS Baza 5L|van|1|34.00|40.80|Zmrzlina
702055|Zmrzlina PLUS Buble Gum 5L|van|1|30.00|36.00|Zmrzlina
1675|Šišky marhuľové mrazené 65g 24ks|bal|1|11.35|13.62|Pekáreň
1683|Šišky čoko s vanilkovou príchutou 65g 24ks|bal|1|11.35|13.62|Pekáreň
1408|Tvarohová taška mrazená 130g 25ks|bal|1|12.83|15.39|Pekáreň
1450|Syrový pagáč mrazený 85g 25ks|bal|1|9.13|10.95|Pekáreň
7162|Croissant lieskovo-oriešková náplň 90g 56ks|bal|1|27.44|32.93|Pekáreň
7161|Croissant marhuľová náplň 90g 56ks|bal|1|27.44|32.93|Pekáreň
7160|Croissant pistáciová náplň 90g 56ks|bal|1|38.64|46.37|Pekáreň
202|Mini šišky pistáciové 4kg|bal|1|17.32|20.78|Pekáreň
321|Mini šišky pizzové 4kg|bal|1|15.49|18.59|Pekáreň
632|Mini šišky čokoládové 4kg|bal|1|16.48|19.78|Pekáreň
730008|Limonáda Jahoda koncentrát 500ml|ks|1|8.50|10.20|Limonáda
730002|Limonáda Čučoriedka koncentrát 500ml|ks|1|8.50|10.20|Limonáda
730001|Limonáda Malina koncentrát 500ml|ks|1|9.90|11.88|Limonáda
730003|Limonáda Mango & Maracuja koncentrát 500ml|ks|1|8.50|10.20|Limonáda
730004|Limonáda Ananás & Kokos koncentrát 500ml|ks|1|8.50|10.20|Limonáda
730011|Limonáda Uhorka & Limetka koncentrát 500ml|ks|1|8.50|10.20|Limonáda
901142|Topping Čučoriedka 1kg|ks|1|12.50|15.00|Doplnky
901132|Topping Čokoláda ADRIA 1kg|ks|1|10.00|12.00|Doplnky
901136|Topping Jahoda ADRIA 1kg|ks|1|10.00|12.00|Doplnky
901137|Topping Karamel 1kg|ks|1|10.00|12.00|Doplnky
901140|Topping Malina 1kg|ks|1|9.00|10.80|Doplnky`.split('\n').map(l=>{const[scm,name,unit,boxQty,price,priceDPH,cat]=l.split('|');return{scm,name,unit,boxQty:+boxQty,price:+price,priceDPH:+priceDPH,cat,sid:"adria"};});
const PLZ=`99611|Pilsner Urquell svetlé fľaša 0.33L (24ks)|prep|24|21.52|26.47|Pilsner Urquell
89414|Pilsner Urquell svetlé fľaša 0.5L (20ks)|prep|20|20.34|25.02|Pilsner Urquell
95445|Pilsner Urquell svetlé plechovka 0.33L (24ks)|kart|24|23.88|29.37|Pilsner Urquell
95443|Pilsner Urquell svetlé fólia 6x0.5L plech.|fol|4|27.84|34.24|Pilsner Urquell
89393|Pilsner Urquell svetlé sud 15L|sud|1|40.60|49.94|Pilsner Urquell
89396|Pilsner Urquell svetlé sud 30L|sud|1|73.85|90.84|Pilsner Urquell
89402|Pilsner Urquell svetlé sud 50L|sud|1|112.00|137.76|Pilsner Urquell
97492|Peroni Nastro Azzuro fľaša 0.33L (4x6ks)|kart|4|20.72|25.49|Peroni
97393|Peroni Nastro Azzuro 0.0 fľaša 0.33L (4x6ks)|kart|4|20.72|24.66|Peroni
99707|Peroni Nastro Azzuro plechovka 0.33L (24ks)|kart|24|23.88|29.37|Peroni
97496|Peroni Nastro Azzuro sud 30L|sud|1|68.90|84.75|Peroni
96518|Gambrinus 10 svetlé fľaša 0.5L (20ks)|prep|20|12.29|15.12|Gambrinus
96513|Gambrinus 12 svetlé fľaša 0.5L (20ks)|prep|20|15.57|19.15|Gambrinus
96516|Gambrinus 10 svetlé fólia 6x0.5L plech.|fol|4|17.78|21.87|Gambrinus
96519|Gambrinus 12 svetlé fólia 6x0.5L plech.|fol|4|20.59|25.33|Gambrinus
96559|Gambrinus 10 svetlé nepast. sud 30L|sud|1|48.40|59.53|Gambrinus
96565|Gambrinus 10 svetlé nepast. sud 50L|sud|1|73.50|90.41|Gambrinus
96604|Gambrinus 12 svetlé nepast. sud 30L|sud|1|50.90|62.61|Gambrinus
94337|Velkopopovický Kozel 10 svetlé fľaša 0.5L (20ks)|prep|20|11.69|14.38|Kozel
95431|Kozel 10 svetlé fólia 6x0.5L plech.|fol|4|15.28|18.79|Kozel
95448|Kozel 11 svetlé fólia 6x0.5L plech.|fol|4|16.10|19.80|Kozel
99374|Kozel 12 svetlé fólia 6x0.5L plech.|fol|4|19.43|23.90|Kozel
96265|Kozel 11 svetlé sud 50L|sud|1|71.50|87.95|Kozel
97753|Radegast Rázná 10 fľaša 0.5L (20ks)|prep|20|16.20|19.93|Radegast
97584|Radegast Ratar fľaša 0.5L (20ks)|prep|20|16.16|19.88|Radegast
94968|Radegast Ryze Hořká 12 fľaša 0.5L (20ks)|prep|20|16.16|19.88|Radegast
97744|Radegast Rázná 10 fólia 6x0.5L plech.|fol|4|21.60|26.57|Radegast
97592|Radegast Ratar fólia 6x0.5L plech.|fol|4|22.06|27.13|Radegast
95439|Radegast Ryze Hořká 12 fólia 6x0.5L plech.|fol|4|22.06|27.13|Radegast
94513|Radegast Rázná 10 sud 30L|sud|1|51.70|63.59|Radegast
96280|Radegast Rázná 10 sud 50L|sud|1|78.00|95.94|Radegast
97603|Radegast Ratar sud 30L|sud|1|55.70|68.51|Radegast
96303|Radegast Ryze Hořká 12 sud 15L|sud|1|30.70|37.76|Radegast
94512|Radegast Ryze Hořká 12 sud 30L|sud|1|55.70|68.51|Radegast
96281|Radegast Ryze Hořká 12 sud 50L|sud|1|84.50|103.94|Radegast
95758|Birell nealko fľaša 0.33L (24ks)|prep|24|18.21|21.67|Birell
95718|Birell nealko fľaša 0.5L (20ks)|prep|20|14.91|17.74|Birell
97772|Birell za studena chmelený fólia 6x0.5L plech.|fol|4|20.61|24.53|Birell
97768|Birell IPA fólia 6x0.5L plech.|fol|4|20.61|24.53|Birell
97097|Birell nealko fólia 6x0.5L plech.|fol|4|20.61|24.53|Birell
95759|Birell nealko sud 15L|sud|1|26.90|32.01|Birell
95757|Birell nealko sud 30L|sud|1|48.40|57.60|Birell
99355|Birell 0.0 Pomelo&Grep radler fľaša 0.33L (24ks)|prep|24|15.84|19.48|Birell
99373|Birell 0.0 Pomelo&Grep radler fľaša 0.5L (20ks)|prep|20|17.24|21.21|Birell
99236|Birell 0.0 Pomelo&Grep radler fólia 6x0.5L|fol|4|22.41|27.56|Birell
99546|Birell 0.0 Sicílsky Citrón radler fólia 6x0.5L|fol|4|22.41|27.56|Birell
99257|Birell 0.0 Polotmavý Citrón radler fólia 6x0.5L|fol|4|22.41|27.56|Birell
99244|Birell 0.0 Malina&Limetka radler fólia 6x0.5L|fol|4|22.41|27.56|Birell
99254|Birell 0.0 Citrón&Mäta radler fólia 6x0.5L|fol|4|22.41|27.56|Birell
99228|Birell 0.0 Višňa&Černica radler fólia 6x0.5L|fol|4|22.41|27.56|Birell
99412|Birell Pomelo&Grep radler sud 15L|sud|1|27.90|34.32|Birell
99413|Birell Pomelo&Grep radler sud 30L|sud|1|50.10|61.62|Birell
96646|Šariš Iskrivá 10 fľaša 0.5L (20ks)|prep|20|10.62|13.06|Šariš
99271|Unikát fľaša 0.5L (20ks)|prep|20|13.82|17.00|Šariš
96647|Šariš Žiarivá 12 fľaša 0.5L (20ks)|prep|20|13.82|17.00|Šariš
89636|Šariš Tmavý fľaša 0.5L (20ks)|prep|20|13.55|16.67|Šariš
96638|Šariš Iskrivá 10 fólia 6x0.5L plech.|fol|4|15.13|18.61|Šariš
99239|Unikát fólia 6x0.5L plech.|fol|4|17.99|22.13|Šariš
96639|Šariš Žiarivá 12 fólia 6x0.5L plech.|fol|4|17.99|22.13|Šariš
98597|Šariš Tmavý fólia 6x0.5L plech.|fol|4|19.01|23.38|Šariš
96663|Šariš Iskrivá 10 sud 30L|sud|1|41.50|51.05|Šariš
96662|Šariš Iskrivá 10 sud 50L|sud|1|63.50|78.11|Šariš
99240|Unikát sud 30L|sud|1|45.10|55.47|Šariš
96704|Šariš Žiarivá 12 sud 30L|sud|1|45.10|55.47|Šariš
96705|Šariš Žiarivá 12 sud 50L|sud|1|68.50|84.26|Šariš
94473|Šariš Tmavý sud 30L|sud|1|39.60|48.71|Šariš
95019|Smädný mních 10 fľaša 0.5L (20ks)|prep|20|10.28|12.64|Smädný mních
95407|Smädný mních 10 fólia 6x0.55L plech.|fol|4|16.40|20.17|Smädný mních
98729|Captain Jack Original fólia 6x0.33L fľ.|kart|4|19.75|24.29|Captain Jack
97851|Captain Jack Blue Lagoon fólia 6x0.33L fľ.|kart|4|19.75|24.29|Captain Jack
98738|Captain Jack Watermelon Margarita fólia 6x0.33L|kart|4|19.75|24.29|Captain Jack
98722|Captain Jack Original fólia 4x0.5L plech.|fol|6|26.60|32.72|Captain Jack
98402|Captain Jack Exotic Daiquiri fólia 4x0.5L|fol|6|26.60|32.72|Captain Jack
98572|Captain Jack Citrus Tonic fólia 4x0.5L|fol|6|26.60|32.72|Captain Jack
99763|Captain Jack Mango&Lime fólia 4x0.5L|fol|6|26.60|32.72|Captain Jack
91962|Master 18 tmavé Nefilter sud 15L|sud|1|35.40|43.54|Špeciály
93661|Topkola sud 50L|sud|1|28.40|34.93|Špeciály
89380|Kofola originál sud 50L|sud|1|54.40|66.91|Špeciály`.split('\n').map(l=>{const[scm,name,unit,boxQty,price,priceDPH,cat]=l.split('|');return{scm,name,unit,boxQty:+boxQty,price:+price,priceDPH:+priceDPH,cat,sid:"plzen"};});

const JED=`jed01|BiRELL Citrón & Máta 0,0% plechovka 0.5L|ks|1|0.64|0.79|Birell
jed02|BiRELL Radler Pomelo/Grep plechovka 0.5L|ks|1|0.64|0.79|Birell
jed03|BiRELL Radler Sicilský citrón plechovka 0.5L|ks|1|0.64|0.79|Birell
jed04|BiRELL Svetlý fľaša 0.5L|ks|1|0.89|1.09|Birell
jed05|BiRELL Radler Sicilský citrón fľaša 0.5L|ks|1|0.97|1.19|Birell
jed06|Pilsner Urquell plechovka 0.5L|ks|1|0.97|1.19|Pilsner Urquell
jed07|Pilsner Urquell fľaša 0.5L|ks|1|1.13|1.39|Pilsner Urquell
jed08|Šariš Svetlé 10° fľaša 0.5L|ks|1|0.56|0.69|Šariš
jed09|Šariš Unikát ležák fľaša 0.5L|ks|1|0.76|0.94|Šariš
jed10|Gambrinus 12° fľaša 0.5L|ks|1|0.80|0.99|Gambrinus
jed11|Radegast Rázna 10° fľaša 0.5L|ks|1|0.80|0.99|Radegast
jed12|Radegast Ryzehoř 12° fľaša 0.5L|ks|1|0.97|1.19|Radegast
jed13|Šariš Svetlé 12° fľaša 0.5L|ks|1|0.77|0.95|Šariš`.split('\n').map(l=>{const[scm,name,unit,boxQty,price,priceDPH,cat]=l.split('|');return{scm,name,unit,boxQty:+boxQty,price:+price,priceDPH:+priceDPH,cat,sid:"jednota"};});

const ALL_CATALOG=[...KOM,...PIM,...ADR,...PLZ,...JED];
const SUPS={
komatop:{name:"KOMATOP s.r.o.",color:BRAND.arabica,icon:"🏭",contact:"kovacikova.norika@komatop.sk · 046/5421782",note:"Veľkoobchodný cenník",updated:"21.05.2025"},
pima:   {name:"PIMA.sk",        color:"#5B21B6",    icon:"🛒",contact:"eshop@pima.sk",                              note:"Ceny s DPH",updated:"—"},
adria:  {name:"Adria Gelato",   color:"#C0392B",    icon:"🍰",contact:"obchod@adriagold.sk · +421 915 811 376",     note:"Adria Gold Slovakia s.r.o. · ceny bez DPH",updated:"2026"},
plzen:  {name:"Plzeňský Prazdroj",color:"#1A5276",  icon:"🍺",contact:"Oddelenie služieb zákazníkom: +421 2/321 714 14",note:"DPH 23% alkohol, 19% neochutené nealko",updated:"1.2.2026"},
jednota:{name:"Jednota",        color:"#2E6B4F",    icon:"🛍️",contact:"Retailový cenník (COOP Jednota)",              note:"Maloobchodné ceny piva · ceny s DPH a bez DPH za 1 ks",updated:"21.06.2026"},
};
const MAIN_CAT_MAP={
Gin:"Nápoje",Vodka:"Nápoje",Rum:"Nápoje",Whisky:"Nápoje",Likér:"Nápoje",Borovička:"Nápoje",Brandy:"Nápoje",Destilát:"Nápoje",Absinth:"Nápoje",Nealko:"Nápoje",Voda:"Nápoje",
"Tonic & Mix":"Nápoje","Pivo fľ.":"Nápoje","Pivo KEG":"Nápoje",Limonáda:"Nápoje","Pilsner Urquell":"Nápoje",Peroni:"Nápoje",Gambrinus:"Nápoje",Kozel:"Nápoje",Radegast:"Nápoje",
Birell:"Nápoje",Šariš:"Nápoje","Smädný mních":"Nápoje","Captain Jack":"Nápoje",Špeciály:"Nápoje",Sirup:"Nápoje",Káva:"Nápoje",Čaj:"Nápoje",
Pochutiny:"Pochutiny",
Torta:"Cukrárenské výrobky",Cheesecake:"Cukrárenské výrobky",Rez:"Cukrárenské výrobky",Zmrzlina:"Cukrárenské výrobky",Pekáreň:"Cukrárenské výrobky",
Čistenie:"Hygiena",
Doplnky:"Ostatné",
};
const MAIN_CATS=["Všetko","Nápoje","Pochutiny","Cukrárenské výrobky","Hygiena","Ostatné"];
function mainCatOf(cat){return MAIN_CAT_MAP[cat]||"Ostatné";}

const NAPOJE_TIER2={
Gin:"Alko",Vodka:"Alko",Rum:"Alko",Whisky:"Alko",Likér:"Alko",Borovička:"Alko",Brandy:"Alko",Destilát:"Alko",Absinth:"Alko",
Nealko:"Nealko",Voda:"Nealko","Tonic & Mix":"Nealko",Limonáda:"Nealko",
"Pivo fľ.":"Pivo","Pivo KEG":"Pivo","Pilsner Urquell":"Pivo",Peroni:"Pivo",Gambrinus:"Pivo",Kozel:"Pivo",Radegast:"Pivo",Birell:"Pivo",Šariš:"Pivo","Smädný mních":"Pivo","Captain Jack":"Pivo",Špeciály:"Pivo",
Sirup:"Sirupy",Káva:"Káva",Čaj:"Čaj",
};
function kavaSub(name){const u=name.toUpperCase();if(u.includes("ZRNO")||u.includes("ZRNKOV"))return"Zrnková káva";if(u.includes("MLET")||u.includes("STAND")||u.includes("PREMIUM"))return"Mletá káva";return"Iné";}
function cajSub(name){const u=name.toUpperCase();if(u.includes("SYPAN")||u.includes("SYPÁ"))return"Sypané čaje";return"Sáčkové čaje";}
function pochSub(name){const u=name.toUpperCase();if(u.includes("ARASID")||u.includes("KESU"))return"Arašidy a kešu";if(u.includes("MANDLE")||u.includes("PISTACIE")||u.includes("PISTÁCIE"))return"Orechy";if(u.includes("SUSEN")||u.includes("SUŠEN"))return"Sušené ovocie";return"Ostatné pochutiny";}

function tier2Of(p){
const mc=mainCatOf(p.cat);
if(mc==="Nápoje") return NAPOJE_TIER2[p.cat]||"Iné";
if(mc==="Pochutiny") return pochSub(p.name);
return null;
}
function tier3Of(p){
const t2=tier2Of(p);
if(t2==="Káva") return kavaSub(p.name);
if(t2==="Čaj") return cajSub(p.name);
return p.cat;
}

function unitInfo(p){
const name=p.name;
let size=null,unit=null,innerCount=1;
let m=name.match(/(\d+)\s*x\s*([\d.,]+)\s*(ml|l|kg|g)\b/i);
if(m){innerCount=parseInt(m[1]);size=parseFloat(m[2].replace(",","."));unit=m[3].toLowerCase();}
else{
const all=name.match(/([\d.,]+)\s*(ml|l|kg|g)\b/gi);
if(all&&all.length){
const last=all[all.length-1];
const mm=last.match(/([\d.,]+)\s*(ml|l|kg|g)/i);
size=parseFloat(mm[1].replace(",","."));unit=mm[2].toLowerCase();
}
}
if(size===null||size<=0) return null;
if(unit==="ml"){size/=1000;unit="l";}
if(unit==="g"){size/=1000;unit="kg";}
const totalPieces=(p.boxQty||1)*innerCount; // skutočný počet jednotlivých kusov (fliaš/plechoviek) v balení
const priceKs=p.priceDPH/totalPieces; // cena za 1 ks, nie za celé balenie
const priceUnit=priceKs/size;
return {priceKs, priceUnit, unit, size};
}

function packagingOf(p){
const name=p.name;
const low=name.toLowerCase();
if(/\bsud\b/.test(low)||/keg/i.test(p.unit)) return "Sud"; // všetky objemy sudov spolu, jedna kategória
let type=null;
if(/plech/.test(low)) type="Plechovka";
else if(/fľaš|flaš/.test(low)) type="Fľaša";
if(!type) return null; // fólia/kartón/prepravka bez rozpoznaného typu obalu sa nefiltrujú samostatne
let vol=null;
const m=name.match(/(\d+)\s*x\s*([\d.,]+)\s*(ml|l)\b/i);
if(m) vol=`${m[2].replace(",",".")}${m[3].toLowerCase()}`; // ber objem JEDNÉHO kusu, nie počet v balení
else{
const single=name.match(/([\d.,]+)\s*(ml|l)\b/i);
if(single) vol=`${single[1].replace(",",".")}${single[2].toLowerCase()}`;
}
return vol?`${type} ${vol}`:type;
}

function mScore(a,b){
const nrm=s=>s.toLowerCase().replace(/[()%,.]/g," ").split(/\s+/).filter(w=>w.length>2);
const wa=nrm(a),wb=nrm(b);
const com=wa.filter(w=>wb.some(w2=>w2===w||w2.startsWith(w)||w.startsWith(w2)));
return com.length/Math.max(wa.length,wb.length)||0;
}
function priceForCompare(p){
const u=unitInfo(p);
if(u) return {value:u.priceUnit,label:u.unit==="l"?"€/L":"€/kg"};
return {value:p.priceDPH/(p.boxQty||1),label:"€/ks"};
}
function bestComparison(p, scope){
const myPrice=priceForCompare(p);
let best=null;
for(const o of scope){
if(o.sid===p.sid||o.scm===p.scm) continue;
if(mScore(p.name,o.name)<0.55) continue;
const op=priceForCompare(o);
if(op.label!==myPrice.label) continue;
if(!best||op.value<best.value) best={...op,product:o};
}
if(!best) return null;
const diff=myPrice.value-best.value;
const pct=best.value>0?(diff/best.value*100):0;
return {diff,pct,cheaper:diff<-0.001,pricier:diff>0.001,other:best.product,otherPrice:best.value,label:myPrice.label};
}

function DodavateliaTab({ inventory, setInventory }) {
const [supF, setSupF] = useState("all");
const [search, setSearch] = useState("");
const [mainCat, setMainCat] = useState("Všetko");
const [tier2F, setTier2F] = useState("Všetko");
const [catF, setCatF] = useState("Všetko");
const [pkgF, setPkgF] = useState("Všetko");
const [view, setView] = useState("catalog"); // catalog | info
const [favs, setFavs] = usePersistentState("cp_favs", []);
const sup = supF==="all"?null:SUPS[supF];
const baseCatalog = supF==="all"?ALL_CATALOG:ALL_CATALOG.filter(p=>p.sid===supF);
const mainFiltered = baseCatalog.filter(p=>mainCat==="Všetko"||mainCatOf(p.cat)===mainCat);
const tier2List = ["Všetko",...new Set(mainFiltered.map(p=>tier2Of(p)).filter(Boolean))];
const tier2Filtered = mainFiltered.filter(p=>tier2F==="Všetko"||tier2Of(p)===tier2F);
const cats = ["Všetko",...new Set(tier2Filtered.map(p=>tier3Of(p)))].sort();
const catFiltered = tier2Filtered.filter(p=>catF==="Všetko"||tier3Of(p)===catF);
const pkgList = ["Všetko",...new Set(catFiltered.map(p=>packagingOf(p)).filter(Boolean))];
const filtered = catFiltered.filter(p=>{
const ms=p.name.toLowerCase().includes(search.toLowerCase());
const mp=pkgF==="Všetko"||packagingOf(p)===pkgF;
return ms&&mp;
});
const inInv = scm => inventory.some(i=>i.scm===scm);
const toggle = p => {
if(inInv(p.scm)) setInventory(iv=>iv.filter(i=>i.scm!==p.scm));
else setInventory(iv=>[...iv,{...p,qty:0,minQty:1}]);
};
const inCount = baseCatalog.filter(p=>inInv(p.scm)).length;
const toggleFav = id => setFavs(f=>f.includes(id)?f.filter(x=>x!==id):[...f,id]);
const supOrder = Object.entries(SUPS).sort((a,b)=>(favs.includes(b[0])?1:0)-(favs.includes(a[0])?1:0));
return (
<div style={{padding:14,display:"flex",flexDirection:"column",gap:10}}>
{/* Supplier — rolovacie menu (scrollable), s "Všetci" pre celkový pohľad */}
<div style={{display:"flex",gap:6,overflowX:"auto",paddingBottom:2}}>
<button onClick={()=>{setSupF("all");setMainCat("Všetko");setTier2F("Všetko");setCatF("Všetko");setPkgF("Všetko");setSearch("");}}
style={{flex:"0 0 auto",minWidth:80,padding:"10px 12px",borderRadius:8,border:"none",cursor:"pointer",
background:supF==="all"?BRAND.espresso:BRAND.crema,color:supF==="all"?"#fff":BRAND.arabica,fontWeight:600,fontSize:12,whiteSpace:"nowrap"}}>
🌐 Všetci
</button>
{supOrder.map(([id,s])=>(
<div key={id} style={{position:"relative",flex:"0 0 auto",minWidth:96}}>
<button onClick={()=>{setSupF(id);setMainCat("Všetko");setTier2F("Všetko");setCatF("Všetko");setPkgF("Všetko");setSearch("");}}
style={{width:"100%",padding:"10px 22px 10px 8px",borderRadius:8,border:"none",cursor:"pointer",
background:supF===id?s.color:BRAND.crema,color:supF===id?"#fff":BRAND.arabica,fontWeight:600,fontSize:12,whiteSpace:"nowrap"}}>
{s.icon} {s.name}
</button>
<button onClick={()=>toggleFav(id)} title="Obľúbený dodávateľ"
style={{position:"absolute",top:2,right:2,background:"none",border:"none",cursor:"pointer",fontSize:13,
color:favs.includes(id)?"#F5C518":(supF===id?"#fff":"#C8BFB0"),padding:2,lineHeight:1}}>
{favs.includes(id)?"★":"☆"}
</button>
</div>
))}
</div>
<div style={{display:"flex",gap:5}}>
{[["catalog","📋 Katalóg"],["info","🏢 Info"],["kontakty","📞 Kontakty"]].map(([id,lbl])=>(
<button key={id} onClick={()=>setView(id)}
style={{padding:"6px 14px",borderRadius:6,border:"none",cursor:"pointer",fontSize:11,fontWeight:600,
background:view===id?BRAND.espresso:BRAND.crema,color:view===id?"#fff":BRAND.arabica}}>
{lbl}
</button>
))}
<div style={{marginLeft:"auto",background:"#F0FDF4",borderRadius:6,padding:"6px 10px",fontSize:11,color:BRAND.olive,fontWeight:600}}>
✓ {inCount} v inventári
</div>
</div>
{view==="info"&&(
sup?(
<div style={{background:"#fff",borderRadius:10,border:"1px solid #E8E0D0",padding:"16px"}}>
<div style={{fontSize:15,fontWeight:700,color:BRAND.espresso,marginBottom:8,display:"flex",alignItems:"center",gap:8}}>
{sup.icon} {sup.name}
<button onClick={()=>toggleFav(supF)} style={{background:"none",border:"none",cursor:"pointer",fontSize:16,color:favs.includes(supF)?"#F5C518":"#C8BFB0"}}>
{favs.includes(supF)?"★":"☆"}
</button>
</div>
<div style={{fontSize:12,color:BRAND.adriatic,marginBottom:4}}>✉ {sup.contact}</div>
<div style={{fontSize:11,color:"#A08060",marginBottom:8}}>{sup.note}</div>
<div style={{display:"inline-flex",alignItems:"center",gap:5,background:BRAND.crema,borderRadius:99,padding:"4px 10px",fontSize:11,color:BRAND.espresso,fontWeight:600,marginBottom:12}}>
🕓 Naposledy aktualizovaný cenník: <b>{sup.updated}</b>
</div>
<div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
{[["Produktov",baseCatalog.length],["V inventári",inCount],["Kategórií",new Set(baseCatalog.map(p=>p.cat)).size]].map(([l,v])=>(
<div key={l} style={{background:BRAND.crema,borderRadius:8,padding:"10px",textAlign:"center"}}>
<div style={{fontSize:20,fontWeight:700,color:BRAND.espresso}}>{v}</div>
<div style={{fontSize:10,color:"#A08060"}}>{l}</div>
</div>
))}
</div>
</div>
):(
<div style={{background:"#fff",borderRadius:10,border:"1px solid #E8E0D0",padding:"16px"}}>
<div style={{fontSize:15,fontWeight:700,color:BRAND.espresso,marginBottom:10}}>🌐 Všetci dodávatelia</div>
<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
{Object.entries(SUPS).map(([id,s])=>(
<div key={id} style={{background:BRAND.crema,borderRadius:8,padding:"10px",display:"flex",alignItems:"center",gap:8}}>
<span style={{fontSize:16}}>{s.icon}</span>
<div style={{flex:1}}>
<div style={{fontSize:12,fontWeight:700,color:BRAND.espresso}}>{s.name}</div>
<div style={{fontSize:10,color:"#A08060"}}>{ALL_CATALOG.filter(p=>p.sid===id).length} produktov · 🕓 {s.updated}</div>
</div>
</div>
))}
</div>
</div>
)
)}
{view==="kontakty"&&(
<div style={{display:"flex",flexDirection:"column",gap:12}}>
{(supF==="all"?SUPPLIER_CONTACTS:SUPPLIER_CONTACTS.filter(s=>s.id===supF)).map(s=>(
<div key={s.id} style={{background:"#fff",borderRadius:10,border:"1px solid #E8E0D0",overflow:"hidden"}}>
<div style={{background:s.color,color:"#fff",padding:"10px 14px",display:"flex",alignItems:"center",gap:8}}>
<span style={{fontSize:17}}>{s.icon}</span>
<span style={{fontSize:14,fontWeight:700}}>{s.name}</span>
</div>
<div style={{padding:"10px 14px",fontSize:11,color:"#A08060",borderBottom:"1px solid #F0EAE0"}}>{s.note}</div>
<div style={{display:"flex",flexDirection:"column"}}>
{s.reps.map((r,i)=>(
<div key={i} style={{padding:"10px 14px",display:"flex",alignItems:"center",gap:10,borderBottom:i<s.reps.length-1?"1px solid #F5F0E8":"none"}}>
<div style={{flex:1,minWidth:0}}>
<div style={{fontSize:12,fontWeight:600,color:BRAND.espresso}}>{r.role}</div>
{r.name&&<div style={{fontSize:11,color:"#A08060"}}>{r.name}</div>}
</div>
{r.phone&&(
<a href={`tel:${r.phone}`} style={{display:"flex",alignItems:"center",gap:5,background:BRAND.crema,borderRadius:7,padding:"6px 10px",textDecoration:"none",fontSize:11,fontWeight:600,color:BRAND.espresso,whiteSpace:"nowrap",flexShrink:0}}>
📞 {r.phoneLabel}
</a>
)}
{r.email&&(
<a href={`mailto:${r.email}`} style={{display:"flex",alignItems:"center",gap:5,background:BRAND.adriatic,borderRadius:7,padding:"6px 10px",textDecoration:"none",fontSize:11,fontWeight:600,color:"#fff",whiteSpace:"nowrap",flexShrink:0}}>
✉ Mail
</a>
)}
</div>
))}
</div>
</div>
))}
</div>
)}
{view==="catalog"&&<>
<div style={{background:BRAND.crema,borderRadius:8,padding:"8px 12px",fontSize:11,color:BRAND.arabica}}>
Klikni <b>+ Sklad</b> pre pridanie produktu do evidencie zásob. ▼ zelená = lacnejšie, ▲ červená = drahšie oproti inému dodávateľovi.
</div>
<input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Hľadaj produkt…"
style={{padding:"7px 10px",borderRadius:7,border:"1px solid #E8E0D0",background:"#fff",fontSize:12,outline:"none"}}/>
{/* Hlavná kategória — globálny filter pre všetkých dodávateľov */}
<div style={{display:"flex",gap:5,overflowX:"auto",paddingBottom:2}}>
{MAIN_CATS.map(c=>(
<button key={c} onClick={()=>{setMainCat(c);setTier2F("Všetko");setCatF("Všetko");setPkgF("Všetko");}}
style={{flex:"0 0 auto",padding:"7px 14px",borderRadius:99,border:"none",cursor:"pointer",fontSize:12,fontWeight:700,whiteSpace:"nowrap",
background:mainCat===c?BRAND.espresso:BRAND.crema,color:mainCat===c?"#fff":BRAND.arabica}}>
{c}
</button>
))}
</div>
{/* Stredná kategória (tier2) — napr. Alko/Nealko/Pivo/Káva/Sirupy/Čaj alebo Orechy/Arašidy.../Sušené ovocie */}
{tier2List.length>1&&(
<div style={{display:"flex",gap:5,overflowX:"auto",paddingBottom:2}}>
{tier2List.map(c=>(
<button key={c} onClick={()=>{setTier2F(c);setCatF("Všetko");setPkgF("Všetko");}}
style={{flex:"0 0 auto",padding:"6px 12px",borderRadius:99,border:"none",cursor:"pointer",fontSize:11,fontWeight:700,whiteSpace:"nowrap",
background:tier2F===c?BRAND.adriatic:"#EAF2F8",color:tier2F===c?"#fff":BRAND.adriatic}}>
{c}
</button>
))}
</div>
)}
{/* Podkategória (tier3) — filter v rámci zvolenej kategórie, naprieč všetkými dodávateľmi */}
<div style={{display:"flex",gap:5,overflowX:"auto",paddingBottom:2}}>
{cats.map(c=>(
<button key={c} onClick={()=>{setCatF(c);setPkgF("Všetko");}}
style={{flex:"0 0 auto",padding:"5px 11px",borderRadius:99,border:`1px solid ${catF===c?BRAND.caramel:"#E8E0D0"}`,cursor:"pointer",fontSize:11,fontWeight:600,whiteSpace:"nowrap",
background:catF===c?BRAND.crema:"#fff",color:catF===c?BRAND.espresso:"#A08060"}}>
{c}
</button>
))}
</div>
{/* Druh balenia (tier4) — napr. Plechovka 0.33L / Fľaša 0.5L */}
{pkgList.length>1&&(
<div style={{display:"flex",gap:5,overflowX:"auto",paddingBottom:2}}>
{pkgList.map(c=>(
<button key={c} onClick={()=>setPkgF(c)}
style={{flex:"0 0 auto",padding:"4px 10px",borderRadius:99,border:`1px solid ${pkgF===c?BRAND.olive:"#D8E8DC"}`,cursor:"pointer",fontSize:10,fontWeight:600,whiteSpace:"nowrap",
background:pkgF===c?"#EAF7EF":"#fff",color:pkgF===c?BRAND.olive:"#7FA68C"}}>
📦 {c}
</button>
))}
</div>
)}
<div style={{fontSize:11,color:"#A08060"}}>{filtered.length} produktov{supF==="all"?" · všetci dodávatelia":""}</div>
<div style={{display:"flex",flexDirection:"column",gap:5}}>
{filtered.map(p=>{
const added=inInv(p.scm);
const psup=SUPS[p.sid];
const cmp=bestComparison(p,tier2Filtered);
return(
<div key={p.scm} style={{background:added?"#F0FDF4":"#fff",borderRadius:8,border:`1px solid ${added?"#6EE7B7":"#E8E0D0"}`,padding:"9px 12px",display:"flex",alignItems:"center",gap:8}}>
<div style={{flex:1}}>
<div style={{fontSize:12,fontWeight:600,color:BRAND.espresso}}>{p.name}</div>
<div style={{fontSize:10,color:"#A08060",marginTop:2}}>
{supF==="all"&&<span style={{color:psup.color,fontWeight:700}}>{psup.icon} {psup.name} · </span>}
{p.cat} · {p.boxQty} {p.unit}/bal.
{p.sid==="pima"
?<span> · <b>{p.priceDPH.toFixed(2)} €</b> s DPH</span>
:<span> · <b>{p.price.toFixed(2)} €</b> bez DPH · {p.priceDPH.toFixed(2)} € s DPH</span>}
</div>
<div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap",marginTop:2}}>
{(()=>{const u=unitInfo(p);if(!u)return null;return(
<div style={{fontSize:10,color:BRAND.adriatic,fontWeight:600}}>
≈ {u.priceKs.toFixed(2)} €/ks · {u.priceUnit.toFixed(2)} €/{u.unit==="l"?"L":"kg"}
{u.size!==1&&<span style={{color:"#A08060",fontWeight:400}}> ({u.size.toFixed(2)} {u.unit==="l"?"L":"kg"}/ks)</span>}
</div>
);})()}
{cmp&&(cmp.cheaper||cmp.pricier)&&(
<div title={`Porovnanie s: ${cmp.other.name} (${SUPS[cmp.other.sid].name})`}
style={{display:"inline-flex",alignItems:"center",gap:3,fontSize:10,fontWeight:700,padding:"1px 6px",borderRadius:99,
background:cmp.cheaper?"#F0FDF4":"#FEF2F2",color:cmp.cheaper?BRAND.olive:BRAND.terracotta,border:`1px solid ${cmp.cheaper?"#6EE7B7":"#FCA5A5"}`}}>
{cmp.cheaper?"▼":"▲"} {Math.abs(cmp.diff).toFixed(2)} {cmp.label} ({Math.abs(cmp.pct).toFixed(0)}%)
</div>
)}
</div>
</div>
<button onClick={()=>toggle(p)}
style={{padding:"5px 10px",borderRadius:6,border:"none",cursor:"pointer",fontSize:11,fontWeight:600,flexShrink:0,
background:added?BRAND.olive:BRAND.caramel,color:added?"#fff":BRAND.espresso}}>
{added?"✓ V sklade":"+ Sklad"}
</button>
</div>
);
})}
</div>
</>}
</div>
);
}
function daysUntil(dateStr){
if(!dateStr)return null;
const d=new Date(dateStr);d.setHours(0,0,0,0);
const t=new Date();t.setHours(0,0,0,0);
return Math.round((d-t)/86400000);
}
function nextExpiry(item){
const list=(item.deliveries||[]).map(d=>d.expiry).filter(Boolean).sort();
return list.length?list[0]:null;
}
function lastDeliveryDate(item){
const list=(item.deliveries||[]).map(d=>d.date).filter(Boolean).sort();
return list.length?list[list.length-1]:null;
}
function extractDeliveryJSON(text){
const s=text.indexOf("[");const e=text.lastIndexOf("]");
if(s<0||e<s) throw new Error("V odpovedi sa nenašlo JSON pole položiek.");
return JSON.parse(text.slice(s,e+1));
}

function StockTab({ inventory, setInventory }) {
const [catF, setCatF] = useState("Všetko");
const [supF, setSupF] = useState("all");
const [search, setSearch] = useState("");
const [editing, setEditing] = useState(null);
const [receivingFor, setReceivingFor] = useState(null);
const [recvQty, setRecvQty] = useState("");
const [recvDate, setRecvDate] = useState(todayStr());
const [recvExpiry, setRecvExpiry] = useState("");
const [scanOpen, setScanOpen] = useState(false);
const cats = ["Všetko",...new Set(inventory.map(i=>i.cat))].sort();
const alerts = inventory.filter(i=>i.qty<i.minQty);
const filtered = inventory.filter(i=>{
const ms=i.name.toLowerCase().includes(search.toLowerCase());
const mc=catF==="Všetko"||i.cat===catF;
const ms2=supF==="all"||i.sid===supF;
return ms&&mc&&ms2;
});
const upd=(scm,f,v)=>setInventory(iv=>iv.map(i=>i.scm===scm?{...i,[f]:parseFloat(v)||0}:i));
const rem=scm=>setInventory(iv=>iv.filter(i=>i.scm!==scm));
const addDelivery=(scm,qty,date,expiry)=>{
const q=parseFloat(qty)||0;if(q<=0)return;
setInventory(iv=>iv.map(i=>i.scm===scm?{...i,qty:Math.round((i.qty+q)*100)/100,deliveries:[...(i.deliveries||[]),{id:"d"+Date.now(),date:date||todayStr(),qty:q,expiry:expiry||""}]}:i));
setReceivingFor(null);setRecvQty("");setRecvExpiry("");setRecvDate(todayStr());
};
return (
<div style={{padding:14,display:"flex",flexDirection:"column",gap:10}}>
{alerts.length>0&&(
<div style={{background:"#FEE2E2",border:"1px solid #FCA5A5",borderRadius:10,padding:"10px 14px"}}>
<div style={{fontSize:12,fontWeight:700,color:BRAND.terracotta,marginBottom:5}}>⚠️ Nízke zásoby ({alerts.length})</div>
{alerts.map(a=><div key={a.scm} style={{fontSize:11,color:BRAND.terracotta}}>• {a.name} — {a.qty} {a.unit} (min. {a.minQty})</div>)}
</div>
)}
{inventory.length===0&&(
<div style={{background:BRAND.crema,borderRadius:10,padding:"24px",textAlign:"center",color:BRAND.arabica,fontSize:12}}>
Sklad je prázdny.<br/>Pridaj produkty zo záložky <b>🏭 Dodávatelia</b> → <b>+ Sklad</b>.
</div>
)}
{inventory.length>0&&<>
<div style={{display:"flex",gap:5,overflowX:"auto"}}>
{[["all","Všetci"],...Object.entries(SUPS).map(([id,s])=>[id,`${s.icon} ${s.name}`])].map(([id,lbl])=>(
<button key={id} onClick={()=>setSupF(id)}
style={{flex:"0 0 auto",padding:"6px 10px",borderRadius:6,border:"none",cursor:"pointer",fontSize:10,fontWeight:600,whiteSpace:"nowrap",
background:supF===id?BRAND.espresso:BRAND.crema,color:supF===id?"#fff":BRAND.arabica}}>
{lbl}
</button>
))}
</div>
<div style={{display:"flex",gap:6}}>
<input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Hľadaj…"
style={{flex:1,padding:"7px 10px",borderRadius:7,border:"1px solid #E8E0D0",background:"#fff",fontSize:12,outline:"none"}}/>
<select value={catF} onChange={e=>setCatF(e.target.value)}
style={{padding:"7px 8px",borderRadius:7,border:"1px solid #E8E0D0",background:"#fff",fontSize:12}}>
{cats.map(c=><option key={c}>{c}</option>)}
</select>
</div>
<div style={{display:"flex",gap:6}}>
{[["Celkom",inventory.length],["Nízke",alerts.length],["OK",inventory.length-alerts.length]].map(([l,v])=>(
<div key={l} style={{flex:1,background:"#fff",borderRadius:8,border:"1px solid #E8E0D0",padding:"8px",textAlign:"center"}}>
<div style={{fontSize:18,fontWeight:700,color:l==="Nízke"&&v>0?BRAND.terracotta:BRAND.olive}}>{v}</div>
<div style={{fontSize:10,color:"#A08060"}}>{l}</div>
</div>
))}
</div>
<button onClick={()=>setScanOpen(true)} style={{padding:10,borderRadius:8,border:"none",background:BRAND.adriatic,color:"#fff",fontWeight:700,fontSize:12,cursor:"pointer"}}>
📥 Pridať dodací list (odfotiť / nahrať dokument)
</button>
<div style={{display:"flex",flexDirection:"column",gap:7}}>
{filtered.map(item=>{
const low=item.qty<item.minQty;
const pct=item.minQty>0?Math.min(100,Math.round((item.qty/item.minQty)*100)):100;
const bc=pct<50?BRAND.terracotta:pct<80?"#F59E0B":BRAND.olive;
const isE=editing===item.scm;
const supInfo=SUPS[item.sid];
return(
<div key={item.scm} style={{background:"#fff",borderRadius:10,border:"1px solid #E8E0D0",padding:"12px 14px",borderLeft:`4px solid ${low?BRAND.terracotta:BRAND.olive}`}}>
<div style={{display:"flex",alignItems:"flex-start",gap:8,marginBottom:8}}>
<div style={{flex:1}}>
<div style={{fontSize:12,fontWeight:600,color:BRAND.espresso}}>{item.name}</div>
<div style={{fontSize:10,color:"#A08060",marginTop:2}}>
{item.cat} · {item.boxQty} {item.unit}/bal.
{supInfo&&<span style={{marginLeft:6,padding:"1px 5px",borderRadius:4,background:supInfo.color+"20",color:supInfo.color,fontWeight:700,fontSize:9}}>{supInfo.icon} {supInfo.name}</span>}
</div>
</div>
<div style={{display:"flex",gap:4}}>
<button onClick={()=>{setReceivingFor(receivingFor===item.scm?null:item.scm);setRecvQty("");setRecvExpiry("");setRecvDate(todayStr());}}
style={{padding:"3px 8px",borderRadius:5,border:"none",cursor:"pointer",fontSize:11,fontWeight:600,background:receivingFor===item.scm?BRAND.adriatic:BRAND.crema,color:receivingFor===item.scm?"#fff":BRAND.arabica}}>
+ Príjem
</button>
<button onClick={()=>setEditing(isE?null:item.scm)}
style={{padding:"3px 8px",borderRadius:5,border:"none",cursor:"pointer",fontSize:11,fontWeight:600,background:isE?BRAND.olive:BRAND.crema,color:isE?"#fff":BRAND.arabica}}>
{isE?"✓":"✎"}
</button>
<button onClick={()=>rem(item.scm)}
style={{padding:"3px 8px",borderRadius:5,border:"none",cursor:"pointer",fontSize:11,background:"#FEE2E2",color:BRAND.terracotta}}>✕</button>
</div>
</div>
<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
<div style={{background:BRAND.latte,borderRadius:8,padding:"8px 10px",border:`1px solid ${low?"#FCA5A5":"#E8E0D0"}`}}>
<div style={{fontSize:10,color:"#A08060",marginBottom:3}}>📦 Na sklade</div>
{isE
?<input type="number" defaultValue={item.qty} step="0.5" min="0"
onChange={e=>upd(item.scm,"qty",e.target.value)}
style={{width:"100%",padding:"4px 6px",borderRadius:5,border:"1px solid #E8D0A0",fontSize:16,fontWeight:700,textAlign:"center"}}/>
:<div style={{fontSize:22,fontWeight:700,color:low?BRAND.terracotta:BRAND.olive,lineHeight:1}}>
{item.qty} <span style={{fontSize:11,fontWeight:400,color:"#A08060"}}>{item.unit}</span>
</div>
}
</div>
<div style={{background:BRAND.latte,borderRadius:8,padding:"8px 10px",border:"1px solid #E8E0D0"}}>
<div style={{fontSize:10,color:"#A08060",marginBottom:3}}>⚠️ Min. zásoby</div>
<div style={{display:"flex",alignItems:"center",gap:4}}>
<input type="number" value={item.minQty} step="1" min="0"
onChange={e=>upd(item.scm,"minQty",e.target.value)}
style={{flex:1,padding:"4px 6px",borderRadius:5,border:"1px solid #E8D0A0",fontSize:16,fontWeight:700,textAlign:"center"}}/>
<span style={{fontSize:11,color:"#A08060"}}>{item.unit}</span>
</div>
</div>
</div>
{receivingFor===item.scm&&(
<div style={{background:"#EAF2F8",borderRadius:8,padding:10,marginBottom:8,display:"flex",flexDirection:"column",gap:6}}>
<div style={{fontSize:10,color:BRAND.adriatic,fontWeight:700}}>📥 Príjem tovaru — pridať k zásobe</div>
<div style={{display:"flex",gap:6}}>
<input type="number" value={recvQty} onChange={e=>setRecvQty(e.target.value)} placeholder={`+ ks (${item.unit})`} step="0.5" min="0"
style={{flex:1,padding:"6px 8px",borderRadius:6,border:"1px solid #93C5FD",fontSize:12,outline:"none"}}/>
</div>
<div style={{display:"flex",gap:6,alignItems:"center"}}>
<span style={{fontSize:10,color:"#5B7A99",flexShrink:0,width:70}}>Dodané:</span>
<input type="date" value={recvDate} onChange={e=>setRecvDate(e.target.value)}
style={{flex:1,padding:"5px 7px",borderRadius:6,border:"1px solid #93C5FD",fontSize:11,outline:"none"}}/>
</div>
<div style={{display:"flex",gap:6,alignItems:"center"}}>
<span style={{fontSize:10,color:"#5B7A99",flexShrink:0,width:70}}>Spotreba do:</span>
<input type="date" value={recvExpiry} onChange={e=>setRecvExpiry(e.target.value)}
style={{flex:1,padding:"5px 7px",borderRadius:6,border:"1px solid #93C5FD",fontSize:11,outline:"none"}}/>
</div>
<button onClick={()=>addDelivery(item.scm,recvQty,recvDate,recvExpiry)} disabled={!recvQty}
style={{padding:8,borderRadius:7,border:"none",background:BRAND.olive,color:"#fff",fontWeight:700,fontSize:12,cursor:recvQty?"pointer":"default",opacity:recvQty?1:0.5}}>
✓ Pridať {recvQty||0} {item.unit} k zásobe
</button>
</div>
)}
{(lastDeliveryDate(item)||nextExpiry(item))&&(()=>{
const exp=nextExpiry(item);const dleft=daysUntil(exp);
const expColor=dleft===null?"#A08060":dleft<0?BRAND.terracotta:dleft<=3?BRAND.terracotta:dleft<=7?"#B45309":"#A08060";
return(
<div style={{fontSize:10,color:"#A08060",marginBottom:8,display:"flex",gap:10,flexWrap:"wrap"}}>
{lastDeliveryDate(item)&&<span>🗓 Posledná dodávka: {new Date(lastDeliveryDate(item)).toLocaleDateString("sk")}</span>}
{exp&&<span style={{color:expColor,fontWeight:dleft!==null&&dleft<=7?700:400}}>⏳ Spotreba do: {new Date(exp).toLocaleDateString("sk")}{dleft!==null&&dleft<=7?(dleft<0?" (PREŠLA!)":` (${dleft} dní)`):""}</span>}
</div>
);
})()}
<div style={{display:"flex",alignItems:"center",gap:8}}>
<div style={{flex:1,height:6,background:"#E8E0D0",borderRadius:99,overflow:"hidden"}}>
<div style={{height:"100%",width:pct+"%",background:bc,borderRadius:99,transition:"width .3s"}}/>
</div>
<span style={{fontSize:10,color:bc,fontWeight:600,minWidth:30,textAlign:"right"}}>{pct}%</span>
{low&&<span style={{fontSize:10,background:"#FEE2E2",color:BRAND.terracotta,padding:"1px 6px",borderRadius:99,fontWeight:700}}>OBJEDNAJ</span>}
</div>
</div>
);
})}
</div>
</>}
{scanOpen&&<ScanDeliveryModal inventory={inventory} setInventory={setInventory} onClose={()=>setScanOpen(false)}/>}
</div>
);
}

function ScanDeliveryModal({inventory,setInventory,onClose}){
const[status,setStatus]=useState("idle"); // idle|reading|parsing|preview|error
const[fileName,setFileName]=useState("");
const[rows,setRows]=useState([]); // {name,qty,unit,match:scm|null}
const[errMsg,setErrMsg]=useState("");
const[deliveryDate,setDeliveryDate]=useState(todayStr());
const fileRef=useRef();
const camRef=useRef();

const matchBest=name=>{
let best=null,bestScore=0;
inventory.forEach(it=>{const s=mScore(name,it.name);if(s>bestScore){bestScore=s;best=it.scm;}});
return bestScore>=0.4?best:null;
};

const handleFile=file=>{
setFileName(file.name);setStatus("reading");setErrMsg("");
const reader=new FileReader();
reader.onload=async ev=>{
setStatus("parsing");
const dataUrl=ev.target.result;
const base64=dataUrl.split(",")[1];
const isPdf=file.type==="application/pdf";
try{
const res=await fetch("/api/anthropic",{
method:"POST",
headers:{"Content-Type":"application/json"},
body:JSON.stringify({
model:"claude-sonnet-4-6",
max_tokens:2000,
system:"You are a data extraction API. Return ONLY a valid JSON array, nothing else, no markdown.",
messages:[{role:"user",content:[
isPdf
?{type:"document",source:{type:"base64",media_type:"application/pdf",data:base64}}
:{type:"image",source:{type:"base64",media_type:file.type||"image/jpeg",data:base64}},
{type:"text",text:`Toto je dodací list / faktúra od dodávateľa. Vypíš všetky dodané položky tovaru. Vráť IBA JSON pole v tvare [{"name":"názov položky","qty":číslo,"unit":"jednotka napr. ks/kg/L"}]. Ak je na dokumente viditeľný dátum spotreby/exspirácie pre niektorú položku, pridaj pole "expiry":"YYYY-MM-DD". Žiadny iný text, len JSON pole.`}
]}]
})
});
const data=await res.json();
if(data.error) throw new Error(data.error.message);
const text=data.content?.[0]?.text||"";
const items=extractDeliveryJSON(text);
if(!Array.isArray(items)||!items.length) throw new Error("Nenašli sa žiadne položky.");
const withMatch=items.map(it=>({
name:it.name||"?",qty:parseFloat(it.qty)||0,unit:it.unit||"ks",expiry:it.expiry||"",
match:matchBest(it.name||"")
}));
setRows(withMatch);
setStatus("preview");
}catch(e){setErrMsg("Chyba: "+e.message);setStatus("error");}
};
reader.readAsDataURL(file);
};

const onFileInput=e=>{const f=e.target.files?.[0];if(f)handleFile(f);e.target.value="";};
const updRow=(i,f,v)=>setRows(rs=>rs.map((r,idx)=>idx===i?{...r,[f]:v}:r));
const confirmApply=()=>{
setInventory(iv=>{
let next=iv;
rows.forEach(r=>{
if(!r.match||!r.qty)return;
next=next.map(it=>it.scm===r.match?{...it,qty:Math.round((it.qty+r.qty)*100)/100,deliveries:[...(it.deliveries||[]),{id:"d"+Date.now()+Math.random().toString(36).slice(2,4),date:deliveryDate,qty:r.qty,expiry:r.expiry||""}]}:it);
});
return next;
});
onClose();
};

return(
<div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.5)",zIndex:60,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
<div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:12,padding:18,width:"100%",maxWidth:420,maxHeight:"85vh",overflowY:"auto",display:"flex",flexDirection:"column",gap:10}}>
<div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
<div style={{fontSize:14,fontWeight:700,color:BRAND.espresso}}>📥 Dodací list</div>
<button onClick={onClose} style={{background:"none",border:"none",fontSize:18,color:"#A08060",cursor:"pointer"}}>✕</button>
</div>

{status==="idle"&&(<>
<div style={{fontSize:11,color:"#A08060"}}>Odfoť dodací list alebo nahraj naskenovaný dokument (PDF/foto) — AI automaticky vyčíta dodané položky a množstvá.</div>
<input ref={camRef} type="file" accept="image/*" capture="environment" onChange={onFileInput} style={{display:"none"}}/>
<input ref={fileRef} type="file" accept="image/*,.pdf" onChange={onFileInput} style={{display:"none"}}/>
<button onClick={()=>camRef.current.click()} style={{padding:11,borderRadius:8,border:"none",background:BRAND.olive,color:"#fff",fontWeight:700,fontSize:12,cursor:"pointer"}}>📷 Odfotiť dodací list</button>
<button onClick={()=>fileRef.current.click()} style={{padding:11,borderRadius:8,border:"1px solid #E8E0D0",background:"#fff",color:BRAND.arabica,fontWeight:700,fontSize:12,cursor:"pointer"}}>📂 Nahrať dokument (PDF/foto)</button>
</>)}

{(status==="reading"||status==="parsing")&&(
<div style={{textAlign:"center",padding:"20px 0"}}>
<div style={{fontSize:13,fontWeight:600,color:BRAND.adriatic}}>{status==="reading"?"📂 Čítam súbor…":"🤖 AI rozpoznáva položky…"}</div>
<div style={{fontSize:11,color:"#A08060",marginTop:4}}>{fileName}</div>
</div>
)}

{status==="error"&&(<>
<div style={{color:BRAND.terracotta,fontSize:12,background:"#FEE2E2",padding:"8px 10px",borderRadius:7}}>{errMsg}</div>
<button onClick={()=>setStatus("idle")} style={{padding:9,borderRadius:7,border:"1px solid #E8E0D0",background:"#fff",color:BRAND.arabica,fontSize:12,cursor:"pointer"}}>Skúsiť znova</button>
</>)}

{status==="preview"&&(<>
<div style={{fontSize:11,fontWeight:700,color:BRAND.olive}}>✅ Rozpoznaných {rows.length} položiek — priraď ku skladu:</div>
<div style={{display:"flex",alignItems:"center",gap:8}}>
<span style={{fontSize:10,color:"#A08060",flexShrink:0}}>Dátum dodania:</span>
<input type="date" value={deliveryDate} onChange={e=>setDeliveryDate(e.target.value)}
style={{flex:1,padding:"6px 8px",borderRadius:6,border:"1px solid #E8E0D0",fontSize:11,outline:"none"}}/>
</div>
<div style={{display:"flex",flexDirection:"column",gap:7}}>
{rows.map((r,i)=>(
<div key={i} style={{background:r.match?"#F0FDF4":"#FEF3C7",border:`1px solid ${r.match?"#6EE7B7":"#FCD34D"}`,borderRadius:8,padding:9}}>
<div style={{fontSize:11,fontWeight:600,color:BRAND.espresso,marginBottom:5}}>{r.name}</div>
<div style={{display:"flex",gap:6,marginBottom:5}}>
<input type="number" value={r.qty} onChange={e=>updRow(i,"qty",parseFloat(e.target.value)||0)} style={{width:64,padding:"5px 7px",borderRadius:6,border:"1px solid #E8E0D0",fontSize:11,textAlign:"center"}}/>
<span style={{fontSize:11,color:"#A08060",alignSelf:"center"}}>{r.unit}</span>
<input type="date" value={r.expiry} onChange={e=>updRow(i,"expiry",e.target.value)} placeholder="Spotreba (voliteľné)"
style={{flex:1,padding:"5px 7px",borderRadius:6,border:"1px solid #E8E0D0",fontSize:11}}/>
</div>
<select value={r.match||""} onChange={e=>updRow(i,"match",e.target.value||null)}
style={{width:"100%",padding:"6px 7px",borderRadius:6,border:"1px solid #E8E0D0",fontSize:11}}>
<option value="">— Nepriradiť (vynechať) —</option>
{inventory.map(it=><option key={it.scm} value={it.scm}>{it.name}</option>)}
</select>
{!r.match&&<div style={{fontSize:9,color:"#92400E",marginTop:3}}>⚠️ Nenašla sa zhoda — vyber položku zo skladu alebo vynechaj.</div>}
</div>
))}
</div>
<button onClick={confirmApply} style={{padding:10,borderRadius:8,border:"none",background:BRAND.olive,color:"#fff",fontWeight:700,fontSize:12,cursor:"pointer"}}>
✓ Pripočítať k zásobám ({rows.filter(r=>r.match).length} položiek)
</button>
<button onClick={()=>{setStatus("idle");setRows([]);}} style={{padding:8,borderRadius:7,border:"1px solid #E8E0D0",background:"none",color:"#A08060",fontSize:11,cursor:"pointer"}}>Zrušiť</button>
</>)}
</div>
</div>
);
}
const EQUIPMENT_CATEGORIES=["Mobiliár","Tienenie","Kuchyňa","Bar","Technika","Hygiena","Bezpečnosť","Ostatné"];
const LOCATIONS=["Bar","Terasa","Kuchyňa","Sklad"];
const EQUIPMENT_INITIAL=[
{id:"eq1",name:"Stôl terasový (4-osobový)",cat:"Mobiliár",location:"Terasa",qty:6,minQty:4,condition:"Nové",note:"",owner:"prevadzka",ownerDetail:"",photo:"",icon:"",nextRevision:"",serviceContact:""},
{id:"eq2",name:"Stolička terasová",cat:"Mobiliár",location:"Terasa",qty:24,minQty:16,condition:"Nové",note:"",owner:"prevadzka",ownerDetail:"",photo:"",icon:"",nextRevision:"",serviceContact:""},
{id:"eq3",name:"Slnečník 2,5m",cat:"Tienenie",location:"Terasa",qty:4,minQty:3,condition:"Nové",note:"",owner:"prevadzka",ownerDetail:"",photo:"",icon:"",nextRevision:"",serviceContact:""},
{id:"eq4",name:"Dáždnik / pivný stojan",cat:"Tienenie",location:"Terasa",qty:2,minQty:2,condition:"Nové",note:"",owner:"prevadzka",ownerDetail:"",photo:"",icon:"",nextRevision:"",serviceContact:""},
{id:"eq7",name:"Kávovar",cat:"Bar",location:"Bar",qty:1,minQty:1,condition:"Nové",note:"",owner:"firma",ownerDetail:"",photo:"",icon:"",nextRevision:"",serviceContact:""},
{id:"eq8",name:"Mixér na koktaily",cat:"Bar",location:"Bar",qty:1,minQty:1,condition:"Nové",note:"",owner:"firma",ownerDetail:"",photo:"",icon:"",nextRevision:"",serviceContact:""},
{id:"eq9",name:"Chladnička pod pultom",cat:"Kuchyňa",location:"Kuchyňa",qty:2,minQty:1,condition:"Nové",note:"",owner:"firma",ownerDetail:"",photo:"",icon:"",nextRevision:"",serviceContact:""},
{id:"eq10",name:"Mraznička",cat:"Kuchyňa",location:"Kuchyňa",qty:1,minQty:1,condition:"Nové",note:"",owner:"firma",ownerDetail:"",photo:"",icon:"",nextRevision:"",serviceContact:""},
{id:"eq11",name:"Hasiaci prístroj",cat:"Bezpečnosť",location:"Bar",qty:2,minQty:2,condition:"Nové",note:"",owner:"prevadzka",ownerDetail:"",photo:"",icon:"",nextRevision:"",serviceContact:""},
{id:"eq12",name:"Lekárnička",cat:"Bezpečnosť",location:"Bar",qty:1,minQty:1,condition:"Nové",note:"",owner:"prevadzka",ownerDetail:"",photo:"",icon:"",nextRevision:"",serviceContact:""},
{id:"eq13",name:"Dezinfekcia na ruky (stojan)",cat:"Hygiena",location:"Bar",qty:3,minQty:2,condition:"Nové",note:"",owner:"prevadzka",ownerDetail:"",photo:"",icon:"",nextRevision:"",serviceContact:""},
{id:"eq14",name:"Odpadkové koše",cat:"Hygiena",location:"Terasa",qty:4,minQty:3,condition:"Nové",note:"",owner:"prevadzka",ownerDetail:"",photo:"",icon:"",nextRevision:"",serviceContact:""},
{id:"eq15",name:"Pákový kávovar (espresso)",cat:"Bar",location:"Bar",qty:1,minQty:1,condition:"Nové",note:"",owner:"firma",ownerDetail:"",photo:"",icon:"☕"},
{id:"eq16",name:"Mlynček na kávu",cat:"Bar",location:"Bar",qty:1,minQty:1,condition:"Nové",note:"",owner:"firma",ownerDetail:"",photo:"",icon:"",nextRevision:"",serviceContact:""},
{id:"eq17",name:"Výčapné zariadenie (pivný tower)",cat:"Bar",location:"Bar",qty:1,minQty:1,condition:"Nové",note:"",owner:"firma",ownerDetail:"",photo:"",icon:"🍺"},
{id:"eq18",name:"Chladiaca vitrína na nápoje",cat:"Bar",location:"Bar",qty:1,minQty:1,condition:"Nové",note:"",owner:"firma",ownerDetail:"",photo:"",icon:"",nextRevision:"",serviceContact:""},
{id:"eq19",name:"Výrobník ľadu",cat:"Bar",location:"Bar",qty:1,minQty:1,condition:"Nové",note:"",owner:"firma",ownerDetail:"",photo:"",icon:"🧊"},
{id:"eq20",name:"POS systém / pokladňa",cat:"Technika",location:"Bar",qty:1,minQty:1,condition:"Nové",note:"",owner:"firma",ownerDetail:"",photo:"",icon:"",nextRevision:"",serviceContact:""},
{id:"eq21",name:"Umývačka riadu",cat:"Kuchyňa",location:"Kuchyňa",qty:1,minQty:1,condition:"Nové",note:"",owner:"firma",ownerDetail:"",photo:"",icon:"",nextRevision:"",serviceContact:""},
{id:"eq22",name:"Indukčná varná platnička",cat:"Kuchyňa",location:"Kuchyňa",qty:1,minQty:1,condition:"Nové",note:"",owner:"firma",ownerDetail:"",photo:"",icon:"🔥"},
{id:"eq23",name:"Toaster / grilovacie zariadenie",cat:"Kuchyňa",location:"Kuchyňa",qty:1,minQty:1,condition:"Nové",note:"",owner:"firma",ownerDetail:"",photo:"",icon:"",nextRevision:"",serviceContact:""},
{id:"eq24",name:"Servírovací vozík",cat:"Mobiliár",location:"Terasa",qty:1,minQty:1,condition:"Nové",note:"",owner:"prevadzka",ownerDetail:"",photo:"",icon:"",nextRevision:"",serviceContact:""},
{id:"eq5",name:"Parná sprcha",cat:"Ostatné",qty:1,minQty:1,condition:"Nové",note:"Bazos, Trenčianske Teplice · wellness",owner:"osobne",ownerDetail:"",photo:"",icon:"",nextRevision:"",serviceContact:""},
{id:"eq6",name:"Výrivka",cat:"Ostatné",qty:1,minQty:1,condition:"Nové",note:"wellness",owner:"osobne",ownerDetail:"",photo:"",icon:"",nextRevision:"",serviceContact:""},
];

const OWNER_TYPES=[
{id:"firma",label:"🏢 Firma",color:BRAND.adriatic},
{id:"prevadzka",label:"🏪 Prevádzka",color:BRAND.olive},
{id:"osobne",label:"👤 Os. vlastníctvo",color:"#5B21B6"},
{id:"dodavatel",label:"🚚 Dodávateľ",color:BRAND.terracotta},
];
const OWNER_NAMES=["Martin","Jana","Peter","Zuzka","Admin"];
function ownerLabel(item){
const t=OWNER_TYPES.find(o=>o.id===item.owner);
if(!t) return null;
if(item.owner==="osobne") return `${t.label}${item.ownerDetail?": "+item.ownerDetail:""}`;
if(item.owner==="dodavatel") return `${t.label}${item.ownerDetail&&SUPS[item.ownerDetail]?": "+SUPS[item.ownerDetail].name:""}`;
return t.label;
}

const ICONS_BY_CAT={
"Mobiliár":["🪑","🛋️","🛏️","🪞","🚪","🗄️","🪟","🧺"],
"Tienenie":["⛱️","☂️","🌳","🏖️","🎪","🌴"],
"Bar":["☕","🍹","🍸","🧋","🍺","🍷","🥃","🧊","🍾","🥤","🍶","🧉"],
"Kuchyňa":["🍽️","🔥","❄️","🧊","🍳","🥘","🔪","🧁","🍕","🥐","🧇","🍰"],
"Technika":["🔧","💻","📺","🔌","🔋","🖥️","📡","⚙️","🧰","💡","🔊","📠"],
"Hygiena":["🧴","🧹","🧼","🗑️","🧽","🚿","🧻","🪣"],
"Bezpečnosť":["🧯","🩹","🚨","⛑️","🔒","📷","🚪","⚠️"],
"Ostatné":["📦","🏷️","✨","🔖","📋","🗂️"],
};
const ALL_ICONS=[...new Set(Object.values(ICONS_BY_CAT).flat())];
const AVATAR_ICONS=["👨‍🍳","👩‍🍳","🧑‍🍳","👨‍💼","👩‍💼","🧑‍💼","👤","🧔","👱‍♀️","👨‍🦱","👩‍🦰","🧑‍🦲","👴","👵","🙂"];

function PhotoBox({photo,icon,cat,icons,onPhoto,onIcon,size=56}){
const ref=useRef();
const[lb,setLb]=useState(false);
const[picker,setPicker]=useState(false);
const onFile=e=>{
const f=e.target.files?.[0];if(!f||!f.type.startsWith("image/"))return;
const r=new FileReader();r.onload=ev=>{onPhoto(ev.target.result);setPicker(false);};r.readAsDataURL(f);
e.target.value="";
};
const suggested=icons||ICONS_BY_CAT[cat]||ALL_ICONS.slice(0,5);
return(
<div style={{position:"relative",flexShrink:0}}>
{lb&&photo&&<div onClick={()=>setLb(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.85)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",cursor:"zoom-out"}}>
<img src={photo} alt="" style={{maxWidth:"90vw",maxHeight:"85vh",borderRadius:10}}/>
<button onClick={()=>setLb(false)} style={{position:"absolute",top:14,right:18,background:"none",border:"none",color:"#fff",fontSize:26,cursor:"pointer"}}>✕</button>
</div>}
<input ref={ref} type="file" accept="image/*" onChange={onFile} style={{display:"none"}}/>
{photo
?<div style={{position:"relative"}}>
<img src={photo} alt="" onClick={()=>setLb(true)} style={{width:size,height:size,objectFit:"cover",borderRadius:8,border:"1px solid #E8E0D0",cursor:"zoom-in"}}/>
<button onClick={()=>setPicker(v=>!v)} style={{position:"absolute",bottom:-4,right:-4,width:18,height:18,borderRadius:"50%",background:BRAND.caramel,border:"1px solid #fff",color:BRAND.espresso,fontSize:9,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>✎</button>
</div>
:icon
?<div onClick={()=>setPicker(v=>!v)} style={{width:size,height:size,borderRadius:8,border:"1px solid #E8E0D0",background:BRAND.crema,fontSize:size*0.5,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>{icon}</div>
:<button onClick={()=>setPicker(v=>!v)} style={{width:size,height:size,borderRadius:8,border:"1.5px dashed #E8E0D0",background:BRAND.crema,color:"#A08060",fontSize:20,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>}
{picker&&(
<div style={{position:"absolute",top:size+6,left:0,zIndex:40,background:"#fff",border:"1px solid #E8E0D0",borderRadius:9,padding:9,boxShadow:"0 4px 16px rgba(0,0,0,.15)",width:185}}>
<div style={{fontSize:9,color:"#A08060",marginBottom:5,fontWeight:700}}>Ikona ({cat||"Ostatné"}):</div>
<div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:7}}>
{suggested.map(ic=>(
<button key={ic} onClick={()=>{onIcon(ic);setPicker(false);}}
style={{fontSize:18,width:28,height:28,padding:0,borderRadius:6,border:`1px solid ${icon===ic?BRAND.caramel:"#E8E0D0"}`,background:icon===ic?BRAND.crema:"#fff",cursor:"pointer"}}>{ic}</button>
))}
</div>
<button onClick={()=>ref.current.click()} style={{width:"100%",padding:"7px",borderRadius:6,border:"none",background:BRAND.olive,color:"#fff",fontSize:11,fontWeight:600,cursor:"pointer",marginBottom:4}}>📂 Z zariadenia (foto)</button>
<button onClick={()=>setPicker(false)} style={{width:"100%",padding:"5px",borderRadius:6,border:"1px solid #E8E0D0",background:"none",color:"#A08060",fontSize:10,cursor:"pointer"}}>Zavrieť</button>
</div>
)}
</div>
);
}

function EquipmentTab(){
const[equipment,setEquipment]=usePersistentState("cp_equipment",EQUIPMENT_INITIAL);
const[catF,setCatF]=useState("Všetko");
const[editing,setEditing]=useState(null);
const[adding,setAdding]=useState(false);
const[form,setForm]=useState({name:"",cat:"Mobiliár",location:"Bar",customLocation:"",qty:1,minQty:1,condition:"Nové",note:"",owner:"prevadzka",ownerDetail:"",photo:"",icon:"",nextRevision:"",serviceContact:""});
const cats=["Všetko",...EQUIPMENT_CATEGORIES];
const[stavF,setStavF]=useState("Všetko");
const[ioMsg,setIoMsg]=useState("");
const fileRef=useRef();
const filtered=equipment.filter(e=>(catF==="Všetko"||e.cat===catF)&&(stavF==="Všetko"||e.condition===stavF));
const alerts=equipment.filter(e=>e.qty<e.minQty);
const broken=equipment.filter(e=>e.condition==="Poškodené"||e.condition==="Nefunkčné");
const upd=(id,f,v)=>setEquipment(eq=>eq.map(e=>e.id===id?{...e,[f]:f==="qty"||f==="minQty"?(parseFloat(v)||0):v}:e));
const rem=id=>setEquipment(eq=>eq.filter(e=>e.id!==id));

const EXPORT_COLS=["id","name","cat","location","qty","minQty","condition","owner","ownerDetail","note","serviceContact","nextRevision","icon"];
const csvEscape=v=>{const s=String(v??"");return/[",;\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s;};
const download=(content,filename,mime)=>{
const blob=new Blob([content],{type:mime});
const url=URL.createObjectURL(blob);
const a=document.createElement("a");a.href=url;a.download=filename;document.body.appendChild(a);a.click();
document.body.removeChild(a);URL.revokeObjectURL(url);
};
const exportCSV=()=>{
const rows=[EXPORT_COLS.join(";"),...equipment.map(e=>EXPORT_COLS.map(c=>csvEscape(e[c])).join(";"))];
download("\uFEFF"+rows.join("\n"),"inventar_vybavenie.csv","text/csv;charset=utf-8");
setIoMsg("✓ Exportované do CSV (otvor v Exceli/Numbers/Sheets).");
};
const exportJSON=()=>{
download(JSON.stringify(equipment,null,2),"inventar_vybavenie.json","application/json");
setIoMsg("✓ Exportované do JSON.");
};
const exportPDF=()=>{
const rows=equipment.map(e=>`<tr>
<td>${e.name||""}</td><td>${e.cat||""}</td><td style="text-align:center">${e.qty}</td><td style="text-align:center">${e.minQty}</td>
<td>${e.condition||""}</td><td>${ownerLabel(e)||""}</td><td>${e.note||""}</td><td>${e.serviceContact||""}</td><td>${e.nextRevision||""}</td>
</tr>`).join("");
const html=`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Inventár vybavenia — Cafe Paradise</title>
<style>
body{font-family:Arial,Helvetica,sans-serif;color:#2C1A0E;padding:24px;}
h1{font-size:18px;margin-bottom:2px;}
.sub{font-size:11px;color:#A08060;margin-bottom:16px;}
table{width:100%;border-collapse:collapse;font-size:11px;}
th{background:#2C1A0E;color:#fff;text-align:left;padding:6px 8px;}
td{padding:5px 8px;border-bottom:1px solid #E8E0D0;}
tr:nth-child(even){background:#FAF7F0;}
@media print{body{padding:0;}}
</style></head><body>
<h1>🪑 Inventár technického vybavenia</h1>
<div class="sub">Cafe Paradise · Exportované ${new Date().toLocaleDateString("sk")} · ${equipment.length} položiek</div>
<table><thead><tr><th>Názov</th><th>Kategória</th><th>Ks</th><th>Min.</th><th>Stav</th><th>Majetok</th><th>Popis</th><th>Servis</th><th>Revízia</th></tr></thead>
<tbody>${rows}</tbody></table>
</body></html>`;
const win=window.open("","_blank");
if(!win){setIoMsg("✕ Prehliadač zablokoval otvorenie okna. Povoľ vyskakovacie okná pre export do PDF.");return;}
win.document.write(html);win.document.close();
win.onload=()=>{win.focus();win.print();};
setIoMsg("✓ Otvorené tlačové okno — vyber \"Uložiť ako PDF\" v dialógu tlače.");
};
const parseCSV=text=>{
const lines=text.replace(/^\uFEFF/,"").split(/\r?\n/).filter(l=>l.trim());
if(!lines.length)return[];
const sep=lines[0].includes(";")?";":",";
const splitLine=l=>{const out=[];let cur="",inQ=false;
for(let i=0;i<l.length;i++){const ch=l[i];
if(inQ){if(ch==='"'){if(l[i+1]==='"'){cur+='"';i++;}else inQ=false;}else cur+=ch;}
else{if(ch==='"')inQ=true;else if(ch===sep){out.push(cur);cur="";}else cur+=ch;}}
out.push(cur);return out;};
const headers=splitLine(lines[0]);
return lines.slice(1).map(l=>{const vals=splitLine(l);const obj={};headers.forEach((h,i)=>obj[h]=vals[i]??"");
return{id:obj.id||"eq"+Date.now()+Math.random().toString(36).slice(2,5),name:obj.name||"",cat:obj.cat||"Ostatné",
qty:parseFloat(obj.qty)||0,minQty:parseFloat(obj.minQty)||0,condition:obj.condition||"Nové",
owner:obj.owner||"prevadzka",ownerDetail:obj.ownerDetail||"",note:obj.note||"",
serviceContact:obj.serviceContact||"",nextRevision:obj.nextRevision||"",icon:obj.icon||"",photo:""};
});
};
const handleImport=e=>{
const file=e.target.files?.[0];if(!file)return;
const reader=new FileReader();
reader.onload=ev=>{
try{
let imported;
if(file.name.toLowerCase().endsWith(".json")) imported=JSON.parse(ev.target.result);
else imported=parseCSV(ev.target.result);
if(!Array.isArray(imported)||!imported.length) throw new Error("Žiadne položky v súbore.");
setEquipment(eq=>{
const existingIds=new Set(eq.map(x=>x.id));
const merged=[...eq];
imported.forEach(it=>{
if(existingIds.has(it.id)){const idx=merged.findIndex(x=>x.id===it.id);merged[idx]={...merged[idx],...it};}
else merged.push({photo:"",icon:"",nextRevision:"",serviceContact:"",ownerDetail:"",...it});
});
return merged;
});
setIoMsg(`✓ Importovaných ${imported.length} položiek.`);
}catch(err){setIoMsg("✕ Chyba importu: "+err.message);}
};
file.name.toLowerCase().endsWith(".json")?reader.readAsText(file):reader.readAsText(file,"utf-8");
e.target.value="";
};
const addNew=()=>{
if(!form.name.trim())return;
const finalLocation=form.location==="__custom"?(form.customLocation.trim()||"Iné"):form.location;
setEquipment(eq=>[...eq,{id:"eq"+Date.now(),...form,location:finalLocation,qty:parseFloat(form.qty)||0,minQty:parseFloat(form.minQty)||0}]);
setForm({name:"",cat:"Mobiliár",location:"Bar",customLocation:"",qty:1,minQty:1,condition:"Nové",note:"",owner:"prevadzka",ownerDetail:"",photo:"",icon:"",nextRevision:"",serviceContact:""});setAdding(false);
};
const CC={"Nové":"#D1FAE5","Zánovné":"#DBEAFE","Poškodené":"#FEF3C7","Nefunkčné":"#FEE2E2"};
const CT={"Nové":BRAND.olive,"Zánovné":BRAND.adriatic,"Poškodené":"#92400E","Nefunkčné":BRAND.terracotta};
return(
<div style={{padding:14,display:"flex",flexDirection:"column",gap:10}}>
<div style={{background:BRAND.crema,borderRadius:8,padding:"8px 12px",fontSize:11,color:BRAND.arabica}}>
🪑 Technické vybavenie prevádzky — stoly, stoličky, slnečníky, dáždniky a iné zariadenie (nesúvisí s dodávateľmi nápojov/tovaru).
</div>
<div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
<input ref={fileRef} type="file" accept=".csv,.json" onChange={handleImport} style={{display:"none"}}/>
<button onClick={()=>fileRef.current.click()} style={{flex:"0 0 auto",padding:"7px 12px",borderRadius:7,border:"1px solid #E8E0D0",background:"#fff",color:BRAND.adriatic,fontSize:11,fontWeight:600,cursor:"pointer"}}>📥 Import (CSV/JSON)</button>
<button onClick={exportCSV} style={{flex:"0 0 auto",padding:"7px 12px",borderRadius:7,border:"none",background:BRAND.crema,color:BRAND.arabica,fontSize:11,fontWeight:600,cursor:"pointer"}}>📤 Export CSV</button>
<button onClick={exportJSON} style={{flex:"0 0 auto",padding:"7px 12px",borderRadius:7,border:"none",background:BRAND.crema,color:BRAND.arabica,fontSize:11,fontWeight:600,cursor:"pointer"}}>📤 Export JSON</button>
<button onClick={exportPDF} style={{flex:"0 0 auto",padding:"7px 12px",borderRadius:7,border:"none",background:BRAND.crema,color:BRAND.arabica,fontSize:11,fontWeight:600,cursor:"pointer"}}>📄 Export PDF</button>
</div>
{ioMsg&&<div style={{fontSize:11,color:ioMsg.startsWith("✕")?BRAND.terracotta:BRAND.olive,fontWeight:600}}>{ioMsg}</div>}
{(alerts.length>0||broken.length>0)&&(
<div style={{background:"#FEE2E2",border:"1px solid #FCA5A5",borderRadius:10,padding:"10px 14px"}}>
{alerts.length>0&&<div style={{fontSize:11,color:BRAND.terracotta,marginBottom:2}}>⚠️ Nízky počet: {alerts.map(a=>a.name).join(", ")}</div>}
{broken.length>0&&<div style={{fontSize:11,color:BRAND.terracotta}}>🔧 Vyžaduje pozornosť: {broken.map(b=>`${b.name} (${b.condition})`).join(", ")}</div>}
</div>
)}
<div style={{display:"flex",gap:5,overflowX:"auto"}}>
{cats.map(c=>(
<button key={c} onClick={()=>setCatF(c)}
style={{flex:"0 0 auto",padding:"6px 12px",borderRadius:99,border:"none",cursor:"pointer",fontSize:11,fontWeight:600,whiteSpace:"nowrap",
background:catF===c?BRAND.espresso:BRAND.crema,color:catF===c?"#fff":BRAND.arabica}}>
{c}
</button>
))}
</div>
<div style={{display:"flex",gap:5,overflowX:"auto"}}>
{["Všetko",...Object.keys(CC)].map(s=>(
<button key={s} onClick={()=>setStavF(s)}
style={{flex:"0 0 auto",padding:"5px 11px",borderRadius:99,border:`1px solid ${stavF===s?(CT[s]||BRAND.espresso):"#E8E0D0"}`,cursor:"pointer",fontSize:11,fontWeight:600,whiteSpace:"nowrap",
background:stavF===s?(CC[s]||BRAND.crema):"#fff",color:stavF===s?(CT[s]||BRAND.espresso):"#A08060"}}>
{s}
</button>
))}
</div>
<button onClick={()=>setAdding(v=>!v)}
style={{padding:9,borderRadius:8,border:"1.5px dashed #E8E0D0",background:adding?BRAND.crema:"transparent",color:BRAND.arabica,fontSize:12,cursor:"pointer",fontWeight:600}}>
{adding?"✕ Zrušiť":"+ Pridať vybavenie"}
</button>
{adding&&(
<div style={{background:"#fff",borderRadius:10,border:"1px solid #E8E0D0",padding:12,display:"flex",flexDirection:"column",gap:6}}>
<div style={{display:"flex",alignItems:"center",gap:8}}>
<PhotoBox photo={form.photo} icon={form.icon} cat={form.cat} onPhoto={src=>setForm(f=>({...f,photo:src}))} onIcon={ic=>setForm(f=>({...f,icon:ic}))}/>
<input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Názov (napr. Stôl terasový)"
style={{flex:1,padding:"7px 10px",borderRadius:7,border:"1px solid #E8E0D0",fontSize:12,outline:"none"}}/>
<div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:BRAND.latte,borderRadius:8,border:"1px solid #E8D0A0",padding:"6px 12px",minWidth:64,flexShrink:0}}>
<div style={{fontSize:9,color:"#A08060",marginBottom:2}}>Počet ks</div>
<input type="number" value={form.qty} onChange={e=>setForm(f=>({...f,qty:e.target.value}))}
style={{width:48,padding:"3px 4px",borderRadius:5,border:"1px solid #E8D0A0",fontSize:14,fontWeight:700,textAlign:"center",outline:"none"}}/>
</div>
</div>
<div style={{fontSize:10,color:"#A08060",fontWeight:600,marginTop:2}}>Kategória:</div>
<div style={{display:"flex",gap:5,overflowX:"auto"}}>
{EQUIPMENT_CATEGORIES.map(c=>(
<button key={c} onClick={()=>setForm(f=>({...f,cat:c}))}
style={{flex:"0 0 auto",padding:"6px 10px",borderRadius:99,border:"none",cursor:"pointer",fontSize:11,fontWeight:600,whiteSpace:"nowrap",
background:form.cat===c?BRAND.espresso:BRAND.crema,color:form.cat===c?"#fff":BRAND.arabica}}>
{c}
</button>
))}
</div>
<div style={{fontSize:10,color:"#A08060",fontWeight:600,marginTop:2}}>Umiestnenie:</div>
<div style={{display:"flex",gap:5,overflowX:"auto"}}>
{LOCATIONS.map(l=>(
<button key={l} onClick={()=>setForm(f=>({...f,location:l}))}
style={{flex:"0 0 auto",padding:"6px 10px",borderRadius:99,border:"none",cursor:"pointer",fontSize:11,fontWeight:600,whiteSpace:"nowrap",
background:form.location===l?BRAND.olive:BRAND.crema,color:form.location===l?"#fff":BRAND.arabica}}>
📍 {l}
</button>
))}
<button onClick={()=>setForm(f=>({...f,location:"__custom"}))}
style={{flex:"0 0 auto",padding:"6px 10px",borderRadius:99,border:`1px dashed ${form.location==="__custom"?BRAND.olive:"#E8E0D0"}`,cursor:"pointer",fontSize:11,fontWeight:600,whiteSpace:"nowrap",
background:form.location==="__custom"?BRAND.crema:"#fff",color:BRAND.arabica}}>
+ Vlastné
</button>
</div>
{form.location==="__custom"&&(
<input value={form.customLocation} onChange={e=>setForm(f=>({...f,customLocation:e.target.value}))} placeholder="Zadaj vlastné umiestnenie…"
style={{padding:"7px 10px",borderRadius:7,border:"1px solid #E8D0A0",fontSize:12,outline:"none"}}/>
)}
<div style={{display:"flex",gap:5,overflowX:"auto"}}>
{OWNER_TYPES.map(o=>(
<button key={o.id} onClick={()=>setForm(f=>({...f,owner:o.id,ownerDetail:""}))}
style={{flex:"0 0 auto",padding:"6px 10px",borderRadius:99,border:"none",cursor:"pointer",fontSize:11,fontWeight:600,whiteSpace:"nowrap",
background:form.owner===o.id?o.color:BRAND.crema,color:form.owner===o.id?"#fff":BRAND.arabica}}>
{o.label}
</button>
))}
</div>
{form.owner==="osobne"&&(
<select value={form.ownerDetail} onChange={e=>setForm(f=>({...f,ownerDetail:e.target.value}))}
style={{padding:"7px 8px",borderRadius:7,border:"1px solid #E8E0D0",fontSize:12}}>
<option value="">Vyber meno…</option>
{OWNER_NAMES.map(n=><option key={n} value={n}>{n}</option>)}
</select>
)}
{form.owner==="dodavatel"&&(
<select value={form.ownerDetail} onChange={e=>setForm(f=>({...f,ownerDetail:e.target.value}))}
style={{padding:"7px 8px",borderRadius:7,border:"1px solid #E8E0D0",fontSize:12}}>
<option value="">Vyber dodávateľa…</option>
{Object.entries(SUPS).map(([id,s])=><option key={id} value={id}>{s.icon} {s.name}</option>)}
</select>
)}
<select value={form.condition} onChange={e=>setForm(f=>({...f,condition:e.target.value}))} style={{padding:"7px 8px",borderRadius:7,border:"1px solid #E8E0D0",fontSize:12}}>
{Object.keys(CC).map(c=><option key={c}>{c}</option>)}
</select>
<input value={form.note} onChange={e=>setForm(f=>({...f,note:e.target.value}))} placeholder="Poznámka (voliteľné)"
style={{padding:"7px 10px",borderRadius:7,border:"1px solid #E8E0D0",fontSize:12,outline:"none"}}/>
<button onClick={addNew} style={{padding:9,borderRadius:7,border:"none",background:BRAND.olive,color:"#fff",fontWeight:700,fontSize:12,cursor:"pointer"}}>✓ Pridať</button>
</div>
)}
<div style={{display:"flex",flexDirection:"column",gap:7}}>
{filtered.map(item=>{
const low=item.qty<item.minQty;
const isE=editing===item.id;
return(
<div key={item.id} style={{background:"#fff",borderRadius:10,border:"1px solid #E8E0D0",padding:"12px 14px",borderLeft:`4px solid ${(item.condition==="Poškodené"||item.condition==="Nefunkčné")?"#F59E0B":low?BRAND.terracotta:BRAND.olive}`}}>
<div style={{display:"flex",alignItems:"flex-start",gap:8}}>
<PhotoBox photo={item.photo} icon={item.icon} cat={item.cat} onPhoto={src=>upd(item.id,"photo",src)} onIcon={ic=>upd(item.id,"icon",ic)}/>
<div style={{flex:1}}>
<div style={{display:"flex",alignItems:"center",gap:6}}>
{isE
?<input defaultValue={item.name} onChange={e=>upd(item.id,"name",e.target.value)} placeholder="Názov"
style={{flex:1,padding:"4px 7px",borderRadius:6,border:"1px solid #E8D0A0",fontSize:12,fontWeight:600,color:BRAND.espresso,outline:"none"}}/>
:<div style={{fontSize:12,fontWeight:600,color:BRAND.espresso}}>{item.name}</div>}
{!isE&&<span style={{fontSize:9,fontWeight:700,padding:"2px 7px",borderRadius:99,background:CC[item.condition],color:CT[item.condition],flexShrink:0}}>{item.condition}</span>}
</div>
<div style={{fontSize:10,color:"#A08060",marginTop:2}}>{item.cat}{item.location?` · 📍 ${item.location}`:""}{item.note?` · ${item.note}`:""}</div>
{ownerLabel(item)&&<div style={{fontSize:10,fontWeight:600,color:OWNER_TYPES.find(o=>o.id===item.owner)?.color,marginTop:3}}>{ownerLabel(item)}</div>}
{!isE&&item.nextRevision&&(()=>{const d=new Date(item.nextRevision);const soon=d-Date.now()<14*86400000;return(
<div style={{fontSize:10,fontWeight:600,color:soon?BRAND.terracotta:"#A08060",marginTop:3}}>🗓 Revízia: {d.toLocaleDateString("sk")}{soon?" ⚠️":""}</div>
);})()}
{!isE&&item.serviceContact&&<div style={{fontSize:10,color:"#A08060",marginTop:2}}>🔧 Servis: {item.serviceContact}</div>}
</div>
<div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:BRAND.latte,borderRadius:8,border:`1px solid ${low?"#FCA5A5":"#E8D0A0"}`,padding:"6px 12px",minWidth:64,flexShrink:0}}>
<div style={{fontSize:9,color:"#A08060",marginBottom:2}}>Počet ks</div>
{isE
?<input type="number" defaultValue={item.qty} onChange={e=>upd(item.id,"qty",e.target.value)}
style={{width:48,padding:"3px 4px",borderRadius:5,border:"1px solid #E8D0A0",fontSize:14,fontWeight:700,textAlign:"center",outline:"none"}}/>
:<div style={{fontSize:18,fontWeight:700,color:low?BRAND.terracotta:BRAND.olive}}>{item.qty}</div>}
</div>
<button onClick={()=>setEditing(isE?null:item.id)}
style={{padding:"3px 8px",borderRadius:5,border:"none",cursor:"pointer",fontSize:11,fontWeight:600,background:isE?BRAND.olive:BRAND.crema,color:isE?"#fff":BRAND.arabica,flexShrink:0}}>
{isE?"✓":"✎"}
</button>
<button onClick={()=>rem(item.id)} style={{padding:"3px 8px",borderRadius:5,border:"none",cursor:"pointer",fontSize:11,background:"#FEE2E2",color:BRAND.terracotta,flexShrink:0}}>✕</button>
</div>
{isE&&(<>
<div style={{fontSize:10,color:"#A08060",fontWeight:600,marginBottom:2,marginTop:8}}>Kategória <span style={{fontWeight:400,fontStyle:"italic"}}>— typ vybavenia</span>:</div>
<div style={{display:"flex",gap:5,overflowX:"auto",marginBottom:6}}>
{EQUIPMENT_CATEGORIES.map(c=>(
<button key={c} onClick={()=>upd(item.id,"cat",c)}
style={{flex:"0 0 auto",padding:"5px 9px",borderRadius:99,border:"none",cursor:"pointer",fontSize:10,fontWeight:600,whiteSpace:"nowrap",
background:item.cat===c?BRAND.espresso:BRAND.crema,color:item.cat===c?"#fff":BRAND.arabica}}>
{c}
</button>
))}
</div>
<div style={{fontSize:10,color:"#A08060",fontWeight:600,marginBottom:2}}>Umiestnenie <span style={{fontWeight:400,fontStyle:"italic"}}>— kde sa nachádza</span>:</div>
<div style={{display:"flex",gap:5,overflowX:"auto",marginBottom:6}}>
{LOCATIONS.map(l=>(
<button key={l} onClick={()=>upd(item.id,"location",l)}
style={{flex:"0 0 auto",padding:"5px 9px",borderRadius:99,border:"none",cursor:"pointer",fontSize:10,fontWeight:600,whiteSpace:"nowrap",
background:item.location===l?BRAND.olive:BRAND.crema,color:item.location===l?"#fff":BRAND.arabica}}>
📍 {l}
</button>
))}
<button onClick={()=>upd(item.id,"location","__custom")}
style={{flex:"0 0 auto",padding:"5px 9px",borderRadius:99,border:`1px dashed ${!LOCATIONS.includes(item.location)?BRAND.olive:"#E8E0D0"}`,cursor:"pointer",fontSize:10,fontWeight:600,whiteSpace:"nowrap",
background:!LOCATIONS.includes(item.location)?BRAND.crema:"#fff",color:BRAND.arabica}}>
+ Vlastné
</button>
</div>
{(!LOCATIONS.includes(item.location))&&(
<input defaultValue={item.location==="__custom"?"":item.location} onChange={e=>upd(item.id,"location",e.target.value)} placeholder="Zadaj vlastné umiestnenie…"
style={{width:"100%",padding:"7px 10px",borderRadius:7,border:"1px solid #E8D0A0",fontSize:12,outline:"none",marginBottom:6}}/>
)}
<div style={{fontSize:10,color:"#A08060",fontWeight:600,marginBottom:2}}>Majetok <span style={{fontWeight:400,fontStyle:"italic"}}>— komu vybavenie patrí</span>:</div>
<div style={{display:"flex",gap:5,overflowX:"auto",marginBottom:6}}>
{OWNER_TYPES.map(o=>(
<button key={o.id} onClick={()=>{upd(item.id,"owner",o.id);upd(item.id,"ownerDetail","");}}
style={{flex:"0 0 auto",padding:"5px 9px",borderRadius:99,border:"none",cursor:"pointer",fontSize:10,fontWeight:600,whiteSpace:"nowrap",
background:item.owner===o.id?o.color:BRAND.crema,color:item.owner===o.id?"#fff":BRAND.arabica}}>
{o.label}
</button>
))}
</div>
{item.owner==="osobne"&&(
<select value={item.ownerDetail||""} onChange={e=>upd(item.id,"ownerDetail",e.target.value)}
style={{width:"100%",padding:"7px 8px",borderRadius:7,border:"1px solid #E8E0D0",fontSize:12,marginBottom:6}}>
<option value="">Vyber meno…</option>
{OWNER_NAMES.map(n=><option key={n} value={n}>{n}</option>)}
</select>
)}
{item.owner==="dodavatel"&&(
<select value={item.ownerDetail||""} onChange={e=>upd(item.id,"ownerDetail",e.target.value)}
style={{width:"100%",padding:"7px 8px",borderRadius:7,border:"1px solid #E8E0D0",fontSize:12,marginBottom:6}}>
<option value="">Vyber dodávateľa…</option>
{Object.entries(SUPS).map(([id,s])=><option key={id} value={id}>{s.icon} {s.name}</option>)}
</select>
)}
<div style={{fontSize:10,color:"#A08060",fontWeight:600,marginBottom:2}}>Stav <span style={{fontWeight:400,fontStyle:"italic"}}>— aktuálny technický stav</span>:</div>
<select value={item.condition} onChange={e=>upd(item.id,"condition",e.target.value)}
style={{width:"100%",padding:"7px 8px",borderRadius:7,border:"1px solid #E8E0D0",fontSize:12,marginBottom:6}}>
{Object.keys(CC).map(c=><option key={c}>{c}</option>)}
</select>
<div style={{fontSize:10,color:"#A08060",fontWeight:600,marginBottom:2}}>Popis <span style={{fontWeight:400,fontStyle:"italic"}}>— poznámka k vybaveniu</span>:</div>
<input defaultValue={item.note} onChange={e=>upd(item.id,"note",e.target.value)} placeholder="Poznámka (voliteľné)"
style={{width:"100%",padding:"7px 10px",borderRadius:7,border:"1px solid #E8E0D0",fontSize:12,outline:"none",marginBottom:6}}/>
<div style={{fontSize:10,color:"#A08060",fontWeight:600,marginBottom:2}}>Kontakt na dodávateľa/servis <span style={{fontWeight:400,fontStyle:"italic"}}>— kto opraví/vymení</span>:</div>
<input defaultValue={item.serviceContact} onChange={e=>upd(item.id,"serviceContact",e.target.value)} placeholder="napr. meno, telefón, email…"
style={{width:"100%",padding:"7px 10px",borderRadius:7,border:"1px solid #E8E0D0",fontSize:12,outline:"none",marginBottom:6}}/>
<div style={{fontSize:10,color:"#A08060",fontWeight:600,marginBottom:2}}>Najbližšia revízia <span style={{fontWeight:400,fontStyle:"italic"}}>— termín kontroly/servisu</span>:</div>
<input type="date" defaultValue={item.nextRevision} onChange={e=>upd(item.id,"nextRevision",e.target.value)}
style={{width:"100%",padding:"7px 10px",borderRadius:7,border:"1px solid #E8E0D0",fontSize:12,outline:"none"}}/>
</>)}
</div>
);
})}
{filtered.length===0&&<div style={{textAlign:"center",color:"#A08060",fontSize:12,padding:20}}>Žiadne vybavenie v tejto kategórii.</div>}
</div>
</div>
);
}

const SUPPLIER_CONTACTS=[
{id:"komatop",name:"KOMATOP s.r.o.",icon:"🏭",color:BRAND.arabica,
reps:[{role:"Obchodný zástupca",name:"Norika Kováčiková",phone:"+421465421782",phoneLabel:"046/542 17 82",email:"kovacikova.norika@komatop.sk"}],
note:"Cenník 21.05.2025 · alkohol, nealko, pochutiny, čistenie"},
{id:"pima",name:"PIMA.sk",icon:"🛒",color:"#5B21B6",
reps:[{role:"E-shop / objednávky",name:"",phone:"",phoneLabel:"",email:"eshop@pima.sk"}],
note:"Trenčín · destiláty, gin, borovička · ceny s DPH"},
{id:"adria",name:"Adria Gelato",icon:"🍰",color:"#C0392B",
reps:[
{role:"Obchod / objednávky",name:"",phone:"+421915811376",phoneLabel:"+421 915 811 376",email:"obchod@adriagold.sk"},
{role:"OZ Región južné Slovensko",name:"",phone:"+421948150430",phoneLabel:"+421 948 150 430",email:""},
{role:"OZ Región západ",name:"",phone:"+421915835243",phoneLabel:"+421 915 835 243",email:""},
{role:"OZ Región sever",name:"",phone:"+421903516505",phoneLabel:"+421 903 516 505",email:""},
{role:"OZ Región stred a východ",name:"",phone:"+421948611400",phoneLabel:"+421 948 611 400",email:""},
],
note:"Adria Gold Slovakia s.r.o. · Šávoľská 324/3, 986 01 Fiľakovo · IČO: 36059153"},
{id:"plzen",name:"Plzeňský Prazdroj",icon:"🍺",color:"#1A5276",
reps:[{role:"Oddelenie služieb zákazníkom",name:"",phone:"+421232171414",phoneLabel:"+421 2/321 714 14",email:""}],
note:"Cenník platný od 1.2.2026 · Pilsner Urquell, Peroni, Gambrinus, Kozel, Radegast, Birell, Šariš…"},
];

// ── OBJEDNÁVKY — prepojenie Dodávatelia ↔ Sklad/Inventár ────────
function OrderTab({ inventory }){
const[orders,setOrders]=usePersistentState("cp_orders",[]);
const[creating,setCreating]=useState(false);
const[draft,setDraft]=useState({items:[]});
const[expandId,setExpandId]=useState(null);
const[fSup,setFSup]=useState("all");
const invScms=new Set(inventory.map(i=>i.scm));
const orderable=ALL_CATALOG.filter(p=>invScms.has(p.scm));
const bySup=Object.keys(SUPS).map(id=>({id,...SUPS[id],products:orderable.filter(p=>p.sid===id)})).filter(s=>s.products.length>0);
const tog=p=>{const has=draft.items.find(i=>i.scm===p.scm);if(has)setDraft(d=>({...d,items:d.items.filter(i=>i.scm!==p.scm)}));else setDraft(d=>({...d,items:[...d.items,{...p,qty:1}]}));};
const updQ=(scm,v)=>setDraft(d=>({...d,items:d.items.map(i=>i.scm===scm?{...i,qty:v===""?"":parseFloat(v)||1}:i)}));
const dBySup=Object.keys(SUPS).map(id=>{const items=draft.items.filter(i=>i.sid===id);return{id,...SUPS[id],items,total:items.reduce((a,i)=>a+(i.price||i.priceDPH||0)*(parseFloat(i.qty)||0),0)};}).filter(s=>s.items.length>0);
const place=()=>{
if(!draft.items.length)return;
const newO=Object.keys(SUPS).map(id=>{const items=draft.items.filter(i=>i.sid===id);if(!items.length)return null;
return{id:"o"+Date.now()+id,supplierId:id,supplier:SUPS[id].name,date:new Date().toLocaleDateString("sk"),status:"Čaká",
items:items.map(i=>({...i,total:(i.price||i.priceDPH||0)*(parseFloat(i.qty)||0)}))};}).filter(Boolean);
setOrders(o=>[...newO,...o]);setDraft({items:[]});setCreating(false);
};
const SC={"Čaká":"#FEF3C7","Odoslaná":"#DBEAFE","Doručená":"#D1FAE5","Zrušená":"#FEE2E2"};
const alerts=inventory.filter(i=>i.qty<i.minQty);
const filtOrd=fSup==="all"?orders:orders.filter(o=>o.supplierId===fSup);
return(
<div style={{padding:14,display:"flex",flexDirection:"column",gap:10}}>
{inventory.length===0&&<div style={{background:BRAND.crema,borderRadius:8,padding:"10px 14px",fontSize:11,color:BRAND.arabica,textAlign:"center"}}>
Najprv pridaj produkty do skladu cez záložku <b>🏭 Dodávatelia</b> → <b>+ Sklad</b>.
</div>}
{!creating?<>
<button onClick={()=>setCreating(true)} disabled={!orderable.length}
style={{padding:11,borderRadius:8,border:"none",background:BRAND.olive,color:"#fff",fontWeight:700,fontSize:13,cursor:orderable.length?"pointer":"default",opacity:orderable.length?1:0.5}}>
+ Nová objednávka
</button>
{alerts.length>0&&<div style={{background:BRAND.crema,borderRadius:8,padding:"10px 14px"}}>
<div style={{fontSize:11,fontWeight:700,color:BRAND.arabica,marginBottom:5}}>💡 Odporúčame objednať (nízke zásoby):</div>
{alerts.map(a=>{const s=SUPS[a.sid];return(
<div key={a.scm} style={{fontSize:11,color:BRAND.espresso,display:"flex",justifyContent:"space-between"}}>
<span>• {a.name}</span><span style={{color:"#A08060"}}>{a.qty}/{a.minQty} {a.unit} · {s?.name}</span>
</div>
);})}
</div>}
{orders.length>0&&<div style={{display:"flex",gap:5,overflowX:"auto"}}>
{[["all","📋 Všetky"],...Object.entries(SUPS).map(([id,s])=>[id,`${s.icon} ${s.name}`])].map(([id,lbl])=>(
<button key={id} onClick={()=>setFSup(id)}
style={{flex:"0 0 auto",padding:"6px 12px",borderRadius:99,border:"none",cursor:"pointer",fontSize:11,fontWeight:700,whiteSpace:"nowrap",
background:fSup===id?BRAND.espresso:BRAND.crema,color:fSup===id?"#fff":BRAND.arabica}}>{lbl}</button>
))}
</div>}
{Object.entries(SUPS).map(([id,s])=>{
const sOrd=filtOrd.filter(o=>o.supplierId===id);
if(!sOrd.length)return null;
return(
<div key={id}>
<div style={{display:"flex",alignItems:"center",gap:6,margin:"4px 0"}}>
<div style={{flex:1,height:2,background:s.color,borderRadius:99}}/>
<span style={{fontSize:10,fontWeight:700,color:s.color,textTransform:"uppercase"}}>{s.icon} {s.name}</span>
<div style={{flex:1,height:2,background:s.color,borderRadius:99}}/>
</div>
{sOrd.map(o=>(
<div key={o.id} style={{background:"#fff",borderRadius:8,border:"1px solid #E8E0D0",borderLeft:`4px solid ${s.color}`,padding:"9px 12px",marginBottom:8}}>
<div style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer"}} onClick={()=>setExpandId(expandId===o.id?null:o.id)}>
<div style={{flex:1}}><div style={{fontSize:12,fontWeight:600,color:BRAND.espresso}}>{o.supplier}</div><div style={{fontSize:10,color:"#A08060"}}>{o.date} · {o.items.length} pol.</div></div>
<div style={{textAlign:"right"}}><div style={{fontSize:13,fontWeight:700,color:BRAND.arabica}}>{o.items.reduce((a,i)=>a+i.total,0).toFixed(2)} €</div></div>
<span style={{fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:99,background:SC[o.status]||BRAND.crema}}>{o.status}</span>
<span>{expandId===o.id?"▾":"▸"}</span>
</div>
{expandId===o.id&&<div style={{marginTop:10}}>
{o.items.map(i=>(
<div key={i.scm} style={{display:"flex",justifyContent:"space-between",fontSize:11,padding:"4px 0",borderBottom:"1px solid #F0EAE0"}}>
<span style={{flex:1,color:BRAND.espresso}}>{i.name}</span><span style={{color:"#A08060",marginLeft:8}}>{i.qty}× = <b>{i.total.toFixed(2)} €</b></span>
</div>
))}
<div style={{display:"flex",gap:5,marginTop:8,flexWrap:"wrap"}}>
{["Odoslaná","Doručená","Zrušená"].map(st=>(
<button key={st} onClick={()=>setOrders(ords=>ords.map(x=>x.id===o.id?{...x,status:st}:x))}
style={{padding:"4px 8px",borderRadius:6,border:"none",cursor:"pointer",fontSize:10,fontWeight:600,background:SC[st]||BRAND.crema,color:BRAND.espresso}}>{st}</button>
))}
</div>
</div>}
</div>
))}
</div>
);
})}
{orders.length===0&&<div style={{textAlign:"center",color:"#A08060",fontSize:12,padding:20}}>Žiadne objednávky.</div>}
</>:<div style={{display:"flex",flexDirection:"column",gap:10}}>
<div style={{display:"flex",alignItems:"center",gap:8}}>
<button onClick={()=>setCreating(false)} style={{padding:"6px 12px",borderRadius:6,border:"none",background:BRAND.crema,color:BRAND.arabica,cursor:"pointer",fontSize:12}}>← Späť</button>
<span style={{fontSize:14,fontWeight:700,color:BRAND.espresso}}>Nová objednávka</span>
</div>
{bySup.map(s=>(
<div key={s.id}>
<div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",borderRadius:8,background:s.color+"18",marginBottom:6}}>
<span>{s.icon}</span><span style={{fontSize:13,fontWeight:700,color:s.color,flex:1}}>{s.name}</span>
<span style={{fontSize:11,fontWeight:700,color:s.color}}>{draft.items.filter(i=>i.sid===s.id).length} vybraných</span>
</div>
{s.products.map(p=>{
const item=draft.items.find(i=>i.scm===p.scm);
return(
<div key={p.scm} style={{background:item?BRAND.crema:"#fff",borderRadius:8,border:`1px solid ${item?s.color:"#E8E0D0"}`,padding:"8px 10px",marginBottom:5,display:"flex",alignItems:"center",gap:8}}>
<button onClick={()=>tog(p)} style={{width:20,height:20,borderRadius:4,border:`1.5px solid ${item?s.color:BRAND.caramel}`,background:item?s.color:"#fff",color:"#fff",cursor:"pointer",flexShrink:0,fontSize:12,display:"flex",alignItems:"center",justifyContent:"center"}}>{item?"✓":""}</button>
<div style={{flex:1}}><div style={{fontSize:12,fontWeight:600,color:BRAND.espresso}}>{p.name}</div><div style={{fontSize:10,color:"#A08060"}}>{p.cat}</div></div>
{item&&<input type="number" value={item.qty} min="1" onChange={e=>updQ(p.scm,e.target.value)}
style={{width:55,padding:"3px 6px",borderRadius:5,border:"1px solid #E8E0D0",fontSize:12,textAlign:"center"}}/>}
</div>
);
})}
</div>
))}
{dBySup.length>0&&<>
<div style={{background:BRAND.espresso,borderRadius:10,padding:14}}>
<div style={{fontSize:12,fontWeight:700,color:BRAND.crema,marginBottom:8}}>📋 Súhrn</div>
{dBySup.map(s=>(
<div key={s.id} style={{display:"flex",justifyContent:"space-between",fontSize:12,color:BRAND.caramel,marginBottom:4}}>
<span>{s.icon} {s.name}</span><span style={{fontWeight:700}}>{s.total.toFixed(2)} €</span>
</div>
))}
<div style={{display:"flex",justifyContent:"space-between",fontSize:13,fontWeight:700,color:"#fff",paddingTop:6,borderTop:"1px solid rgba(255,255,255,.15)"}}>
<span>Celkom</span><span>{dBySup.reduce((a,s)=>a+s.total,0).toFixed(2)} €</span>
</div>
</div>
<button onClick={place} style={{padding:12,borderRadius:8,border:"none",background:BRAND.olive,color:"#fff",fontWeight:700,fontSize:13,cursor:"pointer"}}>
✓ Vytvoriť {dBySup.length} objednávk{dBySup.length===1?"u":dBySup.length<5?"y":"í"}
</button>
</>}
</div>}
</div>
);
}

const ESHOP_PRODUCTS=[
{id:"decibar",name:"Decibar — čítačka čiarových kódov s váhou",
img:"⚖️",
desc:"Súčasťou je Decibar Inventory SW pre Windows. Tlačené manuály pre Decibar a podrobný užívateľský manuál pre Decibar Inventory SW v slovenskom/českom jazyku. Súčasťou nie je nabíječka a kabel — používa sa štandardná nabíječka pre telefóny. Súčasťou produktu je neobmedzená licencia a databáza hmotností cca 1400 sortimentných položiek vrátane aktualizácií.",
priceNoVAT:16990,priceVAT:20558,currency:"Kč",availability:"skladom",
url:"https://www.decibar.cz"},
];

// ── ZAMESTNANCI ──────────────────────────────────────────────
const ROLES=["Vedúci prevádzky","Barista/Barman","Barback","Čašník/Servis","Šéfkuchár","Kuchár","Pomocný kuchár","Upratovačka","Brigádnik","Iné"];
const CONTRACTS=["TPP","Brigáda (dohoda)","Živnosť","Stážista","Skúšobná doba"];
const todayStr=()=>new Date().toISOString().slice(0,10);
function calcAge(birthDate){
if(!birthDate) return null;
const b=new Date(birthDate);
if(isNaN(b.getTime())) return null;
const t=new Date();
let age=t.getFullYear()-b.getFullYear();
const m=t.getMonth()-b.getMonth();
if(m<0||(m===0&&t.getDate()<b.getDate())) age--;
return age;
}
const EMPLOYEES_INITIAL=[
{id:"em1",name:"Martin",role:"Vedúci prevádzky",phone:"",email:"",contract:"TPP",wage:"",note:"",photo:"",icon:"👤",hireDate:todayStr(),probationMonths:3,address:"",idNumber:"",birthDate:""},
{id:"em2",name:"Jana",role:"Barista/Barman",phone:"",email:"",contract:"TPP",wage:"",note:"",photo:"",icon:"👤",hireDate:todayStr(),probationMonths:3,address:"",idNumber:"",birthDate:""},
{id:"em3",name:"Peter",role:"Čašník/Servis",phone:"",email:"",contract:"Brigáda (dohoda)",wage:"",note:"",photo:"",icon:"👤",hireDate:todayStr(),probationMonths:3,address:"",idNumber:"",birthDate:""},
{id:"em4",name:"Zuzka",role:"Barista/Barman",phone:"",email:"",contract:"Brigáda (dohoda)",wage:"",note:"",photo:"",icon:"👤",hireDate:todayStr(),probationMonths:3,address:"",idNumber:"",birthDate:""},
];

const COMPANY_DEFAULT={name:"Gastro Corner s.r.o.",sidlo:"Námestie Hraničiarov 2581/4A, 851 03 Bratislava - mestská časť Petržalka",ico:"53182120",dic:"2121306671",icDph:"SK2121306671",place:"Bratislava",iban:"",hasVirtualOffice:false,voProvider:"",voFrom:"",voTo:""};
const CONTRACT_DOC_TYPE={"TPP":"Pracovná zmluva","Brigáda (dohoda)":"Dohoda o vykonaní práce","Stážista":"Zmluva o stáži / praxi","Živnosť":"Zmluva o spolupráci (živnosť)","Skúšobná doba":"Pracovná zmluva (skúšobná doba)"};

function buildContract(company,emp,d,venue){
const sk=x=>x&&x.trim()?x:"......................................................";
const dateSK=s=>s?new Date(s).toLocaleDateString("sk"):"......................";
const workplace=venue&&venue.address?venue.address:sk(company.sidlo);
if(emp.contract==="Brigáda (dohoda)"){
return `DOHODA O VYKONANÍ PRÁCE
uzatvorená podľa § 226 zákona č. 311/2001 Z. z. Zákonník práce v znení neskorších predpisov medzi

zamestnávateľom:
názov: ${sk(company.name)}
sídlo: ${sk(company.sidlo)}
IČO: ${sk(company.ico)}
DIČ: ${sk(company.dic)}
IČ DPH: ${sk(company.icDph)}
(ďalej len "zamestnávateľ")

a

zamestnancom:
meno a priezvisko: ${sk(emp.name)}
bytom: ${sk(emp.address)}
číslo OP: ${sk(emp.idNumber)}
(ďalej len "zamestnanec")

I. Predmet dohody
Predmetom dohody je vymedziť vzájomné práva a povinnosti oboch zmluvných strán. Zamestnanec sa zaväzuje, že pre zamestnávateľa vykoná prácu na pracovnej pozícii: ${sk(emp.role)}.

II. Miesto a doba vykonania práce
Miesto výkonu práce: ${workplace}.
Práca sa vykonáva od ${dateSK(d.startDate)} do ${dateSK(d.endDate)}. Dohodu o vykonaní práce možno uzatvoriť najviac na 12 mesiacov a rozsah práce nesmie v úhrne presiahnuť 350 hodín v kalendárnom roku (§ 226 ods. 2 Zákonníka práce).

III. Odmena za vykonanú prácu
Dohodnutá odmena: ${sk(d.wage)}
Splatnosť odmeny: odmena za vykonanie pracovnej úlohy je splatná po dokončení a odovzdaní práce.

IV. Práva a povinnosti zmluvných strán
Na základe tejto dohody oboznámil zamestnávateľ zamestnanca s právnymi predpismi vzťahujúcimi sa na vykonávanú prácu a ostatnými predpismi na zaistenie bezpečnosti a ochrany zdravia pri práci.
Zamestnávateľ sa zaväzuje vytvoriť pracovné podmienky zaisťujúce riadny a bezpečný výkon práce, zaplatiť dohodnutú odmenu a dodržiavať ostatné podmienky tak, ako boli dohodnuté.
Zamestnanec sa zaväzuje vykonať dohodnutú prácu osobne, riadne a včas a dodržiavať podmienky dohodnuté v súlade s právnymi predpismi vzťahujúcimi sa na jej výkon, najmä predpisy na zaistenie bezpečnosti a ochrany zdravia pri práci.
Ostatné práva a povinnosti účastníkov tejto zmluvy sa riadia ustanoveniami Zákonníka práce a ostatnými pracovnoprávnymi predpismi.

V. Mlčanlivosť a ochrana osobných údajov
Zamestnanec sa zaväzuje zachovávať mlčanlivosť o skutočnostiach, s ktorými sa oboznámil pri výkone práce a ktoré sú predmetom obchodného tajomstva zamestnávateľa, a to aj po skončení tejto dohody.
Osobné údaje zamestnanca spracúva zamestnávateľ v súlade s nariadením (EÚ) 2016/679 (GDPR) a zákonom č. 18/2018 Z. z. o ochrane osobných údajov, výlučne na účely plnenia tejto dohody a súvisiacich zákonných povinností.

VI. Záverečné ustanovenia
Táto dohoda nadobúda platnosť a účinnosť dňom jej podpisu oboma zmluvnými stranami. Dohoda je vyhotovená vo dvoch vyhotoveniach, pričom každé vyhotovenie má platnosť originálu. Každá zmluvná strana obdrží jedno vyhotovenie.
Túto dohodu je možné meniť a dopĺňať len formou písomných dodatkov. V otázkach touto dohodou neupravených sa použijú subsidiárne ustanovenia zákona č. 311/2001 Z. z. Zákonník práce v znení neskorších predpisov.
Zmluvné strany si dohodu prečítali, jej obsahu, právam a povinnostiam z nej vyplývajúcim porozumeli, pričom na znak súhlasu s jej obsahom ju vlastnoručne podpisujú.

V ${sk(company.place)} dňa ${dateSK(d.signDate)}


......................................................          ......................................................
            zamestnanec                                      zamestnávateľ`;
}
// TPP / Stážista / Iné — generická pracovná zmluva
return `PRACOVNÁ ZMLUVA
uzatvorená podľa zákona č. 311/2001 Z. z. Zákonník práce v znení neskorších predpisov medzi

zamestnávateľom:
názov: ${sk(company.name)}
sídlo: ${sk(company.sidlo)}
IČO: ${sk(company.ico)}
DIČ: ${sk(company.dic)}
IČ DPH: ${sk(company.icDph)}
(ďalej len "zamestnávateľ")

a

zamestnancom:
meno a priezvisko: ${sk(emp.name)}
bytom: ${sk(emp.address)}
číslo OP: ${sk(emp.idNumber)}
(ďalej len "zamestnanec")

I. Druh práce a deň nástupu do práce
Druh práce: ${sk(emp.role)}
Druh pracovného pomeru: ${sk(emp.contract)}
Deň nástupu do práce: ${dateSK(emp.hireDate)}
Skúšobná doba: ${emp.probationMonths>0?`${emp.probationMonths} mesiace od dňa nástupu do práce`:"nedohodnutá"}

II. Miesto výkonu práce a pracovný čas
Miesto výkonu práce: ${workplace}.
Týždenný pracovný čas a rozvrh zmien sa určuje podľa aktuálneho smenového kalendára zamestnávateľa.

III. Mzdové podmienky
Dohodnutá mzda/odmena: ${sk(d.wage)}
Splatnosť: mzda je splatná v zmysle vnútorných predpisov zamestnávateľa, najneskôr do konca nasledujúceho kalendárneho mesiaca.

IV. Ostatné dojednania
Tento pracovný pomer sa uzatvára na ${d.endDate?`dobu určitú do ${dateSK(d.endDate)}`:"dobu neurčitú"}.
Zamestnanec sa zaväzuje vykonávať prácu osobne podľa pokynov zamestnávateľa, dodržiavať pracovnú disciplínu a predpisy o bezpečnosti a ochrane zdravia pri práci.
Zamestnávateľ sa zaväzuje zaplatiť zamestnancovi za vykonanú prácu mzdu a vytvárať podmienky na riadny výkon práce.
Ostatné práva a povinnosti sa riadia Zákonníkom práce a vnútornými predpismi zamestnávateľa.

V. Mlčanlivosť a ochrana osobných údajov
Zamestnanec sa zaväzuje zachovávať mlčanlivosť o skutočnostiach tvoriacich obchodné tajomstvo zamestnávateľa, a to aj po skončení pracovného pomeru.
Osobné údaje zamestnanca spracúva zamestnávateľ v súlade s nariadením (EÚ) 2016/679 (GDPR) a zákonom č. 18/2018 Z. z. o ochrane osobných údajov, výlučne na účely plnenia tejto zmluvy a súvisiacich zákonných povinností.

VI. Záverečné ustanovenia
Táto zmluva je vyhotovená v dvoch rovnopisoch, po jednom pre každú zmluvnú stranu. Zmenu zmluvy je možné dohodnúť len písomne.
Zmluvné strany si zmluvu prečítali, jej obsahu porozumeli a na znak súhlasu ju vlastnoručne podpisujú.

V ${sk(company.place)} dňa ${dateSK(d.signDate)}


......................................................          ......................................................
            zamestnanec                                      zamestnávateľ`;
}

const EMP_COLORS=["#C4965A","#2E6B4F","#1A5276","#C0392B","#5B21B6","#0E7490","#92400E","#BE185D"];
function empColor(emp){
const s=String(emp.id||emp.name||"");
const hash=s.split("").reduce((a,c)=>a+c.charCodeAt(0),0);
return EMP_COLORS[hash%EMP_COLORS.length];
}

function EmployeesTab({employees,setEmployees,company,setCompany,venue}){
const[editing,setEditing]=useState(null);
const[adding,setAdding]=useState(false);
const[form,setForm]=useState({name:"",role:"Barista/Barman",phone:"",email:"",contract:"TPP",wage:"",note:"",photo:"",icon:"👤",hireDate:todayStr(),probationMonths:3,address:"",idNumber:"",birthDate:""});
const[showCompany,setShowCompany]=useState(false);
const[contractFor,setContractFor]=useState(null); // employee object
const[roleFilter,setRoleFilter]=useState("Všetko");
const[customRoles,setCustomRoles]=usePersistentState("cp_customRoles",[]);
const[addingRole,setAddingRole]=useState(false);
const[newRoleName,setNewRoleName]=useState("");
const allRoles=[...ROLES.filter(r=>r!=="Iné"),...customRoles,"Iné"];
const addCustomRole=(applyTo)=>{
const r=newRoleName.trim();
if(!r)return;
if(!allRoles.includes(r)) setCustomRoles(cr=>[...cr,r]);
if(applyTo) applyTo(r);
setNewRoleName("");setAddingRole(false);
};
const upd=(id,f,v)=>setEmployees(es=>es.map(e=>e.id===id?{...e,[f]:v}:e));
const rem=id=>setEmployees(es=>es.filter(e=>e.id!==id));
const addNew=()=>{
if(!form.name.trim())return;
setEmployees(es=>[...es,{id:"em"+Date.now(),...form}]);
setForm({name:"",role:"Barista/Barman",phone:"",email:"",contract:"TPP",wage:"",note:"",photo:"",icon:"👤",hireDate:todayStr(),probationMonths:3,address:"",idNumber:"",birthDate:""});setAdding(false);
};
const filteredEmployees=roleFilter==="Všetko"?employees:employees.filter(e=>e.role===roleFilter);
return(
<div style={{padding:14,display:"flex",flexDirection:"column",gap:10}}>
<div style={{background:BRAND.crema,borderRadius:8,padding:"8px 12px",fontSize:11,color:BRAND.arabica}}>
👥 Zoznam zamestnancov a brigádnikov prevádzky.
</div>
<button onClick={()=>setShowCompany(v=>!v)} style={{padding:"7px 12px",borderRadius:7,border:"1px solid #E8E0D0",background:showCompany?BRAND.crema:"#fff",color:BRAND.arabica,fontSize:11,fontWeight:600,cursor:"pointer"}}>
🏢 Údaje o firme (pre zmluvy)
</button>
{showCompany&&(
<div style={{background:"#fff",borderRadius:10,border:"1px solid #E8E0D0",padding:12,display:"flex",flexDirection:"column",gap:6}}>
<div style={{fontSize:10,color:"#A08060",fontWeight:600}}>Tieto údaje sa automaticky vyplnia do generovaných zmlúv.</div>
<input value={company.name} onChange={e=>setCompany(c=>({...c,name:e.target.value}))} placeholder="Názov firmy (s.r.o.)"
style={{padding:"7px 10px",borderRadius:7,border:"1px solid #E8E0D0",fontSize:12,outline:"none"}}/>
<input value={company.sidlo} onChange={e=>setCompany(c=>({...c,sidlo:e.target.value}))} placeholder="Sídlo (adresa)"
style={{padding:"7px 10px",borderRadius:7,border:"1px solid #E8E0D0",fontSize:12,outline:"none"}}/>
<input value={company.ico} onChange={e=>setCompany(c=>({...c,ico:e.target.value}))} placeholder="IČO"
style={{padding:"7px 10px",borderRadius:7,border:"1px solid #E8E0D0",fontSize:12,outline:"none"}}/>
<input value={company.place} onChange={e=>setCompany(c=>({...c,place:e.target.value}))} placeholder="Miesto podpisu zmlúv (napr. Prievidza)"
style={{padding:"7px 10px",borderRadius:7,border:"1px solid #E8E0D0",fontSize:12,outline:"none"}}/>
</div>
)}
<button onClick={()=>setAdding(v=>!v)}
style={{padding:9,borderRadius:8,border:"1.5px dashed #E8E0D0",background:adding?BRAND.crema:"transparent",color:BRAND.arabica,fontSize:12,cursor:"pointer",fontWeight:600}}>
{adding?"✕ Zrušiť":"+ Pridať zamestnanca"}
</button>
{adding&&(
<div style={{background:"#fff",borderRadius:10,border:"1px solid #E8E0D0",padding:12,display:"flex",flexDirection:"column",gap:6}}>
<div style={{display:"flex",alignItems:"center",gap:8}}>
<PhotoBox photo={form.photo} icon={form.icon} icons={AVATAR_ICONS} onPhoto={src=>setForm(f=>({...f,photo:src}))} onIcon={ic=>setForm(f=>({...f,icon:ic}))}/>
<input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Meno"
style={{flex:1,padding:"7px 10px",borderRadius:7,border:"1px solid #E8E0D0",fontSize:12,outline:"none"}}/>
</div>
<div style={{fontSize:10,color:"#A08060",fontWeight:600}}>Pozícia:</div>
<div style={{display:"flex",gap:5,overflowX:"auto"}}>
{allRoles.map(r=>(
<button key={r} onClick={()=>setForm(f=>({...f,role:r}))}
style={{flex:"0 0 auto",padding:"6px 10px",borderRadius:99,border:"none",cursor:"pointer",fontSize:11,fontWeight:600,whiteSpace:"nowrap",
background:form.role===r?BRAND.espresso:BRAND.crema,color:form.role===r?"#fff":BRAND.arabica}}>{r}</button>
))}
<button onClick={()=>setAddingRole(v=>!v)}
style={{flex:"0 0 auto",padding:"6px 10px",borderRadius:99,border:`1px dashed ${addingRole?BRAND.olive:"#E8E0D0"}`,cursor:"pointer",fontSize:11,fontWeight:600,whiteSpace:"nowrap",
background:addingRole?BRAND.crema:"#fff",color:BRAND.arabica}}>+ Vlastná pozícia</button>
</div>
{addingRole&&(
<div style={{display:"flex",gap:5}}>
<input value={newRoleName} onChange={e=>setNewRoleName(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")addCustomRole(r=>setForm(f=>({...f,role:r})));}} placeholder="Zadaj novú pozíciu…"
style={{flex:1,padding:"6px 9px",borderRadius:7,border:"1px solid #E8D0A0",fontSize:11,outline:"none"}}/>
<button onClick={()=>addCustomRole(r=>setForm(f=>({...f,role:r})))} style={{padding:"6px 12px",borderRadius:7,border:"none",background:BRAND.olive,color:"#fff",fontSize:11,fontWeight:700,cursor:"pointer"}}>✓</button>
</div>
)}
<div style={{fontSize:10,color:"#A08060",fontWeight:600}}>Typ úväzku:</div>
<div style={{display:"flex",gap:5,overflowX:"auto"}}>
{CONTRACTS.map(c=>(
<button key={c} onClick={()=>setForm(f=>({...f,contract:c}))}
style={{flex:"0 0 auto",padding:"6px 10px",borderRadius:99,border:"none",cursor:"pointer",fontSize:11,fontWeight:600,whiteSpace:"nowrap",
background:form.contract===c?BRAND.adriatic:BRAND.crema,color:form.contract===c?"#fff":BRAND.arabica}}>{c}</button>
))}
</div>
<input value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} placeholder="Telefón"
style={{padding:"7px 10px",borderRadius:7,border:"1px solid #E8E0D0",fontSize:12,outline:"none"}}/>
<input value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} placeholder="Email"
style={{padding:"7px 10px",borderRadius:7,border:"1px solid #E8E0D0",fontSize:12,outline:"none"}}/>
<input value={form.address} onChange={e=>setForm(f=>({...f,address:e.target.value}))} placeholder="Bytom (adresa, pre zmluvy)"
style={{padding:"7px 10px",borderRadius:7,border:"1px solid #E8E0D0",fontSize:12,outline:"none"}}/>
<input value={form.idNumber} onChange={e=>setForm(f=>({...f,idNumber:e.target.value}))} placeholder="Číslo OP (pre zmluvy)"
style={{padding:"7px 10px",borderRadius:7,border:"1px solid #E8E0D0",fontSize:12,outline:"none"}}/>
<div style={{fontSize:10,color:"#A08060",fontWeight:600}}>Dátum narodenia:</div>
<div style={{display:"flex",alignItems:"center",gap:8}}>
<input type="date" value={form.birthDate} onChange={e=>setForm(f=>({...f,birthDate:e.target.value}))}
style={{flex:1,padding:"7px 10px",borderRadius:7,border:"1px solid #E8E0D0",fontSize:12,outline:"none"}}/>
{calcAge(form.birthDate)!==null&&<span style={{fontSize:11,fontWeight:700,color:BRAND.adriatic,whiteSpace:"nowrap"}}>{calcAge(form.birthDate)} rokov</span>}
</div>
<div style={{fontSize:10,color:"#A08060",fontWeight:600}}>Dátum prijatia:</div>
<input type="date" value={form.hireDate} onChange={e=>setForm(f=>({...f,hireDate:e.target.value}))}
style={{padding:"7px 10px",borderRadius:7,border:"1px solid #E8E0D0",fontSize:12,outline:"none"}}/>
<div style={{fontSize:10,color:"#A08060",fontWeight:600}}>Skúšobná doba (mesiace):</div>
<input type="number" value={form.probationMonths} onChange={e=>setForm(f=>({...f,probationMonths:e.target.value}))} placeholder="3"
style={{padding:"7px 10px",borderRadius:7,border:"1px solid #E8E0D0",fontSize:12,outline:"none"}}/>
<input value={form.note} onChange={e=>setForm(f=>({...f,note:e.target.value}))} placeholder="Poznámka (voliteľné)"
style={{padding:"7px 10px",borderRadius:7,border:"1px solid #E8E0D0",fontSize:12,outline:"none"}}/>
<button onClick={addNew} style={{padding:9,borderRadius:7,border:"none",background:BRAND.olive,color:"#fff",fontWeight:700,fontSize:12,cursor:"pointer"}}>✓ Pridať</button>
</div>
)}
<div>
<div style={{fontSize:10,color:"#A08060",fontWeight:600,marginBottom:5}}>Filter podľa pozície:</div>
<div style={{display:"flex",gap:5,overflowX:"auto"}}>
{["Všetko",...allRoles].map(r=>(
<button key={r} onClick={()=>setRoleFilter(r)}
style={{flex:"0 0 auto",padding:"6px 11px",borderRadius:99,border:"none",cursor:"pointer",fontSize:11,fontWeight:600,whiteSpace:"nowrap",
background:roleFilter===r?BRAND.espresso:BRAND.crema,color:roleFilter===r?"#fff":BRAND.arabica}}>
{r}
</button>
))}
</div>
</div>
<div style={{display:"flex",flexDirection:"column",gap:7}}>
{filteredEmployees.map(emp=>{
const isE=editing===emp.id;
const col=empColor(emp);
return(
<div key={emp.id} style={{background:"#fff",borderRadius:10,border:"1px solid #E8E0D0",borderLeft:`4px solid ${col}`,padding:"12px 14px"}}>
<div style={{display:"flex",alignItems:"flex-start",gap:8}}>
<PhotoBox photo={emp.photo} icon={emp.icon} icons={AVATAR_ICONS} onPhoto={src=>upd(emp.id,"photo",src)} onIcon={ic=>upd(emp.id,"icon",ic)}/>
<div style={{flex:1}}>
{isE?<input defaultValue={emp.name} onChange={e=>upd(emp.id,"name",e.target.value)}
style={{width:"100%",padding:"4px 7px",borderRadius:6,border:"1px solid #E8D0A0",fontSize:12,fontWeight:600,outline:"none",marginBottom:3}}/>
:(<div style={{display:"flex",alignItems:"center",gap:7}}>
<span style={{width:9,height:9,borderRadius:"50%",background:col,flexShrink:0}}/>
<span style={{fontSize:13,fontWeight:700,color:col}}>{emp.name}</span>
</div>)}
<div style={{fontSize:10,color:"#A08060",marginTop:2}}>{emp.role} · {emp.contract}{calcAge(emp.birthDate)!==null?` · ${calcAge(emp.birthDate)} rokov`:""}</div>
{(emp.phone||emp.email)&&<div style={{fontSize:10,color:BRAND.adriatic,marginTop:2}}>{emp.phone&&<a href={`tel:${emp.phone}`} style={{color:BRAND.adriatic,textDecoration:"none"}}>📞 {emp.phone}</a>}{emp.phone&&emp.email?" · ":""}{emp.email&&<a href={`mailto:${emp.email}`} style={{color:BRAND.adriatic,textDecoration:"none"}}>✉ {emp.email}</a>}</div>}
{emp.hireDate&&(()=>{
const hd=new Date(emp.hireDate);
const probEnd=new Date(hd);probEnd.setMonth(probEnd.getMonth()+(parseInt(emp.probationMonths)||0));
const inProbation=Date.now()<probEnd.getTime();
return(<div style={{fontSize:10,color:"#A08060",marginTop:2}}>
📅 Prijatý: {hd.toLocaleDateString("sk")}
{emp.probationMonths>0&&<span style={{color:inProbation?BRAND.terracotta:BRAND.olive,fontWeight:600}}> · {inProbation?`Skúšobná doba do ${probEnd.toLocaleDateString("sk")}`:"Skúšobná doba ukončená"}</span>}
</div>);
})()}
{emp.note&&<div style={{fontSize:10,color:"#A08060",marginTop:2}}>{emp.note}</div>}
</div>
<button onClick={()=>setContractFor(emp)} style={{padding:"3px 8px",borderRadius:5,border:"none",cursor:"pointer",fontSize:11,fontWeight:600,background:BRAND.adriatic,color:"#fff",flexShrink:0}}>📄 Zmluva</button>
<button onClick={()=>setEditing(isE?null:emp.id)}
style={{padding:"3px 8px",borderRadius:5,border:"none",cursor:"pointer",fontSize:11,fontWeight:600,background:isE?BRAND.olive:BRAND.crema,color:isE?"#fff":BRAND.arabica,flexShrink:0}}>{isE?"✓":"✎"}</button>
<button onClick={()=>rem(emp.id)} style={{padding:"3px 8px",borderRadius:5,border:"none",cursor:"pointer",fontSize:11,background:"#FEE2E2",color:BRAND.terracotta,flexShrink:0}}>✕</button>
</div>
{isE&&(<div style={{marginTop:8,display:"flex",flexDirection:"column",gap:5}}>
<div style={{display:"flex",gap:5,overflowX:"auto"}}>
{allRoles.map(r=>(
<button key={r} onClick={()=>upd(emp.id,"role",r)}
style={{flex:"0 0 auto",padding:"5px 9px",borderRadius:99,border:"none",cursor:"pointer",fontSize:10,fontWeight:600,whiteSpace:"nowrap",
background:emp.role===r?BRAND.espresso:BRAND.crema,color:emp.role===r?"#fff":BRAND.arabica}}>{r}</button>
))}
<button onClick={()=>setAddingRole(v=>!v)}
style={{flex:"0 0 auto",padding:"5px 9px",borderRadius:99,border:`1px dashed ${addingRole?BRAND.olive:"#E8E0D0"}`,cursor:"pointer",fontSize:10,fontWeight:600,whiteSpace:"nowrap",
background:addingRole?BRAND.crema:"#fff",color:BRAND.arabica}}>+ Vlastná</button>
</div>
{addingRole&&(
<div style={{display:"flex",gap:5}}>
<input value={newRoleName} onChange={e=>setNewRoleName(e.target.value)} onKeyDown={ev=>{if(ev.key==="Enter")addCustomRole(r=>upd(emp.id,"role",r));}} placeholder="Zadaj novú pozíciu…"
style={{flex:1,padding:"5px 8px",borderRadius:6,border:"1px solid #E8D0A0",fontSize:11,outline:"none"}}/>
<button onClick={()=>addCustomRole(r=>upd(emp.id,"role",r))} style={{padding:"5px 10px",borderRadius:6,border:"none",background:BRAND.olive,color:"#fff",fontSize:11,fontWeight:700,cursor:"pointer"}}>✓</button>
</div>
)}
<div style={{display:"flex",gap:5,overflowX:"auto"}}>
{CONTRACTS.map(c=>(
<button key={c} onClick={()=>upd(emp.id,"contract",c)}
style={{flex:"0 0 auto",padding:"5px 9px",borderRadius:99,border:"none",cursor:"pointer",fontSize:10,fontWeight:600,whiteSpace:"nowrap",
background:emp.contract===c?BRAND.adriatic:BRAND.crema,color:emp.contract===c?"#fff":BRAND.arabica}}>{c}</button>
))}
</div>
<input defaultValue={emp.phone} onChange={e=>upd(emp.id,"phone",e.target.value)} placeholder="Telefón"
style={{padding:"6px 8px",borderRadius:6,border:"1px solid #E8E0D0",fontSize:11,outline:"none"}}/>
<input defaultValue={emp.email} onChange={e=>upd(emp.id,"email",e.target.value)} placeholder="Email"
style={{padding:"6px 8px",borderRadius:6,border:"1px solid #E8E0D0",fontSize:11,outline:"none"}}/>
<input defaultValue={emp.address} onChange={e=>upd(emp.id,"address",e.target.value)} placeholder="Bytom (adresa, pre zmluvy)"
style={{padding:"6px 8px",borderRadius:6,border:"1px solid #E8E0D0",fontSize:11,outline:"none"}}/>
<input defaultValue={emp.idNumber} onChange={e=>upd(emp.id,"idNumber",e.target.value)} placeholder="Číslo OP (pre zmluvy)"
style={{padding:"6px 8px",borderRadius:6,border:"1px solid #E8E0D0",fontSize:11,outline:"none"}}/>
<div style={{fontSize:10,color:"#A08060",fontWeight:600}}>Dátum narodenia:</div>
<div style={{display:"flex",alignItems:"center",gap:8}}>
<input type="date" defaultValue={emp.birthDate} onChange={e=>upd(emp.id,"birthDate",e.target.value)}
style={{flex:1,padding:"6px 8px",borderRadius:6,border:"1px solid #E8E0D0",fontSize:11,outline:"none"}}/>
{calcAge(emp.birthDate)!==null&&<span style={{fontSize:11,fontWeight:700,color:BRAND.adriatic,whiteSpace:"nowrap"}}>{calcAge(emp.birthDate)} rokov</span>}
</div>
<div style={{fontSize:10,color:"#A08060",fontWeight:600}}>Dátum prijatia:</div>
<input type="date" defaultValue={emp.hireDate} onChange={e=>upd(emp.id,"hireDate",e.target.value)}
style={{padding:"6px 8px",borderRadius:6,border:"1px solid #E8E0D0",fontSize:11,outline:"none"}}/>
<div style={{fontSize:10,color:"#A08060",fontWeight:600}}>Skúšobná doba (mesiace):</div>
<input type="number" defaultValue={emp.probationMonths} onChange={e=>upd(emp.id,"probationMonths",e.target.value)}
style={{padding:"6px 8px",borderRadius:6,border:"1px solid #E8E0D0",fontSize:11,outline:"none"}}/>
<input defaultValue={emp.note} onChange={e=>upd(emp.id,"note",e.target.value)} placeholder="Poznámka"
style={{padding:"6px 8px",borderRadius:6,border:"1px solid #E8E0D0",fontSize:11,outline:"none"}}/>
</div>)}
</div>
);
})}
{filteredEmployees.length===0&&<div style={{textAlign:"center",color:"#A08060",fontSize:12,padding:20}}>{employees.length===0?"Žiadni zamestnanci. Pridaj prvého vyššie.":"Žiadni zamestnanci s touto pozíciou."}</div>}
</div>
{contractFor&&<ContractModal emp={contractFor} company={company} venue={venue} onClose={()=>setContractFor(null)}/>}
</div>
);
}

function ContractModal({emp,company,venue,onClose}){
const[d,setD]=useState({wage:emp.wage||"",startDate:emp.hireDate||todayStr(),endDate:"",signDate:todayStr()});
const[text,setText]=useState(()=>buildContract(company,emp,{wage:emp.wage||"",startDate:emp.hireDate||todayStr(),endDate:"",signDate:todayStr()},venue));
const[edited,setEdited]=useState(false);
const regenerate=nd=>{setD(nd);if(!edited)setText(buildContract(company,emp,nd,venue));};
const download=()=>{
const blob=new Blob([text],{type:"text/plain;charset=utf-8"});
const url=URL.createObjectURL(blob);
const a=document.createElement("a");a.href=url;a.download=`Zmluva_${emp.name.replace(/\s+/g,"_")}.txt`;document.body.appendChild(a);a.click();
document.body.removeChild(a);URL.revokeObjectURL(url);
};
const printPDF=()=>{
const html=`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Zmluva — ${emp.name}</title>
<style>body{font-family:'Times New Roman',serif;padding:36px;white-space:pre-wrap;font-size:13px;line-height:1.5;color:#1a1a1a;}@media print{body{padding:0;}}</style>
</head><body>${text.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}</body></html>`;
const win=window.open("","_blank");
if(!win){alert("Prehliadač zablokoval otvorenie okna. Povoľ vyskakovacie okná.");return;}
win.document.write(html);win.document.close();
win.onload=()=>{win.focus();win.print();};
};
return(
<div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.5)",zIndex:60,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
<div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:12,padding:18,width:"100%",maxWidth:520,maxHeight:"88vh",overflowY:"auto",display:"flex",flexDirection:"column",gap:10}}>
<div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
<div style={{fontSize:14,fontWeight:700,color:BRAND.espresso}}>📄 {CONTRACT_DOC_TYPE[emp.contract]||"Pracovná zmluva"} — {emp.name}</div>
<button onClick={onClose} style={{background:"none",border:"none",fontSize:18,color:"#A08060",cursor:"pointer"}}>✕</button>
</div>
<div style={{fontSize:10,color:"#A08060"}}>Automaticky vyplnené z údajov o firme a zamestnancovi. Polia nižšie dopočítajú text — text v náhľade nižšie môžeš ďalej voľne upraviť.</div>
<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
<div>
<div style={{fontSize:10,color:"#A08060",fontWeight:600,marginBottom:3}}>Odmena / mzda:</div>
<input value={d.wage} onChange={e=>regenerate({...d,wage:e.target.value})} placeholder="napr. 5,20 €/hod."
style={{width:"100%",padding:"6px 8px",borderRadius:6,border:"1px solid #E8E0D0",fontSize:11,outline:"none",boxSizing:"border-box"}}/>
</div>
<div>
<div style={{fontSize:10,color:"#A08060",fontWeight:600,marginBottom:3}}>Dátum podpisu:</div>
<input type="date" value={d.signDate} onChange={e=>regenerate({...d,signDate:e.target.value})}
style={{width:"100%",padding:"6px 8px",borderRadius:6,border:"1px solid #E8E0D0",fontSize:11,outline:"none",boxSizing:"border-box"}}/>
</div>
<div>
<div style={{fontSize:10,color:"#A08060",fontWeight:600,marginBottom:3}}>Práca od:</div>
<input type="date" value={d.startDate} onChange={e=>regenerate({...d,startDate:e.target.value})}
style={{width:"100%",padding:"6px 8px",borderRadius:6,border:"1px solid #E8E0D0",fontSize:11,outline:"none",boxSizing:"border-box"}}/>
</div>
<div>
<div style={{fontSize:10,color:"#A08060",fontWeight:600,marginBottom:3}}>Práca do:</div>
<input type="date" value={d.endDate} onChange={e=>regenerate({...d,endDate:e.target.value})}
style={{width:"100%",padding:"6px 8px",borderRadius:6,border:"1px solid #E8E0D0",fontSize:11,outline:"none",boxSizing:"border-box"}}/>
</div>
</div>
{!company.ico&&<div style={{fontSize:10,color:BRAND.terracotta,background:"#FEE2E2",padding:"6px 9px",borderRadius:6}}>⚠️ Vyplň IČO firmy v "🏢 Údaje o firme" pre úplnú zmluvu.</div>}
{(!emp.address||!emp.idNumber)&&<div style={{fontSize:10,color:BRAND.terracotta,background:"#FEE2E2",padding:"6px 9px",borderRadius:6}}>⚠️ Zamestnancovi chýba adresa a/alebo číslo OP — doplň v editácii zamestnanca.</div>}
<div style={{fontSize:10,color:"#A08060",fontWeight:600}}>Náhľad zmluvy (editovateľný):</div>
<textarea value={text} onChange={e=>{setText(e.target.value);setEdited(true);}} rows={14}
style={{width:"100%",padding:10,borderRadius:8,border:"1px solid #E8E0D0",fontSize:11,fontFamily:"'Times New Roman',serif",lineHeight:1.5,outline:"none",resize:"vertical",boxSizing:"border-box"}}/>
{edited&&<button onClick={()=>{setText(buildContract(company,emp,d,venue));setEdited(false);}} style={{fontSize:10,color:BRAND.adriatic,background:"none",border:"none",cursor:"pointer",textAlign:"left",padding:0}}>↺ Vrátiť na automaticky vygenerovaný text</button>}
<div style={{display:"flex",gap:6}}>
<button onClick={download} style={{flex:1,padding:9,borderRadius:7,border:"1px solid #E8E0D0",background:"#fff",color:BRAND.arabica,fontSize:11,fontWeight:600,cursor:"pointer"}}>📥 Stiahnuť .txt</button>
<button onClick={printPDF} style={{flex:1,padding:9,borderRadius:7,border:"none",background:BRAND.olive,color:"#fff",fontSize:11,fontWeight:700,cursor:"pointer"}}>📄 Tlač / PDF</button>
</div>
</div>
</div>
);
}

// ── SMENOVÝ KALENDÁR ──────────────────────────────────────────
const DEFAULT_SHIFT_TYPES=[
{id:"r",label:"Ranná",start:"07:00",end:"15:00",hours:8,color:"#FEF3C7",border:"#FCD34D",req:1,lunch:false,lunchFrom:"",lunchTo:""},
{id:"p",label:"Popol.",start:"15:00",end:"23:00",hours:8,color:"#DBEAFE",border:"#93C5FD",req:1,lunch:false,lunchFrom:"",lunchTo:""},
{id:"c",label:"Celodenná",start:"07:00",end:"23:00",hours:16,color:"#FCE7F3",border:"#F9A8D4",req:1,lunch:false,lunchFrom:"",lunchTo:""},
];
const DOW=["Po","Ut","St","Št","Pi","So","Ne"];
const MONTHS_SK=["Január","Február","Marec","Apríl","Máj","Jún","Júl","August","September","Október","November","December"];
function timeToMin(t){const[h,m]=t.split(":").map(Number);return h*60+m;}
function diffHours(start,end,lunchFrom,lunchTo){
let mins=timeToMin(end)-timeToMin(start);if(mins<=0)mins+=24*60;
if(lunchFrom&&lunchTo){
let lm=timeToMin(lunchTo)-timeToMin(lunchFrom);if(lm<0)lm+=24*60;
mins-=lm;
}
return Math.round(mins/60*10)/10;
}
function ShiftsTab({employees,setEmployees}){
const[shiftTypes,setShiftTypes]=usePersistentState("cp_shiftTypes",DEFAULT_SHIFT_TYPES);
const[showSettings,setShowSettings]=useState(false);
const[showAuto,setShowAuto]=useState(false);
const[monthOff,setMonthOff]=useState(0);
const[shifts,setShifts]=usePersistentState("cp_shifts",{}); // key -> [empId,...]
const[picking,setPicking]=useState(null); // {dateStr, shiftId, date, viaPlus}
const[autoP,setAutoP]=useState({empId:"",shiftId:"",shortDays:[],longDays:[],firstWeekType:"short"});
const base=new Date();base.setDate(1);base.setMonth(base.getMonth()+monthOff);
const year=base.getFullYear(),month=base.getMonth();
const firstDow=(new Date(year,month,1).getDay()+6)%7;
const totalDays=new Date(year,month+1,0).getDate();
const cells=[];
for(let i=0;i<firstDow;i++) cells.push(null);
for(let d=1;d<=totalDays;d++) cells.push(new Date(year,month,d));
while(cells.length%7!==0) cells.push(null);
const dateStr=d=>d.toISOString().slice(0,10);
const key=(d,s)=>`${dateStr(d)}_${s}`;
const getArr=k=>shifts[k]||[];
const toggleAssign=(d,s,empId)=>{
const k=key(d,s);
setShifts(sh=>{
const cur=sh[k]||[];
const next=cur.includes(empId)?cur.filter(x=>x!==empId):[...cur,empId];
return{...sh,[k]:next};
});
};
const emp=id=>employees.find(e=>e.id===id);
const today=new Date();today.setHours(0,0,0,0);

const hoursByEmp={};
Object.entries(shifts).forEach(([k,arr])=>{
if(!arr||!arr.length) return;
const[ds,sid]=k.split("_");
const kd=new Date(ds);
if(kd.getFullYear()!==year||kd.getMonth()!==month) return;
const st=shiftTypes.find(s=>s.id===sid);if(!st)return;
arr.forEach(empId=>{hoursByEmp[empId]=(hoursByEmp[empId]||0)+st.hours;});
});
const totalHours=Object.values(hoursByEmp).reduce((a,b)=>a+b,0);

const updShiftType=(id,f,v)=>setShiftTypes(sts=>sts.map(s=>{
if(s.id!==id)return s;
const ns={...s,[f]:v};
if(f==="lunch"&&!v){ns.lunchFrom="";ns.lunchTo="";}
if(["start","end","lunchFrom","lunchTo"].includes(f)) ns.hours=diffHours(ns.start,ns.end,ns.lunch?ns.lunchFrom:"",ns.lunch?ns.lunchTo:"");
return ns;
}));
const addShiftType=()=>{
const id="s"+Date.now();
setShiftTypes(sts=>[...sts,{id,label:"Nová zmena",start:"08:00",end:"16:00",hours:8,color:"#E5E7EB",border:"#D1D5DB",req:1,lunch:false,lunchFrom:"",lunchTo:""}]);
};
const remShiftType=id=>setShiftTypes(sts=>sts.length>1?sts.filter(s=>s.id!==id):sts);

const[newEmpName,setNewEmpName]=useState("");
const quickAddEmployee=()=>{
const name=newEmpName.trim();if(!name||!setEmployees)return;
const ne={id:"em"+Date.now(),name,role:"Brigádnik",phone:"",email:"",contract:"Brigáda (dohoda)",wage:"",note:"",photo:"",icon:"👤",hireDate:todayStr(),probationMonths:3,address:"",idNumber:""};
setEmployees(es=>[...es,ne]);
setNewEmpName("");
};

const toggleAutoDay=(field,dow)=>setAutoP(p=>{
const arr=p[field];
return{...p,[field]:arr.includes(dow)?arr.filter(x=>x!==dow):[...arr,dow]};
});
const generateAuto=()=>{
if(!autoP.empId||!autoP.shiftId)return;
setShifts(sh=>{
const ns={...sh};
cells.forEach((d,i)=>{
if(!d)return;
const weekIdx=Math.floor(i/7);
const isFirstShort=autoP.firstWeekType==="short";
const weekIsShort=weekIdx%2===0?isFirstShort:!isFirstShort;
const dow=(d.getDay()+6)%7;
const pattern=weekIsShort?autoP.shortDays:autoP.longDays;
if(pattern.includes(dow)){
const k=key(d,autoP.shiftId);
const cur=ns[k]||[];
if(!cur.includes(autoP.empId)) ns[k]=[...cur,autoP.empId];
}
});
return ns;
});
setShowAuto(false);
};

return(
<div style={{padding:14,display:"flex",flexDirection:"column",gap:10}}>
<div style={{background:BRAND.crema,borderRadius:8,padding:"8px 12px",fontSize:11,color:BRAND.arabica}}>
🗓 Smenový kalendár — klikni na zmenu v deň, vyber viacero zamestnancov. Hodiny sa počítajú automaticky.
</div>

<div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
<button onClick={()=>setShowSettings(v=>!v)} style={{flex:"0 0 auto",padding:"7px 12px",borderRadius:7,border:"1px solid #E8E0D0",background:showSettings?BRAND.crema:"#fff",color:BRAND.arabica,fontSize:11,fontWeight:600,cursor:"pointer"}}>⚙️ Typy zmien a počty</button>
<button onClick={()=>setShowAuto(v=>!v)} style={{flex:"0 0 auto",padding:"7px 12px",borderRadius:7,border:"1px solid #E8E0D0",background:showAuto?BRAND.crema:"#fff",color:BRAND.arabica,fontSize:11,fontWeight:600,cursor:"pointer"}}>🔁 Krátky/dlhý týždeň (auto)</button>
</div>

{showSettings&&(
<div style={{background:"#fff",borderRadius:10,border:"1px solid #E8E0D0",padding:12,display:"flex",flexDirection:"column",gap:8}}>
<div style={{fontSize:11,fontWeight:700,color:BRAND.espresso}}>Typy zmien (čas, hodiny, potrebný počet ľudí):</div>
{shiftTypes.map(st=>(
<div key={st.id} style={{background:BRAND.latte,borderRadius:8,padding:8,display:"flex",flexDirection:"column",gap:5}}>
<div style={{display:"flex",gap:6,alignItems:"center"}}>
<input value={st.label} onChange={e=>updShiftType(st.id,"label",e.target.value)} style={{flex:1,padding:"5px 7px",borderRadius:5,border:"1px solid #E8D0A0",fontSize:11,outline:"none"}}/>
<button onClick={()=>remShiftType(st.id)} style={{padding:"4px 7px",borderRadius:5,border:"none",background:"#FEE2E2",color:BRAND.terracotta,fontSize:10,cursor:"pointer"}}>✕</button>
</div>
<div style={{display:"flex",gap:6,alignItems:"center"}}>
<input type="time" value={st.start} onChange={e=>updShiftType(st.id,"start",e.target.value)} style={{flex:1,padding:"5px 7px",borderRadius:5,border:"1px solid #E8D0A0",fontSize:11}}/>
<span style={{fontSize:11,color:"#A08060"}}>–</span>
<input type="time" value={st.end} onChange={e=>updShiftType(st.id,"end",e.target.value)} style={{flex:1,padding:"5px 7px",borderRadius:5,border:"1px solid #E8D0A0",fontSize:11}}/>
<span style={{fontSize:10,color:"#A08060",whiteSpace:"nowrap"}}>{st.hours}h</span>
</div>
<div style={{display:"flex",gap:6,alignItems:"center"}}>
<span style={{fontSize:10,color:"#A08060"}}>Potrebný počet ľudí:</span>
<input type="number" min="1" value={st.req} onChange={e=>updShiftType(st.id,"req",parseInt(e.target.value)||1)} style={{width:50,padding:"4px 6px",borderRadius:5,border:"1px solid #E8D0A0",fontSize:11,textAlign:"center"}}/>
</div>
<label style={{display:"flex",alignItems:"center",gap:6,fontSize:10,color:"#A08060",cursor:"pointer"}}>
<input type="checkbox" checked={!!st.lunch} onChange={e=>updShiftType(st.id,"lunch",e.target.checked)}/>
Obedná prestávka (voliteľné, odpočíta sa z hodín)
</label>
{st.lunch&&(
<div style={{display:"flex",gap:6,alignItems:"center"}}>
<span style={{fontSize:10,color:"#A08060",flexShrink:0}}>Prestávka:</span>
<input type="time" value={st.lunchFrom} onChange={e=>updShiftType(st.id,"lunchFrom",e.target.value)} style={{flex:1,padding:"4px 6px",borderRadius:5,border:"1px solid #E8D0A0",fontSize:11}}/>
<span style={{fontSize:11,color:"#A08060"}}>–</span>
<input type="time" value={st.lunchTo} onChange={e=>updShiftType(st.id,"lunchTo",e.target.value)} style={{flex:1,padding:"4px 6px",borderRadius:5,border:"1px solid #E8D0A0",fontSize:11}}/>
</div>
)}
</div>
))}
<button onClick={addShiftType} style={{padding:7,borderRadius:7,border:"1.5px dashed #E8E0D0",background:"none",color:BRAND.arabica,fontSize:11,fontWeight:600,cursor:"pointer"}}>+ Pridať typ zmeny (napr. celodenná, krátka...)</button>
</div>
)}

{showAuto&&(
<div style={{background:"#fff",borderRadius:10,border:"1px solid #E8E0D0",padding:12,display:"flex",flexDirection:"column",gap:8}}>
<div style={{fontSize:11,fontWeight:700,color:BRAND.espresso}}>🔁 Automatické plánovanie — krátky/dlhý týždeň</div>
<div style={{fontSize:10,color:"#A08060"}}>Vyber zamestnanca a dni pre krátky a dlhý týždeň. Týždne v mesiaci sa striedajú automaticky.</div>
<select value={autoP.empId} onChange={e=>setAutoP(p=>({...p,empId:e.target.value}))} style={{padding:"7px 8px",borderRadius:7,border:"1px solid #E8E0D0",fontSize:12}}>
<option value="">Vyber zamestnanca…</option>
{employees.map(e=><option key={e.id} value={e.id}>{e.icon||"👤"} {e.name}</option>)}
</select>
<select value={autoP.shiftId} onChange={e=>setAutoP(p=>({...p,shiftId:e.target.value}))} style={{padding:"7px 8px",borderRadius:7,border:"1px solid #E8E0D0",fontSize:12}}>
<option value="">Vyber typ zmeny…</option>
{shiftTypes.map(s=><option key={s.id} value={s.id}>{s.label} ({s.start}–{s.end})</option>)}
</select>
<div style={{fontSize:10,color:"#A08060",fontWeight:600}}>Krátky týždeň — dni:</div>
<div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
{DOW.map((d,i)=>(
<button key={i} onClick={()=>toggleAutoDay("shortDays",i)} style={{padding:"5px 10px",borderRadius:99,border:"none",cursor:"pointer",fontSize:11,fontWeight:600,
background:autoP.shortDays.includes(i)?BRAND.olive:BRAND.crema,color:autoP.shortDays.includes(i)?"#fff":BRAND.arabica}}>{d}</button>
))}
</div>
<div style={{fontSize:10,color:"#A08060",fontWeight:600}}>Dlhý týždeň — dni:</div>
<div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
{DOW.map((d,i)=>(
<button key={i} onClick={()=>toggleAutoDay("longDays",i)} style={{padding:"5px 10px",borderRadius:99,border:"none",cursor:"pointer",fontSize:11,fontWeight:600,
background:autoP.longDays.includes(i)?BRAND.adriatic:BRAND.crema,color:autoP.longDays.includes(i)?"#fff":BRAND.arabica}}>{d}</button>
))}
</div>
<div style={{fontSize:10,color:"#A08060",fontWeight:600}}>Prvý týždeň v mesiaci je:</div>
<div style={{display:"flex",gap:5}}>
{[["short","Krátky"],["long","Dlhý"]].map(([id,lbl])=>(
<button key={id} onClick={()=>setAutoP(p=>({...p,firstWeekType:id}))} style={{flex:1,padding:"7px",borderRadius:7,border:"none",cursor:"pointer",fontSize:11,fontWeight:600,
background:autoP.firstWeekType===id?BRAND.espresso:BRAND.crema,color:autoP.firstWeekType===id?"#fff":BRAND.arabica}}>{lbl}</button>
))}
</div>
<button onClick={generateAuto} style={{padding:9,borderRadius:7,border:"none",background:BRAND.olive,color:"#fff",fontWeight:700,fontSize:12,cursor:"pointer"}}>✓ Vygenerovať na zobrazený mesiac</button>
</div>
)}

<div style={{display:"flex",alignItems:"center",gap:8}}>
<button onClick={()=>setMonthOff(m=>m-1)} style={{padding:"6px 12px",borderRadius:7,border:"none",background:BRAND.crema,color:BRAND.arabica,fontSize:13,cursor:"pointer",fontWeight:700}}>‹</button>
<div style={{flex:1,textAlign:"center",fontSize:13,fontWeight:700,color:BRAND.espresso}}>
{MONTHS_SK[month]} {year} {monthOff===0&&<span style={{color:BRAND.olive,fontSize:11}}>(tento mesiac)</span>}
</div>
<button onClick={()=>setMonthOff(m=>m+1)} style={{padding:"6px 12px",borderRadius:7,border:"none",background:BRAND.crema,color:BRAND.arabica,fontSize:13,cursor:"pointer",fontWeight:700}}>›</button>
</div>
{employees.length===0&&<div style={{background:"#FEE2E2",borderRadius:8,padding:"10px 14px",fontSize:11,color:BRAND.terracotta}}>Najprv pridaj zamestnancov v záložke 👥 Zamestnanci.</div>}

<div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3}}>
{DOW.map(d=><div key={d} style={{textAlign:"center",fontSize:10,fontWeight:700,color:"#A08060",padding:"2px 0"}}>{d}</div>)}
{cells.map((d,i)=>{
if(!d) return <div key={i}/>;
const isToday=d.getTime()===today.getTime();
return(
<div key={i} style={{background:"#fff",borderRadius:7,border:`1px solid ${isToday?BRAND.caramel:"#E8E0D0"}`,padding:"3px",minHeight:64,display:"flex",flexDirection:"column",gap:2}}>
<div style={{display:"flex",alignItems:"center",justifyContent:"space-between",paddingRight:1}}>
<button onClick={()=>setPicking({dateStr:dateStr(d),shiftId:shiftTypes[0]?.id,date:d,viaPlus:true})}
title="Pridať ďalšieho zamestnanca na tento deň"
style={{width:14,height:14,borderRadius:"50%",border:"none",background:BRAND.crema,color:BRAND.arabica,fontSize:10,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",padding:0,lineHeight:1}}>+</button>
<span style={{fontSize:10,fontWeight:isToday?700:400,color:isToday?BRAND.caramel:BRAND.espresso}}>{d.getDate()}</span>
</div>
{shiftTypes.map(st=>{
const k=key(d,st.id);const arr=getArr(k);
const isPicking=picking&&picking.dateStr===dateStr(d)&&picking.shiftId===st.id;
const met=arr.length>=st.req;
return(
<button key={st.id} onClick={()=>setPicking(isPicking?null:{dateStr:dateStr(d),shiftId:st.id,date:d})}
style={{width:"100%",borderRadius:5,border:`1px solid ${arr.length?st.border:"#F0EAE0"}`,background:arr.length?st.color:"#FAFAFA",cursor:"pointer",fontSize:9,fontWeight:600,color:BRAND.espresso,padding:"2px 3px",textAlign:"left",overflow:"hidden",whiteSpace:"nowrap",textOverflow:"ellipsis"}}>
{arr.length
?`${arr.slice(0,2).map(id=>emp(id)?.name?.slice(0,5)||"?").join(",")}${arr.length>2?` +${arr.length-2}`:""} ${met?"✓":`${arr.length}/${st.req}`}`
:`${st.label.slice(0,4)} +`}
</button>
);
})}
</div>
);
})}
</div>

{picking&&(()=>{const st=shiftTypes.find(s=>s.id===picking.shiftId);const arr=getArr(key(picking.date,picking.shiftId));return(
<div onClick={()=>setPicking(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.4)",zIndex:50,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
<div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:12,padding:16,width:"100%",maxWidth:300,maxHeight:"75vh",overflowY:"auto"}}>
<div style={{fontSize:12,fontWeight:700,color:BRAND.espresso,marginBottom:2}}>{picking.date.toLocaleDateString("sk",{weekday:"long",day:"numeric",month:"numeric"})}</div>
{picking.viaPlus&&shiftTypes.length>1&&(
<div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:8}}>
{shiftTypes.map(t=>(
<button key={t.id} onClick={()=>setPicking(p=>({...p,shiftId:t.id}))}
style={{flex:"0 0 auto",padding:"5px 10px",borderRadius:99,border:"none",cursor:"pointer",fontSize:11,fontWeight:600,
background:picking.shiftId===t.id?BRAND.espresso:BRAND.crema,color:picking.shiftId===t.id?"#fff":BRAND.arabica}}>
{t.label}
</button>
))}
</div>
)}
<div style={{fontSize:11,color:"#A08060",marginBottom:4}}>{st.label} ({st.start}–{st.end}, {st.hours}h{st.lunch&&st.lunchFrom&&st.lunchTo?`, obed ${st.lunchFrom}–${st.lunchTo}`:""})</div>
<div style={{fontSize:11,fontWeight:700,color:arr.length>=st.req?BRAND.olive:BRAND.terracotta,marginBottom:10}}>Obsadené: {arr.length} / {st.req} potrebných</div>
{employees.length===0&&<div style={{fontSize:11,color:"#A08060"}}>Žiadni zamestnanci.</div>}
{employees.map(e=>{
const checked=arr.includes(e.id);
return(
<button key={e.id} onClick={()=>toggleAssign(picking.date,picking.shiftId,e.id)}
style={{display:"flex",alignItems:"center",gap:8,width:"100%",textAlign:"left",padding:"8px 10px",borderRadius:7,border:"none",background:checked?BRAND.crema:"none",fontSize:12,color:BRAND.espresso,cursor:"pointer",marginBottom:2}}>
<span style={{width:16,height:16,borderRadius:4,border:`1.5px solid ${checked?BRAND.olive:"#D8D0C0"}`,background:checked?BRAND.olive:"#fff",color:"#fff",fontSize:10,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{checked?"✓":""}</span>
{e.icon||"👤"} {e.name}
</button>
);
})}
{setEmployees&&(
<div style={{display:"flex",gap:5,marginTop:8,paddingTop:8,borderTop:"1px solid #F0EAE0"}}>
<input value={newEmpName} onChange={e=>setNewEmpName(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")quickAddEmployee();}} placeholder="+ Nový zamestnanec (meno)…"
style={{flex:1,padding:"6px 8px",borderRadius:6,border:"1px solid #E8E0D0",fontSize:11,outline:"none"}}/>
<button onClick={quickAddEmployee} style={{padding:"6px 10px",borderRadius:6,border:"none",background:BRAND.olive,color:"#fff",fontSize:11,fontWeight:700,cursor:"pointer"}}>✓</button>
</div>
)}
<button onClick={()=>setPicking(null)} style={{width:"100%",padding:"8px",borderRadius:7,border:"1px solid #E8E0D0",background:"none",color:"#A08060",fontSize:11,cursor:"pointer",marginTop:6}}>Hotovo</button>
</div>
</div>
);})()}


<div style={{background:BRAND.espresso,borderRadius:10,padding:14}}>
<div style={{fontSize:12,fontWeight:700,color:BRAND.crema,marginBottom:8}}>⏱ Odpracované hodiny — {MONTHS_SK[month]} {year}</div>
{employees.length===0&&<div style={{fontSize:11,color:"#B89A7A"}}>Žiadni zamestnanci.</div>}
{employees.map(e=>(
<div key={e.id} style={{display:"flex",justifyContent:"space-between",fontSize:12,color:BRAND.caramel,marginBottom:4}}>
<span>{e.icon||"👤"} {e.name}</span><span style={{fontWeight:700}}>{hoursByEmp[e.id]||0} h</span>
</div>
))}
{employees.length>0&&<div style={{display:"flex",justifyContent:"space-between",fontSize:13,fontWeight:700,color:"#fff",paddingTop:6,borderTop:"1px solid rgba(255,255,255,.15)",marginTop:4}}>
<span>Spolu</span><span>{totalHours} h</span>
</div>}
</div>
</div>
);
}



function EshopTab(){
const[qty,setQty]=useState({});
const getQty=id=>qty[id]||1;
const setQ=(id,v)=>setQty(q=>({...q,[id]:Math.max(1,v)}));
return(
<div style={{padding:14,display:"flex",flexDirection:"column",gap:14}}>
<div style={{background:BRAND.crema,borderRadius:8,padding:"10px 14px",fontSize:11,color:BRAND.arabica}}>
🛒 Pomôcky a vybavenie na objednanie pre prevádzku Cafe Paradise.
</div>
{ESHOP_PRODUCTS.map(p=>{
const q=getQty(p.id);
const totalNoVAT=p.priceNoVAT*q;
const totalVAT=p.priceVAT*q;
return(
<div key={p.id} style={{background:"#fff",borderRadius:12,border:"1px solid #E8E0D0",overflow:"hidden"}}>
<div style={{display:"flex",gap:12,padding:14}}>
<div style={{fontSize:42,flexShrink:0,width:72,height:72,background:BRAND.crema,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center"}}>{p.img}</div>
<div style={{flex:1,minWidth:0}}>
<div style={{fontSize:13,fontWeight:700,color:BRAND.espresso,marginBottom:4}}>{p.name}</div>
<div style={{fontSize:10,color:"#A08060",lineHeight:1.5}}>{p.desc}</div>
</div>
</div>
<div style={{background:BRAND.crema,padding:"10px 14px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,fontSize:11}}>
<div><div style={{color:"#A08060",marginBottom:3}}>Dostupnosť</div><div style={{fontWeight:700,color:BRAND.olive}}>✓ {p.availability}</div></div>
<div><div style={{color:"#A08060",marginBottom:3}}>Cena bez DPH</div><div style={{fontWeight:700,color:BRAND.espresso}}>{p.priceNoVAT.toLocaleString("sk")} {p.currency}</div></div>
<div><div style={{color:"#A08060",marginBottom:3}}>Množstvo</div>
<div style={{display:"flex",alignItems:"center",gap:6}}>
<button onClick={()=>setQ(p.id,q-1)} style={{width:24,height:24,borderRadius:6,border:"none",background:BRAND.adriatic,color:"#fff",fontWeight:700,cursor:"pointer",fontSize:13}}>−</button>
<input value={q} onChange={e=>setQ(p.id,parseInt(e.target.value)||1)} style={{width:36,textAlign:"center",padding:"3px",borderRadius:6,border:"1px solid #E8E0D0",fontSize:12}}/>
<button onClick={()=>setQ(p.id,q+1)} style={{width:24,height:24,borderRadius:6,border:"none",background:BRAND.adriatic,color:"#fff",fontWeight:700,cursor:"pointer",fontSize:13}}>+</button>
</div>
</div>
<div><div style={{color:"#A08060",marginBottom:3}}>Cena s DPH</div><div style={{fontWeight:700,color:BRAND.terracotta,fontSize:13}}>{totalVAT.toLocaleString("sk")} {p.currency}</div></div>
</div>
<div style={{padding:"10px 14px",display:"flex",gap:8,alignItems:"center",borderTop:"1px solid #F0EAE0"}}>
<div style={{flex:1,fontSize:11,color:"#A08060"}}>Spolu bez DPH: <b style={{color:BRAND.espresso}}>{totalNoVAT.toLocaleString("sk")} {p.currency}</b></div>
<a href={p.url} target="_blank" rel="noreferrer" style={{padding:"8px 16px",borderRadius:7,background:BRAND.olive,color:"#fff",fontSize:12,fontWeight:700,textDecoration:"none",whiteSpace:"nowrap"}}>
🔗 Objednať na decibar.cz
</a>
</div>
</div>
);
})}
</div>
);
}

function FirmaTab({company,setCompany}){
const upd=(f,v)=>setCompany(c=>({...c,[f]:v}));
const FIELDS=[
{key:"name",label:"Obchodné meno (s.r.o.)",placeholder:"napr. Gastro Corner s.r.o."},
{key:"sidlo",label:"Sídlo (adresa)",placeholder:"Ulica, PSČ Mesto"},
{key:"ico",label:"IČO",placeholder:"napr. 53182120"},
{key:"dic",label:"DIČ",placeholder:"napr. 2121306671"},
{key:"icDph",label:"IČ DPH",placeholder:"napr. SK2121306671"},
{key:"iban",label:"IBAN (pre QR platby v Pokladni)",placeholder:"napr. SK89 7500 0000 0000 1234 5671"},
{key:"place",label:"Miesto podpisu zmlúv",placeholder:"napr. Bratislava"},
];
return(
<div style={{padding:14,display:"flex",flexDirection:"column",gap:10}}>
<div style={{background:BRAND.crema,borderRadius:8,padding:"8px 12px",fontSize:11,color:BRAND.arabica}}>
🏢 Firemné a prevádzkové údaje — používajú sa automaticky vo všetkých generovaných dokumentoch (napr. pracovné zmluvy).
</div>
<div style={{background:"#fff",borderRadius:12,border:"1px solid #E8E0D0",padding:16,display:"flex",flexDirection:"column",gap:10}}>
{FIELDS.map(f=>(
<div key={f.key}>
<div style={{fontSize:10,color:"#A08060",fontWeight:600,marginBottom:4}}>{f.label}:</div>
<input value={company[f.key]||""} onChange={e=>upd(f.key,e.target.value)} placeholder={f.placeholder}
style={{width:"100%",padding:"9px 11px",borderRadius:8,border:"1px solid #E8E0D0",fontSize:13,outline:"none",boxSizing:"border-box",color:BRAND.espresso}}/>
</div>
))}
</div>

{/* Virtuálne sídlo — voliteľný box */}
<div style={{background:"#fff",borderRadius:12,border:"1px solid #E8E0D0",padding:16,display:"flex",flexDirection:"column",gap:10}}>
<label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer"}}>
<input type="checkbox" checked={!!company.hasVirtualOffice} onChange={e=>upd("hasVirtualOffice",e.target.checked)}/>
<span style={{fontSize:12,fontWeight:700,color:BRAND.espresso}}>🏢 Firma má virtuálne sídlo</span>
</label>
{company.hasVirtualOffice&&(<>
<div>
<div style={{fontSize:10,color:"#A08060",fontWeight:600,marginBottom:4}}>Poskytovateľ virtuálneho sídla:</div>
<input value={company.voProvider||""} onChange={e=>upd("voProvider",e.target.value)} placeholder="napr. názov spoločnosti poskytujúcej sídlo"
style={{width:"100%",padding:"9px 11px",borderRadius:8,border:"1px solid #E8E0D0",fontSize:13,outline:"none",boxSizing:"border-box",color:BRAND.espresso}}/>
</div>
<div style={{display:"flex",gap:8}}>
<div style={{flex:1}}>
<div style={{fontSize:10,color:"#A08060",fontWeight:600,marginBottom:4}}>Platnosť od:</div>
<input type="date" value={company.voFrom||""} onChange={e=>upd("voFrom",e.target.value)}
style={{width:"100%",padding:"9px 11px",borderRadius:8,border:"1px solid #E8E0D0",fontSize:13,outline:"none",boxSizing:"border-box",color:BRAND.espresso}}/>
</div>
<div style={{flex:1}}>
<div style={{fontSize:10,color:"#A08060",fontWeight:600,marginBottom:4}}>Platnosť do:</div>
<input type="date" value={company.voTo||""} onChange={e=>upd("voTo",e.target.value)}
style={{width:"100%",padding:"9px 11px",borderRadius:8,border:"1px solid #E8E0D0",fontSize:13,outline:"none",boxSizing:"border-box",color:BRAND.espresso}}/>
</div>
</div>
{company.voTo&&(()=>{
const d=daysUntil(company.voTo);
if(d===null)return null;
const urgent=d<=30;
return(
<div style={{background:urgent?"#FEE2E2":"#F0FDF4",border:`1px solid ${urgent?"#FCA5A5":"#6EE7B7"}`,borderRadius:8,padding:"9px 11px",display:"flex",alignItems:"center",gap:8}}>
<span style={{fontSize:16}}>{urgent?"⚠️":"✅"}</span>
<div style={{fontSize:11,color:urgent?BRAND.terracotta:BRAND.olive,fontWeight:600}}>
{d<0
?`Platnosť virtuálneho sídla vypršala ${new Date(company.voTo).toLocaleDateString("sk")} — uhraď faktúru a obnov zmluvu!`
:urgent
?`Pripomienka: faktúru za virtuálne sídlo treba uhradiť do ${new Date(company.voTo).toLocaleDateString("sk")} (zostáva ${d} dní)`
:`Platné do ${new Date(company.voTo).toLocaleDateString("sk")} (${d} dní)`}
</div>
</div>
);
})()}
</>)}
</div>

<div style={{background:BRAND.espresso,borderRadius:10,padding:14}}>
<div style={{fontSize:11,fontWeight:700,color:BRAND.crema,marginBottom:6}}>📇 Náhľad — ako sa zobrazí v dokumentoch:</div>
<div style={{fontSize:12,color:BRAND.caramel,lineHeight:1.6}}>
{company.name||"—"}<br/>
{company.sidlo||"—"}<br/>
IČO: {company.ico||"—"} · DIČ: {company.dic||"—"} · IČ DPH: {company.icDph||"—"}
</div>
</div>
</div>
);
}

const DOW_FULL=["Po","Ut","St","Št","Pi","So","Ne"];
const EMPTY_HOUR={open:"",close:"",lunch:false,lunchFrom:"",lunchTo:""};
const VENUE_DEFAULT={
name:"Cafe Paradise",
type:"Kaviareň, bar & wellness",
capacity:"",
address:"J. Murgaša 46, Prievidza",
phone:"",
email:"",
hours:{Po:{...EMPTY_HOUR},Ut:{...EMPTY_HOUR},St:{...EMPTY_HOUR},Št:{...EMPTY_HOUR},Pi:{...EMPTY_HOUR},So:{...EMPTY_HOUR},Ne:{...EMPTY_HOUR}},
hoursMode:"same",
note:"",
};
function HourFields({value,onChange}){
const v=value||EMPTY_HOUR;
const set=(f,val)=>onChange({...v,[f]:val});
return(
<div style={{display:"flex",flexDirection:"column",gap:5}}>
<div style={{display:"flex",gap:6,alignItems:"center"}}>
<input type="time" value={v.open} onChange={e=>set("open",e.target.value)}
style={{flex:1,padding:"6px 8px",borderRadius:6,border:"1px solid #E8E0D0",fontSize:12,outline:"none"}}/>
<span style={{fontSize:11,color:"#A08060"}}>–</span>
<input type="time" value={v.close} onChange={e=>set("close",e.target.value)}
style={{flex:1,padding:"6px 8px",borderRadius:6,border:"1px solid #E8E0D0",fontSize:12,outline:"none"}}/>
</div>
<label style={{display:"flex",alignItems:"center",gap:6,fontSize:10,color:"#A08060",cursor:"pointer"}}>
<input type="checkbox" checked={!!v.lunch} onChange={e=>set("lunch",e.target.checked)}/>
Obedná prestávka
</label>
{v.lunch&&(
<div style={{display:"flex",gap:6,alignItems:"center",marginLeft:4}}>
<span style={{fontSize:10,color:"#A08060",flexShrink:0}}>Prestávka:</span>
<input type="time" value={v.lunchFrom} onChange={e=>set("lunchFrom",e.target.value)}
style={{flex:1,padding:"5px 7px",borderRadius:6,border:"1px solid #E8E0D0",fontSize:11,outline:"none"}}/>
<span style={{fontSize:11,color:"#A08060"}}>–</span>
<input type="time" value={v.lunchTo} onChange={e=>set("lunchTo",e.target.value)}
style={{flex:1,padding:"5px 7px",borderRadius:6,border:"1px solid #E8E0D0",fontSize:11,outline:"none"}}/>
</div>
)}
</div>
);
}
function fmtHour(h){
if(!h||!h.open||!h.close) return null;
let s=`${h.open}–${h.close}`;
if(h.lunch&&h.lunchFrom&&h.lunchTo) s+=` (obed ${h.lunchFrom}–${h.lunchTo})`;
return s;
}
function VenueTab({venue,setVenue}){
const upd=(f,v)=>setVenue(p=>({...p,[f]:v}));
const updHour=(d,val)=>setVenue(p=>{
const nh={...p.hours,[d]:val};
// Pri vyplnení Pondelka automaticky vyplň aj Ut–Pi (pracovné dni rovnaké)
if(d==="Po"){nh.Ut=val;nh.St=val;nh.Št=val;nh.Pi=val;}
return{...p,hours:nh};
});
const setSameAll=val=>setVenue(p=>({...p,hours:{Po:val,Ut:val,St:val,Št:val,Pi:val,So:val,Ne:val}}));
const TOP_FIELDS=[
{key:"name",label:"Názov prevádzky",placeholder:"napr. Cafe Paradise"},
{key:"type",label:"Typ prevádzky",placeholder:"napr. Kaviareň, bar & wellness"},
{key:"capacity",label:"Kapacita (počet miest)",placeholder:"napr. 40 vnútri + 24 terasa"},
];
const hoursSet = Object.values(venue.hours||{}).some(h=>h&&h.open&&h.close);
return(
<div style={{padding:14,display:"flex",flexDirection:"column",gap:10}}>
<div style={{background:BRAND.crema,borderRadius:8,padding:"8px 12px",fontSize:11,color:BRAND.arabica}}>
🏪 Údaje o samotnej prevádzke (kaviarni) — odlišné od právnických údajov firmy v záložke 🏢 Firma.
</div>
<div style={{background:"#fff",borderRadius:12,border:"1px solid #E8E0D0",padding:16,display:"flex",flexDirection:"column",gap:10}}>
{TOP_FIELDS.map(f=>(
<div key={f.key}>
<div style={{fontSize:10,color:"#A08060",fontWeight:600,marginBottom:4}}>{f.label}:</div>
<input value={venue[f.key]||""} onChange={e=>upd(f.key,e.target.value)} placeholder={f.placeholder}
style={{width:"100%",padding:"9px 11px",borderRadius:8,border:"1px solid #E8E0D0",fontSize:13,outline:"none",boxSizing:"border-box",color:BRAND.espresso}}/>
</div>
))}
<div>
<div style={{fontSize:10,color:"#A08060",fontWeight:600,marginBottom:4}}>Adresa prevádzky:</div>
<input value={venue.address||""} onChange={e=>upd("address",e.target.value)} placeholder="Ulica, č., PSČ Mesto"
style={{width:"100%",padding:"9px 11px",borderRadius:8,border:"1px solid #E8E0D0",fontSize:13,outline:"none",boxSizing:"border-box",color:BRAND.espresso}}/>
</div>
<div>
<div style={{fontSize:10,color:"#A08060",fontWeight:600,marginBottom:4}}>Telefón prevádzky:</div>
<input value={venue.phone||""} onChange={e=>upd("phone",e.target.value)} placeholder="+421…"
style={{width:"100%",padding:"9px 11px",borderRadius:8,border:"1px solid #E8E0D0",fontSize:13,outline:"none",boxSizing:"border-box",color:BRAND.espresso}}/>
</div>
<div>
<div style={{fontSize:10,color:"#A08060",fontWeight:600,marginBottom:4}}>Email prevádzky:</div>
<input value={venue.email||""} onChange={e=>upd("email",e.target.value)} placeholder="info@…"
style={{width:"100%",padding:"9px 11px",borderRadius:8,border:"1px solid #E8E0D0",fontSize:13,outline:"none",boxSizing:"border-box",color:BRAND.espresso}}/>
</div>
<div>
<div style={{fontSize:10,color:"#A08060",fontWeight:600,marginBottom:6}}>Otváracie hodiny:</div>
<div style={{display:"flex",gap:5,marginBottom:8}}>
{[["same","Rovnaké pre všetky dni"],["perDay","Podľa jednotlivých dní"]].map(([id,lbl])=>(
<button key={id} onClick={()=>upd("hoursMode",id)}
style={{flex:1,padding:"7px 8px",borderRadius:7,border:"none",cursor:"pointer",fontSize:11,fontWeight:600,
background:venue.hoursMode===id?BRAND.espresso:BRAND.crema,color:venue.hoursMode===id?"#fff":BRAND.arabica}}>
{lbl}
</button>
))}
</div>
{venue.hoursMode==="same"?(
<HourFields value={venue.hours.Po} onChange={setSameAll}/>
):(
<div style={{display:"flex",flexDirection:"column",gap:10}}>
<div style={{fontSize:9,color:"#A08060",fontStyle:"italic"}}>Vyplnením pondelka sa automaticky nastaví Po–Pi rovnako. So a Ne uprav samostatne.</div>
{DOW_FULL.map(d=>(
<div key={d} style={{borderTop:d!=="Po"?"1px solid #F0EAE0":"none",paddingTop:d!=="Po"?8:0}}>
<div style={{fontSize:11,fontWeight:700,color:BRAND.espresso,marginBottom:4}}>{d}</div>
<HourFields value={venue.hours[d]} onChange={val=>updHour(d,val)}/>
</div>
))}
</div>
)}
</div>
<div>
<div style={{fontSize:10,color:"#A08060",fontWeight:600,marginBottom:4}}>Poznámka <span style={{fontWeight:400,fontStyle:"italic"}}>— napr. predchodca/pôvodná prevádzka, vypíš len ak chceš v údajoch uvádzať pôvodný názov (napr. "predtým KupéCoffe")</span>:</div>
<textarea value={venue.note||""} onChange={e=>upd("note",e.target.value)} placeholder='Voliteľná poznámka, napr. "predtým KupéCoffe"…' rows={3}
style={{width:"100%",padding:"9px 11px",borderRadius:8,border:"1px solid #E8E0D0",fontSize:12,outline:"none",boxSizing:"border-box",color:BRAND.espresso,resize:"vertical",fontFamily:"inherit"}}/>
</div>
</div>
<div style={{background:BRAND.espresso,borderRadius:10,padding:14}}>
<div style={{fontSize:11,fontWeight:700,color:BRAND.crema,marginBottom:6}}>📇 Náhľad:</div>
<div style={{fontSize:12,color:BRAND.caramel,lineHeight:1.6}}>
{venue.name||"—"} <span style={{color:"#B89A7A"}}>· {venue.type||"—"}</span><br/>
{venue.address||"—"}<br/>
{(venue.phone||venue.email)&&<>{venue.phone}{venue.phone&&venue.email?" · ":""}{venue.email}<br/></>}
{venue.capacity&&<>👥 {venue.capacity}<br/></>}
{hoursSet&&<>🕐 {DOW_FULL.filter(d=>fmtHour(venue.hours[d])).map(d=>`${d} ${fmtHour(venue.hours[d])}`).join(", ")}<br/></>}
{venue.note&&<span style={{color:"#B89A7A",fontStyle:"italic"}}>{venue.note}</span>}
</div>
</div>
</div>
);
}

// ── ZÁVOZY (pravidelné dodávky) ────────────────────────────────
const FREQ_OPTIONS=["Každý deň","Každý pondelok","Každý utorok","Každú stredu","Každý štvrtok","Každý piatok","Každú sobotu","Každú nedeľu","Každý 2. týždeň","Raz za mesiac","Podľa objednávky","Iné"];
const ZAVOZY_INITIAL=[];
// ── POKLADŇA (tržby + QR platba) ────────────────────────────────
const SALE_CATS=["Káva","Jedlo","Alkohol","Nealko","Wellness","Iné"];
const PAY_METHODS=["Hotovosť","Karta","QR / prevod"];
function ibanToEpc(iban){return (iban||"").replace(/\s+/g,"").toUpperCase();}
function buildEpcQR(company,amount,note){
const iban=ibanToEpc(company.iban);
const lines=["BCD","002","1","SCT","",company.name||"",iban,amount?`EUR${parseFloat(amount).toFixed(2)}`:"","","",note||""];
return lines.join("\n");
}
function qrImgUrl(data,size=220){
return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(data)}`;
}
function PokladnaTab({company,sales,setSales}){
const[form,setForm]=useState({amount:"",cat:"Káva",method:"Hotovosť",note:"",date:todayStr()});
const[qrAmount,setQrAmount]=useState("");
const[qrNote,setQrNote]=useState("");
const[showQR,setShowQR]=useState(false);

const addSale=(amount,cat,method,note,date)=>{
const a=parseFloat(amount);if(!a||a<=0)return;
setSales(s=>[{id:"s"+Date.now(),amount:a,cat,method,note:note||"",date:date||todayStr()},...s]);
};
const submitForm=()=>{addSale(form.amount,form.cat,form.method,form.note,form.date);setForm(f=>({...f,amount:"",note:""}));};
const rem=id=>setSales(s=>s.filter(x=>x.id!==id));

const todayKey=todayStr();
const weekAgo=new Date();weekAgo.setDate(weekAgo.getDate()-7);
const monthAgo=new Date();monthAgo.setDate(monthAgo.getDate()-30);
const sumIn=(days)=>{
const cutoff=days===0?todayKey:(days===7?weekAgo:monthAgo).toISOString().slice(0,10);
return sales.filter(s=>days===0?s.date===todayKey:s.date>=cutoff).reduce((a,s)=>a+s.amount,0);
};
const todaySales=sales.filter(s=>s.date===todayKey);
const byCat={};todaySales.forEach(s=>{byCat[s.cat]=(byCat[s.cat]||0)+s.amount;});
const byMethod={};todaySales.forEach(s=>{byMethod[s.method]=(byMethod[s.method]||0)+s.amount;});

const qrString=buildEpcQR(company,qrAmount,qrNote);
const noIban=!company.iban;

return(
<div style={{padding:14,display:"flex",flexDirection:"column",gap:10}}>
<div style={{background:BRAND.crema,borderRadius:8,padding:"8px 12px",fontSize:11,color:BRAND.arabica}}>
💰 Pokladňa — zaznamenaj tržby a generuj QR kód pre priamu platbu na bankový účet.
</div>

<div style={{display:"flex",gap:6}}>
{[["Dnes",sumIn(0)],["7 dní",sumIn(7)],["30 dní",sumIn(30)]].map(([l,v])=>(
<div key={l} style={{flex:1,background:"#fff",borderRadius:8,border:"1px solid #E8E0D0",padding:"10px 8px",textAlign:"center"}}>
<div style={{fontSize:16,fontWeight:700,color:BRAND.olive}}>{v.toFixed(2)} €</div>
<div style={{fontSize:10,color:"#A08060"}}>{l}</div>
</div>
))}
</div>

{/* Nová tržba */}
<div style={{background:"#fff",borderRadius:10,border:"1px solid #E8E0D0",padding:12,display:"flex",flexDirection:"column",gap:7}}>
<div style={{fontSize:11,fontWeight:700,color:BRAND.espresso}}>+ Nová tržba</div>
<input type="number" value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))} placeholder="Suma €" step="0.01"
style={{padding:"8px 10px",borderRadius:7,border:"1px solid #E8E0D0",fontSize:14,fontWeight:700,outline:"none"}}/>
<div style={{display:"flex",gap:5,overflowX:"auto"}}>
{SALE_CATS.map(c=>(
<button key={c} onClick={()=>setForm(f=>({...f,cat:c}))}
style={{flex:"0 0 auto",padding:"6px 10px",borderRadius:99,border:"none",cursor:"pointer",fontSize:11,fontWeight:600,whiteSpace:"nowrap",
background:form.cat===c?BRAND.espresso:BRAND.crema,color:form.cat===c?"#fff":BRAND.arabica}}>{c}</button>
))}
</div>
<div style={{display:"flex",gap:5}}>
{PAY_METHODS.map(m=>(
<button key={m} onClick={()=>setForm(f=>({...f,method:m}))}
style={{flex:1,padding:"6px 8px",borderRadius:7,border:"none",cursor:"pointer",fontSize:11,fontWeight:600,
background:form.method===m?BRAND.adriatic:BRAND.crema,color:form.method===m?"#fff":BRAND.arabica}}>{m}</button>
))}
</div>
<input value={form.note} onChange={e=>setForm(f=>({...f,note:e.target.value}))} placeholder="Poznámka (voliteľné)"
style={{padding:"7px 10px",borderRadius:7,border:"1px solid #E8E0D0",fontSize:12,outline:"none"}}/>
<button onClick={submitForm} disabled={!form.amount} style={{padding:9,borderRadius:7,border:"none",background:BRAND.olive,color:"#fff",fontWeight:700,fontSize:12,cursor:form.amount?"pointer":"default",opacity:form.amount?1:0.5}}>
✓ Zaznamenať tržbu
</button>
</div>

{/* QR platba */}
<div style={{background:"#fff",borderRadius:10,border:"1px solid #E8E0D0",padding:12,display:"flex",flexDirection:"column",gap:7}}>
<button onClick={()=>setShowQR(v=>!v)} style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:"none",border:"none",cursor:"pointer",padding:0}}>
<span style={{fontSize:11,fontWeight:700,color:BRAND.espresso}}>📱 Priama platba na účet cez QR kód</span>
<span style={{color:"#A08060"}}>{showQR?"▾":"▸"}</span>
</button>
{showQR&&(<>
{noIban&&<div style={{fontSize:11,color:BRAND.terracotta,background:"#FEE2E2",padding:"7px 9px",borderRadius:7}}>⚠️ Najprv doplň IBAN v záložke 🏢 Firma.</div>}
<input type="number" value={qrAmount} onChange={e=>setQrAmount(e.target.value)} placeholder="Suma na úhradu €" step="0.01"
style={{padding:"8px 10px",borderRadius:7,border:"1px solid #E8E0D0",fontSize:14,fontWeight:700,outline:"none"}}/>
<input value={qrNote} onChange={e=>setQrNote(e.target.value)} placeholder="Poznámka pre platbu (napr. stôl 4)"
style={{padding:"7px 10px",borderRadius:7,border:"1px solid #E8E0D0",fontSize:12,outline:"none"}}/>
{!noIban&&qrAmount&&(
<div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:8,padding:10,background:BRAND.crema,borderRadius:10}}>
<img src={qrImgUrl(qrString)} alt="QR platba" style={{width:200,height:200,borderRadius:8,background:"#fff"}}/>
<div style={{fontSize:13,fontWeight:700,color:BRAND.espresso}}>{parseFloat(qrAmount).toFixed(2)} €</div>
<div style={{fontSize:10,color:"#A08060",textAlign:"center"}}>Klient naskenuje QR vo svojej bankovej appke a sumu uhradí priamo na účet.</div>
<button onClick={()=>{addSale(qrAmount,"Iné","QR / prevod",qrNote,todayStr());setQrAmount("");setQrNote("");}}
style={{padding:8,borderRadius:7,border:"none",background:BRAND.olive,color:"#fff",fontWeight:700,fontSize:11,cursor:"pointer"}}>
✓ Zaznamenať ako prijatú platbu
</button>
</div>
)}
</>)}
</div>

{/* Súhrn dňa */}
{todaySales.length>0&&(
<div style={{background:BRAND.espresso,borderRadius:10,padding:14}}>
<div style={{fontSize:11,fontWeight:700,color:BRAND.crema,marginBottom:8}}>📊 Súhrn dnešného dňa</div>
<div style={{display:"flex",flexWrap:"wrap",gap:10,marginBottom:8}}>
{Object.entries(byCat).map(([c,v])=>(
<div key={c} style={{fontSize:11,color:BRAND.caramel}}>{c}: <b>{v.toFixed(2)} €</b></div>
))}
</div>
<div style={{display:"flex",flexWrap:"wrap",gap:10,paddingTop:8,borderTop:"1px solid rgba(255,255,255,.15)"}}>
{Object.entries(byMethod).map(([m,v])=>(
<div key={m} style={{fontSize:11,color:BRAND.caramel}}>{m}: <b>{v.toFixed(2)} €</b></div>
))}
</div>
</div>
)}

{/* Zoznam */}
<div style={{display:"flex",flexDirection:"column",gap:5}}>
{sales.slice(0,30).map(s=>(
<div key={s.id} style={{display:"flex",alignItems:"center",gap:8,background:"#fff",borderRadius:8,border:"1px solid #E8E0D0",padding:"7px 10px"}}>
<div style={{flex:1}}>
<div style={{fontSize:12,fontWeight:700,color:BRAND.espresso}}>{s.amount.toFixed(2)} € <span style={{fontWeight:400,color:"#A08060",fontSize:10}}>· {s.cat} · {s.method}</span></div>
{s.note&&<div style={{fontSize:10,color:"#A08060"}}>{s.note}</div>}
</div>
<span style={{fontSize:10,color:"#A08060"}}>{new Date(s.date).toLocaleDateString("sk")}</span>
<button onClick={()=>rem(s.id)} style={{fontSize:10,color:"#D0C8C0",background:"none",border:"none",cursor:"pointer"}}>✕</button>
</div>
))}
{sales.length===0&&<div style={{textAlign:"center",color:"#A08060",fontSize:12,padding:20}}>Žiadne tržby zatiaľ zaznamenané.</div>}
</div>
</div>
);
}

function ZavozyTab(){
const[zavozy,setZavozy]=usePersistentState("cp_zavozy",ZAVOZY_INITIAL);
const[adding,setAdding]=useState(false);
const[editing,setEditing]=useState(null);
const[form,setForm]=useState({supplierId:"komatop",freq:"Každý pondelok",time:"",driverName:"",driverPhone:"",note:""});
const upd=(id,f,v)=>setZavozy(zs=>zs.map(z=>z.id===id?{...z,[f]:v}:z));
const rem=id=>setZavozy(zs=>zs.filter(z=>z.id!==id));
const addNew=()=>{
setZavozy(zs=>[...zs,{id:"zv"+Date.now(),...form}]);
setForm({supplierId:"komatop",freq:"Každý pondelok",time:"",driverName:"",driverPhone:"",note:""});setAdding(false);
};
const FormFields=({f,setF})=>(<>
<div style={{fontSize:10,color:"#A08060",fontWeight:600}}>Dodávateľ:</div>
<div style={{display:"flex",gap:5,overflowX:"auto"}}>
{Object.entries(SUPS).map(([id,s])=>(
<button key={id} onClick={()=>setF(p=>({...p,supplierId:id}))}
style={{flex:"0 0 auto",padding:"6px 10px",borderRadius:99,border:"none",cursor:"pointer",fontSize:11,fontWeight:600,whiteSpace:"nowrap",
background:f.supplierId===id?s.color:BRAND.crema,color:f.supplierId===id?"#fff":BRAND.arabica}}>{s.icon} {s.name}</button>
))}
</div>
<div style={{fontSize:10,color:"#A08060",fontWeight:600}}>Frekvencia závozu:</div>
<div style={{display:"flex",gap:5,overflowX:"auto",flexWrap:"wrap"}}>
{FREQ_OPTIONS.map(fr=>(
<button key={fr} onClick={()=>setF(p=>({...p,freq:fr}))}
style={{flex:"0 0 auto",padding:"6px 10px",borderRadius:99,border:"none",cursor:"pointer",fontSize:11,fontWeight:600,whiteSpace:"nowrap",
background:f.freq===fr?BRAND.espresso:BRAND.crema,color:f.freq===fr?"#fff":BRAND.arabica}}>{fr}</button>
))}
</div>
<div style={{fontSize:10,color:"#A08060",fontWeight:600}}>Čas dodania (voliteľné):</div>
<input type="time" value={f.time} onChange={e=>setF(p=>({...p,time:e.target.value}))}
style={{padding:"7px 10px",borderRadius:7,border:"1px solid #E8E0D0",fontSize:12,outline:"none"}}/>
<div style={{fontSize:10,color:"#A08060",fontWeight:600}}>Kontakt na dopravcu / vodiča (voliteľné):</div>
<input value={f.driverName} onChange={e=>setF(p=>({...p,driverName:e.target.value}))} placeholder="Meno vodiča / dopravcu"
style={{padding:"7px 10px",borderRadius:7,border:"1px solid #E8E0D0",fontSize:12,outline:"none"}}/>
<input value={f.driverPhone} onChange={e=>setF(p=>({...p,driverPhone:e.target.value}))} placeholder="Telefón vodiča"
style={{padding:"7px 10px",borderRadius:7,border:"1px solid #E8E0D0",fontSize:12,outline:"none"}}/>
<input value={f.note} onChange={e=>setF(p=>({...p,note:e.target.value}))} placeholder="Poznámka (voliteľné)"
style={{padding:"7px 10px",borderRadius:7,border:"1px solid #E8E0D0",fontSize:12,outline:"none"}}/>
</>);
return(
<div style={{padding:14,display:"flex",flexDirection:"column",gap:10}}>
<div style={{background:BRAND.crema,borderRadius:8,padding:"8px 12px",fontSize:11,color:BRAND.arabica}}>
🚚 Prehľad pravidelných závozov od dodávateľov a kontakt na dopravcu/vodiča pre každý závoz.
</div>
<button onClick={()=>setAdding(v=>!v)}
style={{padding:9,borderRadius:8,border:"1.5px dashed #E8E0D0",background:adding?BRAND.crema:"transparent",color:BRAND.arabica,fontSize:12,cursor:"pointer",fontWeight:600}}>
{adding?"✕ Zrušiť":"+ Pridať závoz"}
</button>
{adding&&(
<div style={{background:"#fff",borderRadius:10,border:"1px solid #E8E0D0",padding:12,display:"flex",flexDirection:"column",gap:6}}>
<FormFields f={form} setF={setForm}/>
<button onClick={addNew} style={{padding:9,borderRadius:7,border:"none",background:BRAND.olive,color:"#fff",fontWeight:700,fontSize:12,cursor:"pointer"}}>✓ Pridať</button>
</div>
)}
<div style={{display:"flex",flexDirection:"column",gap:7}}>
{zavozy.map(z=>{
const s=SUPS[z.supplierId];const isE=editing===z.id;
return(
<div key={z.id} style={{background:"#fff",borderRadius:10,border:"1px solid #E8E0D0",borderLeft:`4px solid ${s?.color||BRAND.arabica}`,padding:"12px 14px"}}>
{!isE?(<>
<div style={{display:"flex",alignItems:"flex-start",gap:8,marginBottom:6}}>
<div style={{flex:1}}>
<div style={{fontSize:13,fontWeight:700,color:s?.color||BRAND.espresso}}>{s?.icon} {s?.name||"Neznámy dodávateľ"}</div>
<div style={{fontSize:11,color:BRAND.espresso,marginTop:3,fontWeight:600}}>🗓 {z.freq}{z.time?` · ${z.time}`:""}</div>
{z.note&&<div style={{fontSize:10,color:"#A08060",marginTop:2}}>{z.note}</div>}
</div>
<button onClick={()=>setEditing(z.id)} style={{padding:"3px 8px",borderRadius:5,border:"none",cursor:"pointer",fontSize:11,fontWeight:600,background:BRAND.crema,color:BRAND.arabica}}>✎</button>
<button onClick={()=>rem(z.id)} style={{padding:"3px 8px",borderRadius:5,border:"none",cursor:"pointer",fontSize:11,background:"#FEE2E2",color:BRAND.terracotta}}>✕</button>
</div>
{(z.driverName||z.driverPhone)&&(
<div style={{background:BRAND.latte,borderRadius:8,padding:"8px 10px",display:"flex",alignItems:"center",gap:8}}>
<span style={{fontSize:11,color:BRAND.espresso,flex:1}}>🚚 {z.driverName||"Vodič/dopravca"}</span>
{z.driverPhone&&<a href={`tel:${z.driverPhone}`} style={{fontSize:11,fontWeight:700,color:"#fff",background:BRAND.olive,padding:"5px 10px",borderRadius:6,textDecoration:"none"}}>📞 {z.driverPhone}</a>}
</div>
)}
</>):(
<div style={{display:"flex",flexDirection:"column",gap:6}}>
<FormFields f={z} setF={updater=>setZavozy(zs=>zs.map(item=>item.id===z.id?updater(item):item))}/>
<button onClick={()=>setEditing(null)} style={{padding:8,borderRadius:7,border:"none",background:BRAND.olive,color:"#fff",fontWeight:700,fontSize:12,cursor:"pointer"}}>✓ Hotovo</button>
</div>
)}
</div>
);
})}
{zavozy.length===0&&<div style={{textAlign:"center",color:"#A08060",fontSize:12,padding:20}}>Žiadne pravidelné závozy. Pridaj prvý vyššie.</div>}
</div>
</div>
);
}

// ── RECEPTÚRY / KALKULÁCIE NÁPOJOV ──────────────────────────────
const RECIPE_CATEGORIES=["Koktaily","Kávy","Nealko","Jedlo","Iné"];
const RECIPES_INITIAL=[
{id:"rc_mojito",name:"Mojito",category:"Koktaily",sellPrice:"",kategoria:"Klasické",typ:"Klasický",glass:"Highball",difficulty:"Stredná",prepTime:"3-4 min",mocktail:false,photo:"",icon:"",shortInstr:"Roztlač mätu s cukrom, pridaj rum, limetku, ľad, doplň sódou",longInstr:"Do pohára vlož mätové listy a cukor, jemne roztlač lyžičkou (nedrť na kašu). Pridaj rozkrájanú limetku a roztlač spolu s mätou. Naplň pohár drveným ľadom, prilej biely rum a dôkladne premiešaj. Doplň sódou po okraj, znova zľahka premiešaj a dozdob mätou a limetkou.",ingredients:[{id:"ing_rc_mojito_0",scm:"",name:"Biely rum",qty:50,unit:"ml",cost:""},{id:"ing_rc_mojito_1",scm:"",name:"Limetka",qty:1,unit:"ks",cost:""},{id:"ing_rc_mojito_2",scm:"",name:"Mäta (listy)",qty:8,unit:"ks",cost:""},{id:"ing_rc_mojito_3",scm:"",name:"Trstinový cukor",qty:2,unit:"tsp",cost:""},{id:"ing_rc_mojito_4",scm:"",name:"Sóda",qty:100,unit:"ml",cost:""}]},
{id:"rc_margarita",name:"Margarita",category:"Koktaily",sellPrice:"",kategoria:"Klasické",typ:"Klasický",glass:"Coupe",difficulty:"Stredná",prepTime:"3 min",mocktail:false,photo:"",icon:"",shortInstr:"Shake tequilu, triple sec a limetkový džús s ľadom, podávaj v pohári s soľou na okraji",longInstr:"Okraj pohára navlhči limetkou a obal v hrubej soli. Do shakera daj ľad, tequilu, triple sec a čerstvý limetkový džús. Poriadne potras (10-15s) a precedi do pripraveného pohára. Dozdob plátkom limetky.",ingredients:[{id:"ing_rc_margarita_0",scm:"",name:"Tequila",qty:50,unit:"ml",cost:""},{id:"ing_rc_margarita_1",scm:"",name:"Triple sec",qty:25,unit:"ml",cost:""},{id:"ing_rc_margarita_2",scm:"",name:"Limetkový džús",qty:25,unit:"ml",cost:""},{id:"ing_rc_margarita_3",scm:"",name:"Soľ",qty:1,unit:"pinch",cost:""}]},
{id:"rc_gin_tonic",name:"Gin & Tonic",category:"Koktaily",sellPrice:"",kategoria:"Klasické",typ:"Klasický",glass:"Highball",difficulty:"Ľahká",prepTime:"2 min",mocktail:false,photo:"",icon:"",shortInstr:"Gin na ľad, doplň tonikom, dozdob limetkou",longInstr:"Pohár naplň ľadom po okraj. Prilej gin a pomaly doplň vychladeným tonikom, aby sa zachovala perlivosť. Zľahka premiešaj barovou lyžičkou. Dozdob kolieskami limetky alebo ako alternatívu plátkom uhorky.",ingredients:[{id:"ing_rc_gin_tonic_0",scm:"",name:"Gin",qty:50,unit:"ml",cost:""},{id:"ing_rc_gin_tonic_1",scm:"",name:"Tonic",qty:150,unit:"ml",cost:""},{id:"ing_rc_gin_tonic_2",scm:"",name:"Limetka",qty:1,unit:"ks",cost:""}]},
{id:"rc_negroni",name:"Negroni",category:"Koktaily",sellPrice:"",kategoria:"Klasické",typ:"Klasický",glass:"Rocks",difficulty:"Stredná",prepTime:"3 min",mocktail:false,photo:"",icon:"",shortInstr:"Postav v poradí gin, Campari, vermút na ľad, premiešaj",longInstr:"Do pohára na rocky vlož veľkú kocku ľadu. Prilej gin, Campari a sladký červený vermút v rovnakom poměre. Premiešaj barovou lyžičkou aspoň 20-30 sekúnd, aby sa nápoj dostatočne vychladil a zriedil. Dozdob pásikom pomarančovej kôry.",ingredients:[{id:"ing_rc_negroni_0",scm:"",name:"Gin",qty:30,unit:"ml",cost:""},{id:"ing_rc_negroni_1",scm:"",name:"Campari",qty:30,unit:"ml",cost:""},{id:"ing_rc_negroni_2",scm:"",name:"Červený vermút",qty:30,unit:"ml",cost:""},{id:"ing_rc_negroni_3",scm:"",name:"Pomarančová kôra",qty:1,unit:"ks",cost:""}]},
{id:"rc_old_fashioned",name:"Old Fashioned",category:"Koktaily",sellPrice:"",kategoria:"Klasické",typ:"Klasický",glass:"Rocks",difficulty:"Stredná",prepTime:"4 min",mocktail:false,photo:"",icon:"",shortInstr:"Cukor + bitters rozpusti vo whisky, na ľad, dozdob kôrou",longInstr:"V pohári na rocky rozpusti kocku cukru s 2-3 kvapkami Angostura bitters a kvapkou vody. Pridaj veľkú kocku ľadu a prilej bourbon alebo rye whisky. Pomaly premiešaj, aby sa whisky vychladila a zriedila. Dozdob vytlačenou pomarančovou kôrou a koktailovou čerešňou.",ingredients:[{id:"ing_rc_old_fashioned_0",scm:"",name:"Bourbon/rye whisky",qty:50,unit:"ml",cost:""},{id:"ing_rc_old_fashioned_1",scm:"",name:"Kocka cukru",qty:1,unit:"ks",cost:""},{id:"ing_rc_old_fashioned_2",scm:"",name:"Angostura bitters",qty:2,unit:"dash",cost:""},{id:"ing_rc_old_fashioned_3",scm:"",name:"Pomarančová kôra",qty:1,unit:"ks",cost:""}]},
{id:"rc_aperol_spritz",name:"Aperol Spritz",category:"Koktaily",sellPrice:"",kategoria:"Klasické",typ:"Klasický",glass:"Víno (balón)",difficulty:"Ľahká",prepTime:"2 min",mocktail:false,photo:"",icon:"",shortInstr:"Prosecco, Aperol a sóda na ľad v poradí, zľahka premiešaj",longInstr:"Veľký balónový pohár naplň ľadom. Prilej prosecco, potom Aperol a na záver kúsok sódy. Postupnosť prilievania (od najľahšieho po najťažší) zaisťuje správne premiešanie bez nutnosti veľa miešať. Dozdob plátkom pomaranča.",ingredients:[{id:"ing_rc_aperol_spritz_0",scm:"",name:"Aperol",qty:60,unit:"ml",cost:""},{id:"ing_rc_aperol_spritz_1",scm:"",name:"Prosecco",qty:90,unit:"ml",cost:""},{id:"ing_rc_aperol_spritz_2",scm:"",name:"Sóda",qty:30,unit:"ml",cost:""},{id:"ing_rc_aperol_spritz_3",scm:"",name:"Pomaranč (plátok)",qty:1,unit:"ks",cost:""}]},
{id:"rc_moscow_mule",name:"Moscow Mule",category:"Koktaily",sellPrice:"",kategoria:"Klasické",typ:"Klasický",glass:"Highball/Mug",difficulty:"Ľahká",prepTime:"2 min",mocktail:false,photo:"",icon:"",shortInstr:"Vodka a limetkový džús na ľad, doplň ginger beer",longInstr:"Do medeného hrnčeka alebo highball pohára daj ľad, prilej vodku a čerstvý limetkový džús. Doplň ginger beer (zázvorové pivo) a zľahka premiešaj. Dozdob plátkom limetky a vetvičkou mäty.",ingredients:[{id:"ing_rc_moscow_mule_0",scm:"",name:"Vodka",qty:50,unit:"ml",cost:""},{id:"ing_rc_moscow_mule_1",scm:"",name:"Limetkový džús",qty:20,unit:"ml",cost:""},{id:"ing_rc_moscow_mule_2",scm:"",name:"Ginger beer",qty:120,unit:"ml",cost:""}]},
{id:"rc_pi_a_colada",name:"Piña Colada",category:"Koktaily",sellPrice:"",kategoria:"Klasické",typ:"Klasický",glass:"Hurricane",difficulty:"Stredná",prepTime:"4 min",mocktail:false,photo:"",icon:"",shortInstr:"Rum, ananásový džús a kokosové mlieko rozmixuj s ľadom",longInstr:"Všetky ingrediencie vlož do mixéra s hrsťou ľadu a rozmixuj do hladkej konzistencie (cca 20-30s). Nalej do vysokého hurricane pohára. Dozdob kúskom ananásu a koktailovou čerešňou, prípadne slamkou.",ingredients:[{id:"ing_rc_pi_a_colada_0",scm:"",name:"Biely rum",qty:50,unit:"ml",cost:""},{id:"ing_rc_pi_a_colada_1",scm:"",name:"Ananásový džús",qty:90,unit:"ml",cost:""},{id:"ing_rc_pi_a_colada_2",scm:"",name:"Kokosové mlieko",qty:30,unit:"ml",cost:""}]},
{id:"rc_espresso_martini",name:"Espresso Martini",category:"Koktaily",sellPrice:"",kategoria:"Klasické",typ:"Klasický",glass:"Martini",difficulty:"Stredná",prepTime:"4 min",mocktail:false,photo:"",icon:"",shortInstr:"Vodku, kávový likér a espresso poriadne potras s ľadom",longInstr:"Pripravený vychladený espresso, vodku a kávový likér (napr. Kahlúa) daj do shakera s ľadom. Potras intenzívne 15-20 sekúnd, aby vznikla charakteristická pena. Precedi do martini pohára bez ľadu. Dozdob 3 kávovými zrnami.",ingredients:[{id:"ing_rc_espresso_martini_0",scm:"",name:"Vodka",qty:50,unit:"ml",cost:""},{id:"ing_rc_espresso_martini_1",scm:"",name:"Kávový likér",qty:30,unit:"ml",cost:""},{id:"ing_rc_espresso_martini_2",scm:"",name:"Espresso (vychladené)",qty:30,unit:"ml",cost:""}]},
{id:"rc_caipirinha",name:"Caipirinha",category:"Koktaily",sellPrice:"",kategoria:"Klasické",typ:"Klasický",glass:"Rocks",difficulty:"Stredná",prepTime:"3 min",mocktail:false,photo:"",icon:"",shortInstr:"Limetku s cukrom rozdrv, pridaj cachaçu a drvený ľad",longInstr:"Limetku nakrájaj na kúsky a vlož do pohára s trstinovým cukrom. Dôkladne rozdrv paličkou (muddler), aby sa uvoľnili oleje z kôry a šťava. Naplň drveným ľadom a prilej cachaçu. Premiešaj a podávaj so slamkou.",ingredients:[{id:"ing_rc_caipirinha_0",scm:"",name:"Cachaça",qty:50,unit:"ml",cost:""},{id:"ing_rc_caipirinha_1",scm:"",name:"Limetka",qty:1,unit:"ks",cost:""},{id:"ing_rc_caipirinha_2",scm:"",name:"Trstinový cukor",qty:2,unit:"tsp",cost:""}]},
{id:"rc_manhattan",name:"Manhattan",category:"Koktaily",sellPrice:"",kategoria:"Klasické",typ:"Klasický",glass:"Coupe",difficulty:"Stredná",prepTime:"3 min",mocktail:false,photo:"",icon:"",shortInstr:"Whisky, vermút a bitters premiešaj s ľadom, precedi",longInstr:"Do miešacieho pohára (alebo shakera) daj ľad, rye whisky, červený vermút a 2 kvapky Angostura bitters. Premiešaj barovou lyžičkou cca 20-30 sekúnd. Precedi do vychladeného coupe pohára. Dozdob koktailovou čerešňou.",ingredients:[{id:"ing_rc_manhattan_0",scm:"",name:"Rye whisky",qty:50,unit:"ml",cost:""},{id:"ing_rc_manhattan_1",scm:"",name:"Červený vermút",qty:20,unit:"ml",cost:""},{id:"ing_rc_manhattan_2",scm:"",name:"Angostura bitters",qty:2,unit:"dash",cost:""}]},
{id:"rc_cosmopolitan",name:"Cosmopolitan",category:"Koktaily",sellPrice:"",kategoria:"Klasické",typ:"Klasický",glass:"Martini",difficulty:"Stredná",prepTime:"3 min",mocktail:false,photo:"",icon:"",shortInstr:"Vodku, triple sec, brusnicový a limetkový džús potras s ľadom",longInstr:"Všetky ingrediencie daj do shakera naplneného ľadom. Poriadne potras 10-15 sekúnd, aby sa nápoj dôkladne vychladil. Precedi do martini pohára. Dozdob plátkom limetky alebo pomarančovou kôrou.",ingredients:[{id:"ing_rc_cosmopolitan_0",scm:"",name:"Vodka",qty:40,unit:"ml",cost:""},{id:"ing_rc_cosmopolitan_1",scm:"",name:"Triple sec",qty:15,unit:"ml",cost:""},{id:"ing_rc_cosmopolitan_2",scm:"",name:"Brusnicový džús",qty:15,unit:"ml",cost:""},{id:"ing_rc_cosmopolitan_3",scm:"",name:"Limetkový džús",qty:10,unit:"ml",cost:""}]},
{id:"rc_long_island_iced_tea",name:"Long Island Iced Tea",category:"Koktaily",sellPrice:"",kategoria:"Klasické",typ:"Klasický",glass:"Highball",difficulty:"Stredná",prepTime:"4 min",mocktail:false,photo:"",icon:"",shortInstr:"Premiešaj 4 destiláty s triple sec a citrónom, doplň colou",longInstr:"Do vysokého pohára s ľadom daj vodku, gin, biely rum, tequilu a triple sec. Pridaj čerstvý citrónový džús. Premiešaj a doplň colou po okraj. Zľahka premiešaj, aby sa zachovala perlivosť. Dozdob plátkom citróna.",ingredients:[{id:"ing_rc_long_island_iced_tea_0",scm:"",name:"Vodka",qty:15,unit:"ml",cost:""},{id:"ing_rc_long_island_iced_tea_1",scm:"",name:"Gin",qty:15,unit:"ml",cost:""},{id:"ing_rc_long_island_iced_tea_2",scm:"",name:"Biely rum",qty:15,unit:"ml",cost:""},{id:"ing_rc_long_island_iced_tea_3",scm:"",name:"Tequila",qty:15,unit:"ml",cost:""},{id:"ing_rc_long_island_iced_tea_4",scm:"",name:"Triple sec",qty:15,unit:"ml",cost:""},{id:"ing_rc_long_island_iced_tea_5",scm:"",name:"Citrónový džús",qty:25,unit:"ml",cost:""},{id:"ing_rc_long_island_iced_tea_6",scm:"",name:"Cola",qty:60,unit:"ml",cost:""}]},
{id:"rc_singapore_sling",name:"Singapore Sling",category:"Koktaily",sellPrice:"",kategoria:"Klasické",typ:"Klasický",glass:"Hurricane",difficulty:"Stredná",prepTime:"5 min",mocktail:false,photo:"",icon:"",shortInstr:"Potras gin, likéry a džúsy s ľadom, precedi do vysokého pohára",longInstr:"Všetky ingrediencie (gin, cherry brandy, Cointreau, Bénédictine, grenadine, ananásový a citrónový džús, Angostura bitters) daj do shakera s ľadom. Dôkladne potras a precedi do vysokého pohára s ľadom. Dozdob plátkom ananásu a koktailovou čerešňou.",ingredients:[{id:"ing_rc_singapore_sling_0",scm:"",name:"Gin",qty:30,unit:"ml",cost:""},{id:"ing_rc_singapore_sling_1",scm:"",name:"Cherry brandy",qty:15,unit:"ml",cost:""},{id:"ing_rc_singapore_sling_2",scm:"",name:"Cointreau",qty:7,unit:"ml",cost:""},{id:"ing_rc_singapore_sling_3",scm:"",name:"Bénédictine",qty:7,unit:"ml",cost:""},{id:"ing_rc_singapore_sling_4",scm:"",name:"Grenadine",qty:10,unit:"ml",cost:""},{id:"ing_rc_singapore_sling_5",scm:"",name:"Ananásový džús",qty:120,unit:"ml",cost:""},{id:"ing_rc_singapore_sling_6",scm:"",name:"Citrónový džús",qty:15,unit:"ml",cost:""}]},
{id:"rc_bloody_mary",name:"Bloody Mary",category:"Koktaily",sellPrice:"",kategoria:"Klasické",typ:"Klasický",glass:"Highball",difficulty:"Stredná",prepTime:"4 min",mocktail:false,photo:"",icon:"",shortInstr:"Vodku a koreniny premiešaj s paradajkovým džúsom, dozdob zelerom",longInstr:"Do pohára s ľadom daj vodku, paradajkový džús, citrónovú šťavu, Worcester omáčku, niekoľko kvapiek Tabasca, soľ a čerstvo mleté čierne korenie. Premiešaj barovou lyžičkou. Dozdob stopkou zeleru a plátkom citróna.",ingredients:[{id:"ing_rc_bloody_mary_0",scm:"",name:"Vodka",qty:50,unit:"ml",cost:""},{id:"ing_rc_bloody_mary_1",scm:"",name:"Paradajkový džús",qty:100,unit:"ml",cost:""},{id:"ing_rc_bloody_mary_2",scm:"",name:"Citrónová šťava",qty:10,unit:"ml",cost:""},{id:"ing_rc_bloody_mary_3",scm:"",name:"Worcester omáčka",qty:3,unit:"dash",cost:""},{id:"ing_rc_bloody_mary_4",scm:"",name:"Tabasco",qty:2,unit:"dash",cost:""},{id:"ing_rc_bloody_mary_5",scm:"",name:"Stopka zeleru",qty:1,unit:"ks",cost:""}]},
{id:"rc_sex_on_the_beach",name:"Sex on the Beach",category:"Koktaily",sellPrice:"",kategoria:"Klasické",typ:"Klasický",glass:"Highball",difficulty:"Ľahká",prepTime:"2 min",mocktail:false,photo:"",icon:"",shortInstr:"Vodku a broskyňový likér zalej džúsmi na ľad",longInstr:"Pohár naplň ľadom. Prilej vodku a broskyňový likér, doplň brusnicovým a ananásovým džúsom v rovnakom poměre. Zľahka premiešaj barovou lyžičkou. Dozdob plátkom pomaranča a koktailovou čerešňou.",ingredients:[{id:"ing_rc_sex_on_the_beach_0",scm:"",name:"Vodka",qty:30,unit:"ml",cost:""},{id:"ing_rc_sex_on_the_beach_1",scm:"",name:"Broskyňový likér",qty:15,unit:"ml",cost:""},{id:"ing_rc_sex_on_the_beach_2",scm:"",name:"Brusnicový džús",qty:45,unit:"ml",cost:""},{id:"ing_rc_sex_on_the_beach_3",scm:"",name:"Ananásový džús",qty:45,unit:"ml",cost:""}]},
{id:"rc_mai_tai",name:"Mai Tai",category:"Koktaily",sellPrice:"",kategoria:"Klasické",typ:"Klasický",glass:"Hurricane",difficulty:"Stredná",prepTime:"4 min",mocktail:false,photo:"",icon:"",shortInstr:"Dva druhy rumu, curaçao, orgeat a limetku potras s ľadom",longInstr:"Do shakera daj biely a tmavý rum, oranžový curaçao, orgeat sirup (mandľový) a čerstvý limetkový džús. Potras s ľadom a nalej (bez precedenia) do hurricane pohára plného drveného ľadu. Dozdob vetvičkou mäty a plátkom limetky.",ingredients:[{id:"ing_rc_mai_tai_0",scm:"",name:"Biely rum",qty:30,unit:"ml",cost:""},{id:"ing_rc_mai_tai_1",scm:"",name:"Tmavý rum",qty:30,unit:"ml",cost:""},{id:"ing_rc_mai_tai_2",scm:"",name:"Oranžový curaçao",qty:15,unit:"ml",cost:""},{id:"ing_rc_mai_tai_3",scm:"",name:"Orgeat sirup",qty:15,unit:"ml",cost:""},{id:"ing_rc_mai_tai_4",scm:"",name:"Limetkový džús",qty:25,unit:"ml",cost:""}]},
{id:"rc_white_russian",name:"White Russian",category:"Koktaily",sellPrice:"",kategoria:"Klasické",typ:"Klasický",glass:"Rocks",difficulty:"Ľahká",prepTime:"2 min",mocktail:false,photo:"",icon:"",shortInstr:"Vodku a kávový likér na ľad, opatrne zalej smotanou",longInstr:"Pohár na rocky naplň ľadom. Prilej vodku a kávový likér, premiešaj. Opatrne navrstvi smotanu na povrch tak, aby plávala navrchu (alebo premiešaj podľa chuti pre jednotnú farbu).",ingredients:[{id:"ing_rc_white_russian_0",scm:"",name:"Vodka",qty:50,unit:"ml",cost:""},{id:"ing_rc_white_russian_1",scm:"",name:"Kávový likér",qty:25,unit:"ml",cost:""},{id:"ing_rc_white_russian_2",scm:"",name:"Smotana",qty:25,unit:"ml",cost:""}]},
{id:"rc_french_75",name:"French 75",category:"Koktaily",sellPrice:"",kategoria:"Klasické",typ:"Klasický",glass:"Champagne flute",difficulty:"Stredná",prepTime:"3 min",mocktail:false,photo:"",icon:"",shortInstr:"Gin, citrón a cukor potras, precedi a doplň šampanským",longInstr:"Gin, čerstvý citrónový džús a cukrový sirup potras v shakeri s ľadom. Precedi do flétny na šampanské a pomaly doplň vychladeným šampanským alebo proseccom. Dozdob špirálou citrónovej kôry.",ingredients:[{id:"ing_rc_french_75_0",scm:"",name:"Gin",qty:30,unit:"ml",cost:""},{id:"ing_rc_french_75_1",scm:"",name:"Citrónový džús",qty:15,unit:"ml",cost:""},{id:"ing_rc_french_75_2",scm:"",name:"Cukrový sirup",qty:10,unit:"ml",cost:""},{id:"ing_rc_french_75_3",scm:"",name:"Šampanské/Prosecco",qty:60,unit:"ml",cost:""}]},
{id:"rc_bellini",name:"Bellini",category:"Koktaily",sellPrice:"",kategoria:"Klasické",typ:"Klasický",glass:"Champagne flute",difficulty:"Ľahká",prepTime:"2 min",mocktail:false,photo:"",icon:"",shortInstr:"Broskyňové pyré zalej proseccom",longInstr:"Do flétny na šampanské nalej chladné broskyňové pyré. Pomaly doplň vychladeným proseccom a zľahka premiešaj barovou lyžičkou, aby sa zachovala perlivosť.",ingredients:[{id:"ing_rc_bellini_0",scm:"",name:"Broskyňové pyré",qty:60,unit:"ml",cost:""},{id:"ing_rc_bellini_1",scm:"",name:"Prosecco",qty:90,unit:"ml",cost:""}]},
{id:"rc_pornstar_martini",name:"Pornstar Martini",category:"Koktaily",sellPrice:"",kategoria:"Klasické",typ:"Klasický",glass:"Martini",difficulty:"Stredná",prepTime:"4 min",mocktail:false,photo:"",icon:"",shortInstr:"Vanilkovú vodku, passoa a ananás potras, podávaj so shotom prosecca",longInstr:"Vanilkovú vodku, passoa (marakujový likér), ananásový a limetkový džús potras s ľadom. Precedi do martini pohára a podávaj so samostatným shotom vychladeného prosecca vedľa.",ingredients:[{id:"ing_rc_pornstar_martini_0",scm:"",name:"Vanilková vodka",qty:40,unit:"ml",cost:""},{id:"ing_rc_pornstar_martini_1",scm:"",name:"Passoa",qty:15,unit:"ml",cost:""},{id:"ing_rc_pornstar_martini_2",scm:"",name:"Ananásový džús",qty:15,unit:"ml",cost:""},{id:"ing_rc_pornstar_martini_3",scm:"",name:"Limetkový džús",qty:10,unit:"ml",cost:""},{id:"ing_rc_pornstar_martini_4",scm:"",name:"Prosecco (shot vedľa)",qty:30,unit:"ml",cost:""}]},
{id:"rc_gin_basil_smash",name:"Gin Basil Smash",category:"Koktaily",sellPrice:"",kategoria:"Klasické",typ:"Klasický",glass:"Rocks",difficulty:"Stredná",prepTime:"4 min",mocktail:false,photo:"",icon:"",shortInstr:"Bazalku rozdrv, pridaj gin, citrón a sirup, potras a precedi",longInstr:"Čerstvé listy bazalky rozdrv v shakeri s cukrovým sirupom, aby sa uvoľnila aróma. Pridaj gin, citrónový džús a ľad. Poriadne potras a precedi (double strain) do pohára s ľadom. Dozdob lístkom bazalky.",ingredients:[{id:"ing_rc_gin_basil_smash_0",scm:"",name:"Gin",qty:60,unit:"ml",cost:""},{id:"ing_rc_gin_basil_smash_1",scm:"",name:"Bazalka (listy)",qty:10,unit:"ks",cost:""},{id:"ing_rc_gin_basil_smash_2",scm:"",name:"Citrónový džús",qty:25,unit:"ml",cost:""},{id:"ing_rc_gin_basil_smash_3",scm:"",name:"Cukrový sirup",qty:15,unit:"ml",cost:""}]},
{id:"rc_vieux_carr",name:"Vieux Carré",category:"Koktaily",sellPrice:"",kategoria:"Klasické",typ:"Klasický",glass:"Rocks",difficulty:"Stredná",prepTime:"4 min",mocktail:false,photo:"",icon:"",shortInstr:"Whisky, koňak, vermút, Bénédictine a bitters premiešaj s ľadom",longInstr:"Do miešacieho pohára daj rye whisky, koňak, sladký vermút, Bénédictine a po kvapke Angostura a Peychaud's bitters. Premiešaj s ľadom a precedi do pohára na rocky s veľkou kockou ľadu. Dozdob čerešňou.",ingredients:[{id:"ing_rc_vieux_carr_0",scm:"",name:"Rye whisky",qty:20,unit:"ml",cost:""},{id:"ing_rc_vieux_carr_1",scm:"",name:"Koňak",qty:20,unit:"ml",cost:""},{id:"ing_rc_vieux_carr_2",scm:"",name:"Sladký vermút",qty:20,unit:"ml",cost:""},{id:"ing_rc_vieux_carr_3",scm:"",name:"Bénédictine",qty:5,unit:"ml",cost:""},{id:"ing_rc_vieux_carr_4",scm:"",name:"Angostura bitters",qty:1,unit:"dash",cost:""}]},
{id:"rc_tommy_s_margarita",name:"Tommy's Margarita",category:"Koktaily",sellPrice:"",kategoria:"Klasické",typ:"Klasický",glass:"Coupe",difficulty:"Stredná",prepTime:"3 min",mocktail:false,photo:"",icon:"",shortInstr:"Tequilu, limetku a agávu potras s ľadom, precedi",longInstr:"Tequilu, čerstvý limetkový džús a agávový sirup daj do shakera s ľadom. Poriadne potras a precedi do pohára (s alebo bez soli na okraji). Dozdob plátkom limetky.",ingredients:[{id:"ing_rc_tommy_s_margarita_0",scm:"",name:"Tequila",qty:50,unit:"ml",cost:""},{id:"ing_rc_tommy_s_margarita_1",scm:"",name:"Limetkový džús",qty:25,unit:"ml",cost:""},{id:"ing_rc_tommy_s_margarita_2",scm:"",name:"Agávový sirup",qty:15,unit:"ml",cost:""}]},
{id:"rc_penicillin",name:"Penicillin",category:"Koktaily",sellPrice:"",kategoria:"Klasické",typ:"Klasický",glass:"Rocks",difficulty:"Stredná",prepTime:"4 min",mocktail:false,photo:"",icon:"",shortInstr:"Whisky, citrón a medovo-zázvorový sirup potras, navrch dymový whisky",longInstr:"Blended scotch whisky, čerstvý citrónový džús a medovo-zázvorový sirup potras s ľadom. Precedi do pohára s ľadom. Navrch opatrne nalej trochu dymového (Islay) whisky tak, aby plával na povrchu. Dozdob kandizovaným zázvorom.",ingredients:[{id:"ing_rc_penicillin_0",scm:"",name:"Blended scotch whisky",qty:50,unit:"ml",cost:""},{id:"ing_rc_penicillin_1",scm:"",name:"Citrónový džús",qty:20,unit:"ml",cost:""},{id:"ing_rc_penicillin_2",scm:"",name:"Medovo-zázvorový sirup",qty:15,unit:"ml",cost:""},{id:"ing_rc_penicillin_3",scm:"",name:"Dymový whisky (na vrch)",qty:7,unit:"ml",cost:""}]},
{id:"rc_last_word",name:"Last Word",category:"Koktaily",sellPrice:"",kategoria:"Klasické",typ:"Klasický",glass:"Coupe",difficulty:"Stredná",prepTime:"3 min",mocktail:false,photo:"",icon:"",shortInstr:"Gin, Chartreuse, maraschino a limetku potras v rovnakom poméri",longInstr:"Gin, zelený Chartreuse, maraschino likér a čerstvý limetkový džús v rovnakom poméri potras s ľadom. Precedi do vychladeného coupe pohára. Podávaj bez dekorácie pre čistú prezentáciu.",ingredients:[{id:"ing_rc_last_word_0",scm:"",name:"Gin",qty:20,unit:"ml",cost:""},{id:"ing_rc_last_word_1",scm:"",name:"Zelený Chartreuse",qty:20,unit:"ml",cost:""},{id:"ing_rc_last_word_2",scm:"",name:"Maraschino likér",qty:20,unit:"ml",cost:""},{id:"ing_rc_last_word_3",scm:"",name:"Limetkový džús",qty:20,unit:"ml",cost:""}]},
{id:"rc_boulevardier",name:"Boulevardier",category:"Koktaily",sellPrice:"",kategoria:"Klasické",typ:"Klasický",glass:"Rocks",difficulty:"Stredná",prepTime:"3 min",mocktail:false,photo:"",icon:"",shortInstr:"Bourbon, Campari a vermút premiešaj s ľadom",longInstr:"Bourbon, Campari a sladký vermút v rovnakom pomére premiešaj v miešacom pohári s ľadom. Precedi do pohára na rocky s veľkou kockou ľadu. Dozdob pomarančovou kôrou.",ingredients:[{id:"ing_rc_boulevardier_0",scm:"",name:"Bourbon",qty:30,unit:"ml",cost:""},{id:"ing_rc_boulevardier_1",scm:"",name:"Campari",qty:30,unit:"ml",cost:""},{id:"ing_rc_boulevardier_2",scm:"",name:"Sladký vermút",qty:30,unit:"ml",cost:""},{id:"ing_rc_boulevardier_3",scm:"",name:"Pomarančová kôra",qty:1,unit:"ks",cost:""}]},
{id:"rc_aviation",name:"Aviation",category:"Koktaily",sellPrice:"",kategoria:"Klasické",typ:"Klasický",glass:"Coupe",difficulty:"Stredná",prepTime:"3 min",mocktail:false,photo:"",icon:"",shortInstr:"Gin, maraschino, citrón a kvapku fialkového likéru potras",longInstr:"Gin, maraschino likér, čerstvý citrónový džús a kvapku crème de violette (fialkový likér) potras s ľadom. Precedi do vychladeného coupe pohára. Dozdob koktailovou čerešňou.",ingredients:[{id:"ing_rc_aviation_0",scm:"",name:"Gin",qty:45,unit:"ml",cost:""},{id:"ing_rc_aviation_1",scm:"",name:"Maraschino likér",qty:15,unit:"ml",cost:""},{id:"ing_rc_aviation_2",scm:"",name:"Citrónový džús",qty:15,unit:"ml",cost:""},{id:"ing_rc_aviation_3",scm:"",name:"Crème de violette",qty:2,unit:"dash",cost:""}]},
{id:"rc_corpse_reviver",name:"Corpse Reviver",category:"Koktaily",sellPrice:"",kategoria:"Klasické",typ:"Klasický",glass:"Coupe",difficulty:"Stredná",prepTime:"4 min",mocktail:false,photo:"",icon:"",shortInstr:"Gin, Cointreau, Lillet a citrón potras, kvapka absintu na vypláchnutie",longInstr:"Vychladený coupe pohár vyplákni kvapkou absintu. Gin, Cointreau, Lillet Blanc a čerstvý citrónový džús potras s ľadom a precedi do pripraveného pohára.",ingredients:[{id:"ing_rc_corpse_reviver_0",scm:"",name:"Gin",qty:20,unit:"ml",cost:""},{id:"ing_rc_corpse_reviver_1",scm:"",name:"Cointreau",qty:20,unit:"ml",cost:""},{id:"ing_rc_corpse_reviver_2",scm:"",name:"Lillet Blanc",qty:20,unit:"ml",cost:""},{id:"ing_rc_corpse_reviver_3",scm:"",name:"Citrónový džús",qty:20,unit:"ml",cost:""},{id:"ing_rc_corpse_reviver_4",scm:"",name:"Absint (na vypláchnutie)",qty:1,unit:"dash",cost:""}]},
{id:"rc_jungle_bird",name:"Jungle Bird",category:"Koktaily",sellPrice:"",kategoria:"Klasické",typ:"Klasický",glass:"Hurricane",difficulty:"Stredná",prepTime:"4 min",mocktail:false,photo:"",icon:"",shortInstr:"Tmavý rum, Campari, ananás a limetku potras s ľadom",longInstr:"Tmavý rum, Campari, ananásový a limetkový džús a cukrový sirup potras s ľadom. Nalej do hurricane pohára s ľadom (bez precedenia alebo precedené, podľa preferencie). Dozdob plátkom ananásu.",ingredients:[{id:"ing_rc_jungle_bird_0",scm:"",name:"Tmavý rum",qty:45,unit:"ml",cost:""},{id:"ing_rc_jungle_bird_1",scm:"",name:"Campari",qty:15,unit:"ml",cost:""},{id:"ing_rc_jungle_bird_2",scm:"",name:"Ananásový džús",qty:15,unit:"ml",cost:""},{id:"ing_rc_jungle_bird_3",scm:"",name:"Limetkový džús",qty:10,unit:"ml",cost:""},{id:"ing_rc_jungle_bird_4",scm:"",name:"Cukrový sirup",qty:7,unit:"ml",cost:""}]},
{id:"rc_virgin_mojito",name:"Virgin Mojito",category:"Koktaily",sellPrice:"",kategoria:"Klasické",typ:"Klasický",glass:"Highball",difficulty:"Ľahká",prepTime:"3 min",mocktail:true,photo:"",icon:"",shortInstr:"Limetku a mätu rozdrv s cukrom, doplň sódou — bez alkoholu",longInstr:"Do pohára vlož mätu a cukor, jemne rozdrv. Pridaj rozkrájanú limetku a rozdrv spolu s mätou. Naplň drveným ľadom, doplň sódou po okraj a premiešaj. Dozdob mätou a limetkou. Plne nealkoholická verzia klasického Mojita.",ingredients:[{id:"ing_rc_virgin_mojito_0",scm:"",name:"Limetka",qty:1,unit:"ks",cost:""},{id:"ing_rc_virgin_mojito_1",scm:"",name:"Mäta (listy)",qty:8,unit:"ks",cost:""},{id:"ing_rc_virgin_mojito_2",scm:"",name:"Trstinový cukor",qty:2,unit:"tsp",cost:""},{id:"ing_rc_virgin_mojito_3",scm:"",name:"Sóda",qty:150,unit:"ml",cost:""}]},
{id:"rc_nojito",name:"Nojito",category:"Koktaily",sellPrice:"",kategoria:"Klasické",typ:"Klasický",glass:"Highball",difficulty:"Ľahká",prepTime:"3 min",mocktail:true,photo:"",icon:"",shortInstr:"Alternatívna nealko verzia Mojita s ginger ale",longInstr:"Rovnaký postup ako Virgin Mojito, ale sóda sa nahrádza zázvorovým ginger ale pre výraznejšiu chuť. Limetku a mätu rozdrv s cukrom, naplň ľadom a doplň ginger ale.",ingredients:[{id:"ing_rc_nojito_0",scm:"",name:"Limetka",qty:1,unit:"ks",cost:""},{id:"ing_rc_nojito_1",scm:"",name:"Mäta (listy)",qty:8,unit:"ks",cost:""},{id:"ing_rc_nojito_2",scm:"",name:"Cukrový sirup",qty:15,unit:"ml",cost:""},{id:"ing_rc_nojito_3",scm:"",name:"Ginger ale",qty:150,unit:"ml",cost:""}]},
{id:"rc_virgin_pi_a_colada",name:"Virgin Piña Colada",category:"Koktaily",sellPrice:"",kategoria:"Klasické",typ:"Klasický",glass:"Hurricane",difficulty:"Ľahká",prepTime:"3 min",mocktail:true,photo:"",icon:"",shortInstr:"Ananásový džús a kokosové mlieko rozmixuj s ľadom — bez rumu",longInstr:"Ananásový džús a kokosové mlieko rozmixuj s hrsťou ľadu do hladkej konzistencie. Nalej do hurricane pohára. Dozdob kúskom ananásu a čerešňou.",ingredients:[{id:"ing_rc_virgin_pi_a_colada_0",scm:"",name:"Ananásový džús",qty:120,unit:"ml",cost:""},{id:"ing_rc_virgin_pi_a_colada_1",scm:"",name:"Kokosové mlieko",qty:40,unit:"ml",cost:""}]},
{id:"rc_shirley_temple",name:"Shirley Temple",category:"Koktaily",sellPrice:"",kategoria:"Klasické",typ:"Klasický",glass:"Highball",difficulty:"Ľahká",prepTime:"2 min",mocktail:true,photo:"",icon:"",shortInstr:"Ginger ale a grenadine na ľad, dozdob čerešňou",longInstr:"Pohár naplň ľadom. Prilej ginger ale a grenadine, zľahka premiešaj — grenadine postupne klesne a vytvorí farebný prechod. Dozdob koktailovou čerešňou a plátkom citróna.",ingredients:[{id:"ing_rc_shirley_temple_0",scm:"",name:"Ginger ale",qty:180,unit:"ml",cost:""},{id:"ing_rc_shirley_temple_1",scm:"",name:"Grenadine",qty:15,unit:"ml",cost:""},{id:"ing_rc_shirley_temple_2",scm:"",name:"Koktailová čerešňa",qty:1,unit:"ks",cost:""}]},
{id:"rc_virgin_bloody_mary",name:"Virgin Bloody Mary",category:"Koktaily",sellPrice:"",kategoria:"Klasické",typ:"Klasický",glass:"Highball",difficulty:"Stredná",prepTime:"3 min",mocktail:true,photo:"",icon:"",shortInstr:"Paradajkový džús a koreniny premiešaj na ľad — bez vodky",longInstr:"Do pohára s ľadom daj paradajkový džús, citrónovú šťavu, Worcester omáčku, niekoľko kvapiek Tabasca, soľ a čierne korenie. Premiešaj a dozdob stopkou zeleru.",ingredients:[{id:"ing_rc_virgin_bloody_mary_0",scm:"",name:"Paradajkový džús",qty:150,unit:"ml",cost:""},{id:"ing_rc_virgin_bloody_mary_1",scm:"",name:"Citrónová šťava",qty:10,unit:"ml",cost:""},{id:"ing_rc_virgin_bloody_mary_2",scm:"",name:"Worcester omáčka",qty:3,unit:"dash",cost:""},{id:"ing_rc_virgin_bloody_mary_3",scm:"",name:"Stopka zeleru",qty:1,unit:"ks",cost:""}]},
{id:"rc_ginger_beer_mocktail",name:"Ginger Beer Mocktail",category:"Koktaily",sellPrice:"",kategoria:"Klasické",typ:"Klasický",glass:"Highball",difficulty:"Ľahká",prepTime:"2 min",mocktail:true,photo:"",icon:"",shortInstr:"Ginger beer s limetkou a mätou na ľad",longInstr:"Pohár naplň ľadom, pridaj rozkrájanú limetku a lístky mäty. Doplň ginger beer po okraj a zľahka premiešaj.",ingredients:[{id:"ing_rc_ginger_beer_mocktail_0",scm:"",name:"Ginger beer",qty:180,unit:"ml",cost:""},{id:"ing_rc_ginger_beer_mocktail_1",scm:"",name:"Limetka",qty:0.5,unit:"ks",cost:""},{id:"ing_rc_ginger_beer_mocktail_2",scm:"",name:"Mäta (listy)",qty:5,unit:"ks",cost:""}]},
{id:"rc_berry_lemonade_sparkler",name:"Berry Lemonade Sparkler",category:"Koktaily",sellPrice:"",kategoria:"Klasické",typ:"Klasický",glass:"Highball",difficulty:"Ľahká",prepTime:"2 min",mocktail:true,photo:"",icon:"",shortInstr:"Limonáda s lesným ovocím a sódou na ľad",longInstr:"Do pohára s ľadom daj rozmrazené alebo čerstvé lesné plody, doplň citrónovou limonádou a kúskom sódy pre perlivosť. Zľahka premiešaj.",ingredients:[{id:"ing_rc_berry_lemonade_sparkler_0",scm:"",name:"Citrónová limonáda",qty:120,unit:"ml",cost:""},{id:"ing_rc_berry_lemonade_sparkler_1",scm:"",name:"Lesné plody",qty:30,unit:"g",cost:""},{id:"ing_rc_berry_lemonade_sparkler_2",scm:"",name:"Sóda",qty:60,unit:"ml",cost:""}]},
{id:"rc_cucumber_mint_cooler",name:"Cucumber Mint Cooler",category:"Koktaily",sellPrice:"",kategoria:"Klasické",typ:"Klasický",glass:"Highball",difficulty:"Ľahká",prepTime:"2 min",mocktail:true,photo:"",icon:"",shortInstr:"Uhorku a mätu rozdrv, doplň sódou a limetkou",longInstr:"Plátky uhorky a lístky mäty zľahka rozdrv v pohári. Naplň ľadom, pridaj limetkový džús a doplň sódou. Premiešaj a dozdob plátkom uhorky.",ingredients:[{id:"ing_rc_cucumber_mint_cooler_0",scm:"",name:"Uhorka (plátky)",qty:4,unit:"ks",cost:""},{id:"ing_rc_cucumber_mint_cooler_1",scm:"",name:"Mäta (listy)",qty:6,unit:"ks",cost:""},{id:"ing_rc_cucumber_mint_cooler_2",scm:"",name:"Limetkový džús",qty:15,unit:"ml",cost:""},{id:"ing_rc_cucumber_mint_cooler_3",scm:"",name:"Sóda",qty:150,unit:"ml",cost:""}]},
{id:"rc_hibiscus_tea_spritz",name:"Hibiscus Tea Spritz",category:"Koktaily",sellPrice:"",kategoria:"Klasické",typ:"Klasický",glass:"Víno (balón)",difficulty:"Ľahká",prepTime:"3 min",mocktail:false,photo:"",icon:"",shortInstr:"Vychladený hibiskusový čaj doplň sódou a limetkou",longInstr:"Vychladený uvarený hibiskusový čaj nalej do pohára s ľadom. Doplň sódou pre perlivosť a pridaj limetkový džús. Dozdob plátkom limetky a kvetom hibiskusu.",ingredients:[{id:"ing_rc_hibiscus_tea_spritz_0",scm:"",name:"Hibiskusový čaj (vychladený)",qty:120,unit:"ml",cost:""},{id:"ing_rc_hibiscus_tea_spritz_1",scm:"",name:"Sóda",qty:60,unit:"ml",cost:""},{id:"ing_rc_hibiscus_tea_spritz_2",scm:"",name:"Limetkový džús",qty:10,unit:"ml",cost:""}]},
{id:"rc_orange_mango_fizz",name:"Orange Mango Fizz",category:"Koktaily",sellPrice:"",kategoria:"Klasické",typ:"Klasický",glass:"Highball",difficulty:"Ľahká",prepTime:"2 min",mocktail:true,photo:"",icon:"",shortInstr:"Pomarančový džús a mangové pyré doplň sódou",longInstr:"Pomarančový džús a mangové pyré premiešaj v pohári s ľadom. Doplň sódou po okraj pre perlivosť a zľahka premiešaj. Dozdob plátkom pomaranča.",ingredients:[{id:"ing_rc_orange_mango_fizz_0",scm:"",name:"Pomarančový džús",qty:90,unit:"ml",cost:""},{id:"ing_rc_orange_mango_fizz_1",scm:"",name:"Mangové pyré",qty:40,unit:"ml",cost:""},{id:"ing_rc_orange_mango_fizz_2",scm:"",name:"Sóda",qty:60,unit:"ml",cost:""}]},
];


const GLASS_ICON_MAP=[
{kw:["martini","coupe","kokteilov"],icons:["🍸","🍹","🍧"]},
{kw:["rocks","old fashioned","tumbler","whisky"],icons:["🥃","🧊"]},
{kw:["champagne","flute"],icons:["🥂","🍾"]},
{kw:["wine","víno","vino"],icons:["🍷"]},
{kw:["hurricane","tiki","colada"],icons:["🍹","🌴"]},
{kw:["shot","kalíšok"],icons:["🥃"]},
{kw:["mug","hrnček","hrncek","irish coffee"],icons:["☕","🍵"]},
{kw:["beer","pivo","pint"],icons:["🍺"]},
{kw:["highball","collins","long drink"],icons:["🥤","🍹","🧊"]},
];
const GLASS_ICONS_DEFAULT=["🍸","🍹","🥃","🍷","🥂","🍺","🧊","🍾"];
function glassIcons(glass){
const g=(glass||"").toLowerCase();
const m=GLASS_ICON_MAP.find(x=>x.kw.some(k=>g.includes(k)));
return m?m.icons:GLASS_ICONS_DEFAULT;
}

function RecipesTab({inventory,recipes,setRecipes}){
const[adding,setAdding]=useState(false);
const[editing,setEditing]=useState(null);
const[form,setForm]=useState({name:"",category:"Iné",sellPrice:"",kategoria:"",typ:"",glass:"",difficulty:"",prepTime:"",mocktail:false,shortInstr:"",longInstr:"",ingredients:[],photo:"",icon:""});
const[catFilter,setCatFilter]=useState("Všetko");
const[kokSubFilter,setKokSubFilter]=useState("Všetko");
const[mocktailOnly,setMocktailOnly]=useState(false);
const[infoFor,setInfoFor]=useState(null); // recipe object whose instructions are shown

const addIngredient=(setF)=>setF(f=>({...f,ingredients:[...f.ingredients,{id:"ing"+Date.now(),scm:"",name:"",qty:"",unit:"g",cost:""}]}));
const updIngredient=(setF,id,fld,val)=>setF(f=>({...f,ingredients:f.ingredients.map(ing=>ing.id===id?{...ing,[fld]:val}:ing)}));
const remIngredient=(setF,id)=>setF(f=>({...f,ingredients:f.ingredients.filter(ing=>ing.id!==id)}));
const linkToStock=(setF,id,scm)=>{
const it=inventory.find(i=>i.scm===scm);
setF(f=>({...f,ingredients:f.ingredients.map(ing=>{
if(ing.id!==id)return ing;
if(!it)return{...ing,scm:""};
const u=unitInfo(it);
return{...ing,scm,name:it.name,unit:u?u.unit:it.unit,cost:u?u.priceUnit.toFixed(3):(it.priceDPH/(it.boxQty||1)).toFixed(3)};
})}));
};

const costOf=recipe=>recipe.ingredients.reduce((a,ing)=>a+(parseFloat(ing.qty)||0)*(parseFloat(ing.cost)||0),0);

const addNew=()=>{
if(!form.name.trim())return;
setRecipes(rs=>[...rs,{id:"rc"+Date.now(),...form}]);
setForm({name:"",category:"Iné",sellPrice:"",kategoria:"",typ:"",glass:"",difficulty:"",prepTime:"",mocktail:false,shortInstr:"",longInstr:"",ingredients:[],photo:"",icon:""});setAdding(false);
};
const rem=id=>setRecipes(rs=>rs.filter(r=>r.id!==id));
const updRecipe=(id,fld,val)=>setRecipes(rs=>rs.map(r=>r.id===id?{...r,[fld]:val}:r));

const koktailyRecipes=recipes.filter(r=>(r.category||"Iné")==="Koktaily");
const kategorieOptions=["Všetko",...new Set(koktailyRecipes.map(r=>r.kategoria).filter(Boolean))];
const filtered=recipes.filter(r=>{
const c=r.category||"Iné";
if(catFilter!=="Všetko"&&c!==catFilter)return false;
if(catFilter==="Koktaily"){
if(kokSubFilter!=="Všetko"&&r.kategoria!==kokSubFilter)return false;
if(mocktailOnly&&!r.mocktail)return false;
}
return true;
});

const CocktailFields=({f,setF})=>(<>
<div style={{fontSize:10,color:"#A08060",fontWeight:600}}>Kategória koktailu (z tabuľky):</div>
<input value={f.kategoria} onChange={e=>setF(p=>({...p,kategoria:e.target.value}))} placeholder="napr. Klasické"
style={{padding:"6px 9px",borderRadius:7,border:"1px solid #E8E0D0",fontSize:11,outline:"none"}}/>
<div style={{display:"flex",gap:6}}>
<input value={f.typ} onChange={e=>setF(p=>({...p,typ:e.target.value}))} placeholder="Typ (napr. Klasický)"
style={{flex:1,padding:"6px 9px",borderRadius:7,border:"1px solid #E8E0D0",fontSize:11,outline:"none"}}/>
<input value={f.glass} onChange={e=>setF(p=>({...p,glass:e.target.value}))} placeholder="Pohár (napr. Highball)"
style={{flex:1,padding:"6px 9px",borderRadius:7,border:"1px solid #E8E0D0",fontSize:11,outline:"none"}}/>
</div>
<div style={{display:"flex",gap:6}}>
<input value={f.difficulty} onChange={e=>setF(p=>({...p,difficulty:e.target.value}))} placeholder="Obtiažnosť"
style={{flex:1,padding:"6px 9px",borderRadius:7,border:"1px solid #E8E0D0",fontSize:11,outline:"none"}}/>
<input value={f.prepTime} onChange={e=>setF(p=>({...p,prepTime:e.target.value}))} placeholder="Čas prípravy"
style={{flex:1,padding:"6px 9px",borderRadius:7,border:"1px solid #E8E0D0",fontSize:11,outline:"none"}}/>
</div>
<label style={{display:"flex",alignItems:"center",gap:6,fontSize:11,color:"#A08060",cursor:"pointer"}}>
<input type="checkbox" checked={!!f.mocktail} onChange={e=>setF(p=>({...p,mocktail:e.target.checked}))}/>
Dostupné ako mocktail (bez alkoholu)
</label>
<input value={f.shortInstr} onChange={e=>setF(p=>({...p,shortInstr:e.target.value}))} placeholder="Postup prípravy (krátky)"
style={{padding:"6px 9px",borderRadius:7,border:"1px solid #E8E0D0",fontSize:11,outline:"none"}}/>
<textarea value={f.longInstr} onChange={e=>setF(p=>({...p,longInstr:e.target.value}))} placeholder="Podrobnejší návod" rows={2}
style={{padding:"6px 9px",borderRadius:7,border:"1px solid #E8E0D0",fontSize:11,outline:"none",fontFamily:"inherit",resize:"vertical"}}/>
</>);

const IngredientRows=({recipe,setF,isEdit})=>(
<div style={{display:"flex",flexDirection:"column",gap:5}}>
{recipe.ingredients.map(ing=>(
<div key={ing.id} style={{display:"flex",gap:5,alignItems:"center",background:BRAND.latte,borderRadius:7,padding:6}}>
<select value={ing.scm} onChange={e=>linkToStock(setF,ing.id,e.target.value)} style={{flex:2,padding:"5px 6px",borderRadius:5,border:"1px solid #E8D0A0",fontSize:10}}>
<option value="">Vlastná položka…</option>
{inventory.map(it=><option key={it.scm} value={it.scm}>{it.name}</option>)}
</select>
{!ing.scm&&<input value={ing.name} onChange={e=>updIngredient(setF,ing.id,"name",e.target.value)} placeholder="Názov" style={{flex:2,padding:"5px 6px",borderRadius:5,border:"1px solid #E8D0A0",fontSize:10}}/>}
<input type="number" value={ing.qty} onChange={e=>updIngredient(setF,ing.id,"qty",e.target.value)} placeholder="množ." style={{width:48,padding:"5px 6px",borderRadius:5,border:"1px solid #E8D0A0",fontSize:10,textAlign:"center"}}/>
<span style={{fontSize:9,color:"#A08060",width:22}}>{ing.unit}</span>
<input type="number" value={ing.cost} onChange={e=>updIngredient(setF,ing.id,"cost",e.target.value)} placeholder="€/j" step="0.001" style={{width:54,padding:"5px 6px",borderRadius:5,border:"1px solid #E8D0A0",fontSize:10,textAlign:"center"}}/>
<button onClick={()=>remIngredient(setF,ing.id)} style={{fontSize:10,color:BRAND.terracotta,background:"none",border:"none",cursor:"pointer"}}>✕</button>
</div>
))}
<button onClick={()=>addIngredient(setF)} style={{padding:6,borderRadius:6,border:"1.5px dashed #E8E0D0",background:"none",color:BRAND.arabica,fontSize:11,cursor:"pointer"}}>+ Surovina</button>
</div>
);

return(
<div style={{padding:14,display:"flex",flexDirection:"column",gap:10}}>
<div style={{background:BRAND.crema,borderRadius:8,padding:"8px 12px",fontSize:11,color:BRAND.arabica}}>
🧮 Receptúry a kalkulácie nápojov/jedál — náklad na porciu sa počíta zo surovín (prepojených na sklad alebo vlastných).
</div>

{/* Hlavný filter kategórie */}
<div style={{display:"flex",gap:5,overflowX:"auto"}}>
{["Všetko",...RECIPE_CATEGORIES].map(c=>(
<button key={c} onClick={()=>{setCatFilter(c);setKokSubFilter("Všetko");setMocktailOnly(false);}}
style={{flex:"0 0 auto",padding:"7px 12px",borderRadius:99,border:"none",cursor:"pointer",fontSize:11,fontWeight:700,whiteSpace:"nowrap",
background:catFilter===c?BRAND.espresso:BRAND.crema,color:catFilter===c?"#fff":BRAND.arabica}}>{c}</button>
))}
</div>
{/* Podfilter pre Koktaily — podľa kategórie z tabuľky + mocktail */}
{catFilter==="Koktaily"&&(
<div style={{display:"flex",gap:5,overflowX:"auto",flexWrap:"wrap"}}>
{kategorieOptions.map(k=>(
<button key={k} onClick={()=>setKokSubFilter(k)}
style={{flex:"0 0 auto",padding:"5px 11px",borderRadius:99,border:`1px solid ${kokSubFilter===k?BRAND.caramel:"#E8E0D0"}`,cursor:"pointer",fontSize:11,fontWeight:600,whiteSpace:"nowrap",
background:kokSubFilter===k?BRAND.crema:"#fff",color:kokSubFilter===k?BRAND.espresso:"#A08060"}}>{k}</button>
))}
<button onClick={()=>setMocktailOnly(v=>!v)}
style={{flex:"0 0 auto",padding:"5px 11px",borderRadius:99,border:`1px solid ${mocktailOnly?BRAND.olive:"#E8E0D0"}`,cursor:"pointer",fontSize:11,fontWeight:600,whiteSpace:"nowrap",
background:mocktailOnly?"#F0FDF4":"#fff",color:mocktailOnly?BRAND.olive:"#A08060"}}>🍃 Len mocktaily</button>
</div>
)}

<button onClick={()=>setAdding(v=>!v)} style={{padding:9,borderRadius:8,border:"1.5px dashed #E8E0D0",background:adding?BRAND.crema:"transparent",color:BRAND.arabica,fontSize:12,cursor:"pointer",fontWeight:600}}>
{adding?"✕ Zrušiť":"+ Pridať receptúru"}
</button>
{adding&&(
<div style={{background:"#fff",borderRadius:10,border:"1px solid #E8E0D0",padding:12,display:"flex",flexDirection:"column",gap:7}}>
<div style={{display:"flex",alignItems:"center",gap:8}}>
<PhotoBox photo={form.photo} icon={form.icon} icons={glassIcons(form.glass)} onPhoto={src=>setForm(f=>({...f,photo:src}))} onIcon={ic=>setForm(f=>({...f,icon:ic}))}/>
<input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Názov (napr. Cappuccino / Mojito)"
style={{flex:1,padding:"7px 10px",borderRadius:7,border:"1px solid #E8E0D0",fontSize:12,outline:"none"}}/>
</div>
<div style={{fontSize:10,color:"#A08060",fontWeight:600}}>Kategória:</div>
<div style={{display:"flex",gap:5,overflowX:"auto"}}>
{RECIPE_CATEGORIES.map(c=>(
<button key={c} onClick={()=>setForm(f=>({...f,category:c}))}
style={{flex:"0 0 auto",padding:"6px 10px",borderRadius:99,border:"none",cursor:"pointer",fontSize:11,fontWeight:600,whiteSpace:"nowrap",
background:form.category===c?BRAND.espresso:BRAND.crema,color:form.category===c?"#fff":BRAND.arabica}}>{c}</button>
))}
</div>
<input type="number" value={form.sellPrice} onChange={e=>setForm(f=>({...f,sellPrice:e.target.value}))} placeholder="Predajná cena €" step="0.01"
style={{padding:"7px 10px",borderRadius:7,border:"1px solid #E8E0D0",fontSize:12,outline:"none"}}/>
{form.category==="Koktaily"&&<CocktailFields f={form} setF={setForm}/>}
<IngredientRows recipe={form} setF={setForm}/>
<div style={{fontSize:11,color:BRAND.adriatic,fontWeight:700}}>Náklad: {costOf(form).toFixed(2)} €{form.sellPrice?` · Marža: ${(form.sellPrice-costOf(form)).toFixed(2)} € (${(((form.sellPrice-costOf(form))/form.sellPrice)*100).toFixed(0)}%)`:""}</div>
<button onClick={addNew} style={{padding:9,borderRadius:7,border:"none",background:BRAND.olive,color:"#fff",fontWeight:700,fontSize:12,cursor:"pointer"}}>✓ Pridať</button>
</div>
)}
<div style={{fontSize:11,color:"#A08060"}}>{filtered.length} receptúr</div>
<div style={{display:"flex",flexDirection:"column",gap:7}}>
{filtered.map(r=>{
const isE=editing===r.id;const cost=costOf(r);const margin=parseFloat(r.sellPrice)-cost;const marginPct=r.sellPrice?(margin/r.sellPrice*100):0;
return(
<div key={r.id} style={{background:"#fff",borderRadius:10,border:"1px solid #E8E0D0",padding:12}}>
<div style={{display:"flex",alignItems:"flex-start",gap:8,marginBottom:6}}>
<PhotoBox photo={r.photo} icon={r.icon} icons={glassIcons(r.glass)} onPhoto={src=>updRecipe(r.id,"photo",src)} onIcon={ic=>updRecipe(r.id,"icon",ic)}/>
<div style={{flex:1}}>
{isE?<input defaultValue={r.name} onChange={e=>updRecipe(r.id,"name",e.target.value)} style={{width:"100%",padding:"4px 7px",borderRadius:6,border:"1px solid #E8D0A0",fontSize:13,fontWeight:700}}/>
:<div style={{fontSize:13,fontWeight:700,color:BRAND.espresso}}>{r.name} {r.mocktail&&<span style={{fontSize:9,fontWeight:700,color:BRAND.olive,background:"#F0FDF4",padding:"1px 6px",borderRadius:99}}>🍃 mocktail dostupný</span>}</div>}
<div style={{fontSize:10,color:"#A08060",marginTop:2}}>
{(r.category||"Iné")}{r.kategoria?` · ${r.kategoria}`:""}{r.glass?` · 🥃 ${r.glass}`:""}{r.prepTime?` · ⏱ ${r.prepTime}`:""}{r.difficulty?` · ${r.difficulty}`:""}
</div>
<div style={{fontSize:10,color:"#A08060",marginTop:2}}>Náklad: <b>{cost.toFixed(2)} €</b> · Predaj: <b>{parseFloat(r.sellPrice||0).toFixed(2)} €</b> · Marža: <b style={{color:margin>=0?BRAND.olive:BRAND.terracotta}}>{margin.toFixed(2)} € ({marginPct.toFixed(0)}%)</b></div>
{(r.shortInstr||r.longInstr)&&<button onClick={()=>setInfoFor(r)} style={{display:"flex",alignItems:"center",gap:3,fontSize:10,color:BRAND.adriatic,fontStyle:"italic",marginTop:3,background:"none",border:"none",cursor:"pointer",padding:0,textAlign:"left"}}>
<span style={{width:14,height:14,borderRadius:"50%",background:BRAND.adriatic,color:"#fff",fontSize:9,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontStyle:"normal"}}>i</span>
{r.shortInstr||"Zobraziť návod"}
</button>}
</div>
<button onClick={()=>setEditing(isE?null:r.id)} style={{padding:"3px 8px",borderRadius:5,border:"none",cursor:"pointer",fontSize:11,fontWeight:600,background:isE?BRAND.olive:BRAND.crema,color:isE?"#fff":BRAND.arabica}}>{isE?"✓":"✎"}</button>
<button onClick={()=>rem(r.id)} style={{padding:"3px 8px",borderRadius:5,border:"none",cursor:"pointer",fontSize:11,background:"#FEE2E2",color:BRAND.terracotta}}>✕</button>
</div>
{isE?(<>
<input type="number" defaultValue={r.sellPrice} onChange={e=>updRecipe(r.id,"sellPrice",e.target.value)} placeholder="Predajná cena €" style={{width:"100%",padding:"6px 8px",borderRadius:6,border:"1px solid #E8D0A0",fontSize:11,marginBottom:6}}/>
{(r.category||"Iné")==="Koktaily"&&<CocktailFields f={r} setF={fn=>setRecipes(rs=>rs.map(item=>item.id===r.id?fn(item):item))}/>}
<IngredientRows recipe={r} setF={fn=>setRecipes(rs=>rs.map(item=>item.id===r.id?fn(item):item))}/>
</>):(
<div style={{display:"flex",flexWrap:"wrap",gap:6,marginTop:4}}>
{r.ingredients.map(ing=>(
<span key={ing.id} style={{fontSize:10,background:BRAND.crema,color:BRAND.arabica,padding:"2px 7px",borderRadius:99}}>{ing.name} {ing.qty}{ing.unit}</span>
))}
</div>
)}
</div>
);
})}
{filtered.length===0&&<div style={{textAlign:"center",color:"#A08060",fontSize:12,padding:20}}>{recipes.length===0?"Žiadne receptúry. Pridaj prvú vyššie.":"Žiadne receptúry v tomto filtri."}</div>}
</div>
{infoFor&&(
<div onClick={()=>setInfoFor(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.5)",zIndex:60,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
<div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:12,padding:18,width:"100%",maxWidth:380,maxHeight:"82vh",overflowY:"auto"}}>
<div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
{(infoFor.photo||infoFor.icon)&&<div style={{width:44,height:44,borderRadius:8,overflow:"hidden",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",background:BRAND.crema,fontSize:24}}>
{infoFor.photo?<img src={infoFor.photo} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:infoFor.icon}
</div>}
<div style={{flex:1}}>
<div style={{fontSize:15,fontWeight:700,color:BRAND.espresso}}>{infoFor.name}</div>
<div style={{fontSize:10,color:"#A08060"}}>{infoFor.glass?`🥃 ${infoFor.glass}`:""}{infoFor.prepTime?` · ⏱ ${infoFor.prepTime}`:""}{infoFor.difficulty?` · ${infoFor.difficulty}`:""}</div>
</div>
<button onClick={()=>setInfoFor(null)} style={{background:"none",border:"none",fontSize:18,color:"#A08060",cursor:"pointer"}}>✕</button>
</div>
{infoFor.mocktail&&<div style={{fontSize:10,fontWeight:700,color:BRAND.olive,background:"#F0FDF4",padding:"4px 9px",borderRadius:99,display:"inline-block",marginBottom:10}}>🍃 dostupný aj ako mocktail (bez alkoholu)</div>}
{infoFor.ingredients&&infoFor.ingredients.length>0&&(
<div style={{marginBottom:12}}>
<div style={{fontSize:11,fontWeight:700,color:BRAND.espresso,marginBottom:5}}>Ingrediencie:</div>
<div style={{display:"flex",flexDirection:"column",gap:3}}>
{infoFor.ingredients.map(ing=>(
<div key={ing.id} style={{fontSize:12,color:BRAND.espresso,display:"flex",justifyContent:"space-between"}}>
<span>{ing.name}</span><span style={{color:"#A08060",fontWeight:600}}>{ing.qty} {ing.unit}</span>
</div>
))}
</div>
</div>
)}
{infoFor.shortInstr&&(
<div style={{marginBottom:10}}>
<div style={{fontSize:11,fontWeight:700,color:BRAND.espresso,marginBottom:3}}>Krátky postup:</div>
<div style={{fontSize:12,color:BRAND.espresso,fontStyle:"italic"}}>{infoFor.shortInstr}</div>
</div>
)}
{infoFor.longInstr&&(
<div>
<div style={{fontSize:11,fontWeight:700,color:BRAND.espresso,marginBottom:3}}>Podrobný návod na namiešanie:</div>
<div style={{fontSize:12,color:BRAND.espresso,lineHeight:1.6}}>{infoFor.longInstr}</div>
</div>
)}
</div>
</div>
)}
</div>
);
}

// ── ODPAD (podľa Katalógu odpadov) ──────────────────────────────
const WASTE_CODES=[
{code:"20 01 08",label:"Biologicky rozložiteľný odpad z kuchyne"},
{code:"15 01 07",label:"Sklo (obaly)"},
{code:"15 01 01",label:"Papier a lepenka (obaly)"},
{code:"15 01 02",label:"Plastové obaly"},
{code:"15 01 04",label:"Kovové obaly"},
{code:"20 01 25",label:"Jedlé oleje a tuky"},
{code:"20 03 01",label:"Zmesový komunálny odpad"},
{code:"20 01 39",label:"Plasty"},
{code:"Iné",label:"Iný druh odpadu"},
];
const DISPOSAL_METHODS=["Zber. spoločnosť","Komunálny zber","Vlastný odvoz","Recyklácia","Iné"];
function WasteTab({inventory,setInventory,wasteLog,setWasteLog}){
const[form,setForm]=useState({wasteCode:WASTE_CODES[0].code,customLabel:"",qtyKg:"",disposal:DISPOSAL_METHODS[0],company:"",linkScm:"",deductStock:false,note:"",date:todayStr()});
const codeLabel=c=>WASTE_CODES.find(w=>w.code===c)?.label||"";

const addEntry=()=>{
const q=parseFloat(form.qtyKg);if(!q||q<=0)return;
setWasteLog(w=>[{id:"w"+Date.now(),...form,qtyKg:q,label:form.wasteCode==="Iné"?form.customLabel:codeLabel(form.wasteCode)},...w]);
if(form.deductStock&&form.linkScm){
setInventory(iv=>iv.map(it=>it.scm===form.linkScm?{...it,qty:Math.max(0,Math.round((it.qty-q)*100)/100)}:it));
}
setForm(f=>({...f,qtyKg:"",customLabel:"",note:"",linkScm:"",deductStock:false}));
};
const rem=id=>setWasteLog(w=>w.filter(x=>x.id!==id));

const monthAgo=new Date();monthAgo.setDate(monthAgo.getDate()-30);
const monthKg=wasteLog.filter(w=>w.date>=monthAgo.toISOString().slice(0,10)).reduce((a,w)=>a+w.qtyKg,0);
const byCode={};wasteLog.forEach(w=>{byCode[w.label]=(byCode[w.label]||0)+w.qtyKg;});

return(
<div style={{padding:14,display:"flex",flexDirection:"column",gap:10}}>
<div style={{background:BRAND.crema,borderRadius:8,padding:"8px 12px",fontSize:11,color:BRAND.arabica}}>
🗑 Evidencia odpadu podľa Katalógu odpadov (vyhláška MŽP SR) — záznam o vzniknutom odpade pre potreby odpadového hospodárstva. Voliteľne prepojené so skladom (odpočet zo zásob pri znehodnotení tovaru).
</div>

<div style={{display:"flex",gap:6}}>
<div style={{flex:1,background:"#fff",borderRadius:8,border:"1px solid #E8E0D0",padding:"10px 8px",textAlign:"center"}}>
<div style={{fontSize:16,fontWeight:700,color:BRAND.olive}}>{monthKg.toFixed(1)} kg</div>
<div style={{fontSize:10,color:"#A08060"}}>za 30 dní</div>
</div>
<div style={{flex:1,background:"#fff",borderRadius:8,border:"1px solid #E8E0D0",padding:"10px 8px",textAlign:"center"}}>
<div style={{fontSize:16,fontWeight:700,color:BRAND.espresso}}>{wasteLog.length}</div>
<div style={{fontSize:10,color:"#A08060"}}>záznamov celkom</div>
</div>
</div>

<div style={{background:"#fff",borderRadius:10,border:"1px solid #E8E0D0",padding:12,display:"flex",flexDirection:"column",gap:7}}>
<div style={{fontSize:11,fontWeight:700,color:BRAND.espresso}}>+ Nový záznam o odpade</div>
<select value={form.wasteCode} onChange={e=>setForm(f=>({...f,wasteCode:e.target.value}))} style={{padding:"7px 8px",borderRadius:7,border:"1px solid #E8E0D0",fontSize:12}}>
{WASTE_CODES.map(w=><option key={w.code} value={w.code}>{w.code} — {w.label}</option>)}
</select>
{form.wasteCode==="Iné"&&<input value={form.customLabel} onChange={e=>setForm(f=>({...f,customLabel:e.target.value}))} placeholder="Popis druhu odpadu"
style={{padding:"7px 10px",borderRadius:7,border:"1px solid #E8E0D0",fontSize:12,outline:"none"}}/>}
<div style={{display:"flex",gap:6}}>
<input type="number" value={form.qtyKg} onChange={e=>setForm(f=>({...f,qtyKg:e.target.value}))} placeholder="Množstvo (kg)" step="0.1"
style={{flex:1,padding:"7px 10px",borderRadius:7,border:"1px solid #E8E0D0",fontSize:12,outline:"none"}}/>
<input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))}
style={{flex:1,padding:"7px 10px",borderRadius:7,border:"1px solid #E8E0D0",fontSize:12,outline:"none"}}/>
</div>
<select value={form.disposal} onChange={e=>setForm(f=>({...f,disposal:e.target.value}))} style={{padding:"7px 8px",borderRadius:7,border:"1px solid #E8E0D0",fontSize:12}}>
{DISPOSAL_METHODS.map(d=><option key={d}>{d}</option>)}
</select>
<input value={form.company} onChange={e=>setForm(f=>({...f,company:e.target.value}))} placeholder="Zberová spoločnosť / odberateľ (voliteľné)"
style={{padding:"7px 10px",borderRadius:7,border:"1px solid #E8E0D0",fontSize:12,outline:"none"}}/>
<select value={form.linkScm} onChange={e=>setForm(f=>({...f,linkScm:e.target.value}))} style={{padding:"7px 8px",borderRadius:7,border:"1px solid #E8E0D0",fontSize:12}}>
<option value="">Neprepojiť so skladovou položkou</option>
{inventory.map(it=><option key={it.scm} value={it.scm}>{it.name}</option>)}
</select>
{form.linkScm&&(
<label style={{display:"flex",alignItems:"center",gap:6,fontSize:11,color:"#A08060",cursor:"pointer"}}>
<input type="checkbox" checked={form.deductStock} onChange={e=>setForm(f=>({...f,deductStock:e.target.checked}))}/>
Odpočítať toto množstvo zo skladovej zásoby
</label>
)}
<input value={form.note} onChange={e=>setForm(f=>({...f,note:e.target.value}))} placeholder="Poznámka (voliteľné)"
style={{padding:"7px 10px",borderRadius:7,border:"1px solid #E8E0D0",fontSize:12,outline:"none"}}/>
<button onClick={addEntry} disabled={!form.qtyKg} style={{padding:9,borderRadius:7,border:"none",background:BRAND.olive,color:"#fff",fontWeight:700,fontSize:12,cursor:form.qtyKg?"pointer":"default",opacity:form.qtyKg?1:0.5}}>
✓ Zaznamenať odpad
</button>
</div>

{Object.keys(byCode).length>0&&(
<div style={{background:BRAND.espresso,borderRadius:10,padding:14}}>
<div style={{fontSize:11,fontWeight:700,color:BRAND.crema,marginBottom:6}}>📊 Súhrn podľa druhu odpadu (celkovo)</div>
{Object.entries(byCode).map(([l,v])=>(
<div key={l} style={{display:"flex",justifyContent:"space-between",fontSize:11,color:BRAND.caramel,marginBottom:3}}>
<span>{l}</span><b>{v.toFixed(1)} kg</b>
</div>
))}
</div>
)}

<div style={{display:"flex",flexDirection:"column",gap:5}}>
{wasteLog.slice(0,40).map(w=>(
<div key={w.id} style={{display:"flex",alignItems:"center",gap:8,background:"#fff",borderRadius:8,border:"1px solid #E8E0D0",padding:"7px 10px"}}>
<div style={{flex:1}}>
<div style={{fontSize:12,fontWeight:600,color:BRAND.espresso}}>{w.label} <span style={{fontWeight:400,color:"#A08060",fontSize:10}}>· {w.qtyKg} kg · {w.disposal}</span></div>
{(w.company||w.note)&&<div style={{fontSize:10,color:"#A08060"}}>{[w.company,w.note].filter(Boolean).join(" · ")}</div>}
</div>
<span style={{fontSize:10,color:"#A08060"}}>{new Date(w.date).toLocaleDateString("sk")}</span>
<button onClick={()=>rem(w.id)} style={{fontSize:10,color:"#D0C8C0",background:"none",border:"none",cursor:"pointer"}}>✕</button>
</div>
))}
{wasteLog.length===0&&<div style={{textAlign:"center",color:"#A08060",fontSize:12,padding:20}}>Žiadne záznamy o odpade.</div>}
</div>
</div>
);
}

const TAB_GROUPS = [
{ group:"Prevádzka", tabs:[
{id:"firma",     icon:"🏢", label:"Firma"},
{id:"provadzka", icon:"🏪", label:"Prevádzka"},
{id:"equipment", icon:"🪑", label:"Inventár"},
{id:"eshop",     icon:"🛒", label:"Eshop"},
]},
{ group:"Tím", tabs:[
{id:"zamestnanci",icon:"👥", label:"Zamestnanci"},
{id:"zmeny",      icon:"🗓️", label:"Zmeny"},
]},
{ group:"Sklad", tabs:[
{id:"dodav",     icon:"🏭", label:"Dodávatelia"},
{id:"sklad",     icon:"📦", label:"Sklad"},
{id:"objednavky",icon:"🛍️", label:"Objednávky"},
{id:"zavozy",    icon:"🚚", label:"Závozy"},
{id:"recepty",   icon:"🧮", label:"Receptúry"},
{id:"odpad",     icon:"🗑️", label:"Odpad"},
]},
{ group:"Plánovanie", tabs:[
{id:"plan",      icon:"📋", label:"Plán"},
{id:"brand",     icon:"🎨", label:"Branding"},
{id:"menu",      icon:"☕", label:"Menu"},
{id:"finance",   icon:"📊", label:"Financie"},
{id:"pokladna",  icon:"💰", label:"Pokladňa"},
]},
{ group:"Kalendár", tabs:[
{id:"kalendar",  icon:"📅", label:"Kalendár"},
]},
];
const TABS = TAB_GROUPS.flatMap(g=>g.tabs);
const groupOf = id => TAB_GROUPS.find(g=>g.tabs.some(t=>t.id===id))?.group;

// ---- Role a práva ----
const ROLE_LABELS = { admin:"Admin", manager:"Manažér", staff:"Personál" };
const PERM_LEVELS = [
{ k:"none", l:"Bez prístupu", c:"#9C8C7E", bg:"#F1EDE6" },
{ k:"view", l:"Len čítať",    c:"#1A5276", bg:"#E6F0F6" },
{ k:"edit", l:"Upravovať",    c:"#0F6E56", bg:"#E1F5EE" },
];
const ROLE_TEMPLATES = {
manager:{ firma:"view", provadzka:"edit", equipment:"edit", eshop:"edit", zamestnanci:"edit", zmeny:"edit", dodav:"edit", sklad:"edit", objednavky:"edit", zavozy:"edit", recepty:"edit", odpad:"edit", plan:"edit", brand:"edit", menu:"edit", finance:"view", pokladna:"edit", kalendar:"edit" },
staff:{ sklad:"view", objednavky:"edit", zavozy:"view", recepty:"view", odpad:"edit", zmeny:"view", menu:"view", pokladna:"edit", plan:"view", kalendar:"view" },
};
function templatePerms(role){
if(role==="admin"){ const o={}; TABS.forEach(t=>o[t.id]="edit"); return o; }
return { ...(ROLE_TEMPLATES[role]||{}) };
}

function UsersAdminTab(){
const { session, profile } = useAuth();
const [users,setUsers]=useState([]);
const [loading,setLoading]=useState(true);
const [msg,setMsg]=useState("");
const [err,setErr]=useState("");
const [creating,setCreating]=useState(false);
const [form,setForm]=useState({ email:"", full_name:"", password:"", role:"staff" });
const [openId,setOpenId]=useState(null);

const load=async()=>{
setLoading(true);
const { data, error }=await supabase.from("profiles").select("*").order("created_at",{ascending:true});
if(error) setErr(error.message); else setUsers(data||[]);
setLoading(false);
};
useEffect(()=>{ load(); },[]);

const api=async(method,body)=>{
const res=await fetch("/api/admin/users",{ method, headers:{ "Content-Type":"application/json", "Authorization":"Bearer "+session.access_token }, body: JSON.stringify(body) });
const data=await res.json();
if(!res.ok) throw new Error(data.error||"Chyba");
return data;
};

const createUser=async()=>{
setErr(""); setMsg("");
if(!form.email||!form.password){ setErr("Vyplň email a heslo."); return; }
if(form.password.length<6){ setErr("Heslo musí mať aspoň 6 znakov."); return; }
setCreating(true);
try{
await api("POST",{ ...form, permissions: templatePerms(form.role) });
setMsg("Používateľ "+form.email+" bol vytvorený.");
setForm({ email:"", full_name:"", password:"", role:"staff" });
await load();
}catch(e){ setErr(e.message); }
setCreating(false);
};

const setRole=async(u,role)=>{
setErr("");
const perms = role==="admin" ? {} : templatePerms(role);
const { error }=await supabase.from("profiles").update({ role, permissions: perms }).eq("id",u.id);
if(error){ setErr(error.message); return; }
await load();
};
const setPerm=async(u,tabId,level)=>{
setErr("");
const perms={ ...(u.permissions||{}) };
if(level==="none") delete perms[tabId]; else perms[tabId]=level;
const { error }=await supabase.from("profiles").update({ permissions:perms }).eq("id",u.id);
if(error){ setErr(error.message); return; }
setUsers(us=>us.map(x=>x.id===u.id?{...x,permissions:perms}:x));
};
const toggleActive=async(u)=>{
const { error }=await supabase.from("profiles").update({ is_active: !u.is_active }).eq("id",u.id);
if(error){ setErr(error.message); return; }
await load();
};
const delUser=async(u)=>{
if(!window.confirm("Naozaj zmazať používateľa "+u.email+"?")) return;
setErr("");
try{ await api("DELETE",{ id:u.id }); setMsg("Používateľ zmazaný."); await load(); }
catch(e){ setErr(e.message); }
};
const resetPwd=async(u)=>{
const np=window.prompt("Nové heslo pre "+u.email+" (min. 6 znakov):");
if(!np) return;
if(np.length<6){ setErr("Heslo musí mať aspoň 6 znakov."); return; }
try{ await api("PATCH",{ id:u.id, password:np }); setMsg("Heslo zmenené."); }
catch(e){ setErr(e.message); }
};

const card={ background:"#fff", border:"1px solid #ECE3D7", borderRadius:10, padding:12, marginBottom:10 };
const inp={ padding:"9px 10px", borderRadius:8, border:"1px solid #E0D6C2", fontSize:13, outline:"none", color:BRAND.espresso };

return (
<div style={{ padding:"14px 16px 30px" }}>
<div style={{ display:"flex", alignItems:"center", gap:9, marginBottom:14 }}>
<div style={{ width:26, height:26, borderRadius:7, background:`linear-gradient(135deg,${MV.neon},${MV.violet})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14 }}>🔐</div>
<div>
<div style={{ fontSize:14, fontWeight:800, color:BRAND.espresso }}>Používatelia a práva</div>
<div style={{ fontSize:9.5, color:BRAND.arabica }}>Pridávaj ľudí a nastav im prístup k sekciám</div>
</div>
</div>

{msg&&<div style={{ background:"#E1F5EE", color:"#0F6E56", fontSize:12, borderRadius:8, padding:"8px 10px", marginBottom:10 }}>{msg}</div>}
{err&&<div style={{ background:"#FCEBEB", color:"#A32D2D", fontSize:12, borderRadius:8, padding:"8px 10px", marginBottom:10 }}>{err}</div>}

<div style={{ ...card, background:"#FBF6EE" }}>
<div style={{ fontSize:12, fontWeight:800, color:BRAND.espresso, marginBottom:9 }}>＋ Nový používateľ</div>
<div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:8 }}>
<input style={inp} placeholder="Email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))}/>
<input style={inp} placeholder="Meno (voliteľné)" value={form.full_name} onChange={e=>setForm(f=>({...f,full_name:e.target.value}))}/>
<input style={inp} type="text" placeholder="Heslo (min. 6 znakov)" value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))}/>
<select style={inp} value={form.role} onChange={e=>setForm(f=>({...f,role:e.target.value}))}>
<option value="staff">Personál</option>
<option value="manager">Manažér</option>
<option value="admin">Admin</option>
</select>
</div>
<button onClick={createUser} disabled={creating} style={{ width:"100%", padding:10, borderRadius:8, border:"none", fontWeight:800, fontSize:13, cursor:creating?"default":"pointer", color:"#fff", background:`linear-gradient(135deg,${MV.neon},${MV.violet})`, opacity:creating?0.6:1 }}>
{creating?"Vytváram…":"Vytvoriť používateľa"}
</button>
<div style={{ fontSize:10, color:BRAND.arabica, marginTop:7 }}>Rola prednastaví práva — jednotlivé sekcie vieš doladiť nižšie.</div>
</div>

{loading?<div style={{ textAlign:"center", color:BRAND.arabica, fontSize:13, padding:20 }}>Načítavam…</div>:
users.map(u=>{
const isMe=u.id===profile.id;
const isAdminU=u.role==="admin";
const open=openId===u.id;
return (
<div key={u.id} style={card}>
<div style={{ display:"flex", alignItems:"center", gap:10 }}>
<div style={{ width:34, height:34, borderRadius:"50%", background:BRAND.caramel, color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:13 }}>{(u.full_name||u.email||"?").slice(0,1).toUpperCase()}</div>
<div style={{ flex:1, minWidth:0 }}>
<div style={{ fontSize:13, fontWeight:700, color:BRAND.espresso }}>{u.full_name||u.email} {isMe&&<span style={{ fontSize:9, color:BRAND.arabica }}>(ty)</span>}</div>
<div style={{ fontSize:10.5, color:BRAND.arabica, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{u.email} · {u.is_active===false?"deaktivovaný":"aktívny"}</div>
</div>
<select value={u.role} disabled={isMe} onChange={e=>setRole(u,e.target.value)} style={{ ...inp, padding:"6px 8px", fontSize:12, opacity:isMe?0.5:1 }}>
<option value="staff">Personál</option>
<option value="manager">Manažér</option>
<option value="admin">Admin</option>
</select>
</div>
{!isAdminU&&(
<button onClick={()=>setOpenId(open?null:u.id)} style={{ marginTop:9, width:"100%", padding:"7px", borderRadius:7, border:`1px solid ${BRAND.caramel}`, background:open?"rgba(255,106,0,.08)":"#fff", color:BRAND.caramel, fontWeight:700, fontSize:12, cursor:"pointer" }}>
{open?"Skryť práva ▲":"Práva na sekcie ▼"}
</button>
)}
{isAdminU&&<div style={{ marginTop:8, fontSize:11, color:"#0F6E56", fontWeight:700 }}>Admin má prístup ku všetkému vrátane správy používateľov.</div>}
{open&&!isAdminU&&(
<div style={{ marginTop:10, borderTop:"1px solid #F0E8DA", paddingTop:10 }}>
{TAB_GROUPS.map(g=>(
<div key={g.group} style={{ marginBottom:9 }}>
<div style={{ fontSize:9, fontWeight:800, color:BRAND.arabica, textTransform:"uppercase", letterSpacing:".06em", marginBottom:4 }}>{g.group}</div>
{g.tabs.map(t=>{
const cur=(u.permissions&&u.permissions[t.id])||"none";
return (
<div key={t.id} style={{ display:"flex", alignItems:"center", gap:8, padding:"4px 0" }}>
<div style={{ flex:1, fontSize:12, color:BRAND.espresso }}>{t.icon} {t.label}</div>
<div style={{ display:"flex", gap:4 }}>
{PERM_LEVELS.map(p=>(
<button key={p.k} onClick={()=>setPerm(u,t.id,p.k)} style={{ padding:"3px 8px", borderRadius:6, border:cur===p.k?`1.5px solid ${p.c}`:"1px solid #E0D6C2", background:cur===p.k?p.bg:"#fff", color:cur===p.k?p.c:"#A08C7C", fontSize:10.5, fontWeight:cur===p.k?800:500, cursor:"pointer" }}>{p.l}</button>
))}
</div>
</div>
);
})}
</div>
))}
</div>
)}
{!isMe&&(
<div style={{ marginTop:9, display:"flex", gap:8, flexWrap:"wrap" }}>
<button onClick={()=>toggleActive(u)} style={{ flex:1, padding:"6px", borderRadius:7, border:"1px solid #E0D6C2", background:"#fff", color:u.is_active===false?"#0F6E56":"#9A3412", fontSize:11, fontWeight:700, cursor:"pointer" }}>{u.is_active===false?"Aktivovať":"Deaktivovať"}</button>
<button onClick={()=>resetPwd(u)} style={{ flex:1, padding:"6px", borderRadius:7, border:"1px solid #E0D6C2", background:"#fff", color:BRAND.adriatic, fontSize:11, fontWeight:700, cursor:"pointer" }}>Zmeniť heslo</button>
<button onClick={()=>delUser(u)} style={{ flex:1, padding:"6px", borderRadius:7, border:"1px solid #F0C0C0", background:"#fff", color:"#A32D2D", fontSize:11, fontWeight:700, cursor:"pointer" }}>Zmazať</button>
</div>
)}
</div>
);
})}
</div>
);
}

export default function App() {
const { profile, signOut } = useAuth();
const isAdmin = profile?.role === "admin";
const permFor = (id) => isAdmin ? "edit" : ((profile?.permissions && profile.permissions[id]) || "none");
const ADMIN_GROUP = { group:"Správa", tabs:[{ id:"users", icon:"🔐", label:"Používatelia" }] };
const visibleGroups = (isAdmin ? [...TAB_GROUPS, ADMIN_GROUP] : TAB_GROUPS)
.map(g => ({ ...g, tabs: g.tabs.filter(t => permFor(t.id) !== "none") }))
.filter(g => g.tabs.length > 0);
const firstGroup = visibleGroups[0]?.group || null;
const firstTab = visibleGroups[0]?.tabs[0]?.id || null;
const [tab, setTab] = useState(firstTab);
const [activeGroup, setActiveGroup] = useState(firstGroup);
const [inventory, setInventory] = usePersistentState("cp_inventory", []);
const [employees, setEmployees] = usePersistentState("cp_employees", EMPLOYEES_INITIAL);
const [company, setCompany] = usePersistentState("cp_company", COMPANY_DEFAULT);
const [venue, setVenue] = usePersistentState("cp_venue", VENUE_DEFAULT);
const [sales, setSales] = usePersistentState("cp_sales", []);
const [recipes, setRecipes] = usePersistentState("cp_recipes", RECIPES_INITIAL);
const [wasteLog, setWasteLog] = usePersistentState("cp_wasteLog", []);
const days = Math.max(0, Math.floor((new Date("2026-06-01")-new Date())/86400000));
const alerts = inventory.filter(i=>i.qty<i.minQty).length;
const currentGroupTabs = visibleGroups.find(g=>g.group===activeGroup)?.tabs||[];
const tabLevel = permFor(tab);
const readOnly = tabLevel === "view";
if (!firstTab) return (
<div style={{ fontFamily:"'Helvetica Neue',Arial,sans-serif", minHeight:"100vh", background:BRAND.latte, display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>
<div style={{ textAlign:"center", maxWidth:340 }}>
<div style={{ fontSize:34, marginBottom:8 }}>🔒</div>
<div style={{ fontSize:15, fontWeight:800, color:BRAND.espresso, marginBottom:6 }}>Žiadne pridelené práva</div>
<div style={{ fontSize:12.5, color:BRAND.arabica, marginBottom:16 }}>Tvoj účet zatiaľ nemá prístup k žiadnej sekcii. Kontaktuj administrátora.</div>
<button onClick={signOut} style={{ padding:"9px 16px", borderRadius:8, border:"none", background:BRAND.caramel, color:"#fff", fontWeight:700, cursor:"pointer" }}>Odhlásiť sa</button>
</div>
</div>
);
return (
<div style={{fontFamily:"'Helvetica Neue',Arial,sans-serif",background:BRAND.latte,minHeight:"100vh"}}>
<div style={{background:"linear-gradient(120deg,#05060d 0%,#140B06 55%,#23120A 100%)",color:MV.text,padding:"10px 16px",display:"flex",alignItems:"center",gap:12,position:"sticky",top:0,zIndex:20,borderBottom:`1px solid ${MV.line}`,boxShadow:"0 2px 18px rgba(255,106,0,.18)"}}>
<div style={{width:32,height:32,borderRadius:9,background:`linear-gradient(135deg,${MV.neon},${MV.violet})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,boxShadow:`0 0 16px ${MV.neon}66`}}>⚡</div>
<div>
<div style={{fontFamily:"Georgia,serif",fontSize:17,fontStyle:"italic",color:"#fff",lineHeight:1.1}}>
Cafe Paradise
</div>
<div style={{fontSize:8.5,color:MV.neon2,letterSpacing:".24em",textTransform:"uppercase",fontWeight:700}}>Service Manager</div>
<div style={{fontSize:8,color:MV.dim,marginTop:2,display:"flex",alignItems:"center",gap:3,whiteSpace:"nowrap"}}>powered by <b style={{background:`linear-gradient(90deg,${MV.neon},${MV.violet})`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",fontWeight:800}}>⚡ MediaVolt</b></div>
</div>
<div style={{marginLeft:"auto",display:"flex",gap:8,alignItems:"center"}}>
{alerts>0&&<div style={{background:"rgba(192,57,43,.92)",color:"#fff",borderRadius:99,padding:"3px 10px",fontSize:11,fontWeight:700}}>⚠️ {alerts}</div>}
<div style={{background:"rgba(255,106,0,.14)",border:`1px solid ${MV.line}`,borderRadius:8,padding:"4px 10px",textAlign:"center"}}>
<div style={{fontSize:17,fontWeight:700,color:"#fff",lineHeight:1}}>{days}</div>
<div style={{fontSize:9,color:MV.neon2}}>dní</div>
</div>
<div style={{textAlign:"right",lineHeight:1.15,maxWidth:130,overflow:"hidden"}}>
<div style={{fontSize:11,color:"#fff",fontWeight:600,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{profile?.full_name||profile?.email}</div>
<div style={{fontSize:8,color:MV.neon2,textTransform:"uppercase",letterSpacing:".1em",fontWeight:700}}>{ROLE_LABELS[profile?.role]||profile?.role}</div>
</div>
<button onClick={signOut} title="Odhlásiť sa" style={{background:"transparent",border:`1px solid ${MV.line}`,color:MV.neon2,borderRadius:8,padding:"6px 8px",fontSize:13,cursor:"pointer",lineHeight:1}}>⏻</button>
</div>
</div>
{/* Blok navigácie — skupiny */}
<div style={{background:MV.panel2,display:"flex",gap:0,position:"sticky",top:48,zIndex:19,overflowX:"auto",borderBottom:`1px solid ${MV.line}`}}>
{visibleGroups.map(g=>(
<button key={g.group} onClick={()=>{setActiveGroup(g.group);setTab(g.tabs[0].id);}}
style={{flex:"0 0 auto",padding:"7px 14px",border:"none",borderBottom:activeGroup===g.group?`2px solid ${MV.neon2}`:"2px solid transparent",
background:activeGroup===g.group?"rgba(255,106,0,.14)":"none",color:activeGroup===g.group?MV.neon2:MV.dim,cursor:"pointer",fontSize:11,fontWeight:700,whiteSpace:"nowrap"}}>
{g.group}
</button>
))}
</div>
{/* Tabs v rámci zvolenej skupiny */}
<div style={{background:"#fff",borderBottom:"1px solid #ECE3D7",display:"flex",position:"sticky",top:78,zIndex:18,overflowX:"auto"}}>
{currentGroupTabs.map(t=>(
<button key={t.id} onClick={()=>setTab(t.id)}
style={{flex:"0 0 auto",minWidth:58,padding:"8px 10px",border:"none",borderBottom:tab===t.id?`2.5px solid ${BRAND.caramel}`:"2.5px solid transparent",background:tab===t.id?"rgba(255,106,0,.07)":"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3,transition:"all .15s"}}>
<span style={{fontSize:15,filter:tab===t.id?"none":"grayscale(.35) opacity(.85)"}}>{t.icon}</span>
<span style={{fontSize:9,fontWeight:tab===t.id?700:500,color:tab===t.id?BRAND.caramel:"#A08C7C",whiteSpace:"nowrap"}}>{t.label}</span>
</button>
))}
</div>
{readOnly&&(
<div style={{background:"#FEF3C7",color:"#8B6F00",fontSize:11,fontWeight:700,padding:"6px 16px",textAlign:"center",borderBottom:"1px solid #F3E3B0"}}>
👁 Len na čítanie — túto sekciu nemôžeš upravovať.
</div>
)}
<div style={readOnly?{pointerEvents:"none",userSelect:"none"}:undefined}>
{tab==="plan"     && <PlanTab/>}
{tab==="brand"    && <BrandingTab/>}
{tab==="menu"     && <MenuTab/>}
{tab==="finance"  && <FinanceTab/>}
{tab==="pokladna" && <PokladnaTab company={company} sales={sales} setSales={setSales}/>}
{tab==="dodav"    && <DodavateliaTab inventory={inventory} setInventory={setInventory}/>}
{tab==="objednavky" && <OrderTab inventory={inventory}/>}
{tab==="zavozy" && <ZavozyTab/>}
{tab==="recepty" && <RecipesTab inventory={inventory} recipes={recipes} setRecipes={setRecipes}/>}
{tab==="odpad" && <WasteTab inventory={inventory} setInventory={setInventory} wasteLog={wasteLog} setWasteLog={setWasteLog}/>}
{tab==="sklad" && <StockTab inventory={inventory} setInventory={setInventory}/>}
{tab==="zamestnanci" && <EmployeesTab employees={employees} setEmployees={setEmployees} company={company} setCompany={setCompany} venue={venue}/>}
{tab==="zmeny" && <ShiftsTab employees={employees} setEmployees={setEmployees}/>}
{tab==="firma" && <FirmaTab company={company} setCompany={setCompany}/>}
{tab==="provadzka" && <VenueTab venue={venue} setVenue={setVenue}/>}
{tab==="equipment" && <EquipmentTab/>}
{tab==="eshop"    && <EshopTab/>}
{tab==="kalendar" && <CalendarTab/>}
{tab==="users"    && <UsersAdminTab/>}
</div>
</div>
);
}
