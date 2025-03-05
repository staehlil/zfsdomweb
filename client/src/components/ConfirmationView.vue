<template>
  <form :class="`flex-grow-1 flex flex-colum justify-content-center align-items-center bg-reset deferred-content${loading ? ' loading' : ''}`" ref="loginForm" autocomplete="on" v-on:submit.prevent>
    <div class="p-4 border-black-alpha-50 lg:w-6 bg-white-alpha-90 shadow-2">
      <div v-if="uuidIsValid" class="text-center">
        Ihr Konto ist jetzt aktiv
      </div>
      <div v-else class="text-center">
        Ungültiger Schlüssel
      </div>
      <div class="flex flex-row justify-content-end">
        <Button label="Starten" icon="pi pi-sign-in" class="flex-shrink-0" @click="goto()"></Button>
      </div>
    </div>
  </form>
  <Toast></Toast>
</template>

<script>

export default {
  name: 'ResetView',
  components: {
  },
  data() {
    return {
      loading:true,
      uuidIsValid:false
    }
  },
  props: {
    uuid:String
  },
  async created() {
    let profile = await new Promise((resolve)=>{
      this.authService.ensureAuth(this.requiredUserLevel||false)
          .then(isAuth=>{
            if (!isAuth)
              this.$router.push("/login");
            resolve(isAuth);
          })
          .catch(err => {
            this.$toast.add({severity:'error', summary: err.messageTitle||'Fehler', detail:err.message||err, life: 3000})
            this.$router.push("/login");
            resolve(false);
          });
    });
    if (profile)
      this.uuidIsValid = (await this.authService.confirm(this.uuid)).valid||false;
    this.loading = false;
  },
  methods: {
    goto(path="/") {
      this.$router.push(path);
    }
  }
}
</script>