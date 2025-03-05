<template>
  <form v-if="ensured" class="flex-grow-1 flex flex-colum justify-content-center align-items-center bg-login" ref="loginForm" autocomplete="on" v-on:submit.prevent>
    <div class="border-black-alpha-50 w-full lg:w-9 bg-white-alpha-90 shadow-2 sm:relative">
      <div class="flex flex-row justify-content-start align-items-start mb-4">
        <h2 class="cursor-pointer max-w-full pixelart m-0 p-2" @click="goto()">
          zfsdomweb<sup class="text-xs">libvirt+zfs</sup>
        </h2>
      </div>
      <div class="absolute left-0 top-0 m-2" v-if="sso.name">
        <a class="text-sm font-medium no-underline text-blue-500 cursor-pointer" :href="sso.url">Einloggen mit {{sso.name}}</a>
      </div>
      <div class="flex flex-column md:flex-row align-items-center m-2">
        <div class="flex-grow-1 w-12 sm:w-9">
          <div class="text-center mb-3">
            <div class="text-900 text-xl font-thin flex align-items-start line-height-1 p-1 absolute top-0 right-0 text-gray-900">&nbsp;</div>
            <div class="flex flex-column">
              <div class="font-medium line-height-3 font-bold">Bei Ihrem Konto anmelden</div>
              <!--          <a class="text-sm font-medium no-underline text-blue-500 cursor-pointer" href="/register"> Sie haben noch keinen Account?</a>-->
              <div class="font-italic">Für Administratoren</div>
            </div>
          </div>
          <div class="pb-4">
            <label for="username" class="block text-900 font-medium mb-2">Benutzername</label>
            <InputText id="username" type="text" class="w-full mb-3" v-model="username" autocomplete="username" name="username" required />

            <label for="password" class="block text-900 font-medium mb-2">Passwort</label>
            <InputText id="password" type="password" class="w-full mb-3" v-model="password" autocomplete="password" name="password" required v-on:keyup.enter="login" />

            <div class="flex align-items-center justify-content-between">
              <a class="font-medium no-underline text-blue-500 cursor-pointer" href="/reset">Passwort vergessen?</a>
              <Button label="Anmelden" icon="pi pi-sign-in" class="flex-shrink-0" @click="login"></Button>
            </div>
          </div>
        </div>
        <div class="flex flex-row my-5 m-md-0" id="login-or-aai" >
          <div class="flex-grow-1 flex align-items-center" style="min-width:100px;" >
            <div class="w-full border-primary border-primary border-bottom-1" ></div>
          </div>
          <div class="pl-3 pr-3 pt-1 pb-1 bg-primary text-white text-lg">ODER</div>
          <div class="flex-grow-1 align-items-center"></div>
          <div class="flex-grow-1 flex align-items-center" style="min-width:100px;" >
            <div class="w-full border-primary border-primary border-bottom-1"></div>
          </div>
        </div>
        <button class="md:w-4 flex flex-row justify-content-end p-button p-component p-button-outlined p-0 border-0 border-none bg-transparent" type="button" @click="oidcLogin()">
          <Button @click="oidcLogin()">
            SSO Login
          </Button>
        </button>
      </div>
    </div>
  </form>
  <Toast></Toast>
</template>

<script>

export default {
  name: 'LoginView',
  components: {
  },
  data() {
    return {
      username:"",
      password:"",
      target:"",
      redirect:"",
      ensured:false,
      sso:{}
    }
  },
  async created() {
    this.target = this.$route.query?.q;
    this.redirect = this.$route.query?.r;
    try {
      if (await this.authService.ensureAuth()) {
        if (this.redirect) {
          /*const link = document.createElement('a');
          link.href = this.redirect;
          link.dispatchEvent(new MouseEvent('click'));*/
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
          /*if (import.meta.env.VITE_EXTAUTH_LOGIN) {
            // if local auth fails and there is an external auth service, try it requesting redirect-back even in case of failure (effectively using the external auth service as secondardy/fallback auth method)
            window.location.href = `${import.meta.env.VITE_EXTAUTH_LOGIN}/?u=${this.username}&p=${this.password}&r=${window.location.origin}/auth&f=1`;
          }
          else {*/
            this.$toast.add({severity:'error', summary: 'Login Fehler', detail:err.response ? `${err.response.status} ${err.response.statusText}` : err, life: 3000})
            this.clear();
          //}
        }
      }
    },
    async oidcLogin() {
      window.location.href = `${window.location.origin}/api/auth/oidc-redirect/?origin=${btoa(`${window.location.origin}/login`)}&fingerprint=${this.authService.simpleFingerprint}`;
    }
  }
}
</script>