import { mount } from 'svelte'
import './app.css'
// import App from './App.svelte'
import meow from './meow.svelte'

const app = mount(meow, {
  target: document.getElementById('app')!,
})

export default app
