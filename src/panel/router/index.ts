import Popup from "../views/Popup.vue";
import Home from "../views/DevTool.vue";
import { createRouter, createWebHashHistory } from "vue-router";

const routes = [
  { path: '/devtools', component: Home, name: 'devtools' },
  { path: '/popup', component: Popup, name: 'popup' },
]

export const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

router.beforeEach((to, from, next) => {
  document.querySelector('html')!.id = to.name?.toString() || '';
  next();
})