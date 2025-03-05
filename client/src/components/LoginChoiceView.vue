<template>
  <form v-if="ensured" class="flex-grow-1 flex flex-colum justify-content-center align-items-center bg-login" ref="loginForm" autocomplete="on" v-on:submit.prevent>
    <div class="border-black-alpha-50 w-full lg:w-9 bg-white-alpha-90 shadow-2 sm:relative">
      <div class="flex flex-row justify-content-start align-items-start mb-2">
        <h2 class="cursor-pointer max-w-full pixelart m-0 p-2" @click="goto()">
          zfsdomweb<sup class="text-xs">libvirt+zfs</sup>
        </h2>
      </div>
      <div class="absolute left-0 top-0 m-2" v-if="sso.name">
        <a class="text-sm font-medium no-underline text-blue-500 cursor-pointer" :href="sso.url">Einloggen mit {{sso.name}}</a>
      </div>
      <div class="text-900 text-xl font-thin flex align-items-start line-height-1 p-1 absolute top-0 right-0 text-gray-900">&nbsp;</div>
      <div class="flex flex-row justify-content-center mb-2">
        <Button @click="oidcLogin()">
          SSO Login
        </Button>
      </div>
      <div class="flex flex-row justify-content-end align-items-center text-xs p-1 system-button cursor-pointer" @click="goto('/login-admin')">
        <i class="pi pi-bolt"></i><div>Admin<br><small>Login</small></div>
      </div>
    </div>
  </form>
  <Toast></Toast>
</template>

<script>

export default {
  name: 'LoginChoiceView',
  components: {
  },
  data() {
    return {
      username:"",
      password:"",
      target:"",
      ensured:false,
      sso:{}
    }
  },
  async created() {
    this.target = this.$route.query?.q;

    let params = null;
    try {
      const b64json = this.$route.query?.params;
      if (b64json)
        params = JSON.parse(atob(b64json));
    } catch (err) { console.log(err);
    }
    try {
      if (params)
        await this.authService.oidcLogin(params);
      if (await this.authService.ensureAuth()) {
        if (this.redirect) {
          let { accessToken } = this.authService.getLocalAuth();
          window.location.href = `${this.redirect}/?q=${accessToken}`;
        }
        else
          this.goto(this.target);
      }
      else {
        this.ensured = true;
      }
    }
    catch (err) {
      this.$toast.add({severity:'error', summary: 'Fehler', detail:err.response?.data?.error || err, life: 3000})
      this.ensured = true;
    }
    if (import.meta.env?.VUE_APP_SSO_ORGANIZATION_NAME && import.meta.env?.VUE_APP_SSO_ORGANIZATION_URL)
      this.sso = {
        name:import.meta.env?.VUE_APP_SSO_ORGANIZATION_NAME,
        url:import.meta.env?.VUE_APP_SSO_ORGANIZATION_URL
      }
  },
  methods: {
    goto(path="/") {
      this.$router.push(path);
    },
    clear() {
      this.username="";
      this.password="";
    },
    async login() {
      if (this.username && this.password) {
        try {
          await this.authService.login({username:this.username,password:this.password});
          await this.authService.ensureAuth();
          if (this.redirect) {
            let { accessToken } = this.authService.getLocalAuth();
            window.location.href = `${this.redirect}/?q=${accessToken}`;
          }
          else
            this.goto(this.target);
        } catch (err) {
          if (import.meta.env.VITE_EXTAUTH_LOGIN) {
            /* if local auth fails and there is an external auth service, try it requesting redirect-back even in case of failure (effectively using the external auth service as secondardy/fallback auth method)*/
            window.location.href = `${import.meta.env.VITE_EXTAUTH_LOGIN}/?u=${this.username}&p=${this.password}&r=${window.location.origin}/auth&f=1`;
          }
          else {
            this.$toast.add({severity:'error', summary: 'Login Fehler', detail:err.response ? `${err.response.status} ${err.response.statusText}` : err, life: 3000})
            this.clear();
          }
        }
      }
    },
    async oidcLogin() {
      window.location.href = `${window.location.origin}/api/auth/oidc-redirect/?origin=${btoa(window.location.href.replace(/\?.+$/g,""))}&fingerprint=${this.authService.simpleFingerprint}`;
    },
  }
}
</script>