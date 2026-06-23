const KEY="life-organiser-v2";
const workCats=["Outstanding Task","Deadline","Audit","Meeting","Admin"];
const personalCats=["Routine","Habit","Exercise","Salah","Hydration","Cooking","Reading","Important Date"];
let items=JSON.parse(localStorage.getItem(KEY)||"null")||seed();
const $=s=>document.querySelector(s);
const tabs=document.querySelectorAll(".tabs button");
const views=document.querySelectorAll(".view");
const form=$("#itemForm"), area=$("#area"), category=$("#category");
const installBtn=$("#installBtn"); let deferredPrompt;

function seed(){return[
{id:crypto.randomUUID(),area:"Work",category:"Outstanding Task",title:"Review work priorities",date:"",priority:"Normal",notes:"Add the most important tasks first.",done:false,createdAt:new Date().toISOString()},
{id:crypto.randomUUID(),area:"Personal",category:"Salah",title:"Track salah",date:"",priority:"High",notes:"Tick off when complete.",done:false,createdAt:new Date().toISOString()},
{id:crypto.randomUUID(),area:"Personal",category:"Hydration",title:"Drink water",date:"",priority:"Normal",notes:"Aim for regular water through the day.",done:false,createdAt:new Date().toISOString()}
]}

function save(){localStorage.setItem(KEY,JSON.stringify(items))}
function esc(t){return String(t).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
function fmt(d){if(!d)return"No date";return new Intl.DateTimeFormat(undefined,{dateStyle:"medium",timeStyle:"short"}).format(new Date(d))}
function dueSoon(it){if(!it.date||it.done)return false; const now=new Date(), d=new Date(it.date); return d-now < 1000*60*60*24*7 && d>=new Date(now.getTime()-1000*60*60*24)}
function updateCats(){category.innerHTML=(area.value==="Work"?workCats:personalCats).map(c=>`<option>${c}</option>`).join("")}
area.addEventListener("change",updateCats); updateCats();

tabs.forEach(btn=>btn.addEventListener("click",()=>{tabs.forEach(b=>b.classList.remove("active"));views.forEach(v=>v.classList.remove("active"));btn.classList.add("active");$("#"+btn.dataset.view).classList.add("active");render()}));

form.addEventListener("submit",e=>{e.preventDefault();items.unshift({id:crypto.randomUUID(),area:area.value,category:category.value,title:$("#title").value.trim(),date:$("#date").value,priority:$("#priority").value,notes:$("#notes").value.trim(),done:false,createdAt:new Date().toISOString()});save();form.reset();updateCats();show("dashboard");render()});
function show(name){tabs.forEach(b=>b.classList.toggle("active",b.dataset.view===name));views.forEach(v=>v.classList.toggle("active",v.id===name))}

$("#workFilter").addEventListener("change",render); $("#personalFilter").addEventListener("change",render);

function card(it){const li=document.createElement("li");li.className=`item ${it.done?"done":""}`;li.innerHTML=`<div class="row"><div><div class="title">${esc(it.title)}</div><div class="meta">${esc(it.area)} • ${esc(it.category)} • ${fmt(it.date)}</div></div><span class="badge ${it.priority==="High"?"high":""}">${esc(it.priority)}</span></div>${it.notes?`<div>${esc(it.notes)}</div>`:""}<div class="actions"><button class="donebtn">${it.done?"Mark active":"Done"}</button><button class="delete">Delete</button></div>`;li.querySelector(".donebtn").onclick=()=>{items=items.map(x=>x.id===it.id?{...x,done:!x.done}:x);save();render()};li.querySelector(".delete").onclick=()=>{items=items.filter(x=>x.id!==it.id);save();render()};return li}
function fillList(el,arr){el.innerHTML=""; if(!arr.length){el.innerHTML=`<li class="item">Nothing here yet.</li>`; return} arr.sort((a,b)=>(b.priority==="High")-(a.priority==="High") || (a.date?new Date(a.date):Infinity)-(b.date?new Date(b.date):Infinity)).forEach(it=>el.appendChild(card(it)))}
function overview(areaName, el, cats){el.innerHTML=cats.map(c=>`<span class="chip">${c}: ${items.filter(i=>i.area===areaName&&i.category===c&&!i.done).length}</span>`).join("")}

function render(){
$("#activeCount").textContent=items.filter(i=>!i.done).length;
$("#doneCount").textContent=items.filter(i=>i.done).length;
$("#dueCount").textContent=items.filter(dueSoon).length;
$("#habitCount").textContent=items.filter(i=>i.area==="Personal"&&!i.done&&["Habit","Exercise","Salah","Hydration","Cooking","Reading"].includes(i.category)).length;
fillList($("#todayList"),items.filter(i=>!i.done&&(dueSoon(i)||i.priority==="High")).slice(0,8));
overview("Work",$("#workOverview"),workCats); overview("Personal",$("#personalOverview"),personalCats);
let wf=$("#workFilter").value; fillList($("#workList"),items.filter(i=>i.area==="Work"&&(wf==="All"||i.category===wf)));
let pf=$("#personalFilter").value; fillList($("#personalList"),items.filter(i=>i.area==="Personal"&&(pf==="All"||i.category===pf)));
}
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredPrompt=e;installBtn.classList.remove("hidden")});
installBtn.onclick=async()=>{if(!deferredPrompt)return;deferredPrompt.prompt();await deferredPrompt.userChoice;deferredPrompt=null;installBtn.classList.add("hidden")};
if("serviceWorker" in navigator) navigator.serviceWorker.register("service-worker.js");
render();
