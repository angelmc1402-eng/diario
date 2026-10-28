/** A top-layer viewer that leaves the meal form and its unsaved fields intact. */
export function createPhotoViewer({getUrl}) {
  let dialog, image, status, counter, previous, next, zoom, stage;
  let photos = [], index = 0, request = 0, trigger, touchStart;
  function build() {
    dialog = document.createElement('dialog');
    dialog.className = 'photo-viewer';
    dialog.setAttribute('aria-label', 'Visor de fotografías');
    dialog.innerHTML = `<div class="viewer-toolbar"><span class="viewer-counter" aria-live="polite"></span><div><button type="button" class="viewer-zoom" aria-pressed="false">Ampliar</button><button type="button" class="viewer-close" aria-label="Cerrar visor">×</button></div></div><div class="viewer-body"><button type="button" class="viewer-previous" aria-label="Fotografía anterior">‹</button><div class="viewer-stage"><img alt=""><p class="viewer-status" role="status"></p></div><button type="button" class="viewer-next" aria-label="Fotografía siguiente">›</button></div>`;
    document.body.append(dialog);
    image = dialog.querySelector('img');
    stage = dialog.querySelector('.viewer-stage');
    status = dialog.querySelector('.viewer-status');
    counter = dialog.querySelector('.viewer-counter');
    previous = dialog.querySelector('.viewer-previous');
    next = dialog.querySelector('.viewer-next');
    zoom = dialog.querySelector('.viewer-zoom');
    dialog.querySelector('.viewer-close').onclick = () => dialog.close();
    previous.onclick = () => move(-1);
    next.onclick = () => move(1);
    zoom.onclick = () => {
      const active = stage.classList.toggle('zoomed');
      zoom.textContent = active ? 'Ajustar' : 'Ampliar';
      zoom.setAttribute('aria-pressed', String(active));
    };
    image.onload = () => {status.textContent = ''; zoom.disabled = false;};
    image.onerror = () => {image.hidden = true; status.textContent = 'No se pudo cargar la fotografía.';};
    dialog.addEventListener('close', () => {
      request++;
      image.removeAttribute('src');
      photos = [];
      document.body.classList.remove('viewer-open');
      if (trigger?.isConnected) trigger.focus();
    });
    dialog.addEventListener('click', event => {if (event.target === dialog) dialog.close();});
    dialog.addEventListener('keydown', event => {
      event.stopPropagation();
      if (event.key === 'ArrowLeft') {event.preventDefault();move(-1);}
      if (event.key === 'ArrowRight') {event.preventDefault();move(1);}
    });
    stage.addEventListener('touchstart', event => {
      touchStart = event.touches.length === 1 ? {x:event.touches[0].clientX,y:event.touches[0].clientY} : null;
    }, {passive:true});
    stage.addEventListener('touchend', event => {
      if (!touchStart || stage.classList.contains('zoomed')) return;
      const end = event.changedTouches[0], dx = end.clientX-touchStart.x, dy=end.clientY-touchStart.y;
      if (Math.abs(dx)>60 && Math.abs(dx)>Math.abs(dy)*1.5) move(dx<0?1:-1);
      touchStart = null;
    }, {passive:true});
  }
  async function display() {
    const current = ++request;
    image.hidden = true;
    image.removeAttribute('src');
    stage.classList.remove('zoomed');
    stage.scrollTo(0,0);
    zoom.textContent = 'Ampliar';
    zoom.setAttribute('aria-pressed','false');
    zoom.disabled = true;
    status.textContent = 'Cargando fotografía…';
    counter.textContent = `Fotografía ${index+1} de ${photos.length}`;
    previous.hidden = next.hidden = photos.length < 2;
    previous.disabled = index === 0;
    next.disabled = index === photos.length-1;
    image.alt = `Fotografía ${index+1} de la comida`;
    try {
      const url = await getUrl(photos[index]);
      if (current !== request || !dialog.open) return;
      image.hidden = false;
      image.src = url;
    } catch {
      if (current === request && dialog.open) status.textContent = 'No se pudo cargar la fotografía. Comprueba la conexión.';
    }
  }
  function move(offset) {
    if (index+offset < 0 || index+offset >= photos.length) return;
    index += offset;
    display();
  }
  return {
    open(paths, selected = 0) {
      if (!paths?.length) return;
      if (!dialog) build();
      photos = [...paths];
      index = Math.max(0,Math.min(selected,photos.length-1));
      trigger = document.activeElement;
      if (!dialog.open) dialog.showModal();
      document.body.classList.add('viewer-open');
      display();
    },
  };
}
