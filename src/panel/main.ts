import { library } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { fas } from "@fortawesome/free-solid-svg-icons";
import { far } from "@fortawesome/free-regular-svg-icons";
import { IconPack } from "@fortawesome/fontawesome-svg-core";
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
import "element-plus/theme-chalk/dark/css-vars.css";
import "./themes/app.scss";
import { createApp } from "vue";
import App from "./App.vue";
import { router } from "./router";
import { useDark, useToggle } from '@vueuse/core'

const isDark = useDark()
useToggle(isDark);

library.add(fas as IconPack);
library.add(far as IconPack);

const app = createApp(App)
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}
app.component("font-awesome-icon", FontAwesomeIcon)
app.use(router);
app.use(ElementPlus).mount('#app')
