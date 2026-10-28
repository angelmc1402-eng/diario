# Texto para incorporar a una memoria

El proyecto Diario consiste en el desarrollo de una aplicación web personal para registrar comidas con fotografías, actividad física, objetivos, hitos, pesajes y citas. Su diseño se adapta al móvil y al ordenador, con un menú lateral en escritorio y una navegación plegable en pantallas pequeñas. La interfaz prioriza el registro rápido, la legibilidad y una presentación sobria de la información.

La aplicación utiliza HTML, CSS y JavaScript, con Vite para generar la versión de producción y GitHub Pages para publicarla. Supabase proporciona la autenticación, la base de datos PostgreSQL y el almacenamiento privado de imágenes. Los registros se vinculan a cada usuario y se protegen mediante políticas de seguridad por fila. Las fotografías se comprimen antes de subirse y se muestran mediante enlaces temporales en un visor integrado que conserva los cambios pendientes del formulario.

El seguimiento combina dos escalas temporales: quincenas de catorce días para organizar las revisiones y semanas de lunes a domingo para los objetivos deportivos. El deporte se contabiliza por días distintos y tiene en cuenta la semana completa, aunque cruce el límite de una quincena. De esta forma, una revisión entre semana no reinicia ni cierra prematuramente el objetivo.

El desarrollo ha sido iterativo e incluye mejoras de acceso, recuperación ante fallos de red al editar objetivos, visualización de fotografías y legibilidad en escritorio. La verificación comprende dieciséis pruebas automáticas, la compilación de producción, comprobaciones de autorización de la actualización de objetivos y pruebas de interacción con datos de demostración. La versión actual requiere conexión a internet y no incluye todavía una APK ni funcionamiento sin conexión.
