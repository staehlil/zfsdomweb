import {createRouter, createWebHashHistory, createWebHistory} from "vue-router";
import LoginView from "@/components/LoginView.vue";
import HomeView from "@/components/HomeView.vue";
import UsersView from "@/components/UsersView.vue";
import SystemView from "@/components/SystemView.vue";
import UserView from "@/components/UserView.vue";
import SettingsView from "@/components/SettingsView.vue";
import ResetView from "@/components/ResetView.vue";
import ResetRequestView from "@/components/ResetRequestView.vue";
import PasswordExpiredView from "@/components/PasswordExpiredView.vue";
import RegistrationView from "@/components/RegistrationView.vue";
import ConfirmationView from "@/components/ConfirmationView.vue";
import ConfirmationRequestView from "@/components/ConfirmationRequestView.vue";
import LogoutView from "@/components/LogoutView.vue";
import SSOView from "@/components/SSOView.vue";
import AccountView from "@/components/AccountView.vue";
import LoginExtView from "@/components/LoginExtView.vue";
import LoginChoiceView from "@/components/LoginChoiceView.vue";

const routes = [
    {
        path: '/',
        component: HomeView
    },
    {
        path: '/my/:label',
        component: HomeView,
        props: true
    },
    {
        path: '/my',
        component: HomeView,
        props: true
    },
    {
        path: '/account',
        component: AccountView
    },
    {
        path: '/system',
        component: SystemView
    },
    {
        path: '/system/users',
        component: UsersView
    },
    {
        path: '/system/users/:id',
        component: UserView,
        props: true
    },
    {
        path: '/system/config',
        component: SettingsView
    },
    {
        path: '/login',
        component: LoginChoiceView
    },
    {
        path: '/login-admin',
        component: LoginView
    },
    {
        path: '/logout',
        component: LogoutView
    },
    {
        path: '/reset',
        component: ResetRequestView
    },
    {
        path: '/reset/:uuid',
        component: ResetView,
        props: true
    },
    {
        path: '/password-expired/',
        component: PasswordExpiredView,
    },
    {
        path: '/confirmation',
        component: ConfirmationRequestView,
    },
    {
        path: '/confirmation/:uuid',
        component: ConfirmationView,
        props: true
    },
    {
        path: '/register',
        component: RegistrationView
    },
    {
        path: '/sso/:accessToken/:refreshToken',
        component: SSOView,
        props:true
    },
    {
        path: '/auth',
        component: LoginExtView,
        props:true
    }
]

const router = createRouter({
    history: import.meta.env.IS_ELECTRON ? createWebHashHistory() : createWebHistory(import.meta.env.BASE_URL),
    routes
})

export default router
