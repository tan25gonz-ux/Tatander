import { auth, db } from "../firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import { collection, getDocs, query, where, orderBy } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";
import { getWeekRangeMondayToMonday, formatMoney, formatDate, formatDateTime } from "./utils.js";

const ADMIN_EMAIL = "tan25gonz@gmail.com";

// UI
const btnLogout = document.getElementById('btnLogout');
const weekRangeEl = document.getElementById('weekRange');
const tablaResumenBody = document.querySelector('#tablaResumen tbody');
const tablaDetalleBody = document.querySelector('#tablaDetalle tbody');
const kpiBrutas = document.getElementById('kpiBrutas');
const kpiPremios = document.getElementById('kpiPremios');
const kpiNeto = document.getElementById('kpiNeto');
const prevWeekBtn = document.getElementById('prevWeek');
const nextWeekBtn = document.getElementById('nextWeek');
const btnExcel = document.getElementById('btnExcel');
const btnPDF = document.getElementById('btnPDF');

// Semana actual
let currentMonday = getWeekRangeMondayToMonday().start;

function setWeekLabel(){
  const start = new Date(currentMonday);
  start.setHours(0,0,0,0);
  const end = new Date(start.getTime()+7*86400000);
  end.setHours(0,0,0,0);
  weekRangeEl.textContent = `Semana: ${formatDate(start)} → ${formatDate(end)} (lunes a lunes)`;
}

prevWeekBtn.addEventListener('click', ()=>{
  currentMonday = new Date(currentMonday.getTime() - 7*86400000);
  refresh();
});
nextWeekBtn.addEventListener('click', ()=>{
  currentMonday = new Date(currentMonday.getTime() + 7*86400000);
  refresh();
});

btnLogout.addEventListener('click', async ()=>{
  await signOut(auth);
  window.location.href = 'index.html';
});

// Solo admin
onAuthStateChanged(auth, async (user)=>{
  if (!user){ window.location.href='index.html'; return; }
  if (user.email !== ADMIN_EMAIL){
    alert('Acceso solo para administrador');
    window.location.href = 'vendedor.html';
    return;
  }
  setWeekLabel();
  await refresh();
});

async function refresh(){
  const start = new Date(currentMonday); start.setHours(0,0,0,0);
  const end = new Date(currentMonday.getTime()+7*86400000); end.setHours(0,0,0,0);

  setWeekLabel();

  const sorteos = await getSorteosEnRango(start, end);

  renderDetalle(sorteos);

  const { resumen, totales } = calcularResumen(sorteos);
  renderResumen(resumen, totales);
}

async function getSorteosEnRango(start, end){
  const qy = query(
    collection(db,'sorteos'),
    where('fechaSorteo','>=', start),
    where('fechaSorteo','<', end),
    orderBy('fechaSorteo','asc')
  );
  const snap = await getDocs(qy);
  const list = [];
  snap.forEach(d=>{
    const s = d.data();
    const f = s.fechaSorteo?.toDate ? s.fechaSorteo.toDate() : new Date();
    list.push({ ...s, fechaDate: f });
  });
  return list;
}

function calcularResumen(sorteos){
  const resumen = {};
  let totalBrutas=0, totalPremios=0, totalNeto=0;

  for(const s of sorteos){
    const id = s.vendedorId;
    if(!resumen[id]){
      resumen[id] = {
        vendedorId: id,
        vendedorNombre: s.vendedorNombre || id,
        brutas: 0,
        premios: 0,
        comisionPct: 16, // fijo
        neto: 0
      };
    }
    resumen[id].brutas += Number(s.totalVendido || 0);
    resumen[id].premios += Number(s.premioMonto || 0);

    totalBrutas += Number(s.totalVendido || 0);
    totalPremios += Number(s.premioMonto || 0);
  }

  for(const id in resumen){
    const r = resumen[id];
    const comision = r.brutas * 0.16;
    r.neto = r.brutas - r.premios - comision;
    totalNeto += r.neto;
  }

  return { resumen, totales: { totalBrutas, totalPremios, totalNeto } };
}

function renderResumen(resumen, totales){
  tablaResumenBody.innerHTML = '';
  Object.values(resumen).forEach(r=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${r.vendedorNombre}</td>
      <td>${formatMoney(r.brutas)}</td>
      <td>${r.comisionPct}%</td>
      <td>${formatMoney(r.premios)}</td>
      <td>${formatMoney(r.neto)}</td>
    `;
    tablaResumenBody.appendChild(tr);
  });

  kpiBrutas.textContent = formatMoney(totales.totalBrutas);
  kpiPremios.textContent = formatMoney(totales.totalPremios);
  kpiNeto.textContent = formatMoney(totales.totalNeto);
}

function renderDetalle(sorteos){
  tablaDetalleBody.innerHTML = '';
  sorteos.forEach(s=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${formatDateTime(s.fechaDate)}</td>
      <td>${s.vendedorNombre || s.vendedorId}</td>
      <td>${s.nombreSorteo}</td>
      <td>${formatMoney(s.totalVendido)}</td>
      <td>${s.premioNumero || '-'}</td>
      <td>${s.premioMonto ? formatMoney(s.premioMonto) : '-'}</td>
    `;
    tablaDetalleBody.appendChild(tr);
  });
}
