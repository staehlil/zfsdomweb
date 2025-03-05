<template>
  <form v-if="userId" :class="`flex-grow-1 flex flex-colum justify-content-center align-items-center bg-reset deferred-content${loading ? ' loading' : ''}`" ref="loginForm" autocomplete="on" v-on:submit.prevent>
    <div class="p-4 border-black-alpha-50 w-full lg:w-6 bg-white-alpha-90 shadow-2">
      <div class="text-center mb-3">
        <span class="font-medium line-height-3"><b>Ihr Passwort ist abgelaufen und muss geändert werden</b></span>
      </div>

      <div>
        <label class="block text-900 font-medium mb-2">Neues Passwort</label>
        <InputText type="password" class="w-full mb-3" v-model="p0" autocomplete="password" name="password" required v-on:keyup.enter="requestChangePassword" autofocus />
        <label class="block text-900 font-medium mb-2">Wiederholen</label>
        <InputText type="password" class="w-full mb-3" v-model="p1" autocomplete="password" name="password" required v-on:keyup.enter="requestChangePassword" />

        <div class="flex align-items-center justify-content-end">
          <Button :disabled="!p0.length && !p1.length" label="Ok" :icon="senderIcon" class="flex-shrink-0" @click="requestChangePassword"></Button>
        </div>
      </div>
    </div>
  </form>
  <Toast></Toast>
</template>

<script>

import usersService from "@/users-service";

export default {
  name: 'PasswordExpiredView',
  components: {
  },
  data() {
    return {
      p0:"",
      p1:"",
      loading:true,
      userId:0
    }
  },
  props: {
    uuid:String
  },
  async created() {
    this.userId = (this.authService.getLocalProfile()||{}).id;
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
          await usersService.update(this.userId, {pass:this.p0});
          this.$toast.add({severity:'success', summary: 'Passwort ändern', detail:"Passwort erfolgreich geändert.", life: 3000});
          this.goto("/login");
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