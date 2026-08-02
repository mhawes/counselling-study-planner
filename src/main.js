import { createApp } from 'vue';
import { Quasar, Notify } from 'quasar';
import quasarLang from 'quasar/lang/en-US';
import '@quasar/extras/material-icons/material-icons.css';
import 'quasar/dist/quasar.css';
import App from './App.vue';
import router from './router';
const app = createApp(App);
app.use(Quasar, {
    plugins: { Notify },
    config: {
        notify: {
            position: 'top',
            timeout: 2500
        }
    },
    lang: quasarLang
});
app.use(router);
app.mount('#app');
//# sourceMappingURL=main.js.map