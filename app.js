
// CONFIG
// =========================

const API_URL =
"https://script.google.com/macros/s/AKfycbzOXqcVGIolVMcu6o6N7Y_L53bLAUidud9V339YkQQT3yUsNSCCZBFBvVTAbYWIyaz9/exec";
let scannerAcceso = null;
let familiaActual = null;

const COSTO_EVENTO = 400;

// =========================
// DATOS SESION
// =========================
let usuarioActivo = null;
// =========================
// LOGIN TEMPORAL
// =========================

async function login(){

    const usuario =
        document.getElementById("usuario").value.trim();

    const password =
        document.getElementById("password").value.trim();

    if(!usuario || !password){

        alert(
            "Ingrese usuario y contraseña"
        );

        return;
    }

    try{

        const response = await fetch(
            `${API_URL}?action=login` +
            `&usuario=${encodeURIComponent(usuario)}` +
            `&password=${encodeURIComponent(password)}`
        );

        const data = await response.json();

        if(!data.success){

            alert(
                "Usuario o contraseña incorrectos"
            );

            return;
        }

        usuarioActivo = {

            usuario:data.usuario,
            nombre:data.nombre,
            telefono:data.telefono,
            barrio:data.barrio,
            rol:data.rol

        };
        console.log(usuarioActivo);

        // 👇 AQUI VA EL CONTROL DE ROLES
configurarRol(usuarioActivo.rol);

        document
            .getElementById("loginScreen")
            .classList.add("hidden");

        document
            .getElementById("panelScreen")
            .classList.remove("hidden");

        document.getElementById(
            "infoUsuario"
        ).innerHTML = `

            <b>${data.nombre}</b><br>
            ${data.telefono}<br>
            ${data.barrio}<br>
            ${data.rol}

        `;

    }catch(error){

        console.log(error);

        alert(
            "Error de conexión"
        );
    }
}

// =========================
// PANTALLAS
// =========================

function mostrarRegistro(){

    document
        .getElementById("panelScreen")
        .classList.add("hidden");

    document
        .getElementById("registroScreen")
        .classList.remove("hidden");
}

function volverPanel(){

    document.getElementById("registroScreen").classList.add("hidden");
    document.getElementById("resultadoScreen").classList.add("hidden");
    document.getElementById("consultaScreen").classList.add("hidden");
    document.getElementById("accesoScreen").classList.add("hidden");

    document.getElementById("datosFamilia").innerHTML = "";
    document.getElementById("resultadoAcceso").innerHTML = "";

    familiaActual = null;

    document.getElementById("panelScreen").classList.remove("hidden");
}

// =========================
// FOLIO
// =========================

function generarFolio(barrio){

    const numero =
        Date.now().toString().slice(-6);

    const codigos = {

        "Bo.PuebloNuevo":"BPN",
        "Bo.Guadalupe":"BGD",
        "Bo.Judio":"BJD",
        "Bo.Palma":"BPL",
        "Bo.Eucalipto":"BEC",
        "Bo.SGertrudis":"BSG",
        "Bo.Nopancalco":"BNO"

    };

    const codigoBarrio =
        codigos[barrio] || "GEN";

    return `FP2026-${codigoBarrio}-${numero}`;
}

// =========================
// REGISTRO
// =========================

