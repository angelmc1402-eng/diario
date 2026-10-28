# Diario

Diario personal de comidas, actividad física, objetivos, hitos, peso, medidas corporales y citas. Interfaz en español para ordenador y móvil, con datos privados en Supabase y publicación en GitHub Pages.

**Web:** [angelmc1402-eng.github.io/diario](https://angelmc1402-eng.github.io/diario/)  
**Autor del proyecto:** Ángel Moreno  
**Documentación:** 28 de octubre de 2026

## Documentación

- [Memoria completa en PDF](docs/MEMORIA.pdf).
- [Memoria editable en Markdown](docs/MEMORIA.md).
- [Texto para incorporar a otra memoria](docs/TEXTO-PARA-MEMORIA.md).

## Funciones

- Acceso con correo y contraseña; perfil inicial y ajustes personales.
- Quincenas de 14 días desde la fecha de inicio, con días desplegables.
- Desayuno, comida y cena preparados; merienda opcional. Una entrada por tipo y fecha.
- Notas y varias fotos por comida, mediante galería o cámara del dispositivo.
- Compresión a JPEG de hasta 1600 píxeles en el lado mayor y visor dentro de la página, con ampliación, navegación y cierre con Escape.
- Varias sesiones de deporte al día, con duración y nota opcionales.
- Objetivos diarios, de deporte semanal o con marcas manuales. Se pueden copiar a la siguiente quincena sin sus marcas.
- Hitos fechados, registro de peso con gráfica, citas y exportación JSON.
- Medidas corporales por quincena: cintura, cadera, pecho, brazo y muslo, con fichas, gráfica por tipo, historial y ayuda breve.
- Edición y eliminación de registros desde móvil u ordenador.
- Menú lateral en escritorio, menú plegable en móvil y tamaños de texto mayores en escritorio para navegación y datos secundarios.

## Semanas y quincenas

Las **quincenas** organizan las revisiones; el deporte se cuenta por **semanas de lunes a domingo**. Se cuentan días distintos, no el número de sesiones.

Si una quincena empieza el miércoles 28 de octubre, el deporte del martes 27 cuenta en la semana del lunes 26 al domingo 1. La semana puede aparecer en dos quincenas con el mismo recuento: no se duplican registros.

Las semanas que solo coinciden parcialmente con la quincena se identifican como parciales. Una revisión entre semana no las cierra: continúan en curso hasta el domingo. El resumen distingue la actividad semanal de los días con deporte dentro del periodo visible.

## Arquitectura

Aplicación estática con JavaScript, HTML y CSS. Vite construye la web; Supabase aporta autenticación, PostgreSQL y almacenamiento privado. No hay un servidor propio en GitHub Pages.

| Archivo | Responsabilidad |
| --- | --- |
| `src/main.js` | Interfaz, sesión, formularios y operaciones del diario |
| `src/measurements.js` | Validación, series y vista de medidas corporales |
| `src/domain.js` | Fechas, quincenas, semanas, recuentos y gráfica |
| `src/goal-store.js` | Guardado de objetivos y alternativa ante errores de red |
| `src/photo-viewer.js` | Visor de imágenes que conserva el formulario |
| `src/style.css` | Diseño adaptable y legibilidad |
| `supabase/setup.sql` | Esquema y permisos para proyectos nuevos |
| `supabase/goal-update.sql` | Función de actualización de objetivos con los permisos del usuario |
| `.github/workflows/deploy.yml` | Pruebas, construcción y despliegue |

Versiones observadas en el lockfile instalado: Vite 7.3.7 y `@supabase/supabase-js` 2.118.0. `package-lock.json` permite repetir la instalación mediante `npm ci`.

## Desarrollo local

Requisito: Node.js 22.12 o superior.

```bash
npm ci
cp .env.example .env.local
npm run dev
```

En Windows puedes copiar el archivo manualmente. Abre la URL de Vite incluyendo `/diario/`.

```bash
npm test
npm run build
npm run preview
```

## Configurar Supabase

En un proyecto nuevo, ejecuta `supabase/setup.sql` desde SQL Editor. Crea nueve tablas: `profiles`, `meals`, `exercise`, `goals`, `goal_checks`, `milestones`, `weights`, `measurements` y `appointments`; activa RLS y crea el contenedor privado `comidas` con sus políticas.

En un proyecto que ya tiene las tablas, no recrees ni borres los datos para actualizar la web. La función de recuperación del guardado de objetivos está en `supabase/goal-update.sql` y ya se ha aplicado al proyecto original.

1. Crea un usuario con correo confirmado en **Authentication → Users**.
2. Para uso individual, desactiva nuevos registros y el acceso anónimo.
3. En **Authentication → URL Configuration**, configura la dirección de la web como Site URL y añádela a Redirect URLs.
4. Comprueba la entrega del correo para recuperar la contraseña.

```env
VITE_SUPABASE_URL=https://TU-PROYECTO.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=TU-CLAVE-PUBLICABLE
```

Utiliza únicamente una clave publicable en el cliente. La contraseña de la base de datos y las claves secret o service_role no deben subirse al repositorio ni incluirse en Vite.

## Publicar en GitHub Pages

1. Abre **Settings → Pages → Build and deployment → Source** y selecciona exactamente **GitHub Actions**.
2. Para otro proyecto Supabase, define `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY` en **Settings → Secrets and variables → Actions → Variables**. El workflow incluye valores públicos de respaldo para el proyecto original.
3. Sube los cambios a `main`. **Publicar diario** instalará las dependencias, ejecutará las pruebas, construirá `dist` y lo desplegará.
4. Comprueba que el proceso termina correctamente. También puede ejecutarse desde **Run workflow**.

El workflow ajusta la ruta base al nombre del repositorio. No combines la publicación desde una rama con este workflow: la primera puede servir el HTML fuente sin construir y dejar la página vacía. Los artefactos incluyen el número de intento para permitir relanzamientos sin colisiones.

## Datos y privacidad

- RLS restringe las filas por `user_id`. La función alternativa de objetivos usa `security invoker`, exige el propietario y respeta RLS.
- Las fotos se guardan bajo `ID_USUARIO/UUID.jpg` y se muestran mediante enlaces firmados temporales. Esos enlaces permiten acceder a la imagen durante su vigencia a quien los posea.
- La exportación JSON contiene registros y rutas; no incluye los archivos de imagen. No es una copia de seguridad completa de las fotos.
- Los datos de demostración se mantienen en memoria y no se escriben en Supabase.
- Las fechas y citas se presentan en `Europe/Madrid`. La edad del perfil es la edad al empezar.
- El diario registra información: no realiza diagnósticos, recomendaciones clínicas ni cálculos automáticos de objetivos de peso.

## Pruebas y estado

La batería actual contiene **24 pruebas**: fechas y límites de quincena, semanas naturales y revisiones parciales, días distintos de deporte, gráfica, escape de texto, recuperación de fallos de transporte al editar objetivos y validación de medidas, fechas y series con datos incompletos.

Se han comprobado la construcción de producción y, en el navegador publicado con datos de prueba, el registro de deporte fuera del inicio de quincena, la navegación del visor, la ampliación, Escape y la conservación de notas sin guardar. La función de objetivos también se ha probado dentro de una transacción revertida: acceso del propietario, rechazo de otra identidad y falta de permiso anónimo.

La prueba de escritorio no sustituye una revisión completa en dispositivos físicos ni una auditoría integral de seguridad. No se ha utilizado la contraseña del propietario para validar su cuenta.

## Límites y mantenimiento

Se necesita internet para guardar. Un error de transporte puede impedir confirmar una escritura; se conserva el formulario y se informa del problema. La alternativa POST solo se aplica a la edición de objetivos ante un fallo de red; no resuelve una caída general de Supabase ni se utiliza para ocultar errores de permisos.

No se incluyen trabajo sin conexión, sincronización en segundo plano, notificaciones, copia completa de imágenes ni una APK. El soporte HEIC depende del navegador; si no puede decodificarlo, utiliza JPEG o PNG. Las cuotas, la disponibilidad y las copias de seguridad dependen de Supabase.

Antes de ampliar funciones, revisa el esquema, añade pruebas para las reglas afectadas, ejecuta los controles existentes y verifica la web publicada. Conserva por separado las copias de los registros y las fotografías.

## Medidas corporales

La sección **Medidas** aparece debajo de Peso. Cada usuario puede guardar un conjunto por quincena con fecha real de medición dentro de ese periodo. Incluye cintura, cadera, pecho, brazo y muslo, en centímetros y con un decimal. Basta con rellenar una medida; se pueden completar o corregir las demás después.

Las fichas muestran los valores de la quincena seleccionada. Al elegir una ficha cambia la gráfica de ese contorno. El historial conserva todos los periodos y las gráficas omiten los campos vacíos sin interpretarlos como cero. Si se salta una quincena, la separación temporal se conserva. Se pueden editar y eliminar los registros; también se incluyen en la exportación JSON.

El límite de entrada de 500 cm es una validación técnica contra errores de escritura, no un umbral clínico. No se asignan rangos saludables ni objetivos automáticos.

El esquema para esta sección está en `supabase/measurements.sql` y se incluye en `supabase/setup.sql` para instalaciones nuevas. Ya se ha aplicado al proyecto original. La tabla tiene RLS, cuatro políticas de propietario y una clave única por usuario y fecha inicial de quincena. El guardado utiliza upsert por POST y confirma que se devuelve un identificador.
