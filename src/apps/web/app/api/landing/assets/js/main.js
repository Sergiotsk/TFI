(function () {
    'use strict';

    var sinMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var NOMBRE = 'Sistema de Ingreso TUP';

    /* ---------- Navegación entre vistas (SPA con hash) ----------
       #/  #/institucion  #/nosotros  #/contacto */
    var RUTAS = { '': 'home', '/': 'home', '/institucion': 'institucion', '/nosotros': 'nosotros', '/contacto': 'contacto' };
    var vistas = Array.prototype.slice.call(document.querySelectorAll('[data-view]'));
    var enlaces = Array.prototype.slice.call(document.querySelectorAll('a[data-ruta]'));
    var boton = document.querySelector('.nav-toggle');
    var menu = document.getElementById('menu-principal');
    var primeraVez = true;

    function vistaDeLaUrl() {
        var h = window.location.hash.replace(/^#/, '');
        return RUTAS.hasOwnProperty(h) ? RUTAS[h] : 'home';
    }

    function mostrar(nombre) {
        var activa = null;
        vistas.forEach(function (v) {
            var esta = v.getAttribute('data-view') === nombre;
            v.classList.toggle('is-activa', esta);
            if (esta) { activa = v; }
        });
        enlaces.forEach(function (a) {
            if (a.getAttribute('data-ruta') === nombre && a.closest('.menu')) {
                a.setAttribute('aria-current', 'page');
            } else {
                a.removeAttribute('aria-current');
            }
        });
        if (activa) {
            document.title = NOMBRE + ' | ' + activa.getAttribute('data-titulo');
            if (!primeraVez) {
                window.scrollTo(0, 0);
                var h1 = activa.querySelector('h1');
                if (h1) { h1.focus({ preventScroll: true }); }
            }
        }
        primeraVez = false;
        cerrarMenu();
    }

    function cerrarMenu() {
        if (boton && menu) {
            boton.setAttribute('aria-expanded', 'false');
            menu.classList.remove('is-abierto');
        }
    }

    if (boton && menu) {
        boton.addEventListener('click', function () {
            var abierto = boton.getAttribute('aria-expanded') === 'true';
            boton.setAttribute('aria-expanded', String(!abierto));
            menu.classList.toggle('is-abierto', !abierto);
        });
    }

    window.addEventListener('hashchange', function () { mostrar(vistaDeLaUrl()); });
    mostrar(vistaDeLaUrl());

    /* Botones que llevan a una sección dentro de la vista (no usan el hash, que es de la navegación) */
    document.addEventListener('click', function (ev) {
        var b = ev.target.closest('[data-scroll]');
        if (!b) { return; }
        var destino = document.getElementById(b.getAttribute('data-scroll'));
        if (destino) { destino.scrollIntoView({ behavior: sinMovimiento ? 'auto' : 'smooth', block: 'start' }); }
    });

    /* ---------- Imágenes opcionales: si el archivo existe se muestra, si no queda el marcador ---------- */
    Array.prototype.forEach.call(document.querySelectorAll('img[data-src]'), function (img) {
        var prueba = new Image();
        prueba.onload = function () {
            img.src = img.getAttribute('data-src');
            img.hidden = false;
            var contenedor = img.closest('.foto, .persona__foto, .marca');
            if (contenedor) { contenedor.classList.add('tiene-imagen'); }
        };
        prueba.src = img.getAttribute('data-src');
    });

    /* ---------- Aparición suave al hacer scroll ---------- */
    if ('IntersectionObserver' in window && !sinMovimiento) {
        document.documentElement.classList.add('reveal-on');
        var obs = new IntersectionObserver(function (entradas) {
            entradas.forEach(function (e) {
                if (e.isIntersecting) { e.target.classList.add('is-visible'); obs.unobserve(e.target); }
            });
        }, { threshold: 0.12 });
        Array.prototype.forEach.call(document.querySelectorAll('.reveal'), function (el) { obs.observe(el); });
    }

    /* ---------- Recorrido de la Postulación (Home) ---------- */
    var ticket = document.querySelector('[data-tracker]');
    if (ticket) {
        var pasos = Array.prototype.slice.call(ticket.querySelectorAll('[data-paso]'));
        var repetir = ticket.querySelector('[data-repetir]');
        var timers = [];

        var reproducir = function () {
            timers.forEach(clearTimeout);
            timers = [];
            pasos.forEach(function (p) { p.classList.remove('is-alcanzado'); });
            pasos.forEach(function (p, i) {
                timers.push(setTimeout(function () { p.classList.add('is-alcanzado'); }, 500 + i * 800));
            });
        };

        if (sinMovimiento) {
            pasos.forEach(function (p) { p.classList.add('is-alcanzado'); });
        } else {
            ticket.classList.add('is-listo');
            if (repetir) { repetir.hidden = false; repetir.addEventListener('click', reproducir); }
            reproducir();
        }
    }

    /* ---------- Formulario de contacto ---------- */
    var form = document.getElementById('form-contacto');
    if (form) {
        var estado = document.getElementById('form-estado');
        var mensaje = document.getElementById('c-mensaje');
        var contador = document.getElementById('contador');
        var campos = ['nombre', 'email', 'asunto', 'mensaje'];
        var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        mensaje.addEventListener('input', function () { contador.textContent = String(mensaje.value.length); });

        var marcar = function (campo, texto) {
            var input = form.elements[campo];
            var err = document.getElementById('err-' + campo);
            err.textContent = texto || '';
            if (texto) { input.setAttribute('aria-invalid', 'true'); } else { input.removeAttribute('aria-invalid'); }
        };

        var validar = function () {
            var errores = {};
            var v = function (c) { return form.elements[c].value.trim(); };
            if (v('nombre').length < 2) { errores.nombre = 'Escribí tu nombre.'; }
            if (!EMAIL.test(v('email'))) { errores.email = 'Ingresá un email válido.'; }
            if (!v('asunto')) { errores.asunto = 'Elegí un motivo de consulta.'; }
            if (v('mensaje').length < 10) { errores.mensaje = 'Contanos un poco más (mínimo 10 caracteres).'; }
            return errores;
        };

        form.addEventListener('submit', function (ev) {
            ev.preventDefault();
            estado.className = 'form__estado';
            estado.textContent = '';

            var errores = validar();
            campos.forEach(function (c) { marcar(c, errores[c]); });
            var primero = campos.filter(function (c) { return errores[c]; })[0];
            if (primero) { form.elements[primero].focus(); return; }

            var envio = form.querySelector('button[type="submit"]');
            envio.disabled = true;
            estado.textContent = 'Enviando…';

            var datos = {};
            ['nombre', 'email', 'asunto', 'mensaje', 'sitio_web'].forEach(function (c) { datos[c] = form.elements[c].value.trim(); });

            fetch(form.getAttribute('data-endpoint'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(datos)
            })
                .then(function (r) { return r.json().catch(function () { return { ok: false }; }).then(function (j) { return { status: r.status, json: j }; }); })
                .then(function (res) {
                    if (res.json.ok) {
                        form.reset();
                        contador.textContent = '0';
                        estado.className = 'form__estado form__estado--ok';
                        estado.textContent = 'Gracias, recibimos tu consulta. Te vamos a responder por email.';
                    } else {
                        if (res.json.errores) {
                            campos.forEach(function (c) { marcar(c, res.json.errores[c]); });
                        }
                        estado.className = 'form__estado form__estado--error';
                        estado.textContent = res.json.mensaje || 'No pudimos enviar tu consulta. Probá de nuevo en un rato.';
                    }
                })
                .catch(function () {
                    estado.className = 'form__estado form__estado--error';
                    estado.textContent = 'No hay conexión con el servidor. Revisá tu conexión y probá de nuevo.';
                })
                .then(function () { envio.disabled = false; });
        });
    }
})();
