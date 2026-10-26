import { hydrate } from 'svelte';
import Page from '../pages/Model.svelte';

hydrate(Page, { target: document.getElementById('app')!, props: JSON.parse(document.getElementById('props')!.textContent!) });
