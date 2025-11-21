// admin.js
import {
  crearCliente, listarClientes, crearPrestamo,
  listarPrestamosActivos, obtenerPrestamo, listarPagosPorPrestamo,
  registrarPago, actualizarPrestamo, onAuthChange, logout, loginCobrador
} from "./firebase.js";

const DEFAULT_INTERES = 15;

// DOM
const selectCliente = document.getElementById("select-cliente");
const btnCrearCliente = document.getElementById("btn-crear-cliente");
const inputNombre = document.getElementById("cliente-nombre");
const inputTelefono = document.getElementById("cliente-telefono");
const inputDireccion = document.getElementById("cliente-direccion");

const prestamoMonto = document.getElementById("prestamo-monto");
const prestamoInteres = document.getElementById("prestamo-interes");
const prestamoCuota = document.getElementById("prestamo-cuota");
const btnCrearPrestamo = document.getElementById("btn-crear-prestamo");

const tablaPrestamosBody = document.querySelector("#tabla-prestamos tbody");
const historialPagos = document.getElementById("historial-pagos");

const totalPrestadoEl = document.getElementById("total-prestado");
const totalRecuperadoEl = document.getElementById("total-recuperado");
const totalPendienteEl = document.getElementById("total-pendiente");

const btnLogout = document.getElementById("btn-logout");

// Inicial
let clientesCache = [];
async function init(){
  await cargarClientes();
  await cargarPrestamos();
}
init();

btnCrearCliente.addEventListener("click", async () => {
  const nombre = inputNombre.value.trim();
  if(!nombre) return alert("Nombre requerido");
  await crearCliente({ nombre, telefono: inputTelefono.value, direccion: inputDireccion.value });
  inputNombre.value = ""; inputTelefono.value = ""; inputDireccion.value = "";
  await cargarClientes();
  alert("Cliente creado");
});

async function cargarClientes(){
  clientesCache = await listarClientes();
  selectCliente.innerHTML = "";
  clientesCache.forEach(c => {
    const opt = document.createElement("option");
    opt.value = c.id;
    opt.textContent = c.nombre;
    selectCliente.appendChild(opt);
  });
}

btnCrearPrestamo.addEventListener("click", async () => {
  const clienteId = selectCliente.value;
  const monto = prestamoMonto.value.trim();
  if (!clienteId) return alert("Selecciona un cliente");
  if (!monto || isNaN(Number(monto))) return alert("Monto inválido");
  const interes = prestamoInteres.value.trim() ? Number(prestamoInteres.value) : DEFAULT_INTERES;
  const cuota = prestamoCuota.value.trim() ? Number(prestamoCuota.value) : null;
  await crearPrestamo({ clienteId, monto: Number(monto), interes, cuota, frecuencia: "manual" });
  prestamoMonto.value = ""; prestamoInteres.value = ""; prestamoCuota.value = "";
  await cargarPrestamos();
  alert("Préstamo creado");
});

async function cargarPrestamos(){
  const prestamos = await listarPrestamosActivos();
  tablaPrestamosBody.innerHTML = "";
  let totalPrestado = 0, totalPendiente = 0, totalRecuperado = 0;
  for (const p of prestamos) {
    // obtener cliente
    const cliente = clientesCache.find(c => c.id === p.cliente_id) || { nombre: "Cliente desconocido" };
    totalPrestado += Number(p.monto || 0);
    totalPendiente += Number(p.saldo_pendiente || 0);
    totalRecuperado += (Number(p.total_a_pagar || 0) - Number(p.saldo_pendiente || 0));

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${cliente.nombre}</td>
      <td>₡ ${Number(p.monto).toLocaleString()}</td>
      <td>₡ ${Number(p.total_a_pagar).toLocaleString()}</td>
      <td>₡ ${Number(p.saldo_pendiente).toLocaleString()}</td>
      <td>${p.interes}%</td>
      <td>
        <div class="actions">
          <button class="btn ver" data-id="${p.id}">Ver</button>
          <button class="btn ghost pagar" data-id="${p.id}">Registrar pago</button>
          <button class="btn ghost cerrar" data-id="${p.id}">Cerrar</button>
        </div>
      </td>
    `;
    tablaPrestamosBody.appendChild(tr);
  }
  totalPrestadoEl.textContent = `₡ ${totalPrestado.toLocaleString()}`;
  totalPendienteEl.textContent = `₡ ${totalPendiente.toLocaleString()}`;
  totalRecuperadoEl.textContent = `₡ ${totalRecuperado.toLocaleString()}`;

  // listeners botones
  document.querySelectorAll(".ver").forEach(b => b.addEventListener("click", async (e) => {
    const id = e.target.dataset.id;
    const p = await obtenerPrestamo(id);
    mostrarHistorial(p);
  }));

  document.querySelectorAll(".pagar").forEach(b => b.addEventListener("click", async (e) => {
    const id = e.target.dataset.id;
    const monto = prompt("Monto pagado (ej: 3000):");
    if (!monto || isNaN(Number(monto))) return alert("Monto inválido");
    const cobrador = prompt("Nombre del cobrador (opcional):") || "Cobrador";
    await registrarPago({ prestamoId: id, monto: Number(monto), cobrador });
    await cargarPrestamos();
    alert("Pago registrado");
  }));

  document.querySelectorAll(".cerrar").forEach(b => b.addEventListener("click", async (e) => {
    const id = e.target.dataset.id;
    if (!confirm("¿Seguro quieres forzar cierre del préstamo? se pondrá saldo 0")) return;
    await actualizarPrestamo(id, { saldo_pendiente: 0, estado: "cerrado" });
    await cargarPrestamos();
  }));
}

async function mostrarHistorial(prestamo) {
  const pagos = await listarPagosPorPrestamo(prestamo.id);
  historialPagos.innerHTML = `
    <div class="card"><strong>Préstamo de:</strong> ${prestamo.cliente_id} | Monto: ₡ ${Number(prestamo.monto).toLocaleString()} | Saldo: ₡ ${Number(prestamo.saldo_pendiente).toLocaleString()}</div>
    <table class="table"><thead><tr><th>Fecha</th><th>Monto</th><th>Cobrador</th></tr></thead>
    <tbody>
      ${pagos.map(p=>`<tr><td>${p.fecha}</td><td>₡ ${Number(p.monto).toLocaleString()}</td><td>${p.cobrador||'-'}</td></tr>`).join("")}
    </tbody></table>
  `;
}

// LOGOUT (si hay sesión)
btnLogout.addEventListener("click", async () => {
  try { await logout(); alert("Sesión cerrada"); } catch(e){ console.error(e); alert("Error al cerrar sesión"); }
});

// opcional: puedes vigilar estado auth (por ejemplo, forzar login)
onAuthChange(user => {
  if (!user) {
    // si no hay sesión se puede permitir admin local o redirigir
    // console.log("No hay usuario autenticado");
  } else {
    // console.log("Cobrador autenticado:", user.email);
  }
});
