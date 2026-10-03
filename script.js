const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const KEY="frenzilife-data-v1";
const defaults={tasks:[],notes:[],events:[],money:[],shopping:[],settings:{animations:true,theme:"dark"}};
let data=JSON.parse(localStorage.getItem(KEY)||"null")||structuredClone(defaults);
data={...defaults,...data,settings:{...defaults.settings,...(data.settings||{})}};
function save(){localStorage.setItem(KEY,JSON.stringify(data));refreshStats()}
function toast(msg){const t=$("#toast");t.textContent=msg;t.classList.add("show");clearTimeout(toast.t);toast.t=setTimeout(()=>t.classList.remove("show"),2200)}
function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,7)}
function refreshStats(){$("#taskCount").textContent=data.tasks.filter(x=>!x.done).length;$("#noteCount").textContent=data.notes.length;$("#eventCount").textContent=data.events.length}

function updateClock(){const d=new Date();$("#dateNow").textContent=d.toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long",year:"numeric"});$("#timeNow").textContent=d.toLocaleTimeString("fr-FR");$("#deviceType").textContent=innerWidth<=700?"📱 Téléphone":"💻 PC"}
setInterval(updateClock,1000);updateClock();

const quick=[["📋","Tâches","#taches"],["📝","Notes","#notes"],["📅","Calendrier","#calendrier"],["⏱️","Minuteur","#outils"],["🧮","Calculatrice","#outils"],["🛒","Courses","#outils"],["🔐","Mot de passe","#outils"],["⚙️","Paramètres","#parametres"]];
$("#quickTools").innerHTML=quick.map(x=>`<a class="card quick-card" href="${x[2]}"><span>${x[0]}</span><strong>${x[1]}</strong><small>Ouvrir →</small></a>`).join("");

function renderTasks(){
 const el=$("#tasksList");
 if(!data.tasks.length){el.innerHTML='<div class="empty">Aucune tâche pour le moment.</div>';return}
 el.innerHTML=data.tasks.map(t=>`<div class="list-item ${t.done?"done":""}">
 <input type="checkbox" ${t.done?"checked":""} data-task="${t.id}">
 <span class="item-text">${esc(t.text)}</span><span class="priority ${t.priority}">${t.priority==="high"?"Haute":t.priority==="low"?"Basse":"Normale"}</span>
 <button class="icon-btn" data-edit-task="${t.id}">✏️</button><button class="icon-btn" data-del-task="${t.id}">🗑️</button></div>`).join("");
}
$("#taskForm").addEventListener("submit",e=>{e.preventDefault();data.tasks.push({id:uid(),text:$("#taskInput").value.trim(),priority:$("#taskPriority").value,done:false});$("#taskInput").value="";save();renderTasks();});
$("#tasksList").addEventListener("click",e=>{
 const id=e.target.dataset.task||e.target.dataset.delTask||e.target.dataset.editTask;if(!id)return;
 const t=data.tasks.find(x=>x.id===id);
 if(e.target.dataset.task){t.done=e.target.checked;save();renderTasks()}
 if(e.target.dataset.delTask){data.tasks=data.tasks.filter(x=>x.id!==id);save();renderTasks()}
 if(e.target.dataset.editTask){const n=prompt("Modifier la tâche :",t.text);if(n!==null&&n.trim()){t.text=n.trim();save();renderTasks()}}
});

function renderNotes(){
 const q=$("#noteSearch").value.toLowerCase();
 const arr=data.notes.filter(n=>(n.title+" "+n.body).toLowerCase().includes(q));
 $("#notesList").innerHTML=arr.length?arr.map(n=>`<article class="card note"><h3>${esc(n.title)}</h3><p>${esc(n.body||"")}</p><div class="note-actions"><button class="icon-btn" data-edit-note="${n.id}">✏️</button><button class="icon-btn" data-del-note="${n.id}">🗑️</button></div></article>`).join(""):'<div class="empty">Aucune note trouvée.</div>';
}
$("#noteForm").addEventListener("submit",e=>{e.preventDefault();data.notes.unshift({id:uid(),title:$("#noteTitle").value.trim(),body:$("#noteBody").value});$("#noteTitle").value="";$("#noteBody").value="";save();renderNotes();});
$("#noteSearch").addEventListener("input",renderNotes);
$("#notesList").addEventListener("click",e=>{
 const id=e.target.dataset.editNote||e.target.dataset.delNote;if(!id)return;const n=data.notes.find(x=>x.id===id);
 if(e.target.dataset.delNote){data.notes=data.notes.filter(x=>x.id!==id);save();renderNotes()}
 else {const title=prompt("Titre :",n.title);if(title===null)return;const body=prompt("Texte :",n.body);if(body===null)return;n.title=title;n.body=body;save();renderNotes()}
});

let calDate=new Date(),calView="month";
function dateKey(d){return d.toISOString().slice(0,10)}
function renderCalendar(){
 const title=$("#calendarTitle"),grid=$("#calendarGrid");
 const y=calDate.getFullYear(),m=calDate.getMonth(),d=calDate.getDate();
 title.textContent=calView==="month"?calDate.toLocaleDateString("fr-FR",{month:"long",year:"numeric"}):calDate.toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long",year:"numeric"});
 if(calView==="month"){
  const first=new Date(y,m,1),last=new Date(y,m+1,0),start=(first.getDay()+6)%7;
  let out='<div class="calendar-grid">'+["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"].map(x=>`<div class="cal-cell cal-day-name">${x}</div>`).join("");
  for(let i=0;i<start;i++)out+='<div class="cal-cell"></div>';
  for(let day=1;day<=last.getDate();day++){const dt=new Date(y,m,day),key=dateKey(dt),today=key===dateKey(new Date());const ev=data.events.filter(e=>e.date===key);out+=`<div class="cal-cell ${today?"today":""}" data-date="${key}"><div class="cal-number">${day}</div>${ev.map(e=>`<div class="event" data-event="${e.id}" title="Cliquer pour modifier">${e.time?e.time+" ":""}${esc(e.title)}</div>`).join("")}</div>`}
  out+="</div>";grid.innerHTML=out;
 }else if(calView==="week"){
  const monday=new Date(calDate);monday.setDate(d-((monday.getDay()+6)%7));
  let out='<div class="calendar-grid">';
  for(let i=0;i<7;i++){const dt=new Date(monday);dt.setDate(monday.getDate()+i);const key=dateKey(dt);out+=`<div class="cal-cell" data-date="${key}"><div class="cal-day-name">${dt.toLocaleDateString("fr-FR",{weekday:"short"})}</div><div class="cal-number">${dt.getDate()}</div>${data.events.filter(e=>e.date===key).map(e=>`<div class="event" data-event="${e.id}">${e.time?e.time+" ":""}${esc(e.title)}</div>`).join("")}</div>`}out+="</div>";grid.innerHTML=out;
 }else{
  const key=dateKey(calDate),ev=data.events.filter(e=>e.date===key);grid.innerHTML=`<div style="padding:25px">${ev.length?ev.map(e=>`<div class="list-item"><b>${e.time||""}</b><span class="item-text">${esc(e.title)}</span><button class="icon-btn" data-event="${e.id}">✏️</button></div>`).join(""):'<p class="empty">Aucun événement aujourd’hui.</p>'}</div>`;
 }
}
$("#prevMonth").onclick=()=>{if(calView==="month")calDate.setMonth(calDate.getMonth()-1);else calDate.setDate(calDate.getDate()-(calView==="week"?7:1));renderCalendar()}
$("#nextMonth").onclick=()=>{if(calView==="month")calDate.setMonth(calDate.getMonth()+1);else calDate.setDate(calDate.getDate()+(calView==="week"?7:1));renderCalendar()}
$("#todayMonth").onclick=()=>{calDate=new Date();renderCalendar()}
$$(".view-switch button").forEach(b=>b.onclick=()=>{$$(".view-switch button").forEach(x=>x.classList.remove("active"));b.classList.add("active");calView=b.dataset.view;renderCalendar()});
$("#calendarGrid").addEventListener("click",e=>{const event=e.target.dataset.event;if(event){editEvent(event);return}const cell=e.target.closest("[data-date]");if(cell){$("#eventDate").value=cell.dataset.date;$("#eventTitle").focus()}});
$("#eventForm").addEventListener("submit",e=>{e.preventDefault();const id=$("#eventId").value;const obj={id:id||uid(),title:$("#eventTitle").value.trim(),date:$("#eventDate").value,time:$("#eventTime").value};if(id){const i=data.events.findIndex(x=>x.id===id);data.events[i]=obj}else data.events.push(obj);resetEvent();save();renderCalendar();toast("Événement enregistré")});
function editEvent(id){const e=data.events.find(x=>x.id===id);if(!e)return;$("#eventId").value=e.id;$("#eventTitle").value=e.title;$("#eventDate").value=e.date;$("#eventTime").value=e.time||"";location.hash="calendrier"}
$("#cancelEvent").onclick=resetEvent;
function resetEvent(){$("#eventId").value="";$("#eventTitle").value="";$("#eventDate").value=dateKey(calDate);$("#eventTime").value=""}

let timerSec=300,timerInt=null;
function timerText(s){return [Math.floor(s/3600),Math.floor(s%3600/60),s%60].map(n=>String(n).padStart(2,"0")).join(":")}
function syncTimer(){timerSec=(+$("#timerH").value||0)*3600+(+$("#timerM").value||0)*60+(+$("#timerS").value||0);$("#timerDisplay").textContent=timerText(timerSec)}
["timerH","timerM","timerS"].forEach(id=>$("#"+id).oninput=()=>{if(!timerInt)syncTimer()});
$("#timerStart").onclick=()=>{if(timerInt)return;if(timerSec<=0)syncTimer();timerInt=setInterval(()=>{if(timerSec<=0){clearInterval(timerInt);timerInt=null;beep();toast("⏰ Minuteur terminé !");return}timerSec--;$("#timerDisplay").textContent=timerText(timerSec)},1000)}
$("#timerPause").onclick=()=>{clearInterval(timerInt);timerInt=null}
$("#timerReset").onclick=()=>{clearInterval(timerInt);timerInt=null;syncTimer()}
function beep(){try{const a=new AudioContext(),o=a.createOscillator(),g=a.createGain();o.connect(g);g.connect(a.destination);o.frequency.value=880;g.gain.value=.08;o.start();o.stop(a.currentTime+.35)}catch{}}
syncTimer();

let swStart=0,swElapsed=0,swInt=null;
function renderSW(){const x=swElapsed;const ms=Math.floor(x%1000),s=Math.floor(x/1000)%60,m=Math.floor(x/60000)%60,h=Math.floor(x/3600000);$("#stopwatchDisplay").textContent=`${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}.${String(Math.floor(ms/10)).padStart(2,"0")}`}
$("#swStart").onclick=()=>{if(swInt)return;swStart=performance.now()-swElapsed;swInt=setInterval(()=>{swElapsed=performance.now()-swStart;renderSW()},30)}
$("#swPause").onclick=()=>{clearInterval(swInt);swInt=null}
$("#swReset").onclick=()=>{clearInterval(swInt);swInt=null;swElapsed=0;renderSW()};renderSW();

let calc="";
const keys=["C","⌫","%","÷","7","8","9","×","4","5","6","−","1","2","3","+","0",".","="];
$("#calcKeys").innerHTML=keys.map(k=>`<button data-key="${k}">${k}</button>`).join("");
$("#calcKeys").onclick=e=>{const k=e.target.dataset.key;if(!k)return;if(k==="C")calc="";else if(k==="⌫")calc=calc.slice(0,-1);else if(k==="="){try{const expr=calc.replaceAll("×","*").replaceAll("÷","/").replaceAll("−","-").replace(/%/g,"/100");calc=String(Function("return "+expr)())}catch{calc="Erreur"}}else calc+=k;$("#calcDisplay").value=calc||"0"};

function renderMoney(){const bal=data.money.reduce((a,x)=>a+(x.type==="income"?x.amount:-x.amount),0);$("#balance").textContent=bal.toLocaleString("fr-FR",{style:"currency",currency:"EUR"});$("#moneyHistory").innerHTML=data.money.slice().reverse().map(x=>`<div class="money-row"><span>${esc(x.label||"Sans libellé")}</span><b>${x.type==="income"?"+":"−"}${x.amount.toLocaleString("fr-FR",{style:"currency",currency:"EUR"})}</b></div>`).join("")||'<div class="empty">Aucune opération.</div>'}
$("#moneyAdd").onclick=e=>{e.preventDefault();const amount=+$("#moneyAmount").value;if(!(amount>0)){toast("Entre un montant valide");return}data.money.push({id:uid(),amount,type:$("#moneyType").value,label:$("#moneyLabel").value.trim()});$("#moneyAmount").value="";$("#moneyLabel").value="";save();renderMoney()};

function renderShopping(){const left=data.shopping.filter(x=>!x.done).length;$("#shoppingRemaining").textContent=`${left} produit${left>1?"s":""} restant${left>1?"s":""} à acheter`;$("#shoppingList").innerHTML=data.shopping.length?data.shopping.map(x=>`<div class="list-item ${x.done?"done":""}"><input type="checkbox" ${x.done?"checked":""} data-shop="${x.id}"><span class="item-text">${esc(x.name)} × ${x.qty}</span><button class="icon-btn" data-edit-shop="${x.id}">✏️</button><button class="icon-btn" data-del-shop="${x.id}">🗑️</button></div>`).join(""):'<div class="empty">Ta liste est vide.</div>'}
$("#shoppingForm").onsubmit=e=>{e.preventDefault();data.shopping.push({id:uid(),name:$("#shoppingInput").value.trim(),qty:+$("#shoppingQty").value||1,done:false});$("#shoppingInput").value="";$("#shoppingQty").value=1;save();renderShopping()};
$("#shoppingList").onclick=e=>{const id=e.target.dataset.shop||e.target.dataset.delShop||e.target.dataset.editShop;if(!id)return;const x=data.shopping.find(z=>z.id===id);if(e.target.dataset.shop)x.done=e.target.checked;if(e.target.dataset.delShop)data.shopping=data.shopping.filter(z=>z.id!==id);if(e.target.dataset.editShop){const q=prompt("Quantité :",x.qty);if(q)x.qty=Math.max(1,+q||1)}save();renderShopping()};

let linkHTML="";
$("#makeLink").onclick=()=>{let url=$("#linkUrl").value.trim();if(!/^https?:\/\//i.test(url))url="https://"+url;const text=$("#linkText").value.trim()||url;linkHTML=`<a href="${escAttr(url)}" target="_blank" rel="noopener noreferrer">${esc(text)}</a>`;$("#linkResult").innerHTML=linkHTML};
$("#copyLink").onclick=()=>{const a=$("#linkResult a");if(!a){toast("Crée d'abord un lien");return}navigator.clipboard?.writeText(a.href).then(()=>toast("Lien copié !"))};

function generatePassword(){let chars="";if($("#upper").checked)chars+="ABCDEFGHIJKLMNOPQRSTUVWXYZ";if($("#lower").checked)chars+="abcdefghijklmnopqrstuvwxyz";if($("#numbers").checked)chars+="0123456789";if($("#symbols").checked)chars+="!@#$%^&*()-_=+[]{};:,.?";if(!chars){toast("Choisis au moins un type de caractère");return}let out="";const arr=new Uint32Array(+$("#passLength").value);crypto.getRandomValues(arr);arr.forEach(n=>out+=chars[n%chars.length]);$("#passwordResult").value=out}
$("#generatePassword").onclick=generatePassword;$("#passLength").oninput=()=>$("#passLengthLabel").textContent=$("#passLength").value;$("#copyPassword").onclick=()=>{if($("#passwordResult").value)navigator.clipboard?.writeText($("#passwordResult").value).then(()=>toast("Mot de passe copié !"))};generatePassword();

$("#toolSearch").oninput=()=>{const q=$("#toolSearch").value.toLowerCase();$$(".tool-panel").forEach(x=>x.style.display=(!q||x.dataset.tool.includes(q))?"":"none")};
$("#animationsToggle").checked=data.settings.animations;$("#themeSelect").value=data.settings.theme;
function applySettings(){document.body.classList.toggle("no-animations",!data.settings.animations);document.body.classList.toggle("light",data.settings.theme==="light")}
$("#animationsToggle").onchange=()=>{data.settings.animations=$("#animationsToggle").checked;save();applySettings()};
$("#themeSelect").onchange=()=>{data.settings.theme=$("#themeSelect").value;save();applySettings()};
$("#clearData").onclick=()=>{if(confirm("Effacer toutes les tâches, notes, événements et données de FrenziLife ?")){localStorage.removeItem(KEY);location.reload()}};

function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
function escAttr(s){return esc(s).replace(/`/g,"&#096;")}
renderTasks();renderNotes();renderCalendar();resetEvent();renderMoney();renderShopping();applySettings();refreshStats();

let deferredPrompt=null;
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredPrompt=e;$("#installBtn").hidden=false});
$("#installBtn").onclick=async()=>{if(!deferredPrompt){toast("Installation automatique indisponible. Utilise le menu Chrome → Installer / Ajouter à l'écran d'accueil.");return}deferredPrompt.prompt();const {outcome}=await deferredPrompt.userChoice;deferredPrompt=null;$("#installBtn").hidden=true;toast(outcome==="accepted"?"FrenziLife installé !":"Installation annulée")};
window.addEventListener("appinstalled",()=>toast("FrenziLife est installé !"));
if("serviceWorker" in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("./service-worker.js").catch(()=>{}));
