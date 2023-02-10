import Popup from "../views/Popup.vue";
import Home from "../views/Home.vue";
import { createRouter, createWebHashHistory } from "vue-router";

const routes = [
  { path: '/', component: Home },
  { path: '/popup', component: Popup },
]

export const router = createRouter({
  history: createWebHashHistory(),
  routes,
});
