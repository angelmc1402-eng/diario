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

El workflow obtiene la ruta base de GitHub Pages antes de compilar: `/diario/` para el subdirectorio del repositorio o `/` para un dominio propio. No combines la publicación desde una rama con este workflow: la primera puede servir el HTML fuente sin construir y dejar la página vacía. Los artefactos incluyen el número de intento para permitir relanzamientos sin colisiones.

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

## Semanas, expertos e informes

En el alta del perfil y en Ajustes se elige entre quincenas de revisión (14 días desde el inicio) y semanas naturales (lunes a domingo). El cambio conserva el historial. Medidas admite conjuntos de 7 o 14 días con gráficas compartidas.

Cada comida incluye un desplegable **Opciones para expertos**: cantidad total en gramos, kcal estimadas, proteína, hidratos, grasas, fibra, sal y origen de los datos. Son valores del total de la comida, introducidos manualmente; las fotografías no se analizan. Ejercicio permite tipo, grupos musculares, kcal estimadas y origen, distancia, pasos, series iguales, repeticiones, carga y esfuerzo percibido 1–10. Para distintas cargas se registra cada ejercicio o bloque por separado.

Objetivos ofrece caminar, ejercicio, agua, lectura y personalizado. Se ajustan cantidad, fechas, frecuencia y notas. Caminar suma minutos clasificados como caminar; un total manual sustituye el cálculo de ese día. Ejercicio cuenta días distintos de lunes a domingo, incluso fuera de la quincena. Los totales por periodo mantienen las fechas originales al cambiar de modo.

**Informe nutricional**, debajo de Medidas, muestra semanas, gráfica de kcal o proteína, medias y detalle editable por día. Cada media divide entre los días con datos de esa métrica y muestra su cobertura. Los valores vacíos no son cero. La opción de días completos exige confirmar el día y completar cada comida o sesión para la métrica consultada. Un descanso confirmado sin sesiones cuenta como cero gasto de ejercicio; un día sin registrar no. El gasto no incluye metabolismo basal ni actividad no anotada.

**Entrenamiento** agrupa tipos y músculos, muestra las sesiones y las comidas de la misma fecha, y compara proteína anotada en días con actividad y descanso confirmado. La carga externa (series × repeticiones × kg) solo usa bloques de fuerza completos. Estas comparaciones no estiman necesidades ni prueban efectos clínicos.

La guía aparece al entrar por primera vez y se puede repetir desde Ayuda. Los datos nuevos están protegidos por las mismas políticas de propietario. La ampliación del esquema está en `supabase/advanced-journal.sql`; incluye `day_status` y la función segura `update_diary_goal_v2`. La batería ampliada contiene **37 pruebas**.


## Mi cuerpo, comidas y demostración ampliada

Mi cuerpo guarda registros con fecha y fotos frontal, lateral y trasera. Basta una vista; se pueden editar, comparar fechas y ampliar en el visor. La tabla `body_photos` y el bucket privado `cuerpo` aplican políticas de propietario; las imágenes se comprimen y se consultan con enlaces firmados temporales. La exportación JSON incluye rutas, no copias de los archivos.

Las comidas admiten almuerzo y hora local opcional (Europe/Madrid, sin convertirla en un instante UTC). Los objetivos ofrecen «Mínimo», con cantidades, y «Solo una vez al día», con casilla y confirmación. Los objetivos diarios antiguos de una vez conservan ese comportamiento. Los botones Editar de las tarjetas de objetivos comparten el mismo pie.

En la prueba sin iniciar sesión, «Previsualizar datos de prueba» genera 120 días ficticios: cinco comidas diarias con nutrientes y horas, sesiones, objetivos, marcas, pesajes, medidas, hitos y registros corporales ilustrados. Se guarda exclusivamente en memoria, sin peticiones de escritura ni lectura de imágenes externas; al recargar desaparece. No contiene registros reales ni recomendaciones personales. El botón permite restablecer la demostración.

El tema claro, oscuro o del dispositivo se conserva en este navegador, incluida la pantalla de acceso. El favicon es una manzana verde en SVG. La migración adicional está en `supabase/body-and-habits.sql`. La batería ampliada contiene 44 pruebas.


## Dominio goingfit.es

