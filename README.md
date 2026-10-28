# Diario

Aplicación personal para registrar comidas con fotografías, deporte, objetivos, hitos, peso y citas. Diseñada para móvil y ordenador. Interfaz en español.

## Publicación en GitHub Pages, sin instalar programas

El proyecto está preparado para `angelmc1402-eng/diario`.

### 1. Conexión a Supabase preparada

El workflow ya incluye la URL y la clave publicable del proyecto. No necesitas crear variables para el primer despliegue. Para cambiar de proyecto, puedes definir en **Settings → Secrets and variables → Actions → Variables**:

- `VITE_SUPABASE_URL`: copia el valor de `.env.example`, sin el nombre de la variable ni el signo igual.
- `VITE_SUPABASE_PUBLISHABLE_KEY`: copia el valor correspondiente de `.env.example`.

Estas dos variables son públicas por diseño. Nunca utilices una clave secret o service_role en la web. Los permisos RLS de Supabase protegen los datos.

### 2. Activa GitHub Pages

Abre **Settings → Pages → Build and deployment → Source → GitHub Actions**.

### 3. Sube los archivos

Descomprime el ZIP. En la página principal del repositorio, pulsa **Add file → Upload files** (o **uploading an existing file** si está vacío).

Arrastra **el contenido** de la carpeta `diario` al área de subida. `package.json` e `index.html` deben quedar en la raíz del repositorio, sin otra carpeta `diario` encima. Incluye `.github`, `.gitignore` y `.env.example`. No subas `.env.local`, `node_modules` ni `dist`.

Guarda los cambios en la rama `main` con **Commit changes**. Si GitHub no acepta una carpeta oculta al arrastrarla, crea `.github/workflows/deploy.yml` mediante **Add file → Create new file**, y pega el contenido del archivo suministrado.

### 4. Comprueba la publicación

Ve a **Actions → Publicar diario**. El proceso instala las dependencias, ejecuta las pruebas y publica la web. Cuando termine en verde, visita:

https://angelmc1402-eng.github.io/diario/

Si el proceso se ejecutó antes de configurar las variables, vuelve a lanzarlo desde **Actions → Publicar diario → Run workflow**.

### 5. Configura Supabase

Las tablas deben ser las creadas con el SQL facilitado: `profiles`, `meals`, `exercise`, `goals`, `goal_checks`, `milestones`, `weights`, `appointments`, todas con RLS habilitado. El contenedor `comidas` debe ser privado y tener políticas para la carpeta de cada usuario. En `supabase/setup.sql` tienes una copia de la estructura para proyectos nuevos; en tu proyecto ya configurado no hace falta ejecutarla de nuevo.

En **Authentication → URL Configuration** configura:

- **Site URL:** `https://angelmc1402-eng.github.io/diario/`
- **Redirect URLs:** añade esa misma dirección.

Crea tu usuario en **Authentication → Users**, con correo confirmado, y desactiva nuevos registros y acceso anónimo. La aplicación utiliza acceso con correo y contraseña. La recuperación por correo requiere que la entrega de correos esté configurada correctamente en Supabase.

### 6. Primer acceso

Entra con el usuario creado. Completa tu nombre, altura, edad al comenzar, fecha inicial y, opcionalmente, peso inicial. Estos datos se escriben en tu cuenta privada; no están preinsertados en el código.

- En **Objetivos**, añade el objetivo de deporte, elige **Días de deporte por semana** e indica 3 días. Añade el desayuno como objetivo de **Casilla diaria**.
- En **Ajustes → Citas**, registra la próxima revisión.
- En cada día, abre desayuno, comida o cena para escribir una nota y añadir fotografías. Merienda es opcional.
- En **Peso**, añade los siguientes pesajes. La gráfica conserva todos los registros.

Los objetivos duran hasta 14 días. Las semanas de deporte van de lunes a domingo y cuentan días distintos. Se incluye toda la actividad de esa semana, aunque parte quede fuera de la quincena. Las semanas que cruzan una revisión se muestran como parciales y las semanas en curso permanecen abiertas. Una misma semana puede aparecer en dos quincenas con el mismo recuento; no son sesiones duplicadas. Cada día se puede editar, incluidas fechas anteriores. La siguiente quincena puede copiar los objetivos de la anterior, sin copiar sus marcas.

## Desarrollo local

Instala Node.js 22.12 o superior. En la carpeta del proyecto:

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Abre la URL que muestre Vite, incluyendo `/diario/`. En Windows puedes copiar `.env.example` manualmente y renombrar la copia a `.env.local`.

```bash
npm test
npm run build
npm run preview
```

El archivo `package-lock.json` fija las versiones instaladas. El workflow cambia automáticamente la ruta base al nombre del repositorio. Para publicar en la raíz de un dominio, usa `VITE_BASE_PATH=/` al construir.

## Privacidad y funcionamiento

- El código y la interfaz de entrada son públicos. Los registros requieren una sesión y permisos de Supabase.
- Todas las consultas se filtran por usuario; RLS debe estar habilitado también en la base de datos.
- Las fotos se guardan en rutas `ID_USUARIO/UUID.jpg`. Se comprimen a JPEG de hasta 1600 píxeles y se muestran mediante enlaces temporales privados.
- El código permite varias fotos por comida. Las imágenes HEIC dependen de que el navegador pueda decodificarlas; en caso contrario muestra un error y pide JPEG o PNG.
- Una comida puede tener solo nota, solo fotos, o ambas. Hay una entrada por tipo de comida y fecha. Los pesajes tienen una entrada por fecha.
- Los guardados requieren internet. No hay cola de guardado sin conexión. Un fallo de red muestra un aviso; no se anuncia un guardado correcto antes de recibir respuesta del servidor.
- La prueba de la pantalla de entrada usa datos de ejemplo en memoria y no escribe en Supabase. Se borra al recargar o salir.
- La exportación JSON incluye registros y rutas de fotografías, no los archivos de imagen. Para conservar una foto, ábrela desde su comida y descárgala con el navegador.
- La edad es la edad al comenzar, no una edad calculada automáticamente. Las fechas y citas se presentan en Europe/Madrid.
- Las cuotas, la disponibilidad y las copias de seguridad dependen de tu proyecto y plan de Supabase. No hay objetivo de peso ni cálculos médicos automáticos.

## Comprobación antes de usar datos reales

1. En ordenador y móvil: entrar, salir y volver a entrar.
2. Guardar una comida con foto, cerrar la página y confirmar que persiste en otro dispositivo.
3. Editar y borrar registros, añadir merienda y varias sesiones de deporte el mismo día.
4. Añadir un objetivo diario y uno de deporte, marcar casillas y cambiar de quincena.
5. Añadir y editar pesajes, comprobar gráfica e historial.
6. Sin sesión, confirmar que no se pueden leer tablas ni descargar fotos; con una segunda cuenta de prueba, confirmar que no puede acceder a tus filas o fotos.
7. Revisar los tamaños de móvil y ordenador, navegación con teclado y recuperación de contraseña.

## Estado de verificación del paquete

Se ha comprobado la sintaxis JavaScript, la compilación de producción y las pruebas de lógica de fechas, recuentos, gráfica y escape de texto. La infraestructura de vista previa no estuvo disponible en el entorno de creación. No se ha iniciado sesión en la cuenta del propietario ni se han probado escrituras reales en su Supabase; las comprobaciones de acceso y fotos deben completarse tras el despliegue.

Las fotografías se amplían en un visor dentro de la página, con navegación, ampliación y cierre mediante Escape. Abrirlo y cerrarlo conserva el formulario sin guardar.
