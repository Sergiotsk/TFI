# Idea candidata — Reportes personalizados del Boletín Oficial

## El problema

El Boletín Oficial publica todos los días cientos de páginas de normas. Es
información pública y obligatoria, pero ilegible para una persona común.

Hoy, enterarte de una norma que te afecta depende de tener un contador o un
abogado que te avise. El comerciante, el profesional independiente o el
monotributista se entera tarde o no se entera.

## La solución

El sistema baja el Boletín todos los días, procesa cada norma y la clasifica por
tema, rubro y zona. El usuario declara quién es —"comerciante gastronómico en
La Matanza"— y recibe solo lo que le toca, resumido en criollo.

**Lo que lo hace un TFI y no un filtro por palabras:** que el sistema entienda de
qué trata una norma aunque no use las palabras exactas, y que la resuma en lenguaje
entendible. Ahí está el procesamiento de texto real.

## Por qué se defiende bien

- Materia prima infinita, gratuita y pública
- El valor de transformar es altísimo: nadie lee el original
- Ángulo social: democratiza el acceso a información legal
- No es ecommerce ni un rubro saturado

**Riesgo a cubrir en la defensa:** existen servicios pagos de alertas legales para
empresas grandes. El diferencial es el usuario chico, que no paga una suscripción
cara.

---

## Viabilidad legal y técnica

| Punto | Estado |
|---|---|
| Contenido | Público por definición, sin derecho de autor sobre las normas |
| Antecedentes | Hay scrapers públicos en GitHub (uno con Scrapy, otro con BeautifulSoup) |
| API oficial | **No hay** para el Boletín argentino. Se scrapea. |
| Cuidado | Ojo: la API que aparece en las búsquedas es la del Boletín **español**, no sirve |

**Scraping responsable:** con pausas entre pedidos, sin bombardear el sitio, y
revisando los términos de uso. Un scraping agresivo puede terminar en IP bloqueada.

---

## Stack recomendado

### Para arrancar (prototipo)

| Herramienta | Para qué |
|---|---|
| Python | Base de todo |
| `requests` | Bajar las páginas |
| `BeautifulSoup` | Extraer el contenido del HTML |
| `pdfplumber` | Extraer texto de los PDF del Boletín |

Con eso alcanza para el prototipo. **No empezar por lo complejo.**

### Cartas por si el sitio complica

| Herramienta | Cuándo la necesitás |
|---|---|
| `Scrapy` | Si hay que recorrer muchas páginas encadenadas, paralelizar y manejar reintentos |
| `Playwright` | Solo si el contenido se carga con JavaScript y no aparece en el HTML crudo |
| `Tesseract` (OCR) | Solo si aparecen PDF escaneados como imagen |

**Verificar primero:** si el contenido está en el HTML directo, `requests` alcanza y
te ahorrás Playwright entero.

---

## Arquitectura

No scrapear en vivo en cada consulta del usuario.

```
[Boletín Oficial]
       ↓  (1 vez por día)
   Scraper
       ↓
  Procesamiento + clasificación
       ↓
   Base de datos propia
       ↓
  Consultas y alertas del usuario
```

Ventajas: más rápido, más robusto ante caídas del sitio original, y más amable con
el servidor de ellos.

---

## Sostenibilidad (nota a futuro, fuera del alcance del TFI)

No es objetivo del trabajo académico. Se anota solo para no cerrar puertas de diseño:

- **Donaciones** (Cafecito): encaja con el espíritu de acceso a información pública
- **Freemium**: consulta general gratis, alertas personalizadas automáticas pagas
- **API para profesionales**: estudios contables y jurídicos pagarían por acceso a
  una base estructurada del Boletín, que hoy no existe prolija

Si la base de datos y el sistema de alertas están bien diseñados desde el arranque,
esta capa se enchufa después sin rehacer nada.
