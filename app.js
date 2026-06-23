const KEY="life-organiser-v3";
const TRACKER_KEY="life-organiser-trackers-v3";

const workCats=[
"Medication Query","Medication Review","Audit","Safe Prescribing","Cost Effective Prescribing",
"Care Home Query","CQC Safety Alert","MHRA Alert","Hospital Letter","Deadline","Meeting","Follow-up","Admin"
];
const personalCats=["Routine","Habit","Exercise","Salah","Hydration","Cooking","Reading","Important Date","Appointment"];

let items=JSON.parse(localStorage.getItem(KEY)||"null")||seedItems();
let trackers=JSON.parse(localStorage.getItem(TRACKER_KEY)||"null")||{};
const $=s=>document.querySelector(s);

function todayKey(){return new Date().toISOString().slice(0,10)}
function save(){localStorage.setItem(KEY,JSON.stringify(items));localStorage.setItem(TRACKER_KEY,JSON.stringify(trackers))}
function seedItems(){return[
{id:crypto.randomUUID(),area:"Work",category:"Medication Query",title:"Triage medication queries",date:"",priority:"High",status:"Not started",notes:"Add queries without patient-identifiable information.",done:false,doneAt:null,createdAt:new Date().toISOString()},
{id:crypto.randomUUID(),area:"Work",category:"Hospital Letter",title:"Review hospital letters",date:"",priority:"Normal",status:"Not started",notes:"Check medication changes and follow-up actions.",done:false,doneAt:null,createdAt:new Date().toISOString()},
{id:crypto.randomUUID(),area:"Personal",category:"Salah",title:"Complete all 5 prayers",date:"",priority:"High",status:"Not started",notes:"Use the Salah tracker on the home page.",done:false,doneAt:null,createdAt:new Date().toISOString()}
]}

