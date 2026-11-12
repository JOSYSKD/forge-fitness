// Firebase-Anbindung: Auth (E-Mail/Passwort intern, sichtbar nur Benutzername) + Realtime Database.
// Passwörter werden ausschließlich von Firebase Authentication verarbeitet und dort sicher gehasht
// (scrypt) – sie landen nie in der Datenbank. Zugriffsschutz über database.rules.json (auth.uid).
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {
  getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOut, updatePassword, reauthenticateWithCredential, EmailAuthProvider, deleteUser,
  setPersistence, browserLocalPersistence
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import {
  getDatabase, ref, get, set, update, remove, push, onValue, off, serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js';

// Gleiches Firebase-Projekt wie Neon Jungle Casino (klettlogin-3d1ed), eigener Bereich /fit
const config = {
  apiKey: 'AIzaSyB9e7SS4RsT86XnuCo5UVHE6nmEnmEiT_w',
  authDomain: 'klettlogin-3d1ed.firebaseapp.com',
  databaseURL: 'https://klettlogin-3d1ed-default-rtdb.europe-west1.firebasedatabase.app',
  projectId: 'klettlogin-3d1ed',
  appId: '1:273062395503:web:724a7bfcace398dec2179a'
};

const app = initializeApp(config);
export const auth = getAuth(app);
export const db = getDatabase(app);
setPersistence(auth, browserLocalPersistence).catch(() => {});

const ROOT = 'fit';
export const r = (path = '') => ref(db, path ? `${ROOT}/${path}` : ROOT);
export { get, set, update, remove, push, onValue, off, serverTimestamp, onAuthStateChanged };

export const USERNAME_RE = /^[a-zA-Z0-9_.-]{3,20}$/;
const EMAIL_DOMAIN = 'users.forge-fitness.app';
export const usernameToEmail = (u) => `${u.trim().toLowerCase()}@${EMAIL_DOMAIN}`;

export function authErrorText(e) {
  const c = (e && e.code) || '';
  const map = {
    'auth/email-already-in-use': 'Dieser Benutzername ist bereits vergeben.',
    'auth/invalid-credential': 'Benutzername oder Passwort ist falsch.',
    'auth/wrong-password': 'Benutzername oder Passwort ist falsch.',
    'auth/user-not-found': 'Benutzername oder Passwort ist falsch.',
    'auth/invalid-email': 'Ungültiger Benutzername.',
    'auth/weak-password': 'Das Passwort ist zu schwach (mind. 8 Zeichen).',
    'auth/too-many-requests': 'Zu viele Versuche. Bitte warte kurz und versuche es erneut.',
    'auth/network-request-failed': 'Keine Verbindung. Prüfe deine Internetverbindung.',
    'auth/requires-recent-login': 'Bitte melde dich aus Sicherheitsgründen erneut an.',
    'auth/operation-not-allowed': 'Registrierung ist auf dem Server noch nicht freigeschaltet (Firebase: E-Mail/Passwort-Anmeldung aktivieren).',
    'auth/configuration-not-found': 'Anmeldung ist auf dem Server noch nicht eingerichtet (Firebase Authentication aktivieren).',
    'PERMISSION_DENIED': 'Keine Berechtigung für diese Aktion.'
  };
  if (map[c]) return map[c];
  const msg = String((e && e.message) || e || '');
  if (/permission_denied/i.test(msg)) return map.PERMISSION_DENIED;
  if (/CONFIGURATION_NOT_FOUND/i.test(msg)) return map['auth/configuration-not-found'];
  return 'Etwas ist schiefgelaufen. Bitte versuche es erneut.';
}

export async function register(username, password) {
  const cred = await createUserWithEmailAndPassword(auth, usernameToEmail(username), password);
  const uid = cred.user.uid;
  const now = Date.now();
  try {
    await update(r(), {
      [`usernames/${username.toLowerCase()}`]: uid,
      [`public/${uid}`]: { username, createdAt: now },
      [`users/${uid}/profile`]: {
        username, createdAt: now,
        privacy: { weight: false, height: false, training: true, prs: true, ranks: true, sex: false }
      },
      [`users/${uid}/goals`]: { kcal: 2500, p: 150, c: 280, f: 80 }
    });
  } catch (e) {
    // Datenbank-Anlage fehlgeschlagen → Konto wieder entfernen, damit nichts halb existiert
    try { await deleteUser(cred.user); } catch {}
    throw e;
  }
  return cred.user;
}

export const login = (username, password) => signInWithEmailAndPassword(auth, usernameToEmail(username), password);
export const logout = () => signOut(auth);

export async function changePassword(oldPw, newPw) {
  const u = auth.currentUser;
  await reauthenticateWithCredential(u, EmailAuthProvider.credential(u.email, oldPw));
  await updatePassword(u, newPw);
}

export async function reauth(pw) {
  const u = auth.currentUser;
  await reauthenticateWithCredential(u, EmailAuthProvider.credential(u.email, pw));
}
export { deleteUser };
