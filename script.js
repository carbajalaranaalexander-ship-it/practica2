// Variables globales
let canvas, ctx;
let elementosRuleta = [];
let elementosOcultos = new Set();
let elementoResaltado = null;
let rotacionActual = 0;
let estaGirando = false;
let ultimoSeleccionado = null;

// Paleta de colores cíclicos
const paletaColores = [
    '#FF6B6B', // Rojo coral
    '#4ECDC4', // Turquesa
    '#45B7D1', // Azul cielo
    '#96CEB4', // Verde menta
    '#FFEAA7'  // Amarillo pastel
];

// Inicialización cuando el DOM está cargado
document.addEventListener('DOMContentLoaded', function () {
    inicializarCanvas();
    cargarDatosGuardados();
    configurarEventos();
    actualizarRuleta();
});

function inicializarCanvas() {
    canvas = document.getElementById('ruletaCanvas');
    ctx = canvas.getContext('2d');

    // Ajustar tamaño del canvas para alta densidad de píxeles
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    ctx.scale(dpr, dpr);

    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
}

function configurarEventos() {
    // Eventos del canvas
    canvas.addEventListener('click', function () {
        if (!estaGirando) {
            girarRuleta();
        }
    });

    // Eventos de botones
    document.getElementById('btnIniciar').addEventListener('click', function () {
        if (!estaGirando) {
            girarRuleta();
        }
    });

    document.getElementById('btnReiniciar').addEventListener('click', reiniciarTodo);
    document.getElementById('btnPantallaCompleta').addEventListener('click', togglePantallaCompleta);

    // Evento del textarea
    document.getElementById('textareaDatos').addEventListener('input', function () {
        guardarDatos();
        actualizarRuleta();
    });

    // Eventos de teclado
    document.addEventListener('keydown', function (evento) {
        // Evitar que las teclas funcionen cuando estamos escribiendo en el textarea
        if (evento.target.tagName === 'TEXTAREA' && evento.key !== 'Escape') {
            return;
        }

        switch (evento.key.toLowerCase()) {
            case ' ':
                evento.preventDefault();
                if (!estaGirando) {
                    girarRuleta();
                }
                break;
            case 's':
                evento.preventDefault();
                resaltarUltimoSeleccionado();
                break;
            case 'r':
                evento.preventDefault();
                reiniciarTodo();
                break;
            case 'f':
                evento.preventDefault();
                togglePantallaCompleta();
                break;
        }
    });
}

function obtenerElementosDelTextarea() {
    const textarea = document.getElementById('textareaDatos');
    const texto = textarea.value.trim();

    if (!texto) {
        return [];
    }

    return texto.split('\n')
        .map(linea => linea.trim())
        .filter(linea => linea.length > 0);
}

function actualizarRuleta() {
    elementosRuleta = obtenerElementosDelTextarea();
    dibujarRuleta();
}