function esc(t){return String(t).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
function fmt(d){if(!d)return"No date";return new Intl.DateTimeFormat(undefined,{dateStyle:"medium",timeStyle:"short"}).format(new Date(d))}
function dueSoon(it){if(!it.date||it.done)return false; const now=new Date(), d=new Date(it.date); return d-now < 1000*60*60*24*7 && d>=new Date(now.getTime()-1000*60*60*24)}
function todayDone(it){return it.doneAt && it.doneAt.slice(0,10)===todayKey()}

function setOptions(el, arr, includeAll=true){el.innerHTML=(includeAll?["All",...arr]:arr).map(x=>`<option>${x}</option>`).join("")}
setOptions($("#workFilter"),workCats); setOptions($("#personalFilter"),personalCats);
function updateCats(){setOptions($("#category"),$("#area").value==="Work"?workCats:personalCats,false)}
$("#area").addEventListener("change",updateCats); updateCats();

document.querySelectorAll(".tabs button").forEach(btn=>btn.onclick=()=>show(btn.dataset.view));
function show(view){document.querySelectorAll(".tabs button").forEach(b=>b.classList.toggle("active",b.dataset.view===view));document.querySelectorAll(".view").forEach(v=>v.classList.toggle("active",v.id===view));render()}

$("#itemForm").onsubmit=e=>{
 e.preventDefault();
 const status=$("#status").value;
 items.unshift({id:crypto.randomUUID(),area:$("#area").value,category:$("#category").value,title:$("#title").value.trim(),date:$("#date").value,priority:$("#priority").value,status,notes:$("#notes").value.trim(),done:status==="Complete",doneAt:status==="Complete"?new Date().toISOString():null,createdAt:new Date().toISOString()});
 save(); e.target.reset(); updateCats(); show("home");
};

function trackerDone(name){return trackers[todayKey()+"-"+name]===true}
function toggleTracker(name){trackers[todayKey()+"-"+name]=!trackerDone(name);save();render()}
function renderTrackers(){
 const salah=["Fajr","Dhuhr","Asr","Maghrib","Isha"];
 $("#salahBox").innerHTML=salah.map(n=>`<div class="tracker ${trackerDone(n)?"done":""}"><strong>${n}</strong><button onclick="toggleTracker('${n}')">${trackerDone(n)?"Done":"Tick"}</button></div>`).join("");
 const habits=["Water","Exercise","Reading","Cooking","Routine"];
 $("#habitBox").innerHTML=habits.map(n=>`<div class="tracker ${trackerDone(n)?"done":""}"><strong>${n}</strong><button onclick="toggleTracker('${n}')">${trackerDone(n)?"Done":"Tick"}</button></div>`).join("");
 $("#salahScore").textContent=salah.filter(trackerDone).length+"/5";
}

function itemCard(it){
 const li=document.createElement("li");
 li.className=`item ${it.done?"done":""}`;
 const statusClass=it.status==="Waiting"?"waiting":it.status==="In progress"?"progress":"";
 li.innerHTML=`<div class="row"><div><div class="title">${esc(it.title)}</div><div class="meta">${esc(it.area)} • ${esc(it.category)} • ${fmt(it.date)}</div></div><span class="badge ${it.priority==="High"?"high":statusClass}">${esc(it.priority==="High"?"High":it.status)}</span></div>${it.notes?`<div>${esc(it.notes)}</div>`:""}<div class="actions"><button class="donebtn">${it.done?"Mark active":"Done"}</button><button class="delete">Delete</button></div>`;
 li.querySelector(".donebtn").onclick=()=>{items=items.map(x=>x.id===it.id?{...x,done:!x.done,status:!x.done?"Complete":"Not started",doneAt:!x.done?new Date().toISOString():null}:x);save();render()};
 li.querySelector(".delete").onclick=()=>{items=items.filter(x=>x.id!==it.id);save();render()};
 return li;
}
function fillList(el,arr){el.innerHTML=""; if(!arr.length){el.innerHTML=`<li class="item">Nothing here yet.</li>`;return} arr.sort((a,b)=>(b.priority==="High")-(a.priority==="High")||(a.date?new Date(a.date):Infinity)-(b.date?new Date(b.date):Infinity)).forEach(i=>el.appendChild(itemCard(i)))}

function overview(){
 $("#workOverview").innerHTML=workCats.map(c=>`<span class="chip">${c}: ${items.filter(i=>i.area==="Work"&&i.category===c&&!i.done).length}</span>`).join("");
}

function render(){
 renderTrackers();
 $("#activeCount").textContent=items.filter(i=>!i.done).length;
 $("#dueSoonCount").textContent=items.filter(dueSoon).length;
 $("#doneTodayCount").textContent=items.filter(todayDone).length;
 fillList($("#focusList"),items.filter(i=>!i.done&&(i.priority==="High"||dueSoon(i))).slice(0,10));
 overview();
 const wf=$("#workFilter").value; fillList($("#workList"),items.filter(i=>i.area==="Work"&&(wf==="All"||i.category===wf)));
 const pf=$("#personalFilter").value; fillList($("#personalList"),items.filter(i=>i.area==="Personal"&&(pf==="All"||i.category===pf)));
 fillList($("#calendarList"),items.filter(i=>i.date).sort((a,b)=>new Date(a.date)-new Date(b.date)));
}

$("#enableNotifications").onclick=async()=>{
 if(!("Notification" in window)){alert("Notifications are not supported in this browser.");return}
 const permission=await Notification.requestPermission();
 if(permission==="granted"){new Notification("Life Organiser reminders enabled",{body:"Keep this app installed for reminders and offline use."})}
};

let deferredPrompt;
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredPrompt=e;$("#installBtn").classList.remove("hidden")});
$("#installBtn").onclick=async()=>{if(!deferredPrompt)return;deferredPrompt.prompt();await deferredPrompt.userChoice;deferredPrompt=null;$("#installBtn").classList.add("hidden")};
if("serviceWorker" in navigator) navigator.serviceWorker.register("service-worker.js");
render();
