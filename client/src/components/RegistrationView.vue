<template>
  <form class="flex-grow-1 flex flex-colum justify-content-center align-items-center bg-login" ref="loginForm" autocomplete="on" v-on:submit.prevent>
    <div :class="contentClasses">
      <div class="text-center mb-3">
        <div class="text-900 text-xl font-thin flex align-items-start line-height-1 p-1 absolute top-0 right-0 text-white sm:text-primary">zfsdomweb</div>
        <div class="flex flex-row justify-content-start align-items-start mb-4">
          <img src="../assets/logo.png" class="cursor-pointer max-w-full m-2" @click="goto()">
        </div>
        <span class="font-medium line-height-3 mt font-bold">Ein Konto anlegen</span>
      </div>

      <div class="px-4 pb-4">
        <label for="email" class="block text-900 font-medium mb-2">E-Mail</label>
        <InputText id="email" type="text" class="w-full mb-3" v-model="email" name="email" required />

        <label for="password0" class="block text-900 font-medium mb-2">Passwort</label>
        <InputText id="password0" type="password" class="w-full mb-3" v-model="p0" name="password0" required v-on:keyup.enter="register" />
        <label for="password1" class="block text-900 font-medium mb-2">Wiederholen</label>
        <InputText id="password1" type="password" class="w-full mb-3" v-model="p1" name="password1" required v-on:keyup.enter="register" />

        <div class="flex flex-row align-items-center justify-content-end mb-3">
          <label for="disclaimer"> Ich akzeptiere die <a href="#" @click.prevent="displayDisclaimer=true" class="text-blue-500 no-underline">Nutzungsbedingungen</a></label>
          <Checkbox v-model="disclaimer" class="ml-2" :binary="true" />
        </div>

        <div class="flex align-items-center justify-content-between">
          <div class="flex flex-column text-sm">
            <a v-if="externalLinks" class="font-medium no-underline text-blue-500 cursor-pointer" href="#" @click.prevent="startOver">Sie haben schon ein Konto?</a>
          </div>
          <Button :disabled="!(this.email && this.p0 && this.p1 && this.disclaimer) || this.sending" label="Registrieren" :icon="senderIcon" class="flex-shrink-0" @click="register"></Button>
        </div>
      </div>
    </div>
    <Dialog v-model:visible="displayDisclaimer" :modal="true" :close-on-escape="true" :closable="true" :dismissable-mask="true" :draggable="false" style="max-width: 600px" :class="'disclaimer-dialog'">
      <template #header>
        <div class="flex flex-row align-items-center">
          Nutzungsbedingungen
        </div>
      </template>
      <div class="px-3">
        <p>Wir behalten uns das Recht vor, diese Applikation jederzeit und ohne vorherige Ankündigung oder Benachrichtigung zurückzuziehen oder offline zu nehmen.</p>
        <p>Durch die Nutzung dieses Dienstes erklären Sie sich damit einverstanden, dass wir keine Verantwortung oder Haftung für den Verlust von Daten oder Informationen übernehmen, die während der Nutzung entstanden sind. Es obliegt Ihrer Verantwortung, regelmässig Sicherheitskopien Ihrer Daten anzufertigen und diese ausserhalb der Applikation aufzubewahren.</p>
      </div>
    </Dialog>
  </form>
  <Toast></Toast>
</template>

<script>

export default {
  name: 'RegistrationView',
  components: {
  },
  data() {
    return {
      email:"",
      p0:"",
      p1:"",
      sending:false,
      senderIcon:"pi pi-sign-in",
      disclaimer:false,
      displayDisclaimer:false,
      contentClasses:"border-black-alpha-50 w-full lg:w-6 bg-white-alpha-90 shadow-2 sm:relative",
      externalLinks:true
    }
  },
  methods: {
    async startOver() {
      await this.authService.logout();
      this.goto("/login");
    },
    goto(path="/") {
      this.$router.push(path);
    },
    onSuccess() {
      this.goto();
    },
    clear() {
      this.email="";
      this.p0="";
      this.p1="";
    },
    updateSending(sending=false) {
      this.senderIcon = sending ? "pi pi-sync pi-spin" : "pi pi-sign-in";
      this.sending = sending;
    },
    async register() {
      if (!(this.email && this.p0 && this.p1 && this.disclaimer))
        return;
      else if (!this.email.match(/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/)) {
        this.$toast.add({severity:'error', summary: 'Fehler', detail:"E-Mail ungültig.", life: 3000})
      }
      else if (this.p0!==this.p1) {
        this.p0 = this.p1 = "";
        this.$toast.add({severity:'error', summary: 'Fehler', detail:"Passwörter stimmen nicht überein.", life: 3000})
      }
      else  {
        try {
          this.updateSending(true);
          await this.authService.register({email:this.email,password:this.p0});
          let profile = await this.authService.ensureAuth();
          await this.authService.requestConfirm({email:profile.email,url:`${location.origin}/confirmation`})
          this.updateSending(false);
          this.onSuccess({profile});
        } catch (err) {
          this.updateSending(false);
          this.$toast.add({severity:'error', summary: 'Login Fehler', detail:(err.response?.data?.code==="ER_DUP_ENTRY") ? "Mailadresse existiert bereits" : err.response?.data?.code, life: 3000})
        }
      }
    },
  }
}
</script>