function dibujarRuleta() {
    const centerX = 200;
    const centerY = 200;
    const radio = 180;

    // Limpiar canvas
    ctx.clearRect(0, 0, 400, 400);

    if (elementosRuleta.length === 0) {
        // Dibujar ruleta vacía
        ctx.beginPath();
        ctx.arc(centerX, centerY, radio, 0, 2 * Math.PI);
        ctx.fillStyle = '#f0f0f0';
        ctx.fill();
        ctx.strokeStyle = '#ccc';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#999';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Sin elementos', centerX, centerY);
        return;
    }

    // Filtrar elementos ocultos
    const elementosVisibles = elementosRuleta.filter((elemento, indice) => {
        return !elementosOcultos.has(indice);
    });

    if (elementosVisibles.length === 0) {
        // Dibujar ruleta vacía si todos están ocultos
        ctx.beginPath();
        ctx.arc(centerX, centerY, radio, 0, 2 * Math.PI);
        ctx.fillStyle = '#f0f0f0';
        ctx.fill();
        ctx.strokeStyle = '#ccc';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#999';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Todos los elementos ocultos', centerX, centerY);
        return;
    }

    const anguloPorSector = (2 * Math.PI) / elementosVisibles.length;

    // Guardar el estado actual del contexto
    ctx.save();

    // Aplicar rotación
    ctx.translate(centerX, centerY);
    ctx.rotate(rotacionActual);
    ctx.translate(-centerX, -centerY);

    // Dibujar sectores
    elementosVisibles.forEach((elemento, indice) => {
        const anguloInicio = indice * anguloPorSector;
        const anguloFin = (indice + 1) * anguloPorSector;

        // Dibujar sector
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radio, anguloInicio, anguloFin);
        ctx.closePath();

        // Asignar color cíclico
        const colorIndex = indice % paletaColores.length;
        ctx.fillStyle = paletaColores[colorIndex];
        ctx.fill();

        // Dibujar borde
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Dibujar texto
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(anguloInicio + anguloPorSector / 2);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px Arial';
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 3;

        // Truncar texto si es muy largo
        let textoMostrar = elemento;
        if (textoMostrar.length > 15) {
            textoMostrar = textoMostrar.substring(0, 12) + '...';
        }

        ctx.fillText(textoMostrar, radio * 0.7, 0);
        ctx.restore();
    });

    // Restaurar el estado del contexto
    ctx.restore();

    // Dibujar círculo central
    ctx.beginPath();
    ctx.arc(centerX, centerY, 20, 0, 2 * Math.PI);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.stroke();
}

function girarRuleta() {
    if (estaGirando || elementosRuleta.length === 0) {
        return;
    }

    // Filtrar elementos ocultos
    const elementosVisibles = elementosRuleta.filter((elemento, indice) => {
        return !elementosOcultos.has(indice);
    });

    if (elementosVisibles.length === 0) {
        mostrarResultado('No hay elementos visibles para sortear');
        return;
    }

    estaGirando = true;

    // Calcular rotación aleatoria
    const rotacionesAdicionales = Math.floor(Math.random() * 5) + 5; // 5-10 rotaciones completas
    const anguloFinal = Math.random() * 2 * Math.PI;
    const rotacionTotal = rotacionesAdicionales * 2 * Math.PI + anguloFinal;

    // Duración de la animación
    const duracion = 3000; // 3 segundos
    const tiempoInicio = Date.now();
    const rotacionInicio = rotacionActual;

    function animar() {
        const tiempoTranscurrido = Date.now() - tiempoInicio;
        const progreso = Math.min(tiempoTranscurrido / duracion, 1);

        // Función de easing para desaceleración suave
        const easeOut = 1 - Math.pow(1 - progreso, 3);

        rotacionActual = rotacionInicio + rotacionTotal * easeOut;
        dibujarRuleta();

        if (progreso < 1) {
            requestAnimationFrame(animar);
        } else {
            estaGirando = false;
            determinarGanador();
        }
    }

    animar();
}

function determinarGanador() {
    // Calcular qué sector está en la posición superior (donde apunta el triángulo)
    const elementosVisibles = elementosRuleta.filter((elemento, indice) => {
        return !elementosOcultos.has(indice);
    });

    if (elementosVisibles.length === 0) {
        return;
    }

    // Normalizar la rotación a 0-2π
    let rotacionNormalizada = rotacionActual % (2 * Math.PI);
    if (rotacionNormalizada < 0) {
        rotacionNormalizada += 2 * Math.PI;
    }

    // El triángulo apunta hacia arriba (posición 12 en reloj)
    // Necesitamos encontrar qué sector está en esa posición
    // La rotación del canvas mueve los sectores en sentido horario
    // Para encontrar el sector en la parte superior, usamos el ángulo negativo
    let anguloSuperior = (-rotacionNormalizada + Math.PI / 2 - Math.PI) % (2 * Math.PI);
    if (anguloSuperior < 0) {
        anguloSuperior += 2 * Math.PI;
    }

    const anguloPorSector = (2 * Math.PI) / elementosVisibles.length;
    const indiceGanador = Math.floor(anguloSuperior / anguloPorSector);

    // Encontrar el índice real en el array original
    let indiceReal = -1;
    let contadorVisibles = 0;

    for (let i = 0; i < elementosRuleta.length; i++) {
        if (!elementosOcultos.has(i)) {
            if (contadorVisibles === indiceGanador) {
                indiceReal = i;
                break;
            }
            contadorVisibles++;
        }
    }

    if (indiceReal !== -1) {
        ultimoSeleccionado = {
            elemento: elementosRuleta[indiceReal],
            indice: indiceReal
        };

        mostrarResultado(`¡${elementosRuleta[indiceReal]}!`);
    }
}