El despliegue detecta automáticamente la ruta configurada en GitHub Pages. En Settings → Pages, selecciona GitHub Actions como Source y configura goingfit.es en Custom domain. Una vez que el DNS apunte a GitHub y el certificado esté disponible, activa Enforce HTTPS y vuelve a ejecutar Publicar diario si el cambio de dominio no ha generado una publicación nueva.

En Supabase → Authentication → URL Configuration, usa `https://goingfit.es/` como Site URL y añade esa misma URL exacta a Redirect URLs. Si se sirve también www, añade `https://www.goingfit.es/`. Puedes conservar temporalmente la URL anterior de GitHub Pages. Al cambiar de origen hay que iniciar sesión otra vez; los registros y las fotografías permanecen en el mismo proyecto Supabase. No hace falta cambiar la URL del proyecto ni su clave publicable.

Las fotos de comidas y Mi cuerpo se redimensionan antes de subirlas a un máximo de 1600 px en su lado mayor y se convierten a JPEG con calidad 0,82. El tamaño final depende de la imagen; no existe un peso fijo garantizado por fotografía.


## Foto principal y PDF para la visita

En cada comida se puede elegir la foto principal entre las existentes o las nuevas, antes de guardar. Se conserva como la primera ruta del álbum; no duplica archivos ni requiere cambios de esquema. Las notas y la selección de archivos no se pierden al cambiar la portada o abrir el visor.

Al final del Resumen hay un botón «Exportar semana/quincena en PDF» para el periodo seleccionado. El informe se genera en el dispositivo e incluye perfil, resumen, gráficas, medias con cobertura, objetivos y avances, hitos, pesos, medidas, citas y detalle diario. Se identifican el último peso y las medidas anteriores usados como referencia y las sesiones de las semanas limítrofes que cuentan para los objetivos. Los días sin registros figuran en el resumen, sin generar una página vacía por fecha.

Se puede incluir o excluir fotos de comidas y datos avanzados. Las fotos y notas de Mi cuerpo están excluidas por defecto y requieren selección expresa. Las imágenes se incrustan en el PDF, sin publicar rutas privadas ni enlaces firmados. Si alguna imagen no se descarga, se informa al final del documento. La exportación no estima nutrientes a partir de fotos ni sustituye una valoración profesional.

La biblioteca PDF se carga solo al exportar y está fijada a jsPDF 4.2.1. Las 52 pruebas incluyen el orden de portadas, fechas, referencias, semanas naturales, datos incompletos, exclusión corporal y documentos con notas largas.


## Administración e invitaciones

La cuenta propietaria puede abrir **Administración** en el menú lateral para invitar por correo o crear un enlace privado de un solo uso. El destinatario acepta la invitación, elige su contraseña y configura su propio diario. No hay formulario de registro público.

- `diary_admins` contiene los administradores. Un usuario autenticado solo puede consultar su propia pertenencia, sin insertarse ni cambiar permisos. El alta inicial del propietario se realiza aparte, tras verificar su cuenta existente; no se deduce del nombre, del correo enviado por el navegador ni de `user_metadata`.
- La Edge Function `admin-invitations` valida la sesión con Auth y consulta el permiso actual en cada petición. La clave de servicio vive exclusivamente en el entorno de Supabase. El administrador no obtiene acceso a registros o fotos de otros diarios.
- El historial guarda destinatario, fecha y resultado, sin enlaces ni tokens. «Correo enviado» y «Enlace creado» no significan que la invitación haya sido aceptada. Un resultado pendiente debe revisarse antes de repetirlo.
- El envío por correo necesita un servicio SMTP adecuado y `https://goingfit.es/?invitation=1` entre las redirecciones permitidas en Auth. El enlace manual usa un token verificado por Auth desde el fragmento de `goingfit.es`, se retira de la URL al abrirlo y no necesita SMTP. Solo se verifica cuando el destinatario pulsa **Aceptar invitación**.
- Una reserva atómica impide repetir una petición, limita cada administrador a 10 intentos por hora y 50 al día, y exige un minuto entre invitaciones a un mismo correo. No se reintentan envíos automáticamente.

