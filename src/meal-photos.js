/** The first stored path is the cover. Preserve every other photo and its order. */
export function withCover(paths,cover){const list=[...paths];const index=list.indexOf(cover);if(index<=0)return list;return [list[index],...list.slice(0,index),...list.slice(index+1)];}
export function savedMealPhotos(existing,drafts,uploaded,coverKey){if(drafts.length!==uploaded.length)throw Error('No se han confirmado todas las fotografías.');const index=drafts.findIndex(x=>x.key===coverKey);return withCover([...existing,...uploaded],index>=0?uploaded[index]:coverKey);}
