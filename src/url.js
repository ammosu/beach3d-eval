// Site-relative URLs (asset paths in props.json start with "/"), so the build also works under a sub-path such as GitHub Pages /<repo>/.
export const asset=path=>/^[a-z]+:/i.test(path)?path:import.meta.env.BASE_URL+String(path).replace(/^\.?\//,'');
