<template>
  <form :class="`flex-grow-1 flex flex-colum justify-content-center align-items-center bg-reset deferred-content${loading ? ' loading' : ''}`" ref="loginForm" autocomplete="on" v-on:submit.prevent>
    <div v-if="uuidIsValid" class="border-black-alpha-50 w-full lg:w-6 bg-white-alpha-90 shadow-2 sm:relative">
      <div class="text-center mb-3">
        <div class="text-900 text-xl font-thin flex align-items-start line-height-1 p-1 absolute top-0 right-0">zfsdomweb</div>
        <div class="flex flex-row justify-content-start align-items-start mb-4">
          <img src="../assets/logo.png" class="cursor-pointer max-w-full m-2" @click="goto('/data')">
        </div>
        <span class="font-medium line-height-3">Ihr Passwort ändern</span>
      </div>

      <div class="px-4 pb-4">
        <label class="block text-900 font-medium mb-2">Neues Passwort</label>
        <InputText type="password" class="w-full mb-3" v-model="p0" autocomplete="password" name="password" required v-on:keyup.enter="requestChangePassword" />
        <label class="block text-900 font-medium mb-2">Wiederholen</label>
        <InputText type="password" class="w-full mb-3" v-model="p1" autocomplete="password" name="password" required v-on:keyup.enter="requestChangePassword" />

        <div class="flex align-items-center justify-content-end">
          <Button :disabled="!p0.length && !p1.length" label="Ok" :icon="senderIcon" class="flex-shrink-0" @click="requestChangePassword"></Button>
        </div>
      </div>
    </div>
    <div v-else class="p-4 border-black-alpha-50 lg:w-6 bg-white-alpha-90 shadow-2">
      <div class="text-center">
        Ungültiger Schlüssel
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
      p0:"",
      p1:"",
      loading:true,
      uuidIsValid:false
    }
  },
  props: {
    uuid:String
  },
  async created() {
    this.uuidIsValid = (await this.authService.uuid(this.uuid)).valid||false;
    this.updateSenderIcon();
    this.loading = false;
  },
  methods: {
    goto(path="/") {
      this.$router.push(path);
    },
    clear() {
      this.email="";
    },
    updateSenderIcon(sending=false) {
      this.senderIcon = sending ? "pi pi-sync pi-spin" : "pi pi-check";
    },
    async requestChangePassword() {
      if (this.p0===this.p1) {
        try {
          let auth = await this.authService.change({uuid:this.uuid,pass:this.p0});
          this.authService.setLocalAuth(auth);
          this.$toast.add({severity:'success', summary: 'Passwort ändern', detail:"Passwort erfolgreich geändert.", life: 10000});
          this.goto();
        } catch (err) {
          const response = err.response?.data||{};
          this.$toast.add({severity:'error', summary: `Fehler ${response.status}`, detail:`${response.error}`, life: 3000})
        }
      }
      else {
        this.p0 = this.p1 = "";
        this.$toast.add({severity:'error', summary: 'Fehler', detail:"Passwörter stimmen nicht überein.", life: 3000})
      }
    }
  }
}
</script>