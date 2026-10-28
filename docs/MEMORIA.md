# Diario - Memoria técnica y funcional

**Autor del proyecto:** Ángel Moreno  
**Fecha:** 28 de octubre de 2026  
**Web:** https://angelmc1402-eng.github.io/diario/

Documento de funcionamiento, arquitectura, evolución y verificación del proyecto. No incluye registros personales del diario.

## 01 / Propósito y alcance

Diario es una aplicación web personal concebida para anotar comidas, fotografías, actividad física y evolución del peso. Su finalidad es reunir el registro cotidiano y facilitar la consulta por periodos, con una interfaz sobria y cómoda desde móvil y ordenador.

### Objetivos del proyecto

- Reducir los pasos necesarios para registrar una comida o una sesión de deporte.
- Permitir revisar una quincena sin perder el detalle de cada día.
- Separar los periodos de revisión de las semanas naturales utilizadas para los objetivos deportivos.
- Conservar los registros en una cuenta privada y poder consultarlos desde distintos dispositivos.

### Funciones incluidas

La versión documentada incluye acceso con correo y contraseña, perfil, días desplegables, comidas con notas y fotos, sesiones de deporte, objetivos, marcas diarias, hitos, pesajes con gráfica, citas y exportación JSON. Los registros se pueden crear, editar y eliminar. Se ofrece además una demostración que funciona en memoria.

### Límites funcionales

El diario no evalúa el estado de salud ni propone tratamientos. La información introducida sirve como registro personal. No se incluyen por ahora una APK, notificaciones, trabajo sin conexión o una copia de seguridad completa de las imágenes.

### Criterio de calidad

El diseño prioriza controles identificables, mensajes breves y datos legibles. La mejora de escritorio amplía los textos secundarios, los enlaces y la navegación sin transformar el diario en una interfaz recargada.

## 02 / Interfaz y uso diario

| Sección | Uso principal |
| --- | --- |
| Resumen de quincena | Consultar días, comidas, actividad, objetivos y próxima cita. |
| Objetivos | Definir el seguimiento y revisar las marcas o las semanas. |
| Hitos | Anotar logros y su fecha de cumplimiento. |
| Peso | Registrar pesajes y consultar gráfica e historial. |
| Ajustes | Editar el perfil, gestionar citas y exportar los registros. |

### Ordenador y móvil

En escritorio se utiliza un menú lateral fijo y una distribución con espacio para el diario y sus tarjetas de contexto. En móvil el menú se pliega y los bloques se adaptan al ancho disponible. Los formularios permiten introducir y modificar los mismos tipos de registros en ambos casos.

### Registro de comidas

Cada día ofrece desayuno, comida y cena. La merienda se añade cuando se necesita. Cada comida puede incluir una nota, varias imágenes o ambas. Se permite una entrada por tipo de comida y fecha. Para cambiar una comida existente se utiliza su edición, evitando duplicados.

### Visor integrado

Al pulsar una fotografía se abre un diálogo sobre la página. Permite avanzar o retroceder, ampliar y ajustar la imagen, y cerrar con el botón o Escape. El formulario permanece montado detrás del visor, por lo que las notas y los archivos pendientes no se pierden al cerrarlo.

### Medidas por quincena

La sección Medidas, debajo de Peso, permite registrar cintura, cadera, pecho, brazo y muslo en centímetros. Todos los campos son opcionales salvo que debe existir al menos una medida. Cada ficha selecciona su gráfica; los huecos se omiten sin convertirlos en cero. Hay historial, edición y ayuda para mantener el mismo criterio de medición.

### Legibilidad y accesibilidad

La navegación de escritorio pasa a 15 px y la mayor parte de los textos secundarios a 12 o 13 px. Se oscurecen etiquetas y metadatos, se amplía el lateral cuando hace falta y se mantiene la adaptación móvil. Hay etiquetas de formulario, estados de foco y reducción de movimiento; no se afirma una certificación completa de accesibilidad.

## 03 / Arquitectura técnica

La aplicación se construye con HTML, CSS y JavaScript mediante Vite. GitHub Pages sirve los archivos estáticos resultantes. Supabase proporciona autenticación, PostgreSQL y almacenamiento de fotografías. No se ejecuta un servidor de aplicación propio dentro de GitHub Pages.

GitHub Pages entrega los archivos al navegador. El navegador utiliza Supabase Auth, PostgreSQL con RLS y Storage privado.

| Módulo | Responsabilidad |
| --- | --- |
| main.js | Pantallas, sesión, formularios y coordinación de operaciones. |
| domain.js | Fechas, periodos, semanas, recuentos y puntos de la gráfica. |
| measurements.js | Validación, series con campos opcionales y vista de medidas. |
| goal-store.js | Edición confirmada y alternativa ante fallo de transporte. |
| photo-viewer.js | Diálogo de imágenes independiente del formulario. |
| style.css | Diseño adaptable, contraste y tamaños tipográficos. |

