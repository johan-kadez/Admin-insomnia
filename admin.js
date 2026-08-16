let db=null,auth=null;
let firebaseFns={};
let firebaseReady=false;
let firebaseInitPromise=null;

async function initFirebase(){
  if(firebaseReady) return;
  if(firebaseInitPromise) return firebaseInitPromise;

  firebaseInitPromise=(async()=>{
    const [{initializeApp,getApps,getApp},fs,au,cfg]=await Promise.all([
      import("https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js"),
      import("https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js"),
      import("https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js"),
      import("./firebase-config.js")
    ]);

    const app=getApps().length ? getApp() : initializeApp(cfg.firebaseConfig);
    db=fs.getFirestore(app);
    auth=au.getAuth(app);

    firebaseFns={
      collection:fs.collection,getDocs:fs.getDocs,addDoc:fs.addDoc,
      doc:fs.doc,updateDoc:fs.updateDoc,deleteDoc:fs.deleteDoc,
      setDoc:fs.setDoc,signInWithEmailAndPassword:au.signInWithEmailAndPassword,
      signOut:au.signOut
    };

    au.onAuthStateChanged(auth,async u=>{
      try{
        if(u){
          loginScreenEl.classList.add("hidden");
          adminAppEl.classList.remove("hidden");
          await loadAll();
          renderAdmin();
        }else{
          loginScreenEl.classList.remove("hidden");
          adminAppEl.classList.add("hidden");
        }
      }catch(e){
        console.error("Admin load error:",e);
        alert("Login berhasil, tetapi data admin gagal dimuat. Cek Firestore Rules.");
      }
    });

    firebaseReady=true;
  })();

  try{
    await firebaseInitPromise;
  }catch(e){
    firebaseInitPromise=null;
    throw e;
  }
}

function firebaseErrorMessage(e){
  const code=e?.code||"";
  if(code==="auth/invalid-credential"||code==="auth/wrong-password"||code==="auth/user-not-found")
    return "Email atau password salah.";
  if(code==="auth/operation-not-allowed")
    return "Firebase Authentication Email/Password belum diaktifkan.";
  if(code==="auth/invalid-email")
    return "Format email tidak valid.";
  if(code==="auth/network-request-failed")
    return "Koneksi ke Firebase gagal.";
  if(code==="auth/invalid-api-key")
    return "API Key Firebase tidak valid.";
  if(e?.message) return "Firebase error: "+e.message;
  return "Firebase gagal dimuat.";
}

window.adminLogin=async()=>{
  const user=document.getElementById("loginUser")?.value.trim();
  const pass=document.getElementById("loginPass")?.value||"";
  const btn=document.getElementById("loginBtn");

  if(!user||!pass){
    alert("Isi email dan password terlebih dahulu.");
    return;
  }

  if(btn){btn.disabled=true;btn.textContent="Memuat...";}

  try{
    await initFirebase();
    await firebaseFns.signInWithEmailAndPassword(auth,user,pass);
  }catch(e){
    console.error("Firebase login/bootstrap error:",e);
    alert(firebaseErrorMessage(e));
    if(btn){btn.disabled=false;btn.textContent="Masuk";}
  }
};

window.adminLogout=()=>{
  if(auth && firebaseFns.signOut) return firebaseFns.signOut(auth);
};

