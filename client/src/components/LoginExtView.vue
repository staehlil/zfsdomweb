<template>
  <Toast></Toast>
</template>

<script>

export default {
  name: 'LoginExtView',
  components: {
  },
  data() {
    return {
      token:"",
      target:"/",
      redirect:"",
      ensured:false,
      sso:{}
    }
  },
  async created() {
    /*
    one is typically redirected here from ${EXTAUTH_LOGIN}/?r=${THIS_HOST}/auth,
    which should redirect to ${THIS_HOST}/auth/?q=${TOKEN_ENCODED_WITH_EXTAUTH_TOKEN_SECRET}
    if the backend successfully verifies the passed token using EXTAUTH_TOKEN_SECRET, the user is logged in
     */
    this.token = this.$route.query?.q;
    this.redirect = this.$route.query?.r;
    this.extLogin();
  },
  methods: {
    goto(path="/") {
      this.$router.push(path);
    },
    async extLogin() {
      if (this.token) {
        try {
          await this.authService.extlogin({token:this.token}); // backend decodes token using EXTAUTH_TOKEN_SECRET
          let profile = await this.authService.ensureAuth();
          this.goto(this.target);
        } catch (err) {
          this.$toast.add({severity:'error', summary: 'Login Fehler', detail:err.response ? `${err.response.status} ${err.response.statusText}` : err, life: 3000})
          this.clear();
        }
      }
      else if (import.meta.env.VITE_EXTAUTH_LOGIN) {
        if (parseInt(this.redirect)!==0) {
          /*
          if this installation has VUE_APP_EXTAUTH_LOGIN set,
          redirect to the external login url, requesting it to redirect back to the token login url with the accessToken (instead of presenting local login),
          unless ?r=0, which means the external auth service already redirected back on failure
          */
          window.location.href = `${import.meta.env.VITE_EXTAUTH_LOGIN}/?r=${window.location.origin}/auth`;
        }
        else
          this.goto("/login")
      }
    },
  }
}
</script>