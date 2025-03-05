<template>
  <div></div>
</template>

<script>

export default {
  /*extends: AuthView,*/
  name: 'SSOView',
  props: {
    accessToken: String,
    refreshToken: String
  },
  data() {
    return {
    }
  },
  async created() {
    this.authService.setLocalAuth({accessToken:this.accessToken, refreshToken:this.refreshToken});
    this.$router.push("/login");
  },
  methods:{
  },
}
</script>