function mostrarResultado(texto) {
    const divRespuesta = document.getElementById('respuesta');
    divRespuesta.textContent = texto;
    divRespuesta.style.animation = 'none';
    setTimeout(() => {
        divRespuesta.style.animation = 'pulse 0.5s ease-in-out';
    }, 10);
}

function resaltarUltimoSeleccionado() {
    if (!ultimoSeleccionado) {
        mostrarResultado('No hay elemento seleccionado para resaltar');
        return;
    }

    // Ocultar el elemento de la ruleta
    elementosOcultos.add(ultimoSeleccionado.indice);

    // Resaltar en el textarea
    const textarea = document.getElementById('textareaDatos');
    const lineas = textarea.value.split('\n');

    if (ultimoSeleccionado.indice < lineas.length) {
        // Crear una clase CSS para resaltar
        lineas[ultimoSeleccionado.indice] = `[RESALTADO] ${lineas[ultimoSeleccionado.indice]}`;
        textarea.value = lineas.join('\n');

        // Guardar el estado resaltado
        elementoResaltado = ultimoSeleccionado.indice;

        guardarDatos();
        actualizarRuleta();
        mostrarResultado(`Elemento "${ultimoSeleccionado.elemento}" resaltado y oculto`);
    }
}

function reiniciarTodo() {
    // Limpiar conjuntos y variables
    elementosOcultos.clear();
    elementoResaltado = null;
    ultimoSeleccionado = null;
    rotacionActual = 0;
    estaGirando = false;

    // Restaurar textarea quitando resaltados
    const textarea = document.getElementById('textareaDatos');
    const lineas = textarea.value.split('\n');
    const lineasLimpias = lineas.map(linea =>
        linea.replace(/^\[RESALTADO\]\s*/, '')
    );
    textarea.value = lineasLimpias.join('\n');

    // Actualizar ruleta y guardar
    actualizarRuleta();
    guardarDatos();
    mostrarResultado('Ruleta reiniciada completamente');
}

function togglePantallaCompleta() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.error(`Error al intentar pantalla completa: ${err.message}`);
        });
    } else {
        document.exitFullscreen();
    }
}

function guardarDatos() {
    const datos = {
        textarea: document.getElementById('textareaDatos').value,
        elementosOcultos: Array.from(elementosOcultos),
        elementoResaltado: elementoResaltado,
        ultimoSeleccionado: ultimoSeleccionado
    };

    localStorage.setItem('ruletaDatos', JSON.stringify(datos));
}

function cargarDatosGuardados() {
    const datosGuardados = localStorage.getItem('ruletaDatos');

    if (datosGuardados) {
        try {
            const datos = JSON.parse(datosGuardados);

            // Restaurar textarea
            if (datos.textarea) {
                document.getElementById('textareaDatos').value = datos.textarea;
            }

            // Restaurar elementos ocultos
            if (datos.elementosOcultos && Array.isArray(datos.elementosOcultos)) {
                elementosOcultos = new Set(datos.elementosOcultos);
            }

            // Restaurar otros estados
            elementoResaltado = datos.elementoResaltado;
            ultimoSeleccionado = datos.ultimoSeleccionado;

        } catch (error) {
            console.error('Error al cargar datos guardados:', error);
        }
    }
}

// Agregar animación CSS para el pulso
const estilo = document.createElement('style');
estilo.textContent = `
    @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
    }
`;
document.head.appendChild(estilo);
