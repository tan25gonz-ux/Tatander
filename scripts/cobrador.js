// cobrador.js
import {
  listarClientes, listarPrestamosActivos, registrarPago, crearCuentaCobrador,
  loginCobrador, onAuthChange, logout, obtenerPrestamo
} from "./firebase.js";

const loginEmail = document.getElementById("login-email");
const loginPassword = document.getElementById("login-password");
const btnLogin = document.getElementById("btn-login");
const btnCrearCuenta = document.getElementById("btn-crear-cuenta");

const appEl = document.getElementById("app");
const listaClientesEl = document.getElementById("lista-clientes");
const btnLogout = document.getElementById("btn-logout");

// login
btnLogin.addEventListener("click", async () => {
  const email = loginEmail.value.trim();
  const pass = loginPassword.value.trim();
  if (!email || !pass) return alert("Email y contraseña requeridos");
  try {
    await loginCobrador(email, pass);
    // al entrar, onAuthChange manejará el UI
  } catch (e) {
    console.error(e);
    alert("Error de login: " + e.message);
  }
});

// crear cuenta cobrador (opcional) - recomendar que admin lo haga manualmente en Firebase Console
btnCrearCuenta.addEventListener("click", async () => {
  const email = prompt("Email de la cuenta cobrador:");
  const pass = prompt("Contraseña:");
  if (!email || !pass) return alert("Datos incompletos");
  try {
    await crearCuentaCobrador(email, pass);
    alert("Cuenta creada. Inicia sesión con esas credenciales.");
  } catch (e) {
    console.error(e); alert("Error al crear cuenta: " + e.message);
  }
});

// escucha auth
onAuthChange(async (user) => {
  if (user) {
    // mostrar app
    document.querySelector(".card").style.display = "none"; // hide login card
    appEl.style.display = "block";
    await cargarListaClientes();
  } else {
    document.querySelector(".card").style.display = "block";
    appEl.style.display = "none";
  }
});

btnLogout.addEventListener("click", async () => {
  await logout();
});

// cargar clientes + prestamos activos vinculados
async function cargarListaClientes() {
  // traer prestamos activos y agrupar por cliente
  const prestamos = await listarPrestamosActivos();
  // agrupamos por cliente id
  const agrupado = {};
  prestamos.forEach(p => {
    if (!agrupado[p.cliente_id]) agrupado[p.cliente_id] = [];
    agrupado[p.cliente_id].push(p);
  });

  // construimos lista. Nota: no tenemos nombres de clientes aquí (por simplicidad),
  // recomendamos que el admin agregue nombre al préstamo o ampliarlo para hacer join.
  // Para UX: mostraremos cada préstamo como item a cobrar.
  listaClientesEl.innerHTML = `<div class="small">Toca un préstamo para registrar pago</div>`;
  prestamos.forEach(p => {
    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `
      <div class="flex" style="justify-content:space-between">
        <div>
          <div><strong>Cliente ID:</strong> ${p.cliente_id}</div>
          <div class="small">Monto: ₡ ${Number(p.monto).toLocaleString()} | Saldo: ₡ ${Number(p.saldo_pendiente).toLocaleString()}</div>
        </div>
        <div class="actions">
          <button class="btn registrar" data-id="${p.id}">Registrar pago</button>
        </div>
      </div>
    `;
    listaClientesEl.appendChild(div);
  });

  document.querySelectorAll(".registrar").forEach(b => b.addEventListener("click", async (e) => {
    const id = e.target.dataset.id;
    const monto = prompt("Monto pagado (ej: 3000):");
    if (!monto || isNaN(Number(monto))) return alert("Monto inválido");
    // cobrador: usaremos el email del usuario autenticado como nombre
    // pero aquí simplificamos pidiendo nombre (opcional)
    const cobrador = prompt("Tu nombre (opcional):") || "Cobrador";
    try {
      await registrarPago({ prestamoId: id, monto: Number(monto), cobrador });
      alert("Pago registrado correctamente");
      await cargarListaClientes();
    } catch (err) {
      console.error(err);
      alert("Error al registrar pago: " + err.message);
    }
  }));
}
