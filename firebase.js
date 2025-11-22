import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBTSuixpTkky24vc4oWyu15XUrKuN99K4s",
  authDomain: "tienda-70955.firebaseapp.com",
  projectId: "tienda-70955",
  storageBucket: "tienda-70955.appspot.com",
  messagingSenderId: "359666183033",
  appId: "1:359666183033:web:fd729d903471d89ea89da8",
  measurementId: "G-162DKFV890"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
