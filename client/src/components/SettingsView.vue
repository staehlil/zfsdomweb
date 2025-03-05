<template>
  <div class="p-datatable">
    <div class="p-datatable-header border-top-none flex flex-row justify-content-between">
      <Breadcrumb :home="home" :model="listCrumbs" class="p-0 flex">
        <template #item="{item}">
          <span @click="$router.push(item.url||'')"><i :class="item.icon"></i>{{item.label}}</span>
        </template>
      </Breadcrumb>
      <div class="flex flex-column justify-content-center flex-grow-1 align-items-end max-w-full opacity-0">
        <Button></Button>
      </div>
    </div>
  </div>
  <div class="p-datatable"><div class="p-datatable-header border-top-none mt-3">SMTP-Server</div></div>
  <div class="flex flex-row flex-wrap pr-2">
    <div class="field w-12 sm:w-3 mb-1 flex-grow-1 flex flex-column mt-3 ml-2">
      <label>Host</label>
      <InputText v-model="mapSettings['mail-host']" @change="onChangeSettings('mail-host')"></InputText>
    </div>
    <div class="field w-12 sm:w-3 mb-1 flex-grow-1 flex flex-column mt-3 ml-2">
      <label>Port</label>
      <InputNumber v-model="mapSettings['mail-port']" @input="onChangeSettings('mail-port',parseInt($event.value))" :use-grouping="false" ></InputNumber>
    </div>
    <div class="field w-12 sm:w-3 mb-1 flex-grow-1 flex flex-column mt-3 ml-2">
      <label>SSL</label>
      <Dropdown v-model="mapSettings['mail-ssl']" :options="booleanSelection" optionLabel="name" optionValue="id" placeholder="Wählen"  @change="onChangeSettings('mail-ssl',$event.value.code)"/>
    </div>
  </div>
  <div class="flex flex-row flex-wrap pr-2">
    <div class="field w-12 sm:w-3 mb-1 flex-grow-1 flex flex-column mt-3 ml-2">
      <label>Benutzer</label>
      <InputText v-model="mapSettings['mail-user']" @change="onChangeSettings('mail-user')"></InputText>
    </div>
    <div class="field w-12 sm:w-3 mb-1 flex-grow-1 flex flex-column mt-3 ml-2">
      <label>Passwort</label>
      <Password :feedback="false" v-model="mapSettings['mail-pass']" @input="onChangeSettings('mail-pass',null)" class="flex flex-column"></Password>
    </div>
    <div class="field w-12 sm:w-3 mb-1 flex-grow-1 flex flex-column mt-3 ml-2">
      <label>Anzeigename</label>
      <InputText v-model="mapSettings['mail-name']" @change="onChangeSettings('mail-name')"></InputText>
    </div>
  </div>
  <div class="flex flex-column align-items-start mt-2 ml-2">
    <Button :icon="senderIcon" label="Test" @click="requestSendTestMail"></Button>
  </div>
</template>

<script>
import AuthView from "@/components/AuthView.vue";
import settingsService from "@/settings-service";
import mailService from "@/mail-service";

export default {
  extends: AuthView,
  name: 'SettingsView',
  props: {
    id:[Number, String]
  },
  data() {
    return {
      requiredUserLevel:2,
      data: {},
      loading:true,
      home: {icon: 'pi pi-home', url: '/'},
      listCrumbs: [
        {label: 'System',url: '/system'},
        {label: 'Konfiguration',url: '/system/config'},
      ],
      mapColumns:{
        username:"Benutzername",
        email:"Email",
        level:"Userlevel",
        confirmation:"Freischaltung"
      },
      mapSettings:{},
      booleanSelection:[{name:'nein', id:'false'},{name:'ja', id:'true'}],
      senderIcon:""
    }
  },
  async created() {
    this.updateSenderIcon();
    await this.deferred;
    await this.loadSettings();
    this.loading = false;
  },
  methods: {
    async loadSettings() {
      this.mapSettings = (await settingsService.index()).data||{};
    },
    async onChangeSettings(key,val=null) {
      val = val!==null ? val : this.mapSettings[key];
      try {
        await settingsService.update(key,{val});
      } catch (err) {
        this.$toast.add({severity:'error', summary: 'Fehler', detail:err, life: 3000});
      }
    },
    requestSendTestMail() {
      const to = (this.authService.getLocalProfile()||{}).email||"";
      this.$confirm.require({
        acceptClass:"p-button-primary",
        rejectClass:"p-button-text p-button-plain",
        acceptLabel:"Ja",
        rejectLabel:"Nein",
        message: `Eine Testnachricht wird an ${to} gesendet. Fortfahren?`,
        header: 'Konfiguration testen',
        icon: 'pi pi-question-circle',
        accept: async () => {
          try {
            this.updateSenderIcon(true);
            let data = (await mailService.test(to)).data||{};
            this.$toast.add({severity:'success', summary: 'Erfolg', detail:data.success, life: 3000})
          }
          catch (err) {
            const {status,error} = err.response && err.response.data;
            this.$toast.add({severity:'error', summary: `Fehler ${status}`, detail:error, life: 3000})
          }
          this.updateSenderIcon();
        },
      });
    },
    updateSenderIcon(sending=false) {
      this.senderIcon = sending ? "pi pi-sync pi-spin" : "pi pi-envelope";
    },
  }
}
</script>
