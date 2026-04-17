// ═══════════════════════════════════════════════
//  EduPoint — Données partagées + Firebase
//  CORRECTIF : localStorage (partagé entre onglets) + Firebase Firestore
// ═══════════════════════════════════════════════

function getToday() { return new Date().toISOString().split('T')[0]; }
const HEURE_RETARD = '08:00';

// ── DONNÉES PAR DÉFAUT (utilisées seulement si localStorage vide) ──
const DEFAULT_USERS = [
  {id:1, role:'admin',     nom:'Diallo',  prenom:'Moussa',   email:'admin@ecole.sn',      matricule:'ADM001', password:'admin123', classe:null},
  {id:2, role:'directeur', nom:'Sarr',    prenom:'Fatou',    email:'directeur@ecole.sn',  matricule:'DIR001', password:'dir123',   classe:null},
  {id:3, role:'professeur',nom:'Ndiaye',  prenom:'Ibrahima', email:'prof@ecole.sn',       matricule:'PRF001', password:'prof123',  classe:'Mathematiques'},
  {id:4, role:'professeur',nom:'Mbaye',   prenom:'Aissatou', email:'prof2@ecole.sn',      matricule:'PRF002', password:'prof123',  classe:'Francais'},
  {id:5, role:'etudiant',  nom:'Fall',    prenom:'Cheikh',   email:'etudiant@ecole.sn',   matricule:'ETU001', password:'etu123',   classe:'AB1'},
  {id:6, role:'etudiant',  nom:'Gueye',   prenom:'Mariama',  email:'etu2@ecole.sn',       matricule:'ETU002', password:'etu123',   classe:'AB2'},
  {id:7, role:'etudiant',  nom:'Sow',     prenom:'Oumar',    email:'etu3@ecole.sn',       matricule:'ETU003', password:'etu123',   classe:'AB3'},
  {id:8, role:'etudiant',  nom:'Ba',      prenom:'Rokhaya',  email:'etu4@ecole.sn',       matricule:'ETU004', password:'etu123',   classe:'IG1'},
  {id:9, role:'etudiant',  nom:'Diop',    prenom:'Aminata',  email:'etu5@ecole.sn',       matricule:'ETU005', password:'etu123',   classe:'IG2'},
  {id:10,role:'etudiant',  nom:'Sy',      prenom:'Modou',    email:'etu6@ecole.sn',       matricule:'ETU006', password:'etu123',   classe:'IG3'},
  {id:11,role:'etudiant',  nom:'Camara',  prenom:'Ibrahima', email:'etu7@ecole.sn',       matricule:'ETU007', password:'etu123',   classe:'QHSE1'},
  {id:12,role:'etudiant',  nom:'Traore',  prenom:'Kadiatou', email:'etu8@ecole.sn',       matricule:'ETU008', password:'etu123',   classe:'QHSE2'},
];

function genDefaultPointages() {
  var pts = [
    {id:1, userId:3,  date:getToday(), entree:'07:48', sortie:'13:05', statut:'present'},
    {id:2, userId:5,  date:getToday(), entree:'07:52', sortie:null,    statut:'present'},
    {id:3, userId:6,  date:getToday(), entree:'08:18', sortie:null,    statut:'retard'},
    {id:4, userId:9,  date:getToday(), entree:'07:38', sortie:'12:50', statut:'present'},
    {id:5, userId:11, date:getToday(), entree:'08:45', sortie:null,    statut:'retard'},
  ];
  var ids = [5,6,7,8,9,10,11,12,3,4];
  for (var d = 1; d <= 14; d++) {
    var dt = new Date(); dt.setDate(dt.getDate() - d);
    if (dt.getDay() === 0 || dt.getDay() === 6) continue;
    var dateStr = dt.toISOString().split('T')[0];
    ids.forEach(function(uid) {
      var r = Math.random();
      if (r < 0.75) {
        var h = Math.random() < 0.8
          ? '07:' + String(30 + Math.floor(Math.random()*29)).padStart(2,'0')
          : '08:' + String(Math.floor(Math.random()*44)).padStart(2,'0');
        pts.push({id: Date.now()+uid*100+d, userId:uid, date:dateStr, entree:h, sortie:'13:'+String(Math.floor(Math.random()*20)).padStart(2,'0'), statut: h <= HEURE_RETARD ? 'present' : 'retard'});
      } else {
        pts.push({id: Date.now()+uid*100+d+9999, userId:uid, date:dateStr, entree:null, sortie:null, statut:'absent'});
      }
    });
  }
  return pts;
}

