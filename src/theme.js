export const themeKey='diario-theme';
export function initTheme(){let preference='system';try{preference=localStorage.getItem(themeKey)||'system';}catch{}applyTheme(preference);return preference;}
export function applyTheme(preference){if(!['light','dark','system'].includes(preference))preference='system';const dark=preference==='dark'||preference==='system'&&matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.dataset.theme=dark?'dark':'light';document.documentElement.style.colorScheme=dark?'dark':'light';document.querySelector('meta[name="theme-color"]')?.setAttribute('content',dark?'#161d19':'#f6f7f3');try{localStorage.setItem(themeKey,preference);}catch{}return preference;}

matchMedia('(prefers-color-scheme: dark)').addEventListener('change',()=>{let p='system';try{p=localStorage.getItem(themeKey)||'system';}catch{}if(p==='system')applyTheme(p);});
