<template :key="key">
  <div class="p-datatable"><div class="p-datatable-header border-top-none">Benutzer</div></div>
  <div class="flex flex-column lg:flex-row justify-content-start lg:align-items-center ml-3 mt-5">
    <label for="name" class="font-bold lg:w-4">Benutzername</label>
    <div class="flex-grow-1 max-w-full lg:max-w-20rem">
      {{profile.username}}
    </div>
  </div>
  <div v-if="profile.email" class="flex flex-column lg:flex-row justify-content-start lg:align-items-center ml-3 mt-5">
    <label for="name" class="font-bold lg:w-4">E-Mail</label>
    <div class="flex-grow-1 max-w-full lg:max-w-20rem">
      {{profile.email}}
    </div>
  </div>
  <div v-if="aaiData.matriculationNumber" class="flex flex-column lg:flex-row justify-content-start lg:align-items-center ml-3 mt-5">
    <label for="name" class="font-bold lg:w-4">Matrikelnummer</label>
    <div class="flex-grow-1 max-w-full lg:max-w-20rem">
      {{aaiData.matriculationNumber}}
    </div>
  </div>
  <div v-if="aaiData.uniqueID" class="flex flex-column lg:flex-row justify-content-start lg:align-items-center ml-3 mt-5">
    <label for="name" class="font-bold lg:w-4">Switch edu-ID</label>
    <div class="flex-grow-1 max-w-full lg:max-w-20rem">
      {{aaiData.uniqueID}}
    </div>
  </div>
  <div class="flex flex-column lg:flex-row align-items-start lg:align-items-center ml-3 mt-5">
    <Button class="p-button-primary p-2" label="Passwort" icon="pi pi-key" @click="requestSetPassword">
      <slot>
        <div class="flex flex-row align-items-center">
          <i class="pi pi-key"></i>
          <div class="flex flex-column ml-1 align-items-start">
            <div>Passwort</div><small>ändern</small>
          </div>
        </div>
      </slot>
    </Button>
  </div>
</template>

<script>
import usersService from "@/users-service";
import PasswordDialog from "@/components/PasswordDialog.vue";
import AuthView from "@/components/AuthView.vue";

export default {
  extends: AuthView,
  name: 'AccountView',
  props: {
    id:[Number, String]
  },
  data() {
    return {
      requiredUserLevel:0,
      data: {},
      loading:true,
      mapColumns:{
        username:"Benutzername",
        email:"Email",
        level:"Userlevel",
        confirmation:"Freischaltung"
      },
      mapSettings:{},
      booleanSelection:[{name:'nein', id:'false'},{name:'ja', id:'true'}],
      senderIcon:"",
      profile:{},
      key:1,
      aaiData:{}
    }
  },
  async created() {
    this.profile = await this.deferred;
    try {
      this.aaiData = JSON.parse(this.profile.jsonData);
    } catch (err) {}
    this.loading=false;
  },
  methods: {
    async setPassword(pass) {
      try {
        await usersService.update(this.profile.id, {pass});
        this.$toast.add({severity:'success', summary: 'Passwortänderung', detail:"Passwort erfolgreich geändert", life: 3000})
      }
      catch (err) {
        this.$toast.add({severity:'error', summary: 'Fehler', detail:err, life: 3000})
        this.loadData();
      }
    },
    requestSetPassword() {
      this.$dialog.open(PasswordDialog, {
        props: {
          header: 'Passwort ändern',
          modal: true,
          style: {
            width: '80vw',
            "max-width": ' 500px'
          },
          breakpoints:{
            '460px': '100vw'
          },
        },
        onClose: (options) => {
          const data = options.data;
          if (data) {
            this.setPassword(data.val)
          }
        }
      });
    }
  }
}
</script>