// ═══════════════════════════════════════════════
//  STOCKAGE PARTAGÉ : localStorage (visible par tous les onglets)
//  + synchronisation Firebase si configuré
// ═══════════════════════════════════════════════

// Charger USERS depuis localStorage (ou initialiser)
var USERS = (function() {
  try {
    var raw = localStorage.getItem('edupoint_users');
    if (raw) return JSON.parse(raw);
  } catch(e) {}
  var u = JSON.parse(JSON.stringify(DEFAULT_USERS));
  localStorage.setItem('edupoint_users', JSON.stringify(u));
  return u;
})();

// Charger POINTAGES depuis localStorage (ou initialiser)
var POINTAGES = (function() {
  try {
    var raw = localStorage.getItem('edupoint_pointages');
    if (raw) return JSON.parse(raw);
  } catch(e) {}
  var p = genDefaultPointages();
  localStorage.setItem('edupoint_pointages', JSON.stringify(p));
  return p;
})();

// ── FONCTIONS UTILITAIRES ──
function getNow() { return new Date().toTimeString().slice(0,5); }
function getStatut(h) { return !h ? 'absent' : (h <= HEURE_RETARD ? 'present' : 'retard'); }
function getP(uid, date) { date = date || getToday(); return POINTAGES.find(function(p){ return p.userId===uid && p.date===date; }); }
function getStudents() { return USERS.filter(function(u){ return u.role==='etudiant'; }); }
function getProfs() { return USERS.filter(function(u){ return u.role==='professeur'; }); }
function getClasses() {
  return ['AB1','AB2','AB3','IG1','IG2','IG3','QHSE1','QHSE2','QHSE3','SP1','SP2','SP3','SG1','SG2','SG3'];
}
var FILIERES = ['AB','IG','QHSE','SG','SP'];
var NIVEAUX  = [{label:'Licence 1', val:'1'},{label:'Licence 2', val:'2'},{label:'Licence 3', val:'3'}];
function fmtDate(d) { try { return new Date(d).toLocaleDateString('fr-FR',{day:'2-digit',month:'2-digit',year:'numeric'}); } catch(e) { return d; } }
function fmtFull() { return new Date().toLocaleDateString('fr-FR',{weekday:'long',year:'numeric',month:'long',day:'numeric'}); }

// ── SESSION (sessionStorage = par onglet, pour l'utilisateur connecté) ──
function saveSession(user) {
  sessionStorage.setItem('edupoint_user', JSON.stringify(user));
}

function loadSession() {
  var u = sessionStorage.getItem('edupoint_user');
  if (!u) return null;
  // Recharger USERS et POINTAGES depuis localStorage (données partagées à jour)
  try {
    var savedUsers = localStorage.getItem('edupoint_users');
    var savedPointages = localStorage.getItem('edupoint_pointages');
    if (savedUsers) USERS = JSON.parse(savedUsers);
    if (savedPointages) POINTAGES = JSON.parse(savedPointages);
  } catch(e) {}
  return JSON.parse(u);
}

// ── SAUVEGARDE PARTAGÉE (localStorage + Firebase si dispo) ──
function saveData() {
  localStorage.setItem('edupoint_users', JSON.stringify(USERS));
  localStorage.setItem('edupoint_pointages', JSON.stringify(POINTAGES));
  localStorage.setItem('edupoint_lastUpdate', Date.now().toString());
  // Firebase : sauvegarde immédiate si connecté
  firebaseSaveData();
}

