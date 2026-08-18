import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const SUPABASE_URL = "https://kqeolflqbesqvkwuidcx.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_gQY6sALUMDv4GbNx5xUnHA_FZgNJ-2n";
const SITE_URL = "https://eudsonalmeida-afk.github.io/Budget/";
const THEME_KEY = "budget_feliz_theme";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storage: window.localStorage }
});

const banks = [["PicPay","picpay"],["Inter","inter"],["Bradesco","bradesco"],["Banco do Brasil","bb"],["Itaú","itau"],["Dinheiro / Débito","cash"]];
const emoji = {"Alimentação":"🍔","Transporte":"🚗","Casa":"🏠","Lazer":"🎮","Saúde":"💊","Compras":"🛒","Assinatura":"📱","Reforma do quarto":"🛠️","Outros":"✨"};
const $ = id => document.getElementById(id);

const e = {
  authScreen:$("authScreen"),appRoot:$("appRoot"),authForm:$("authForm"),authTitle:$("authTitle"),authDescription:$("authDescription"),authEmail:$("authEmail"),authPassword:$("authPassword"),authSubmit:$("authSubmit"),authModeToggle:$("authModeToggle"),authMessage:$("authMessage"),
  logout:$("logout"),syncStatus:$("syncStatus"),accountMenu:$("accountMenu"),accountMenuButton:$("accountMenuButton"),accountMenuPanel:$("accountMenuPanel"),accountEmail:$("accountEmail"),
  prev:$("prev"),next:$("next"),monthBtn:$("monthBtn"),monthPicker:$("monthPicker"),monthLabel:$("monthLabel"),salaryOut:$("salaryOut"),spentOut:$("spentOut"),balanceOut:$("balanceOut"),balanceMsg:$("balanceMsg"),salaryEdit:$("salaryEdit"),
  appTabs:$("appTabs"),purchaseMode:$("purchaseMode"),installmentDetails:$("installmentDetails"),purchaseName:$("purchaseName"),purchaseDate:$("purchaseDate"),installmentCount:$("installmentCount"),installmentStart:$("installmentStart"),amountQuestion:$("amountQuestion"),amountHelp:$("amountHelp"),categories:$("categories"),banks:$("banks"),amount:$("amount"),add:$("add"),noteToggle:$("noteToggle"),note:$("note"),preview:$("preview"),today:$("today"),
  bankTotals:$("bankTotals"),installmentList:$("installmentList"),installmentSummaryMonth:$("installmentSummaryMonth"),installmentMonthTotal:$("installmentMonthTotal"),newInstallment:$("newInstallment"),
  filters:$("filters"),count:$("count"),filteredTotal:$("filteredTotal"),list:$("list"),installmentDropdown:$("installmentDropdown"),installmentDropdownMeta:$("installmentDropdownMeta"),installmentEntries:$("installmentEntries"),export:$("export"),
  salaryDialog:$("salaryDialog"),salaryForm:$("salaryForm"),salaryInput:$("salaryInput"),salaryMonth:$("salaryMonth"),salaryClose:$("salaryClose"),salaryCancel:$("salaryCancel"),
  editInstallmentDialog:$("editInstallmentDialog"),editInstallmentForm:$("editInstallmentForm"),editInstallmentClose:$("editInstallmentClose"),editInstallmentCancel:$("editInstallmentCancel"),editInstallmentMonthText:$("editInstallmentMonthText"),editInstallmentName:$("editInstallmentName"),editPurchaseDate:$("editPurchaseDate"),editInstallmentAmount:$("editInstallmentAmount"),editInstallmentCount:$("editInstallmentCount"),editFirstInstallmentDate:$("editFirstInstallmentDate"),editInstallmentCategory:$("editInstallmentCategory"),editInstallmentBank:$("editInstallmentBank"),editInstallmentNote:$("editInstallmentNote"),anticipationBox:$("anticipationBox"),editAnticipated:$("editAnticipated"),anticipationTitle:$("anticipationTitle"),anticipationHelp:$("anticipationHelp"),
  deleteDialog:$("deleteDialog"),deleteTitle:$("deleteTitle"),deleteMessage:$("deleteMessage"),deleteCancel:$("deleteCancel"),deleteConfirm:$("deleteConfirm"),theme:$("theme"),toast:$("toast")
};

