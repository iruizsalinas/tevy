import { hydrate } from 'svelte';
import Page from '../pages/Catalog.svelte';

hydrate(Page, { target: document.getElementById('app')!, props: JSON.parse(document.getElementById('props')!.textContent!) });
