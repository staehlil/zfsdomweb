<template>
  <form class="flex-grow-1 flex flex-colum justify-content-center align-items-center bg-reset" ref="loginForm" autocomplete="on" v-on:submit.prevent>
    <div class="border-black-alpha-50 w-full lg:w-6 bg-white-alpha-90 shadow-2 sm:relative">
      <div class="text-center mb-3">
        <div class="text-900 text-xl font-thin flex align-items-start line-height-1 p-1 absolute top-0 right-0">&nbsp;</div>
        <div class="flex flex-row justify-content-start align-items-start mb-4">
          <h2 class="cursor-pointer max-w-full pixelart m-0 p-2" @click="goto()">
            zfsdomweb<sup class="text-xs">libvirt+zfs</sup>
          </h2>
        </div>
        <span class="font-medium line-height-3">Ihr Passwort zurücksetzen</span>
      </div>

      <div class="px-4 pb-4">
        <label for="username" class="block text-900 font-medium mb-2">Email</label>
        <InputText id="username" type="text" class="w-full mb-3" v-model="email" autocomplete="username" name="username" required v-on:keyup.enter="reset" />

        <div class="flex align-items-center justify-content-end">
          <Button label="Reset" :icon="senderIcon" class="flex-shrink-0" @click="reset"></Button>
        </div>
      </div>
    </div>
  </form>
  <Toast></Toast>
</template>

<script>

export default {
  name: 'ResetRequestView',
  components: {
  },
  data() {
    return {
      email:"",
      senderIcon:""
    }
  },
  async created() {
    this.updateSenderIcon();
  },
  methods: {
    goto(path="/") {
      this.$router.push(path);
    },
    clear() {
      this.email="";
    },
    async reset() {
      if (this.email) {
        try {
          this.updateSenderIcon(true);
          await this.authService.reset({email:this.email,url:location.href.replace(/\/$/,"")});
          this.clear();
          this.$toast.add({severity:'success', summary: 'Passwort zurücksetzen', detail:"Bitte überprüfen Sie Ihren Posteingang.", life: 10000})
        } catch (err) {
          const response = err.response?.data||{};
          this.$toast.add({severity:'error', summary: `Fehler ${response.status}`, detail:`${response.error}`, life: 5000})
        }
        this.updateSenderIcon();
      }
    },
    updateSenderIcon(sending=false) {
      this.senderIcon = sending ? "pi pi-sync pi-spin" : "pi pi-sync";
    }
  }
}
</script>