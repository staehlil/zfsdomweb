<template>
  <form :class="`flex-grow-1 flex flex-colum justify-content-center align-items-center bg-reset deferred-content${loading ? ' loading' : ''}`" ref="loginForm" autocomplete="on" v-on:submit.prevent>
    <div v-if="!profile.confirmation" class="p-4 border-black-alpha-50 w-full lg:w-6 bg-white-alpha-90 shadow-2">
      <p class="line-height-3 m-0">Wir haben Ihnen eine E-Mail mit einem Link zur Freischaltung Ihres Accounts gesendet. Bitte prüfen Sie Ihr Postfach unter <b class="text-blue-500">{{profile.email}}</b>.</p>
      <div class="flex align-items-center justify-content-between">
        <div class="flex flex-column">
          <a class="font-medium no-underline text-blue-500 cursor-pointer" href="#" @click.prevent="startOver">Nicht Sie?</a>
        </div>
        <Button label="Erneut Senden" :icon="senderIcon" class="flex-shrink-0" @click="requestResend"></Button>
      </div>
    </div>
    <div v-else class="p-4 border-black-alpha-50 lg:w-6 bg-white-alpha-90 shadow-2">
      <div class="text-center">
        Ihr Account ist bereits aktiv.
      </div>
      <div class="flex flex-row justify-content-end">
        <Button label="Starten" icon="pi pi-sign-in" class="flex-shrink-0" @click="goto()"></Button>
      </div>
    </div>
  </form>
  <Toast></Toast>
</template>

<script>

import AuthView from "@/components/AuthView.vue";

export default {
  name: 'ConfirmationRequestView',
  extends: AuthView,
  components: {
  },
  data() {
    return {
      p0:"",
      p1:"",
      loading:true,
      profile:{},
      senderIcon:"pi pi-envelope"
    }
  },
  props: {
    uuid:String
  },
  async created() {
    this.profile = await this.deferred;
    this.updateSenderIcon();
    this.loading = false;
  },
  methods: {
    async startOver() {
      await this.authService.logout();
      this.goto();
    },
    goto(path="/") {
      this.$router.push(path);
    },
    updateSenderIcon(sending=false) {
      this.senderIcon = sending ? "pi pi-sync pi-spin" : "pi pi-envelope";
    },
    async requestResend() {
      if (this.profile?.email) {
        try {
          this.updateSenderIcon(true);
          await this.authService.requestConfirm({email:this.profile.email,url:location.href.replace(/\/$/,"")});
          this.$toast.add({severity:'success', summary: 'E-Mail versendet', detail:"Bitte überprüfen Sie Ihren Posteingang.", life: 10000})
        } catch (err) {
          const response = err.response?.data||{};
          this.$toast.add({severity:'error', summary: `Fehler ${response.status}`, detail:`${response.error}`, life: 5000})
        }
        this.updateSenderIcon();
      }
    },
  }
}
</script>