document.querySelectorAll(".navbtn").forEach(b=>b.onclick=()=>showAdminPage(b.dataset.ap));
window.showAdminPage=id=>{document.querySelectorAll(".admin-page").forEach(x=>x.classList.remove("active"));document.getElementById(id).classList.add("active");document.querySelectorAll(".navbtn").forEach(x=>x.classList.toggle("active",x.dataset.ap===id));adminTitle.textContent={dash:"Dashboard",manage:"Kelola Mobil",orders:"Pesanan",contact:"CS Admin & Social Media",settings:"Pengaturan Toko"}[id];renderAdmin()};
async function loadAll(){
  try {
    const ps = await getDocs(collection(db,"products"));

    cars = ps.docs.map(d => ({
      id: d.id,
      ...d.data()
    }));

    if(!cars.length){
      for(const c of defaults){
        await setDoc(doc(db,"products",c.id),c);
      }
      cars = defaults.map(x => ({...x}));
    }

    const ss = await getDocs(collection(db,"settings"));
    const pub = ss.docs.find(d => d.id==="public");

    if(pub){
      contact = {...contact,...pub.data()};
    }

    applyContact();

  } catch(e) {
    console.error("ERROR ASLI loadAll:", e);

    alert(
      "ERROR ASLI:\n\n" +
      "code: " + (e?.code || "tidak ada") +
      "\n\nmessage:\n" +
      (e?.message || e)
    );

    throw e;
  }
}
function renderAdmin(){aTotal.textContent=cars.length;aAvailable.textContent=cars.filter(c=>c.status==="available"&&c.active!==false).length;if(manage.classList.contains("active"))renderAdminCars()}
window.renderAdminCars=()=>{const q=(adminSearch.value||"").toLowerCase();adminCars.innerHTML=cars.filter(c=>String(c.name||"").toLowerCase().includes(q)).map(c=>`<div class="car-row"><div class="thumb" ${c.image?`style="background-image:url('${String(c.image).replace(/'/g,"\\'")}');background-size:cover;background-position:center;color:transparent"`:""}>${c.image?"":"CAR"}</div><div><h3>${c.name}</h3><p>${money(c.price)} • ${String(c.type||"").toUpperCase()} • ${c.status==="available"?"TERSEDIA":"HABIS"} • ${c.active!==false?"AKTIF":"NONAKTIF"}</p></div><div class="row"><button onclick="editCar('${c.id}')">Edit</button><button onclick="deleteCar('${c.id}')">Hapus</button></div></div>`).join("")||"<div class='admin-panel' style='text-align:center;color:#617b92'>Mobil tidak ditemukan.</div>"};
window.openCarForm=()=>{editingId=null;modalTitle.textContent="Tambah Mobil";carName.value="";carPrice.value="";carImage.value="";carType.value="sport";carStatus.value="available";carModal.classList.remove("hidden")};window.editCar=id=>{const c=cars.find(x=>x.id===id);if(!c)return;editingId=id;modalTitle.textContent="Edit Mobil";carName.value=c.name||"";carPrice.value=c.price||0;carType.value=c.type||"sport";carImage.value=c.image||"";carStatus.value=c.status||"available";carModal.classList.remove("hidden")};window.closeCarForm=()=>carModal.classList.add("hidden");
window.saveCar=async()=>{const data={name:carName.value.trim(),price:Number(carPrice.value),type:carType.value,image:carImage.value.trim(),status:carStatus.value,active:true};if(!data.name||!data.price)return alert("Nama dan harga wajib diisi.");if(editingId)await firebaseFns.updateDoc(firebaseFns.doc(db,"products",editingId),data);else await firebaseFns.addDoc(firebaseFns.collection(db,"products"),data);await loadAll();closeCarForm();renderAdmin()};window.deleteCar=async id=>{if(confirm("Hapus mobil ini?")){await firebaseFns.deleteDoc(firebaseFns.doc(db,"products",id));await loadAll();renderAdmin()}};
window.saveContact=async()=>{contact={wa:editWa.value.trim(),tg:editTg.value.trim(),tt:editTt.value.trim(),yt:editYt.value.trim()};await firebaseFns.setDoc(firebaseFns.doc(db,"settings","public"),contact,{merge:true});applyContact();alert("CS & Social berhasil disimpan.")};function applyContact(){editWa.value=contact.wa||"";editTg.value=contact.tg||"";editTt.value=contact.tt||"";editYt.value=contact.yt||""}window.saveSettings=()=>alert("Pengaturan dasar ini mengikuti branding Store.");

function bindLogin(){
  const btn=document.getElementById("loginBtn");
  const pass=document.getElementById("loginPass");
  btn?.addEventListener("click",()=>window.adminLogin());
  pass?.addEventListener("keydown",e=>{
    if(e.key==="Enter") window.adminLogin();
  });
}

window.addEventListener("DOMContentLoaded",()=>{
  bindLogin();
  document.getElementById("adminSearch")?.addEventListener("input",window.renderAdminCars);
  initFirebase().catch(e=>console.warn("Firebase preload failed:",e));
});
