<template>
  <form class="flex-grow-1 flex flex-colum justify-content-center align-items-center bg-login" ref="loginForm" autocomplete="on" v-on:submit.prevent>
    <div class="p-4 border-black-alpha-50 w-full lg:w-6 bg-white-alpha-90 shadow-2 relative">
      <div class="absolute right-0 top-0 m-2">
        <a class="text-sm font-medium no-underline text-blue-500 cursor-pointer" href="/register"> Sie haben noch keinen Account?</a>
      </div>
      <div class="text-center mb-3 relative">
        <div class="flex flex-row jusify-content-start align-items-end mb-1">
          <div class="flex-1">&nbsp;</div>
          <img src="../assets/logo.png" class="w-3 flex-1 cursor-pointer" @click="goto()">
          <div class="flex-1 text-900 text-3xl font-medium flex align-items-end line-height-1">&nbsp;tmplt</div>
        </div>
        <span class="font-medium line-height-3">Sie werden von Ihrem Konto abgemeldet</span>
      </div>
    </div>
  </form>
  <Toast></Toast>
</template>

<script>

export default {
  name: 'LogoutView',
  components: {
  },
  data() {
    return {
      redirect:"",
    }
  },
  async created() {
    this.redirect = this.$route.query?.r;
    await this.logout();
    this.goto(`/login${this.redirect ? `/?r=${this.redirect}` : ""}` );
  },
  methods: {
    goto(path="/") {
      this.$router.push(path);
    },
    async logout() {
      await this.authService.logout();
    }
  }
}
</script>