// =========================
// CONFIG
// =========================

const API_URL =
"https://script.google.com/macros/s/AKfycbzOXqcVGIolVMcu6o6N7Y_L53bLAUidud9V339YkQQT3yUsNSCCZBFBvVTAbYWIyaz9/exec";

let familiaActual = null;

const COSTO_EVENTO = 1500;

// =========================
// DATOS SESION
// =========================

let usuarioActivo = {
    usuario: "b1_01",
    nombre: "Juan Pérez",
    telefono: "7711111111",
    barrio: "Barrio 1",
    rol: "COBRADOR"
};

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

    document
        .getElementById("registroScreen")
        .classList.add("hidden");

    document
        .getElementById("resultadoScreen")
        .classList.add("hidden");

    document
        .getElementById("panelScreen")
        .classList.remove("hidden");
}

// =========================
// FOLIO
// =========================

function generarFolio(barrio){

    const numero =
        Date.now().toString().slice(-6);

    let codigoBarrio = "B1";

    if(barrio === "Barrio 2") codigoBarrio = "B2";
    if(barrio === "Barrio 3") codigoBarrio = "B3";
    if(barrio === "Barrio 4") codigoBarrio = "B4";
    if(barrio === "Barrio 5") codigoBarrio = "B5";

    return `EV2026-${codigoBarrio}-${numero}`;
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
`&usuarioRegistro=${encodeURIComponent(usuarioActivo.usuario)}`;

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

    document.getElementById("reader").style.display = "block";

    const scanner = new Html5Qrcode("reader");

    scanner.start(
        { facingMode: "environment" },
        {
            fps: 10,
            qrbox: 250
        },
        async (folio) => {

            await scanner.stop();

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

        document
            .getElementById("panelScreen")
            .classList.add("hidden");

        document
            .getElementById("consultaScreen")
            .classList.remove("hidden");

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

        consultarFamilia(
            familiaActual.folio
        );
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

        consultarFamilia(
            familiaActual.folio
        );
    }
}
function verHistorial(){

    alert(
      "Historial disponible en siguiente fase"
    );

}