let authMode="signin",currentUser=null,month=monthKey(new Date());
let monthData={salary:0,expenses:[],installments:[],overrides:[]};
let category="",bank="",filter="Todos",purchaseType="single",activeTab="launch",pendingDelete=null,editingInstallmentId=null,toastTimer;

function monthKey(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`}
function monthDate(k){const[y,m]=k.split("-").map(Number);return new Date(y,m-1,1,12)}
function monthName(k){return new Intl.DateTimeFormat("pt-BR",{month:"long",year:"numeric"}).format(monthDate(k))}
function monthDiff(start,target){const a=monthDate(start),b=monthDate(target);return(b.getFullYear()-a.getFullYear())*12+(b.getMonth()-a.getMonth())}
function money(v){return new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(Number(v)||0)}
function parseMoney(v){return Number(String(v||"").replace(/\./g,"").replace(",",".").replace(/[^\d.-]/g,""))||0}
function maskMoney(v){const d=v.replace(/\D/g,"");return d?(Number(d)/100).toLocaleString("pt-BR",{minimumFractionDigits:2,maximumFractionDigits:2}):""}
function todayIso(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`}
function defaultDateForMonth(){return month===monthKey(new Date())?todayIso():`${month}-01`}
function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
function bankClass(n){return banks.find(x=>x[0]===n)?.[1]||"cash"}
function isoMonth(dateIso){return String(dateIso||"").slice(0,7)}
function formatDateBR(dateIso){if(!dateIso)return"—";const[y,m,d]=dateIso.split("-");return `${d}/${m}/${y}`}
function addMonthsClamped(dateIso,offset){
  const[y,m,d]=dateIso.split("-").map(Number);const baseIndex=(m-1)+offset;const year=y+Math.floor(baseIndex/12);const monthIndex=((baseIndex%12)+12)%12;const lastDay=new Date(year,monthIndex+1,0).getDate();const day=Math.min(d,lastDay);return `${year}-${String(monthIndex+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
}
function overrideFor(purchaseId,target=month){return monthData.overrides.find(o=>o.installmentId===purchaseId&&o.month===target)}
function getFirstInstallmentDate(p){return p.firstInstallmentDate||`${p.startMonth}-01`}
function installmentForMonth(p,target=month){
  const firstDate=getFirstInstallmentDate(p);const index=monthDiff(isoMonth(firstDate),target);
  if(index<0||index>=p.totalInstallments)return null;
  const date=addMonthsClamped(firstDate,index);const anticipated=Boolean(overrideFor(p.id,target)?.anticipated);
  return {...p,currentInstallment:index+1,date,isInstallment:true,anticipated};
}
function dueInstallments(target=month){return monthData.installments.map(p=>installmentForMonth(p,target)).filter(Boolean)}
function billableInstallments(target=month){return dueInstallments(target).filter(x=>!x.anticipated)}
function allMonthEntries(){return [...monthData.expenses,...billableInstallments()]}
function total(list=allMonthEntries()){return list.reduce((s,x)=>s+Number(x.amount),0)}
function setSync(t,state=""){e.syncStatus.textContent=t;e.syncStatus.className=`sync-status ${state}`.trim()}
function toast(t){e.toast.textContent=t;e.toast.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>e.toast.classList.remove("show"),2300)}
function showAuth(msg="",state=""){e.authScreen.classList.remove("hidden");e.appRoot.classList.add("hidden");e.accountMenu.classList.add("hidden");e.authSubmit.disabled=false;e.authSubmit.textContent=authMode==="signin"?"Entrar":"Criar conta";e.authMessage.textContent=msg;e.authMessage.className=`auth-message ${state}`.trim()}
function showApp(){e.authScreen.classList.add("hidden");e.appRoot.classList.remove("hidden");e.accountMenu.classList.remove("hidden");e.accountEmail.textContent=currentUser?.email||"Conta conectada";window.scrollTo(0,0)}
function friendly(m){if(m.includes("Invalid login credentials"))return"E-mail ou senha incorretos.";if(m.includes("Email not confirmed"))return"Confirme seu e-mail antes de entrar.";if(m.includes("User already registered"))return"Este e-mail já possui uma conta.";return m||"Não foi possível concluir."}

async function handleAuth(ev){ev.preventDefault();e.authSubmit.disabled=true;e.authMessage.textContent=authMode==="signin"?"Entrando…":"Criando conta…";try{if(authMode==="signin"){const{data,error}=await supabase.auth.signInWithPassword({email:e.authEmail.value.trim(),password:e.authPassword.value});if(error)throw error;currentUser=data.session.user;showApp();await loadMonth()}else{const{data,error}=await supabase.auth.signUp({email:e.authEmail.value.trim(),password:e.authPassword.value,options:{emailRedirectTo:SITE_URL}});if(error)throw error;e.authMessage.textContent=data.session?"Conta criada.":"Conta criada. Confirme seu e-mail."}}catch(err){e.authMessage.textContent=friendly(err.message);e.authMessage.className="auth-message error"}finally{e.authSubmit.disabled=false}}
function toggleAuth(){authMode=authMode==="signin"?"signup":"signin";const s=authMode==="signup";e.authTitle.textContent=s?"Criar acesso ao Contaê":"Acessar o Contaê";e.authSubmit.textContent=s?"Criar conta":"Entrar";e.authModeToggle.textContent=s?"Já tenho uma conta":"Ainda não tenho conta";e.authMessage.textContent=""}

async function loadMonth(){
  if(!currentUser)return;setSync("Sincronizando…");
  const [b,x,p,o]=await Promise.all([
    supabase.from("monthly_budgets").select("salary").eq("user_id",currentUser.id).eq("month",month).maybeSingle(),
    supabase.from("expenses").select("id,expense_date,category,bank,amount,note,created_at").eq("user_id",currentUser.id).eq("month",month).order("created_at",{ascending:false}),
    supabase.from("installment_purchases").select("id,name,category,bank,installment_amount,total_installments,start_month,purchase_date,first_installment_date,note,created_at").eq("user_id",currentUser.id).order("created_at",{ascending:false}),
    supabase.from("installment_month_overrides").select("id,installment_id,month,anticipated,created_at").eq("user_id",currentUser.id).eq("month",month)
  ]);
  if(b.error||x.error||p.error||o.error){console.error(b.error||x.error||p.error||o.error);setSync("Erro ao sincronizar","error");toast("Execute o SQL de atualização dos parcelamentos no Supabase.");return}
  monthData={
    salary:Number(b.data?.salary||0),
    expenses:(x.data||[]).map(r=>({id:r.id,date:r.expense_date,category:r.category,bank:r.bank,amount:Number(r.amount),note:r.note||"",createdAt:r.created_at})),
    installments:(p.data||[]).map(r=>({id:r.id,name:r.name,category:r.category,bank:r.bank,amount:Number(r.installment_amount),totalInstallments:r.total_installments,startMonth:r.start_month,purchaseDate:r.purchase_date||r.created_at?.slice(0,10)||`${r.start_month}-01`,firstInstallmentDate:r.first_installment_date||`${r.start_month}-01`,note:r.note||"",createdAt:r.created_at})),
    overrides:(o.data||[]).map(r=>({id:r.id,installmentId:r.installment_id,month:r.month,anticipated:r.anticipated,createdAt:r.created_at}))
  };
  render();setSync("Sincronizado","ok");
}

async function saveSalary(ev){ev.preventDefault();const salary=+parseMoney(e.salaryInput.value).toFixed(2);const{error}=await supabase.from("monthly_budgets").upsert({user_id:currentUser.id,month,salary,updated_at:new Date().toISOString()},{onConflict:"user_id,month"});if(error)return toast("Não foi possível salvar o salário.");monthData.salary=salary;e.salaryDialog.close();render();toast("Salário atualizado.")}

async function addEntry(){
  const amount=parseMoney(e.amount.value);if(!category)return toast("Escolha uma categoria.");if(!bank)return toast("Escolha como pagou.");if(amount<=0)return toast("Digite um valor maior que zero.");e.add.disabled=true;setSync("Salvando…");
  if(purchaseType==="installment"){
    const name=e.purchaseName.value.trim(),count=Number(e.installmentCount.value),purchaseDate=e.purchaseDate.value,startDate=e.installmentStart.value;
    if(!name){e.add.disabled=false;return toast("Dê um nome à compra.")}if(!purchaseDate){e.add.disabled=false;return toast("Informe a data da compra.")}if(!Number.isInteger(count)||count<2){e.add.disabled=false;return toast("Informe pelo menos 2 parcelas.")}if(!startDate){e.add.disabled=false;return toast("Informe a data da primeira parcela.")}
    const startMonth=isoMonth(startDate);
    const{data,error}=await supabase.from("installment_purchases").insert({user_id:currentUser.id,name,category,bank,installment_amount:+amount.toFixed(2),total_installments:count,start_month:startMonth,purchase_date:purchaseDate,first_installment_date:startDate,note:e.note.value.trim()||null}).select("id,name,category,bank,installment_amount,total_installments,start_month,purchase_date,first_installment_date,note,created_at").single();
    e.add.disabled=false;if(error){console.error(error);return toast("Não foi possível salvar o parcelamento.")}
    monthData.installments.unshift({id:data.id,name:data.name,category:data.category,bank:data.bank,amount:Number(data.installment_amount),totalInstallments:data.total_installments,startMonth:data.start_month,purchaseDate:data.purchase_date,firstInstallmentDate:data.first_installment_date,note:data.note||"",createdAt:data.created_at});
    resetEntry();switchTab("installments");render();toast("Compra parcelada cadastrada.");
  }else{
    const date=month===monthKey(new Date())?todayIso():`${month}-01`;
    const{data,error}=await supabase.from("expenses").insert({user_id:currentUser.id,month,expense_date:date,category,bank,amount:+amount.toFixed(2),note:e.note.value.trim()||null}).select("id,expense_date,category,bank,amount,note,created_at").single();
    e.add.disabled=false;if(error)return toast("Não foi possível salvar este gasto.");
    monthData.expenses.unshift({id:data.id,date:data.expense_date,category:data.category,bank:data.bank,amount:Number(data.amount),note:data.note||"",createdAt:data.created_at});resetEntry();render();toast(`Gasto salvo: ${money(amount)}`);
  }
  setSync("Sincronizado","ok");
}

async function saveInstallmentEdit(ev){
  ev.preventDefault();const p=monthData.installments.find(x=>x.id===editingInstallmentId);if(!p)return;
  const name=e.editInstallmentName.value.trim(),amount=parseMoney(e.editInstallmentAmount.value),count=Number(e.editInstallmentCount.value),purchaseDate=e.editPurchaseDate.value,firstDate=e.editFirstInstallmentDate.value,categoryValue=e.editInstallmentCategory.value,bankValue=e.editInstallmentBank.value,note=e.editInstallmentNote.value.trim();
  if(!name||amount<=0||!Number.isInteger(count)||count<2||!purchaseDate||!firstDate)return toast("Confira os dados do parcelamento.");
  setSync("Salvando…");
  const{error}=await supabase.from("installment_purchases").update({name,category:categoryValue,bank:bankValue,installment_amount:+amount.toFixed(2),total_installments:count,start_month:isoMonth(firstDate),purchase_date:purchaseDate,first_installment_date:firstDate,note:note||null}).eq("id",p.id).eq("user_id",currentUser.id);
  if(error){console.error(error);setSync("Erro ao salvar","error");return toast("Não foi possível editar o parcelamento.")}
  const edited={...p,name,category:categoryValue,bank:bankValue,amount:+amount.toFixed(2),totalInstallments:count,startMonth:isoMonth(firstDate),purchaseDate,firstInstallmentDate:firstDate,note};
  const dueNow=installmentForMonth({...edited,id:p.id},month);
  if(dueNow&&e.editAnticipated.checked){
    const{error:overrideError}=await supabase.from("installment_month_overrides").upsert({user_id:currentUser.id,installment_id:p.id,month,anticipated:true,updated_at:new Date().toISOString()},{onConflict:"user_id,installment_id,month"});
    if(overrideError){console.error(overrideError);return toast("O parcelamento foi editado, mas não consegui salvar a antecipação.")}
  }else{
    const{error:overrideError}=await supabase.from("installment_month_overrides").delete().eq("user_id",currentUser.id).eq("installment_id",p.id).eq("month",month);
    if(overrideError){console.error(overrideError);return toast("O parcelamento foi editado, mas não consegui atualizar a antecipação.")}
  }
  editingInstallmentId=null;e.editInstallmentDialog.close();await loadMonth();toast("Parcelamento atualizado.");
}

async function confirmDelete(){if(!pendingDelete)return;const table=pendingDelete.type==="installment"?"installment_purchases":"expenses";const{error}=await supabase.from(table).delete().eq("id",pendingDelete.id).eq("user_id",currentUser.id);if(error)return toast("Não foi possível excluir.");if(pendingDelete.type==="installment")monthData.installments=monthData.installments.filter(x=>x.id!==pendingDelete.id);else monthData.expenses=monthData.expenses.filter(x=>x.id!==pendingDelete.id);pendingDelete=null;e.deleteDialog.close();render();toast("Registro excluído.")}

function render(){
  e.monthLabel.textContent=monthName(month);e.monthPicker.value=month;
  if(!e.purchaseDate.value)e.purchaseDate.value=defaultDateForMonth();if(!e.installmentStart.value)e.installmentStart.value=defaultDateForMonth();
  e.today.textContent=month===monthKey(new Date())?`Hoje • ${new Intl.DateTimeFormat("pt-BR",{day:"2-digit",month:"short"}).format(new Date())}`:"Mês selecionado";
  const spent=total(),balance=monthData.salary-spent;e.salaryOut.textContent=money(monthData.salary);e.spentOut.textContent=money(spent);e.balanceOut.textContent=money(balance);e.balanceMsg.textContent=monthData.salary<=0?"Cadastre o salário deste mês.":balance<0?"O orçamento passou do limite.":spent?`${Math.min(100,spent/monthData.salary*100).toFixed(0)}% do salário utilizado.`:"Nenhum gasto registrado.";
  renderBanks();renderInstallments();renderList();preview();
}

function renderBanks(){const entries=allMonthEntries();e.bankTotals.innerHTML=banks.map(([n,c])=>{const a=entries.filter(v=>v.bank===n);return`<article class="bank-card ${c}"><span>${esc(n)}</span><strong>${money(total(a))}</strong><small>${a.length} ${a.length===1?"lançamento":"lançamentos"}</small></article>`}).join("")}

function renderInstallments(){
  const due=dueInstallments(),billable=due.filter(x=>!x.anticipated);e.installmentSummaryMonth.textContent=monthName(month);e.installmentMonthTotal.textContent=money(total(billable));
  if(!monthData.installments.length){e.installmentList.innerHTML='<div class="empty">🧾<br><b>Nenhuma compra parcelada.</b><p>Cadastre uma no lançamento rápido.</p></div>';return}
  e.installmentList.innerHTML=monthData.installments.map(p=>{
    const firstDate=getFirstInstallmentDate(p),idx=monthDiff(isoMonth(firstDate),month),current=Math.max(0,Math.min(p.totalInstallments,idx+1)),finished=idx>=p.totalInstallments,notStarted=idx<0,percent=finished?100:notStarted?0:current/p.totalInstallments*100,due=installmentForMonth(p,month),anticipated=Boolean(due?.anticipated);
    const dueText=finished?"Finalizado":notStarted?`Começa em ${formatDateBR(firstDate)}`:anticipated?`Parcela ${current}/${p.totalInstallments} • antecipada`:`Parcela ${current}/${p.totalInstallments} em ${formatDateBR(due.date)}`;
    const remaining=Math.max(0,p.totalInstallments-current)*p.amount;
    return`<article class="installment-card"><div><h3>${emoji[p.category]||"✨"} ${esc(p.name)}</h3><p>${esc(p.bank)} • ${esc(p.category)}${p.note?` • ${esc(p.note)}`:""}</p><p class="installment-meta-date">Compra: ${formatDateBR(p.purchaseDate)} • 1ª parcela: ${formatDateBR(firstDate)}</p><div class="installment-progress"><span style="width:${percent}%"></span></div><span class="installment-due ${finished?'installment-finished':''}">${dueText}</span></div><div class="installment-numbers"><strong>${money(p.amount)}/mês</strong><small>Restante no ciclo: ${money(remaining)}</small></div><div class="installment-actions"><button class="edit-installment" data-edit-installment="${p.id}" title="Editar parcelamento">✎</button><button data-delete-installment="${p.id}" title="Excluir parcelamento">🗑️</button></div></article>`;
  }).join("");
}

function expenseMarkup(x,{installment=false}={}){
  const[y,m,d]=x.date.split("-"),dt=new Date(+y,+m-1,+d,12),sm=new Intl.DateTimeFormat("pt-BR",{month:"short"}).format(dt).replace(".",""),note=x.note?` • ${esc(x.note)}`:"";
  const title=installment?`${esc(x.name)} • ${x.currentInstallment}/${x.totalInstallments}`:esc(x.category);
  const value=installment&&x.anticipated?'<span class="value anticipated-value">Antecipada</span>':`<span class="value">-${money(x.amount)}</span>`;
  return`<article class="expense ${installment?'installment-entry':''} ${x.anticipated?'anticipated-entry':''}"><div class="date"><b>${d}</b><small>${sm}</small></div><div class="info"><b>${emoji[x.category]||"✨"} ${title}</b><small>${esc(x.bank)}${note}</small></div><span class="tag ${bankClass(x.bank)}">${esc(x.bank)}</span>${value}${installment?'':`<button class="trash" data-id="${x.id}">🗑️</button>`}</article>`;
}

function renderList(){
  let regular=[...monthData.expenses];if(filter!=="Todos")regular=regular.filter(x=>x.bank===filter);
  regular.sort((a,b)=>(b.createdAt||"").localeCompare(a.createdAt||""));
  e.count.textContent=`${regular.length} ${regular.length===1?"lançamento":"lançamentos"}`;e.filteredTotal.textContent=money(total(regular));
  e.list.innerHTML=regular.length?regular.map(x=>expenseMarkup(x)).join(""):'<div class="empty">🧾<br><b>Nenhum gasto à vista nesta seleção.</b></div>';

  let installments=dueInstallments();if(filter!=="Todos")installments=installments.filter(x=>x.bank===filter);
  installments.sort((a,b)=>(b.createdAt||"").localeCompare(a.createdAt||""));
  const installmentTotal=total(installments.filter(x=>!x.anticipated));
  e.installmentDropdownMeta.textContent=`${installments.length} • ${money(installmentTotal)}`;
  e.installmentEntries.innerHTML=installments.length?installments.map(x=>expenseMarkup(x,{installment:true})).join(""):'<div class="empty">Nenhum parcelamento neste mês.</div>';
}

function preview(){const amount=parseMoney(e.amount.value),p=[];if(purchaseType==="installment"&&e.purchaseName.value.trim())p.push(e.purchaseName.value.trim());if(category)p.push(`${emoji[category]||"✨"} ${category}`);if(bank)p.push(bank);if(amount)p.push(`${money(amount)}${purchaseType==="installment"?" por parcela":""}`);e.preview.textContent=p.length?p.join(" • "):"Selecione categoria, forma de pagamento e valor."}
function switchTab(tab){activeTab=tab;e.appTabs.querySelectorAll("button[data-tab]").forEach(button=>{const active=button.dataset.tab===tab;button.classList.toggle("active",active);button.setAttribute("aria-selected",String(active))});document.querySelectorAll(".tab-page").forEach(page=>{const active=page.id===`tab-${tab}`;page.classList.toggle("active",active);page.hidden=!active});const tabsTop=e.appTabs.getBoundingClientRect().top+window.scrollY-6;if(window.innerWidth>720)window.scrollTo({top:tabsTop,behavior:"smooth"})}
function setPurchaseType(type){purchaseType=type;e.purchaseMode.querySelectorAll("button").forEach(b=>b.classList.toggle("active",b.dataset.mode===type));const inst=type==="installment";e.installmentDetails.classList.toggle("hidden",!inst);e.amountQuestion.textContent=inst?"Qual o valor de cada parcela?":"Quanto foi?";e.amountHelp.textContent=inst?"Informe o valor mensal da parcela, não o valor total da compra.":"Informe o valor total deste gasto.";e.add.textContent=inst?"Cadastrar parcelamento ＋":"Adicionar gasto ＋";preview()}
function resetEntry(){category=bank="";e.amount.value=e.note.value=e.purchaseName.value=e.installmentCount.value="";e.purchaseDate.value=defaultDateForMonth();e.installmentStart.value=defaultDateForMonth();e.note.classList.add("hidden");document.querySelectorAll(".chips button").forEach(b=>b.classList.remove("selected"));setPurchaseType("single")}
function selectChoice(box,b,type){box.querySelectorAll("button").forEach(x=>x.classList.remove("selected"));b.classList.add("selected");type==="category"?category=b.dataset.category:bank=b.dataset.bank;preview()}
async function changeMonth(n){const d=monthDate(month);d.setMonth(d.getMonth()+n);month=monthKey(d);filter="Todos";syncFilters();e.purchaseDate.value=defaultDateForMonth();e.installmentStart.value=defaultDateForMonth();await loadMonth()}
function syncFilters(){e.filters.querySelectorAll("button").forEach(b=>b.classList.toggle("active",b.dataset.filter===filter))}
function openSalary(){e.salaryMonth.textContent=`Defina a renda disponível para ${monthName(month)}.`;e.salaryInput.value=monthData.salary?monthData.salary.toLocaleString("pt-BR",{minimumFractionDigits:2,maximumFractionDigits:2}):"";e.salaryDialog.showModal()}

function openInstallmentEdit(id){
  const p=monthData.installments.find(x=>x.id===id);if(!p)return;editingInstallmentId=id;e.editInstallmentName.value=p.name;e.editPurchaseDate.value=p.purchaseDate;e.editInstallmentAmount.value=p.amount.toLocaleString("pt-BR",{minimumFractionDigits:2,maximumFractionDigits:2});e.editInstallmentCount.value=p.totalInstallments;e.editFirstInstallmentDate.value=getFirstInstallmentDate(p);e.editInstallmentCategory.value=p.category;e.editInstallmentBank.value=p.bank;e.editInstallmentNote.value=p.note||"";
  const due=installmentForMonth(p,month);e.editInstallmentMonthText.textContent=`Alterações gerais afetam o parcelamento inteiro. A antecipação abaixo vale somente para ${monthName(month)}.`;
  e.editAnticipated.checked=Boolean(due?.anticipated);e.editAnticipated.disabled=!due;e.anticipationBox.classList.toggle("disabled",!due);e.anticipationTitle.textContent=due?`Antecipar a parcela ${due.currentInstallment}/${p.totalInstallments} de ${monthName(month)}`:`Sem parcela em ${monthName(month)}`;e.anticipationHelp.textContent=due?"Marcando esta opção, a parcela deixa de ser descontada somente neste mês. Os demais meses não mudam.":"Este parcelamento não possui cobrança no mês que está sendo exibido.";
  e.editInstallmentDialog.showModal();
}

function exportCsv(){const regular=[...monthData.expenses],installments=dueInstallments(),a=[...regular,...installments];if(!a.length)return toast("Não há gastos para exportar.");const rows=[["Data","Tipo","Descrição","Categoria","Banco","Valor","Parcela","Status","Observação"],...a.map(x=>[x.date.split("-").reverse().join("/"),x.isInstallment?"Parcela":"Gasto",x.isInstallment?x.name:"",x.category,x.bank,x.amount.toFixed(2).replace(".",","),x.isInstallment?`${x.currentInstallment}/${x.totalInstallments}`:"",x.anticipated?"Antecipada":"Normal",x.note||""])],csv="\uFEFF"+rows.map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(";")).join("\n"),url=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"})),aTag=document.createElement("a");aTag.href=url;aTag.download=`gastos-${month}.csv`;aTag.click();URL.revokeObjectURL(url)}

// Eventos
e.authForm.onsubmit=handleAuth;e.authModeToggle.onclick=toggleAuth;e.logout.onclick=()=>supabase.auth.signOut();
e.accountMenuButton.onclick=()=>{const h=e.accountMenuPanel.classList.toggle("hidden");e.accountMenuButton.setAttribute("aria-expanded",String(!h))};document.addEventListener("click",ev=>{if(!e.accountMenu.contains(ev.target))e.accountMenuPanel.classList.add("hidden")});
e.prev.onclick=()=>changeMonth(-1);e.next.onclick=()=>changeMonth(1);e.monthBtn.onclick=()=>e.monthPicker.showPicker?e.monthPicker.showPicker():e.monthPicker.click();e.monthPicker.onchange=async()=>{if(e.monthPicker.value){month=e.monthPicker.value;filter="Todos";syncFilters();e.purchaseDate.value=defaultDateForMonth();e.installmentStart.value=defaultDateForMonth();await loadMonth()}};
e.appTabs.querySelectorAll("button[data-tab]").forEach(button=>button.addEventListener("click",event=>{event.preventDefault();event.stopPropagation();switchTab(button.dataset.tab)}));
e.purchaseMode.onclick=ev=>{const b=ev.target.closest("[data-mode]");if(b)setPurchaseType(b.dataset.mode)};e.categories.onclick=ev=>{const b=ev.target.closest("[data-category]");if(b)selectChoice(e.categories,b,"category")};e.banks.onclick=ev=>{const b=ev.target.closest("[data-bank]");if(b)selectChoice(e.banks,b,"bank")};
e.amount.oninput=()=>{e.amount.value=maskMoney(e.amount.value);preview()};e.purchaseName.oninput=preview;e.add.onclick=addEntry;e.noteToggle.onclick=()=>{e.note.classList.toggle("hidden");e.noteToggle.textContent=e.note.classList.contains("hidden")?"+ Adicionar observação":"− Ocultar observação"};
e.salaryEdit.onclick=openSalary;e.salaryClose.onclick=e.salaryCancel.onclick=()=>e.salaryDialog.close();e.salaryInput.oninput=()=>e.salaryInput.value=maskMoney(e.salaryInput.value);e.salaryForm.onsubmit=saveSalary;
e.newInstallment.onclick=()=>{switchTab("launch");setPurchaseType("installment")};e.filters.onclick=ev=>{const b=ev.target.closest("[data-filter]");if(b){filter=b.dataset.filter;syncFilters();renderList()}};
e.list.onclick=ev=>{const b=ev.target.closest("[data-id]");if(b){pendingDelete={type:"expense",id:b.dataset.id};e.deleteTitle.textContent="Excluir este gasto?";e.deleteMessage.textContent="O valor voltará ao saldo do mês.";e.deleteDialog.showModal()}};
e.installmentList.onclick=ev=>{const edit=ev.target.closest("[data-edit-installment]");if(edit)return openInstallmentEdit(edit.dataset.editInstallment);const del=ev.target.closest("[data-delete-installment]");if(del){pendingDelete={type:"installment",id:del.dataset.deleteInstallment};e.deleteTitle.textContent="Excluir todo o parcelamento?";e.deleteMessage.textContent="Ele deixará de ser descontado em todos os meses.";e.deleteDialog.showModal()}};
e.editInstallmentAmount.oninput=()=>e.editInstallmentAmount.value=maskMoney(e.editInstallmentAmount.value);e.editInstallmentForm.onsubmit=saveInstallmentEdit;e.editInstallmentClose.onclick=e.editInstallmentCancel.onclick=()=>{editingInstallmentId=null;e.editInstallmentDialog.close()};
e.deleteCancel.onclick=()=>{pendingDelete=null;e.deleteDialog.close()};e.deleteConfirm.onclick=confirmDelete;e.export.onclick=exportCsv;
e.theme.onclick=()=>{document.body.classList.toggle("dark");const d=document.body.classList.contains("dark");localStorage.setItem(THEME_KEY,d?"dark":"light");e.theme.textContent=d?"🌙":"☀️"};if(localStorage.getItem(THEME_KEY)==="dark"){document.body.classList.add("dark");e.theme.textContent="🌙"}

resetEntry();switchTab(activeTab);
supabase.auth.onAuthStateChange(async(event,session)=>{currentUser=session?.user||null;if(currentUser){showApp();if(event!=="TOKEN_REFRESHED")await loadMonth()}else{monthData={salary:0,expenses:[],installments:[],overrides:[]};showAuth();setSync("Desconectado")}});
const{data:{session}}=await supabase.auth.getSession();currentUser=session?.user||null;if(currentUser){showApp();await loadMonth()}else showAuth();
