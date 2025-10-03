import { auth, db } from "../firebase.js";
import { signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

const ADMIN_EMAIL = "tan25gonz@gmail.com";

const form = document.getElementById('formLogin');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  try {
    await signInWithEmailAndPassword(auth, email, password);
    // onAuthStateChanged hará la redirección
  } catch (err) {
    alert('❌ ' + (err.message || 'Error al ingresar'));
  }
});

onAuthStateChanged(auth, async (user) => {
  if (!user) return;
  try {
    if (user.email === ADMIN_EMAIL) {
      window.location.href = 'admin.html';
      return;
    }
    // intento leer rol (opcional)
    const snap = await getDoc(doc(db, 'usuarios', user.uid));
    const rol = snap.exists() ? (snap.data().rol || 'vendedor') : 'vendedor';
    window.location.href = (rol === 'admin') ? 'admin.html' : 'vendedor.html';
  } catch {
    window.location.href = 'vendedor.html';
  }
});