### Dependencias y recursos

Las versiones instaladas observadas son Vite 7.3.7 y @supabase/supabase-js 2.118.0. El lockfile conserva las versiones resueltas y npm ci permite reinstalarlas. La interfaz solicita DM Sans y Manrope desde Google Fonts, con fuentes del sistema como alternativa.

### Separación de responsabilidades

La interfaz organiza la experiencia, las funciones de dominio definen las reglas y Supabase aplica la autorización real. Ocultar un botón en la web no sustituye a los permisos de la base de datos.

## 04 / Modelo de datos y privacidad

| Tabla | Contenido y restricciones relevantes |
| --- | --- |
| profiles | Perfil por usuario, fecha inicial y zona horaria. |
| meals | Fecha, tipo, nota y rutas de fotos; unicidad por usuario, fecha y tipo. |
| exercise | Fecha, actividad, duración opcional y nota; admite varias sesiones. |
| goals | Título, periodo, tipo de seguimiento y meta semanal opcional. |
| goal_checks | Marca por objetivo y fecha, vinculada al mismo propietario. |
| milestones | Hito, periodo, nota y fecha de cumplimiento opcional. |
| weights | Peso, fecha y nota; un pesaje por usuario y día. |
| measurements | Cinco contornos opcionales, fecha y nota; un conjunto por usuario y quincena. |
| appointments | Título, instante de la cita y nota. |

### Acceso por propietario

Las nueve tablas tienen Row Level Security. Las políticas comparan auth.uid() con user_id para leer, crear, editar y borrar. Las consultas del cliente también filtran por usuario, pero la barrera de autorización es RLS. La función alternativa para objetivos usa security invoker y no puede saltarse estas políticas.

### Fotografías privadas

Las imágenes se almacenan en el contenedor privado comidas. Las políticas restringen las operaciones a la carpeta del usuario y la web obtiene enlaces firmados temporales para mostrarlas. Quien posea uno de esos enlaces puede usarlo durante su vigencia; no debe tratarse como un enlace público permanente.

### Configuración pública y credenciales

La web utiliza una URL de proyecto y una clave publicable. Las contraseñas de base de datos, las claves secret y service_role no forman parte del cliente. Esta memoria no reproduce registros de salud, contraseñas, correos de acceso ni fotografías personales del diario.

## 05 / Reglas de tiempo y seguimiento

### Quincenas de revisión

Una quincena contiene 14 días y se calcula a partir de la fecha inicial del perfil. Es la unidad para revisar el diario, consultar hitos y preparar los objetivos del periodo siguiente. Las fechas se presentan con la zona Europe/Madrid.

### Semanas naturales de deporte

El objetivo deportivo utiliza semanas de lunes a domingo. Se cuentan fechas distintas con actividad: dos sesiones el mismo día siguen siendo un día de deporte. El recuento semanal considera todos los registros del usuario dentro de esa semana, aunque parte de ella quede fuera de la quincena visible.

| Ejemplo de periodo | Cómo se interpreta |
| --- | --- |
| 28 oct - 10 nov de 2026 | La quincena atraviesa tres semanas naturales. |
| 26 oct - 1 nov | Semana inicial parcial; la actividad del martes 27 sí cuenta. |
| 2 nov - 8 nov | Semana completa dentro de la quincena. |
| 9 nov - 15 nov | Semana final parcial; no se cierra al cambiar de quincena. |

### Revisión en mitad de una semana

Si la revisión es el miércoles, la semana conserva su progreso hasta el domingo. Se muestra En curso y, si corresponde, Parcial en esta quincena. Puede aparecer en dos quincenas con idéntico recuento sin duplicar las sesiones. La vista mantiene separados los días de deporte del periodo y los de la semana.

### Objetivos diarios y continuidad

Los objetivos diarios se marcan por fecha dentro de su periodo. Copiar objetivos a la siguiente quincena crea sus definiciones sin trasladar las marcas. Registrar deporte en una fecha fuera de la quincena, pero dentro de sus semanas limítrofes, conserva la vista del periodo.

## 06 / Persistencia, imágenes y errores

### Flujo de guardado

El formulario valida los campos y envía la operación a Supabase con la sesión del usuario. Tras recibir una respuesta correcta se actualiza la vista. Si el guardado ya fue confirmado pero falla la recarga de datos, la interfaz diferencia ambos resultados. No existe una cola de operaciones sin conexión.

### Tratamiento de fotografías

Antes de subir una imagen se comprueba su tamaño y se intenta decodificar en el navegador. Se convierte a JPEG y se limita el lado mayor a 1600 píxeles para reducir transferencia. Los archivos reciben nombres aleatorios dentro de la carpeta del usuario. Las rutas se vinculan a la comida; la eliminación de archivos antiguos se intenta después del guardado.

