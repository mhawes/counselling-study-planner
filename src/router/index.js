import { createRouter, createWebHistory } from 'vue-router';
import PlacementPage from '@/pages/PlacementPage.vue';
import CourseCriteriaPage from '@/pages/CourseCriteriaPage.vue';
import GlossaryPage from '@/pages/GlossaryPage.vue';
import SettingsPage from '@/pages/SettingsPage.vue';
const routes = [
    { path: '/', redirect: '/placement' },
    { path: '/placement', component: PlacementPage },
    { path: '/course-criteria', component: CourseCriteriaPage },
    { path: '/glossary', component: GlossaryPage },
    { path: '/settings', component: SettingsPage }
];
const router = createRouter({
    history: createWebHistory(),
    routes
});
export default router;
//# sourceMappingURL=index.js.map