Despliegue: ejecutar `supabase/admin-invitations.sql` una sola vez, asignar el propietario verificado en `diary_admins` y desplegar `supabase/functions/admin-invitations/index.ts` con verificación JWT activada. No exponer funciones administrativas ni claves de servicio en Vite. Para revocar este rol basta retirar su fila de `diary_admins`; se comprueba en cada llamada al servidor.

Validación: 62 pruebas unitarias, compilación de producción, comprobación real de RLS/permisos y rechazo de llamadas sin autenticar. Las pruebas de invitación usan un proveedor simulado: no envían correos ni crean cuentas a terceros.

### Configuración de las invitaciones por correo

En Supabase → Authentication → URL Configuration:

- **Site URL:** `https://goingfit.es`
- **Redirect URLs:** `https://goingfit.es/` y `https://goingfit.es/?invitation=1`.

En Authentication → Email Templates → Invite user, usar `supabase/templates/invite.html`. Su enlace apunta directamente a la pantalla de aceptación de GoingFit con `TokenHash`; no lo verifica al abrir la página. Esto evita que una previsualización del correo consuma automáticamente `ConfirmationURL`. La sesión solo se crea al pulsar **Aceptar invitación**. No usar `localhost` como URL del sitio desplegado ni activar seguimiento de clics que modifique estos enlaces.

Los hashes actuales de Supabase Auth son SHA-224 (56 caracteres hexadecimales). Cliente y servidor admiten ese formato y el de 64 caracteres, y la validación real del token corresponde siempre a Supabase Auth. La prueba de regresión deriva un hash SHA-224 de datos ficticios usando el algoritmo del proveedor.

Tras cambiar las URLs o la plantilla, crear una invitación nueva. Las invitaciones consumidas, caducadas o sustituidas no se pueden recuperar cambiando su URL. El código muestra un aviso claro cuando recibe `otp_expired` en el retorno de Auth.

## Inicio personalizable

**Resumen → Personalizar** permite elegir tres diseños: **Diario** (distribución original), **Hábitos** (objetivos y constancia) y **Evolución** (peso, gráficas y medidas). El primer alta del diario ofrece esas mismas tres opciones; las cuentas existentes conservan Diario hasta que elijan otra distribución.

El diseño **Personalizado** permite mostrar u ocultar seis indicadores superiores, cambiar su orden y elegir entre nueve paneles. Cada panel puede moverse a la columna izquierda o derecha y ordenarse dentro de ella con botones accesibles. En ordenador se puede ampliar cualquiera de las columnas o equilibrarlas; en móvil se muestran primero los paneles de la izquierda y después los de la derecha. El PDF sigue disponible al final del resumen y Registrar hoy permite añadir comidas o ejercicio incluso con el diario oculto.

Los cambios se aplican con **Guardar diseño**. Cancelar o cerrar descarta el borrador. Las preferencias se guardan por cuenta en `profiles.dashboard_layout`, sincronizadas al cargar el perfil en otro dispositivo. El procedimiento `update_diary_dashboard` modifica únicamente ese campo bajo los permisos y RLS del usuario; no altera su perfil ni sus registros. La demo utiliza la misma personalización sin escribir en Supabase. También puede abrirse desde **Ajustes → Tu inicio**.

Para una instalación nueva, ejecutar también `supabase/dashboard-layout.sql`. La columna es opcional: un valor nulo mantiene la distribución original. La nueva versión cuenta con 74 pruebas, incluidas normalización de preferencias, separación del borrador, orden de columnas, datos desconocidos y persistencia confirmada.

En el inicio, **Personalizar vista** permite elegir paneles y ordenar indicadores. En teléfono se puede elegir entre indicadores compactos (3 por fila) o amplios (2 por fila); las columnas de escritorio se apilan en el móvil. Esta preferencia se guarda junto al diseño de la cuenta.

El selector **Modo** de los días ofrece **Lista estándar**, **Compacto · 3 días** y **Calendario**. El compacto muestra ayer, hoy y mañana en el periodo actual; en otros periodos se centra en una fecha de ese periodo. El calendario muestra siete columnas (dos filas en una quincena) y cada casilla abre el registro completo del día, con comidas, fotografías, deporte y objetivos editables. La elección se guarda en la cuenta, también desde Personalizar vista. El acceso con icono de paleta está disponible en las secciones personales y en Ajustes; siempre configura la vista de inicio.
