import { auth, db } from "../firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import { collection, addDoc, serverTimestamp, query, where, orderBy, getDocs } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";
import { formatMoney, formatDateTime } from "./utils.js";

const tablaSorteos = document.querySelector("#tablaSorteos tbody");
const btnLogout = document.getElementById("btnLogout");
const userName = document.getElementById("userName");

// Botón logout
btnLogout.addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "index.html";
});

// Cuando un usuario se loguea
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }
  userName.textContent = user.email;
  await cargarHistorial(user.uid);
});

// Guardar sorteo
const form = document.getElementById("formSorteo");
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const user = auth.currentUser;
  if (!user) return;

  const nombreSorteo = document.getElementById("nombreSorteo").value.trim();
  const totalVendido = Number(document.getElementById("totalVendido").value || 0);
  const premioNumero = document.getElementById("premioNumero").value.trim();
  const premioMonto = Number(document.getElementById("premioMonto").value || 0);

  if (!nombreSorteo || totalVendido <= 0) {
    alert("Debes ingresar el nombre del sorteo y el total vendido.");
    return;
  }

  const sorteo = {
    vendedorId: user.uid,
    vendedorNombre: user.email,
    nombreSorteo,
    totalVendido,
    premioNumero: premioNumero || null,
    premioMonto: premioMonto || 0,
    fechaSorteo: serverTimestamp(), // fecha/hora automática
  };

  try {
    await addDoc(collection(db, "sorteos"), sorteo);
    form.reset();
    await cargarHistorial(user.uid);
    alert("✅ Sorteo guardado");
  } catch (err) {
    alert("❌ Error al guardar: " + (err.message || ""));
  }
});

// Cargar historial del vendedor
async function cargarHistorial(uid) {
  tablaSorteos.innerHTML = "";
  const q = query(
    collection(db, "sorteos"),
    where("vendedorId", "==", uid),
    orderBy("fechaSorteo", "desc")
  );
  const snap = await getDocs(q);
  snap.forEach((docu) => {
    const s = docu.data();
    const f = s.fechaSorteo?.toDate ? s.fechaSorteo.toDate() : new Date();
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${formatDateTime(f)}</td>
      <td>${s.vendedorNombre}</td>
      <td>${s.nombreSorteo}</td>
      <td>${formatMoney(s.totalVendido)}</td>
      <td>${s.premioNumero || "-"}</td>
      <td>${s.premioMonto ? formatMoney(s.premioMonto) : "-"}</td>
    `;
    tablaSorteos.appendChild(tr);
  });
}
