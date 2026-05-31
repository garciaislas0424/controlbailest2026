// =========================
// CONFIG
// =========================

const API_URL =
"https://script.google.com/macros/s/AKfycbzOXqcVGIolVMcu6o6N7Y_L53bLAUidud9V339YkQQT3yUsNSCCZBFBvVTAbYWIyaz9/exec";

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

function login(){

    const usuario =
        document.getElementById("usuario").value;

    const password =
        document.getElementById("password").value;

    if(usuario === "" || password === ""){
        alert("Ingrese usuario y contraseña");
        return;
    }

    document
        .getElementById("loginScreen")
        .classList.add("hidden");

    document
        .getElementById("panelScreen")
        .classList.remove("hidden");

    document.getElementById("infoUsuario").innerHTML = `
        ${usuarioActivo.nombre}<br>
        ${usuarioActivo.telefono}<br>
        ${usuarioActivo.barrio}
    `;
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

        const response =
            await fetch(API_URL,{
                method:"POST",
                body:JSON.stringify(payload)
            });

        const data =
            await response.json();

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

    alert(
        "Escáner QR disponible en la siguiente fase"
    );
}