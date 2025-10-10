/* eslint-disable */
import { createApp } from 'vue';
import { createMemoryHistory, createRouter } from 'vue-router';
import App from './app.vue';
/* eslint-disable import/no-unresolved */
import 部队编制界面 from './战斗/界面/部队编制界面.vue';
import 高级战斗界面 from './战斗/界面/高级战斗界面.vue';
import 探索界面 from './探索/界面/探索界面.vue';
import 巢穴界面 from './页面/巢穴界面.vue';
import 调教界面 from './页面/调教界面.vue';

$(() => {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: App },
      { path: '/战斗', component: 高级战斗界面 },
      { path: '/探索', component: 探索界面 },
      { path: '/巢穴', component: 巢穴界面 },
      { path: '/调教', component: 调教界面 },
      { path: '/部队编制', component: 部队编制界面 },
    ],
  });

  // 确保路由切换时正确显示内容
  router.beforeEach((_to, _from, next) => {
    next();
  });

  createApp(App).use(router).mount('#app');
});
