/* eslint-disable */
import { createApp } from 'vue';
import { createMemoryHistory, createRouter } from 'vue-router';
import App from './app.vue';
/* eslint-disable import/no-unresolved */
import 主界面 from './界面显示层/主界面.vue';
import 巢穴界面 from './界面显示层/巢穴界面.vue';
import 探索界面 from './界面显示层/探索界面.vue';
import 编制界面 from './界面显示层/编制界面.vue';
import 调教界面 from './界面显示层/调教界面.vue';

$(() => {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: 主界面 },
      { path: '/探索', component: 探索界面 },
      { path: '/巢穴', component: 巢穴界面 },
      { path: '/调教', component: 调教界面 },
      { path: '/编制', component: 编制界面 },
    ],
  });

  // 确保路由切换时正确显示内容
  router.beforeEach((_to, _from, next) => {
    next();
  });

  createApp(App).use(router).mount('#app');
});