// ── ÉCOUTE DES CHANGEMENTS INTER-ONGLETS (même navigateur) ──
window.addEventListener('storage', function(e) {
  if (e.key === 'edupoint_pointages' && e.newValue) {
    try { POINTAGES = JSON.parse(e.newValue); } catch(ex) {}
    if (typeof onDataUpdated === 'function') onDataUpdated();
  }
  if (e.key === 'edupoint_users' && e.newValue) {
    try { USERS = JSON.parse(e.newValue); } catch(ex) {}
    if (typeof onDataUpdated === 'function') onDataUpdated();
  }
});

function logout() {
  sessionStorage.removeItem('edupoint_user');
  window.location.href = 'index.html';
}

// ═══════════════════════════════════════════════
//  FIREBASE INTEGRATION — TEMPS RÉEL MULTI-APPAREILS
//  ⚠️ OBLIGATOIRE si le site est en ligne (hébergé)
//  Sans Firebase, les pointages ne sont visibles que
//  sur le même navigateur (localStorage local)
// ═══════════════════════════════════════════════
var FIREBASE_CONFIG = {
  apiKey: "VOTRE_API_KEY",
  authDomain: "VOTRE_PROJECT.firebaseapp.com",
  projectId: "VOTRE_PROJECT_ID",
  storageBucket: "VOTRE_PROJECT.appspot.com",
  messagingSenderId: "VOTRE_SENDER_ID",
  appId: "VOTRE_APP_ID"
};

var firebaseReady = false;
var db = null;
var _unsubPointages = null;
var _unsubUsers = null;

function isFirebaseConfigured() {
  return FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.apiKey !== 'VOTRE_API_KEY';
}