### Edición de objetivos ante un fallo de red

La edición intenta primero una actualización PATCH y solicita una fila de respuesta. Ante un fallo de transporte reconocible se utiliza una función RPC por POST con los mismos valores. Ambas operaciones asignan el estado completo del objetivo, lo que permite repetir la edición si se perdió la respuesta. Los errores de permisos no activan esta alternativa.

La función comprueba el identificador y el propietario y respeta RLS. Solo se confirma el guardado cuando vuelve el identificador esperado. Si las dos vías fallan, se mantiene el formulario y se informa de que no ha sido posible confirmar la operación. Esta medida no demuestra una causa única de todos los errores Failed to fetch ni resuelve una caída general del servicio.

### Incidencias corregidas

- Acceso: se retiró el mínimo de ocho caracteres del formulario de entrada, porque podía bloquear una contraseña existente válida. Se añadieron visibilidad de contraseña y errores persistentes.
- Imágenes: el enlace a otra pestaña se sustituyó por el visor integrado.
- Seguimiento: se reemplazaron las semanas ancladas al primer día del objetivo por semanas naturales.

## 07 / Despliegue y verificación

### Proceso reproducible

El repositorio conserva el código, el lockfile, el esquema SQL y el workflow. npm ci instala las dependencias; npm test ejecuta las pruebas y npm run build genera dist. GitHub Actions publica ese directorio. La ruta base corresponde a /diario/ en el proyecto original y se adapta al nombre del repositorio en el workflow.

### Ajustes necesarios

GitHub Pages debe utilizar Source: GitHub Actions. La publicación desde una rama puede competir con el workflow y servir el HTML fuente sin construir, provocando una pantalla vacía. Se ha observado ese conflicto; el ajuste requiere quedar configurado en el repositorio. Los artefactos llevan el número de intento para evitar colisiones al relanzar.

En Supabase deben existir el esquema y sus políticas, un usuario confirmado, el contenedor privado y las direcciones correctas de Site URL y Redirect URLs. La recuperación de contraseña también depende de la entrega del correo. Una actualización visual no requiere volver a crear las tablas.

| Comprobación | Evidencia y alcance |
| --- | --- |
| Pruebas automáticas | 24 casos de dominio, transporte y medidas: fechas, semanas, recuentos, gráfica, escape, edición de objetivos y validación de series incompletas de medidas. |
| Construcción | Compilación de producción comprobada y proceso ejecutado en GitHub Actions. |
| Navegador publicado | Prueba con datos en memoria: deporte del martes previo, visor, navegación, ampliación y Escape. |
| Formulario | Una nota sin guardar permanece después de abrir y cerrar el visor. |
| Autorización de la RPC | Transacción revertida: una actualización del propietario, cero de otra identidad y permiso anónimo denegado. |

### Límite de las pruebas

Las pruebas descritas no equivalen a una auditoría integral. No se ha utilizado la contraseña del propietario. Quedan pendientes una revisión sistemática en móviles físicos, una matriz completa de navegadores y la verificación exhaustiva de recuperación de cuenta y copias de seguridad.

## 08 / Mantenimiento y evolución

### Mantenimiento recomendado

- Revisar el esquema y las políticas antes de ampliar los datos almacenados.
- Añadir pruebas para las reglas afectadas y conservar las existentes.
- Comprobar la construcción y abrir la web publicada después de un cambio.
- Exportar los registros y conservar las imágenes por un procedimiento separado. El JSON solo incluye sus rutas.
- Actualizar dependencias de forma controlada y mantener el lockfile.

### Mejoras futuras

Una versión instalable o una APK conectada al mismo Supabase permitiría mantener una única cuenta y los mismos registros. Requeriría empaquetado, firma y pruebas de cámara, almacenamiento y acceso. Otras mejoras posibles son una copia completa de fotografías, trabajo sin conexión y una revisión formal de accesibilidad. Ninguna de estas capacidades se presenta como terminada en esta versión.

### Resultado del proyecto

Se ha obtenido una base funcional publicada para registrar y revisar hábitos de forma privada. La evolución se ha centrado en el uso cotidiano: menos pasos para registrar, fotografías visibles dentro del diario, reglas semanales comprensibles y textos secundarios más legibles. La separación entre calendario semanal y revisión quincenal evita reiniciar objetivos a mitad de semana.

### Referencias y material de consulta

- [Código del proyecto](https://github.com/angelmc1402-eng/diario)
- [Vite: publicación estática](https://vite.dev/guide/static-deploy)
- [Supabase: Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase: almacenamiento privado](https://supabase.com/docs/guides/storage/buckets/fundamentals)
- [MDN: elemento dialog](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog)

Estado documentado el 28 de octubre de 2026. Las versiones corresponden a las dependencias instaladas. Los ejemplos de calendario son ilustrativos y no reproducen registros personales.