async function registrarFamilia(){

    const nombre =
        document.getElementById("nombre").value.trim();

    const barrio =
        document.getElementById("barrio").value;

    const integrantes =
        document.getElementById("integrantes").value;

    if(nombre === ""){
        alert("Ingrese nombre");
        return;
    }

    if(integrantes === ""){
        alert("Ingrese integrantes");
        return;
    }

    const folio =
        generarFolio(barrio);

    const payload = {

        action:"registrarFamilia",

        folio,

        nombre,

        barrio,

        integrantes,

        total:COSTO_EVENTO
    };

    try{

const url =
`${API_URL}?action=registrarFamilia` +
`&folio=${encodeURIComponent(folio)}` +
`&nombre=${encodeURIComponent(nombre)}` +
`&barrio=${encodeURIComponent(barrio)}` +
`&integrantes=${encodeURIComponent(integrantes)}` +
`&total=${COSTO_EVENTO}` +
`&usuarioRegistro=${encodeURIComponent(usuarioActivo?.usuario || "SIN_LOGIN")}`;

const response = await fetch(url);

const data = await response.json();

        if(data.success){

            document
                .getElementById("registroScreen")
                .classList.add("hidden");

            document
                .getElementById("resultadoScreen")
                .classList.remove("hidden");

            document
                .getElementById("folioGenerado")
                .innerText = folio;

            document
                .getElementById("qrcode")
                .innerHTML = "";

            new QRCode(
                document.getElementById("qrcode"),
                {
                    text:folio,
                    width:220,
                    height:220
                }
            );

            document.getElementById("nombre").value = "";
            document.getElementById("integrantes").value = "";

        }else{

            alert("Error al guardar");

            console.log(data);
        }

    }catch(error){

        console.log(error);

        alert(
            "Error de conexión con Apps Script"
        );
    }
}

// =========================
// PROXIMA FASE
// =========================

function buscarQR(){

    // 👇 AQUÍ SE ABRE LA CÁMARA (SIEMPRE EN JS)
    document.getElementById("reader").style.display = "flex";

    const scanner = new Html5Qrcode("reader");

    scanner.start(
        { facingMode: "environment" },
        {
            fps: 10,
            qrbox: 250
        },
        async (folio) => {

            await scanner.stop();

            // 👇 AQUÍ SE CIERRA LA CÁMARA
            document.getElementById("reader").style.display = "none";

            consultarFamilia(folio);
        }
    );
}

async function consultarFamilia(folio){

    try{

        const response = await fetch(
            `${API_URL}?action=buscarFamilia&folio=${encodeURIComponent(folio)}`
        );

        const data = await response.json();

        familiaActual = data;

        if(!data.success){
            alert("Familia no encontrada");
            return;
        }

        // 🔥 SI ES ACCESISTA
        if(usuarioActivo.rol === "ACCESISTA"){

            document.getElementById("panelScreen").classList.add("hidden");
            document.getElementById("accesoScreen").classList.remove("hidden");

            mostrarAcceso(data);
            return;
        }

        // 🔵 RECOLECTADOR / ADMIN
        document.getElementById("panelScreen").classList.add("hidden");
        document.getElementById("consultaScreen").classList.remove("hidden");

        document.getElementById("datosFamilia").innerHTML = `
            <p><b>Folio:</b> ${data.folio}</p>
            <p><b>Nombre:</b> ${data.nombre}</p>
            <p><b>Barrio:</b> ${data.barrio}</p>
            <p><b>Integrantes:</b> ${data.integrantes}</p>
            <p><b>Total:</b> $${data.total}</p>
            <p><b>Abonado:</b> $${data.abonado}</p>
            <p><b>Saldo:</b> $${data.saldo}</p>
            <p><b>Estado:</b> ${data.estado}</p>
        `;

    }catch(error){
        console.log(error);
        alert("Error consultando familia");
    }
}
async function abonarFamilia(){

    if(!familiaActual){
        return;
    }

    const monto = prompt("Monto del abono:");

    if(!monto){
        return;
    }

    const response = await fetch(
        `${API_URL}?action=registrarPago` +
        `&folio=${encodeURIComponent(familiaActual.folio)}` +
        `&tipo=ABONO` +
        `&monto=${monto}` +
        `&usuario=${usuarioActivo.usuario}`
    );

    const data = await response.json();

    if(data.success){

    alert(
        `Abono registrado\n\nSaldo: $${data.saldo}`
    );

    volverPanel();
}
}
async function liquidarFamilia(){

    if(!familiaActual){
        return;
    }

    const saldo = Number(
        familiaActual.saldo
    );

    if(saldo <= 0){

        alert("Ya está liquidado");

        return;
    }

    const confirmar = confirm(
        `¿Liquidar saldo de $${saldo}?`
    );

    if(!confirmar){
        return;
    }

    const response = await fetch(
        `${API_URL}?action=registrarPago` +
        `&folio=${encodeURIComponent(familiaActual.folio)}` +
        `&tipo=LIQUIDACION` +
        `&monto=${saldo}` +
        `&usuario=${usuarioActivo.usuario}`
    );

    const data = await response.json();

    if(data.success){

    alert(
        "Familia liquidada correctamente"
    );

    volverPanel();
}
}
function verHistorial(){

    alert(
      "Historial disponible en siguiente fase"
    );
}