function initFirebase() {
  // Charger config sauvegardée dans localStorage (depuis modal admin)
  try {
    var saved = localStorage.getItem('edupoint_firebase_config');
    if (saved) Object.assign(FIREBASE_CONFIG, JSON.parse(saved));
  } catch(e) {}

  if (!isFirebaseConfigured()) {
    console.info('EduPoint: Firebase non configuré — mode localStorage uniquement.');
    return;
  }
  if (typeof firebase === 'undefined') {
    console.warn('EduPoint: SDK Firebase non chargé.');
    return;
  }
  try {
    if (!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
    db = firebase.firestore();
    // Activer la persistance hors-ligne (cache local même sans internet)
    db.enablePersistence({ synchronizeTabs: true }).catch(function(err) {
      if (err.code === 'failed-precondition') {
        // Plusieurs onglets ouverts — OK, pas critique
      } else if (err.code === 'unimplemented') {
        console.info('Persistance hors-ligne non supportée par ce navigateur.');
      }
    });
    firebaseReady = true;
    console.info('EduPoint: Firebase connecté ✓');
    firebaseLoadData();
    firebaseListenRealtime();
  } catch(e) {
    console.error('EduPoint: Erreur Firebase:', e);
    firebaseReady = false;
  }
}

// Charger données initiales depuis Firestore
function firebaseLoadData() {
  if (!firebaseReady || !db) return;
  db.collection('edupoint').doc('users').get().then(function(doc) {
    if (doc.exists && doc.data() && doc.data().list && doc.data().list.length > 0) {
      USERS = doc.data().list;
      localStorage.setItem('edupoint_users', JSON.stringify(USERS));
      if (typeof onDataUpdated === 'function') onDataUpdated();
    }
  }).catch(function(e) { console.warn('Firebase load users:', e); });

  db.collection('edupoint').doc('pointages').get().then(function(doc) {
    if (doc.exists && doc.data() && doc.data().list) {
      POINTAGES = doc.data().list;
      localStorage.setItem('edupoint_pointages', JSON.stringify(POINTAGES));
      if (typeof render === 'function') render();
    }
  }).catch(function(e) { console.warn('Firebase load pointages:', e); });
}

// Écouter en TEMPS RÉEL les changements Firestore (tous appareils)
function firebaseListenRealtime() {
  if (!firebaseReady || !db) return;

  // Désabonner les anciens listeners si existants
  if (_unsubPointages) { try { _unsubPointages(); } catch(e) {} }
  if (_unsubUsers)     { try { _unsubUsers(); }     catch(e) {} }

  // Écouter les pointages — se déclenche dès qu'un étudiant/prof pointe
  _unsubPointages = db.collection('edupoint').doc('pointages').onSnapshot(function(doc) {
    if (doc.exists && doc.data() && doc.data().list) {
      var newData = doc.data().list;
      // Ne mettre à jour que si les données ont changé
      if (JSON.stringify(newData) !== JSON.stringify(POINTAGES)) {
        POINTAGES = newData;
        localStorage.setItem('edupoint_pointages', JSON.stringify(POINTAGES));
        if (typeof onDataUpdated === 'function') onDataUpdated();
        if (typeof render === 'function') render();
      }
    }
  }, function(err) { console.warn('Firebase pointages listener:', err); });

  // Écouter les utilisateurs — se déclenche quand l'admin ajoute un compte
  _unsubUsers = db.collection('edupoint').doc('users').onSnapshot(function(doc) {
    if (doc.exists && doc.data() && doc.data().list && doc.data().list.length > 0) {
      var newData = doc.data().list;
      if (JSON.stringify(newData) !== JSON.stringify(USERS)) {
        USERS = newData;
        localStorage.setItem('edupoint_users', JSON.stringify(USERS));
        if (typeof onDataUpdated === 'function') onDataUpdated();
        if (typeof render === 'function') render();
      }
    }
  }, function(err) { console.warn('Firebase users listener:', err); });
}

// Sauvegarder dans Firestore — appelé à chaque saveData()
function firebaseSaveData() {
  if (!firebaseReady || !db) return;
  db.collection('edupoint').doc('users').set({ list: USERS, updatedAt: Date.now() })
    .catch(function(e) { console.warn('Firebase save users:', e); });
  db.collection('edupoint').doc('pointages').set({ list: POINTAGES, updatedAt: Date.now() })
    .catch(function(e) { console.warn('Firebase save pointages:', e); });
}

// ── ICONES SVG ──
const ICO = {
  home:     '<svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
  users:    '<svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  user:     '<svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
  check:    '<svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>',
  xmark:    '<svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
  warn:     '<svg viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
  history:  '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
  chart:    '<svg viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
  settings: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
  clock:    '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
  logout:   '<svg viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>',
  download: '<svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
  edit:     '<svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
  trash:    '<svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',
  plus:     '<svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
  report:   '<svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>',
};

// CSS commun injecté dans chaque page
const COMMON_CSS = `
:root{--navy:#07111f;--navy2:#0e1f35;--accent:#00d4aa;--accent2:#ff6b35;--red:#ff4757;--green:#2ed573;--orange:#ffa502;--gold:#f4c430;--text:#ccd6f6;--text2:#7a8aaa;--white:#e8f4f8;--border:rgba(0,212,170,0.13);--card:rgba(14,31,53,.7)}
*{box-sizing:border-box;margin:0;padding:0}
html,body{min-height:100vh;font-family:'Sora',sans-serif;background:var(--navy);color:var(--text)}
.mono{font-family:'Space Mono',monospace}
.layout{display:flex;min-height:100vh}
.sidebar{width:240px;background:rgba(7,17,31,.97);border-right:1px solid var(--border);display:flex;flex-direction:column;position:fixed;top:0;left:0;height:100vh;z-index:100;overflow-y:auto}
.sb-logo{padding:22px 18px 14px}
.sb-logo-inner{display:flex;align-items:center;gap:11px}
.sb-logo-icon{width:38px;height:38px;background:linear-gradient(135deg,var(--accent),#00a885);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0}
.sb-logo-text{font-size:15px;font-weight:800;color:var(--white);letter-spacing:-.3px}
.sb-logo-ver{font-size:10.5px;color:var(--text2)}
.sb-section{padding:10px 12px;flex:1}
.sb-section-title{font-size:9.5px;font-weight:700;color:var(--text2);text-transform:uppercase;letter-spacing:1px;padding:6px 8px 8px}
.nav-item{display:flex;align-items:center;gap:9px;padding:9px 11px;border-radius:9px;color:var(--text2);text-decoration:none;font-size:13.5px;font-weight:500;transition:all .18s;margin-bottom:2px;cursor:pointer}
.nav-item svg{width:17px;height:17px;stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;flex-shrink:0}
.nav-item:hover{background:rgba(0,212,170,.07);color:var(--accent)}
.nav-item.active{background:rgba(0,212,170,.12);color:var(--accent);font-weight:700}
.sb-bottom{padding:14px 12px 18px;border-top:1px solid var(--border)}
.user-badge{display:flex;align-items:center;gap:10px;padding:10px;background:rgba(255,255,255,.04);border-radius:11px;margin-bottom:10px;border:1px solid rgba(255,255,255,.06)}
.user-avatar{width:34px;height:34px;background:linear-gradient(135deg,var(--accent),#00a885);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;color:var(--navy);flex-shrink:0}
.user-name{font-size:13px;font-weight:700;color:var(--white)}
.user-role{font-size:11px;color:var(--text2)}
.btn-logout{width:100%;background:rgba(255,71,87,.1);border:1px solid rgba(255,71,87,.2);border-radius:9px;padding:9px 14px;color:#ff6b7a;font-family:'Sora',sans-serif;font-size:13px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:7px;transition:all .2s}
.btn-logout:hover{background:rgba(255,71,87,.2)}
.btn-logout svg{width:15px;height:15px;stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.main-area{margin-left:240px;flex:1;display:flex;flex-direction:column;min-height:100vh}
.topbar{padding:16px 24px;background:rgba(7,17,31,.9);border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:50;backdrop-filter:blur(12px)}
.topbar-title{font-size:16px;font-weight:700;color:var(--white)}
.topbar-right{display:flex;align-items:center;gap:12px}
.clock-badge{background:rgba(0,212,170,.1);border:1px solid rgba(0,212,170,.2);border-radius:8px;padding:6px 12px;font-size:13.5px;color:var(--accent)}
.readonly-badge{background:rgba(255,165,2,.1);border:1px solid rgba(255,165,2,.2);border-radius:8px;padding:6px 12px;font-size:11px;color:var(--orange);font-weight:600}
.firebase-badge{background:rgba(255,165,2,.1);border:1px solid rgba(255,165,2,.2);border-radius:8px;padding:6px 12px;font-size:11px;color:var(--orange);font-weight:600;cursor:pointer}
.firebase-badge.connected{background:rgba(46,213,115,.1);border-color:rgba(46,213,115,.2);color:var(--green)}
.content{padding:24px;flex:1}
.stats-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(175px,1fr));gap:16px;margin-bottom:24px}
.stat-card{background:var(--card);border:1px solid var(--border);border-radius:15px;padding:20px;position:relative;overflow:hidden;transition:transform .2s}
.stat-card:hover{transform:translateY(-2px)}
.stat-card::after{content:'';position:absolute;top:-20px;right:-20px;width:80px;height:80px;border-radius:50%}
.stat-card.c-green::after{background:radial-gradient(circle,rgba(46,213,115,.16),transparent)}
.stat-card.c-red::after{background:radial-gradient(circle,rgba(255,71,87,.16),transparent)}
.stat-card.c-orange::after{background:radial-gradient(circle,rgba(255,165,2,.16),transparent)}
.stat-card.c-blue::after{background:radial-gradient(circle,rgba(0,212,170,.16),transparent)}
.stat-icon{width:42px;height:42px;border-radius:10px;display:flex;align-items:center;justify-content:center;margin-bottom:14px}
.stat-icon svg{width:20px;height:20px;stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.c-green .stat-icon{background:rgba(46,213,115,.14);color:var(--green)}
.c-red .stat-icon{background:rgba(255,71,87,.14);color:var(--red)}
.c-orange .stat-icon{background:rgba(255,165,2,.14);color:var(--orange)}
.c-blue .stat-icon{background:rgba(0,212,170,.14);color:var(--accent)}
.stat-val{font-size:30px;font-weight:700;color:var(--white);font-family:'Space Mono',monospace;line-height:1}
.stat-lbl{font-size:12.5px;color:var(--text2);margin-top:5px}
.pointage-panel{background:var(--card);border:1px solid var(--border);border-radius:18px;padding:28px;margin-bottom:22px}
.pnl-title{font-size:15px;font-weight:700;color:var(--white);margin-bottom:5px}
.pnl-sub{font-size:13px;color:var(--text2);margin-bottom:22px}
.pnl-btns{display:flex;gap:14px;flex-wrap:wrap}
.btn-entree,.btn-sortie{display:flex;align-items:center;gap:9px;padding:13px 24px;border:none;border-radius:12px;font-family:'Sora',sans-serif;font-size:14px;font-weight:700;cursor:pointer;transition:all .2s}
.btn-entree{background:linear-gradient(135deg,var(--green),#1cb850);color:var(--navy)}
.btn-entree:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 8px 22px rgba(46,213,115,.35)}
.btn-sortie{background:linear-gradient(135deg,var(--accent2),#e05500);color:#fff}
.btn-sortie:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 8px 22px rgba(255,107,53,.35)}
.btn-entree:disabled,.btn-sortie:disabled{opacity:.45;cursor:not-allowed;transform:none}
.btn-entree svg,.btn-sortie svg{width:18px;height:18px;stroke:currentColor;fill:none;stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round}
.pnl-status{display:flex;gap:14px;margin-top:18px;flex-wrap:wrap}
.status-chip{display:flex;align-items:center;gap:8px;background:rgba(255,255,255,.04);border-radius:9px;padding:9px 14px;border:1px solid rgba(255,255,255,.05)}
.dot{width:8px;height:8px;border-radius:50%;flex-shrink:0}
.dot.green{background:var(--green);box-shadow:0 0 7px var(--green)}
.dot.orange{background:var(--orange);box-shadow:0 0 7px var(--orange)}
.dot.red{background:var(--red);box-shadow:0 0 7px var(--red)}
.chip-lbl{font-size:12px;color:var(--text2)}
.chip-val{font-size:13px;font-weight:600;color:var(--white);font-family:'Space Mono',monospace}
.tbl-wrap{background:var(--card);border:1px solid var(--border);border-radius:15px;overflow:hidden;margin-bottom:22px}
.tbl-head{padding:18px 22px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px}
.tbl-title{font-size:14px;font-weight:700;color:var(--white)}
.tbl-filters{display:flex;gap:9px;flex-wrap:wrap;align-items:center}
table{width:100%;border-collapse:collapse}
th{padding:11px 18px;text-align:left;font-size:10.5px;font-weight:700;color:var(--text2);text-transform:uppercase;letter-spacing:.5px;background:rgba(255,255,255,.02);border-bottom:1px solid var(--border)}
td{padding:13px 18px;font-size:13.5px;color:var(--text);border-bottom:1px solid rgba(255,255,255,.035)}
tr:last-child td{border-bottom:none}
tbody tr:hover td{background:rgba(255,255,255,.02)}
.badge{display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:20px;font-size:11.5px;font-weight:700}
.badge.present{background:rgba(46,213,115,.13);color:var(--green);border:1px solid rgba(46,213,115,.2)}
.badge.absent{background:rgba(255,71,87,.13);color:var(--red);border:1px solid rgba(255,71,87,.2)}
.badge.retard{background:rgba(255,165,2,.13);color:var(--orange);border:1px solid rgba(255,165,2,.2)}
.role-tag{display:inline-flex;padding:3px 9px;border-radius:12px;font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.4px}
.role-tag.etudiant{background:rgba(0,212,170,.12);color:var(--accent)}
.role-tag.professeur{background:rgba(244,196,48,.12);color:var(--gold)}
.filter-inp{background:rgba(255,255,255,.05);border:1px solid rgba(0,212,170,.15);border-radius:8px;padding:7px 13px;color:var(--text);font-family:'Sora',sans-serif;font-size:13px;outline:none;transition:border-color .2s}
.filter-inp:focus{border-color:var(--accent)}
.btn-export{display:flex;align-items:center;gap:7px;padding:8px 16px;background:rgba(0,212,170,.1);border:1px solid rgba(0,212,170,.2);border-radius:8px;color:var(--accent);font-family:'Sora',sans-serif;font-size:13px;cursor:pointer;transition:all .2s}
.btn-export:hover{background:rgba(0,212,170,.2)}
.btn-export svg{width:15px;height:15px;stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.btn-add{display:flex;align-items:center;gap:7px;padding:10px 20px;background:linear-gradient(135deg,var(--accent),#00a885);border:none;border-radius:9px;color:var(--navy);font-family:'Sora',sans-serif;font-size:13.5px;font-weight:700;cursor:pointer;transition:all .2s}
.btn-add:hover{box-shadow:0 6px 18px rgba(0,212,170,.3)}
.btn-add svg{width:16px;height:16px;stroke:currentColor;fill:none;stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round}
.btn-sm{padding:5px 11px;border-radius:6px;border:none;cursor:pointer;font-family:'Sora',sans-serif;font-size:11.5px;font-weight:600;transition:all .2s;display:inline-flex;align-items:center;gap:4px}
.btn-sm svg{width:13px;height:13px;stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.btn-edit{background:rgba(0,212,170,.1);color:var(--accent);border:1px solid rgba(0,212,170,.18)}
.btn-edit:hover{background:rgba(0,212,170,.2)}
.btn-del{background:rgba(255,71,87,.1);color:var(--red);border:1px solid rgba(255,71,87,.18)}
.btn-del:hover{background:rgba(255,71,87,.2)}
.charts-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:22px;margin-bottom:24px}
.chart-card{background:var(--card);border:1px solid var(--border);border-radius:15px;padding:22px}
.chart-title{font-size:14px;font-weight:700;color:var(--white);margin-bottom:18px}
.chart-canvas-wrap{position:relative;height:220px}
.modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.72);z-index:1000;display:none;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(5px)}
.modal-overlay.open{display:flex}
.modal-box{background:var(--navy2);border:1px solid var(--border);border-radius:20px;padding:30px;width:480px;max-width:100%;max-height:90vh;overflow-y:auto}
.modal-title{font-size:17px;font-weight:700;color:var(--white);margin-bottom:5px}
.modal-sub{font-size:13px;color:var(--text2);margin-bottom:22px}
.modal-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.modal-footer{display:flex;gap:10px;margin-top:22px;justify-content:flex-end}
.btn-cancel{padding:9px 18px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:8px;color:var(--text);font-family:'Sora',sans-serif;font-size:13.5px;cursor:pointer}
.btn-cancel:hover{background:rgba(255,255,255,.1)}
.btn-save{padding:9px 18px;background:linear-gradient(135deg,var(--accent),#00a885);border:none;border-radius:8px;color:var(--navy);font-family:'Sora',sans-serif;font-size:13.5px;font-weight:700;cursor:pointer}
.btn-save:hover{box-shadow:0 5px 15px rgba(0,212,170,.35)}
.btn-danger{padding:9px 18px;background:rgba(255,71,87,.13);border:1px solid rgba(255,71,87,.28);border-radius:8px;color:var(--red);font-family:'Sora',sans-serif;font-size:13.5px;cursor:pointer}
.btn-danger:hover{background:rgba(255,71,87,.22)}
.form-group{margin-bottom:18px}
.form-label{display:block;font-size:11px;font-weight:700;color:var(--text2);margin-bottom:7px;text-transform:uppercase;letter-spacing:.6px}
.form-input{width:100%;background:rgba(255,255,255,.05);border:1px solid rgba(0,212,170,.18);border-radius:11px;padding:12px 16px;color:var(--text);font-family:'Sora',sans-serif;font-size:14px;transition:all .2s;outline:none}
.form-input:focus{border-color:var(--accent);box-shadow:0 0 0 3px rgba(0,212,170,.1)}
.form-input::placeholder{color:var(--text2)}
select.form-input{cursor:pointer;background-color:rgba(14,31,53,.97)}
.toast{position:fixed;bottom:24px;right:24px;background:var(--navy2);border:1px solid var(--border);border-radius:12px;padding:13px 18px;color:var(--text);font-size:13.5px;z-index:9999;display:none;align-items:center;gap:9px;box-shadow:0 10px 34px rgba(0,0,0,.5);max-width:320px}
.toast.show{display:flex}
.toast.success{border-color:rgba(46,213,115,.3)}
.toast.error{border-color:rgba(255,71,87,.3)}
.section-head{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:22px}
.page-title{font-size:19px;font-weight:700;color:var(--white)}
.page-sub{font-size:13px;color:var(--text2);margin-top:3px}
.empty{text-align:center;padding:44px 20px;color:var(--text2)}
.progress-bar{height:6px;background:rgba(255,255,255,.07);border-radius:3px;overflow:hidden;flex:1}
.progress-fill{height:100%;background:var(--green);border-radius:3px}
.pie-legend{display:flex;justify-content:center;gap:16px;flex-wrap:wrap;margin-top:14px}
.pie-legend-item{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--text2)}
.pie-legend-dot{width:8px;height:8px;border-radius:2px;flex-shrink:0}
.firebase-modal{background:var(--navy2);border:1px solid var(--border);border-radius:20px;padding:30px;width:560px;max-width:100%;max-height:90vh;overflow-y:auto}
.firebase-info-box{background:rgba(0,212,170,.06);border:1px solid rgba(0,212,170,.2);border-radius:10px;padding:14px;margin-bottom:18px;font-size:13px;color:var(--text2);line-height:1.6}
.firebase-info-box b{color:var(--accent)}
/* ── BURGER BUTTON (visible uniquement sur mobile) ── */
.burger-btn{display:none;align-items:center;justify-content:center;width:38px;height:38px;background:rgba(0,212,170,.1);border:1px solid rgba(0,212,170,.2);border-radius:10px;cursor:pointer;flex-shrink:0;transition:background .2s}
.burger-btn:hover{background:rgba(0,212,170,.2)}
.burger-btn svg{width:20px;height:20px;stroke:var(--accent);fill:none;stroke-width:2.2;stroke-linecap:round}
/* ── OVERLAY du drawer ── */
.drawer-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:199;backdrop-filter:blur(3px);opacity:0;transition:opacity .25s}
.drawer-overlay.open{display:block;opacity:1}
/* ── SIDEBAR en mode drawer sur mobile ── */
@media(max-width:768px){
  .burger-btn{display:flex}
  .sidebar{transform:translateX(-100%);transition:transform .28s cubic-bezier(.4,0,.2,1);z-index:200;box-shadow:8px 0 40px rgba(0,0,0,.6)}
  .sidebar.drawer-open{transform:translateX(0)}
  .main-area{margin-left:0}
  .content{padding:16px}
  .stats-grid{grid-template-columns:1fr 1fr}
  .charts-grid{grid-template-columns:1fr}
  .topbar{padding:12px 16px}
}
`;

// Injecter le CSS commun dans la page
(function() {
  var style = document.createElement('style');
  style.textContent = COMMON_CSS;
  document.head.appendChild(style);
})();