function mostrarAcceso(data){

    const div = document.getElementById("resultadoAcceso");

    let estadoTexto = "";

    if(data.estado === "LIQUIDADO"){
        estadoTexto = "✅ LIQUIDADO";
    }else{
        estadoTexto = "❌ PENDIENTE";
    }

    div.innerHTML = `
        <h1>${estadoTexto}</h1>
        <br>
        <b>Familia:</b> ${data.nombre}<br><br>
        <b>Integrantes registrados:</b> ${data.integrantes}
    `;
}

function configurarRol(rol){

    rol = rol.toUpperCase();

    const btnRegistrar = document.getElementById("btnRegistrar");
    const btnAbonar = document.getElementById("btnAbonar");
    const btnLiquidar = document.getElementById("btnLiquidar");
    const btnEscanear = document.getElementById("btnEscanearAcceso");

    // 🔒 SIEMPRE OCULTAR TODO PRIMERO
    const botones = [btnRegistrar, btnAbonar, btnLiquidar, btnEscanear];
    botones.forEach(b => {
        if(b) b.style.display = "none";
    });

    // 🟢 RECOLECTADOR
    if(rol === "RECOLECTADOR"){
        if(btnRegistrar) btnRegistrar.style.display = "block";
        if(btnAbonar) btnAbonar.style.display = "block";
        if(btnLiquidar) btnLiquidar.style.display = "block";
        if(btnEscanear) btnEscanear.style.display = "block";
    }

    // 🟡 ACCESISTA
    else if(rol === "ACCESISTA"){
        if(btnEscanear) btnEscanear.style.display = "block";
    }

    // 🔴 ADMIN
    else if(rol === "ADMIN"){
        botones.forEach(b => {
            if(b) b.style.display = "block";
        });
    }

    console.log("Rol aplicado:", rol);
}

function reiniciarEscaneoAcceso(){

    const div = document.getElementById("resultadoAcceso");

    // limpiar resultado visual
    div.innerHTML = "";

    // si hay scanner activo, lo cerramos bien
    if(scannerAcceso){
        scannerAcceso.stop()
        .then(() => scannerAcceso.clear())
        .catch(() => {})
        .finally(() => {
            scannerAcceso = null;
            iniciarEscaneoAcceso();
        });
    }else{
        iniciarEscaneoAcceso();
    }
}

function iniciarEscaneoAcceso(){

    document.getElementById("readerAcceso").innerHTML = "";

    scannerAcceso = new Html5Qrcode("readerAcceso");

    scannerAcceso.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 250 },
        async (folio) => {

            await scannerAcceso.stop();
            await scannerAcceso.clear();

            scannerAcceso = null;

            consultarAcceso(folio);
        }
    ).catch(err => {
        console.log("Error scanner:", err);
    });
}
function consultarAcceso(folio){

    fetch(`${API_URL}?action=buscarFamilia&folio=${folio}`)
    .then(r => r.json())
    .then(data => {

        const div = document.getElementById("resultadoAcceso");

        if(!data.success){
            div.innerHTML = "❌ NO ENCONTRADO";
            return;
        }

        if(data.estado === "LIQUIDADO"){
            div.innerHTML = "🟢 ACCESO PERMITIDO";
        }else{
            div.innerHTML = "🔴 NO LIQUIDADO";
        }
    });
}
