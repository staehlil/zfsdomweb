<template>
  <div class="p-datatable">
    <div class="p-datatable-header border-top-none flex flex-row justify-content-between p-button-success pr-2">
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
  <div :class="`deferred-content${loading ? ' loading' : ''}`">
    <div class="flex flex-column mt-2">
      <div v-for="(value,name) in data" v-bind:key="name" >
        <div v-if="name==='jsonData'">
          <div class="flex flex-column lg:flex-row justify-content-start lg:align-items-center p-2" v-for="(val,key) in mapColumns['jsonData']" v-bind:key="val" >
            <label :for="name" class="w-2 flex-shrink-0">{{mapColumns['jsonData'][key]}}</label>
            <InputText :id="name" type="text" v-model="data.jsonData[key]" class="flex-grow-1" @input="onChangeData" />
          </div>
        </div>
        <div class="flex flex-column lg:flex-row justify-content-start lg:align-items-center p-2" v-else-if="mapColumns[name]">
          <label :for="name" class="w-2 flex-shrink-0">{{mapColumns[name]||name}}</label>
          <Dropdown v-if="mapColumnEnumKey[name]" v-model="data[name]" :options="mapEnum[mapColumnEnumKey[name]]" optionLabel="name" optionValue="id" placeholder="Wählen" @change="onChangeData" />
          <InputText v-else :id="name" type="text" v-model="data[name]" class="flex-grow-1" @input="onChangeData" />
        </div>
      </div>
      <div class="flex flex-column lg:flex-row justify-content-start lg:align-items-center p-2">
        <label class="w-2 flex-shrink-0">Bearbeiter</label>
        <Dropdown v-model="data['isEditor']" :options="mapEnum['no_yes']" optionLabel="name" optionValue="id" placeholder="Wählen" @change="onChangeEditor" />
      </div>
      <div class="flex flex-column lg:flex-row justify-content-start lg:align-items-center p-2">
        <label class="w-2 flex-shrink-0">Aktiv</label>
        <Dropdown v-model="data['isActive']" :options="mapEnum['no_yes']" optionLabel="name" optionValue="id" placeholder="Wählen" @change="onChangeEditor" />
      </div>
      <div class="flex flex-column lg:flex-row justify-content-start lg:align-items-center p-2">
        <label class="w-2 flex-shrink-0">LDAP-Benutzer</label>
        <Dropdown v-model="(data.jsonData||{})['ldapValidation']" :options="mapEnum['no_yes']" optionLabel="name" optionValue="id" placeholder="Wählen" @change="onChangeData" />
      </div>
      <div class="flex flex-column lg:flex-row justify-content-start lg:align-items-center p-2">
        <label class="w-2 flex-shrink-0 flex align-items-center"><i v-if="hasContainers" class="mr-1 pi pi-exclamation-triangle text-red-600"></i>Cluster Node</label>
        <Dropdown v-model="data['node']" :options="mapEnum['clusterNodes']" optionLabel="name" optionValue="value" placeholder="Wählen" @change="onChangeEditor" />
      </div>
      <div class="flex flex-column lg:flex-row justify-content-start lg:align-items-start p-2">
        <label class="w-2 mt-2 flex-shrink-0">Gruppen</label>
        <div class="flex flex-column flex-grow-1">
          <div v-for="group of listGroups" :key="group.name" class="flex flex-row flex-grow-1 mb-2 align-items-center">
            <div class="flex-grow-1">{{group.name}}</div>
            <Button icon="pi pi-trash" class="ml-1 p-button-danger p-button-outlined flex-shrink-0" @click="requestDeleteGroupRelation(group.name)"></Button>
          </div>
          <Button icon="pi pi-plus" class="p-button-primary p-button-outlined" @click="requestAddGroupRelation"></Button>
        </div>
      </div>
      <div class="flex flex-column lg:flex-row justify-content-start lg:align-items-start p-2">
        <label class="w-2 mt-2 flex-shrink-0">Attribute</label>
        <div class="flex flex-column flex-grow-1">
          <table class="flex-grow-1 max-w-5rem">
          <tr v-for="(val,key) in data.jsonData||{}" :key="key">
            <td class="pl-0"><b>{{key}}</b></td>
            <td class="overflow-hidden max-w-10rem">{{val}}</td>
            <td><Button icon="pi pi-trash" class="ml-1 p-button-danger p-button-outlined flex-shrink-0" @click="requestDeleteAttribute(key)"></Button></td>
          </tr>
          </table>
          <Button icon="pi pi-plus" class="p-button-primary p-button-outlined" @click="requestAddAttribute"></Button>
        </div>
      </div>
    </div>
    <div class="flex flex-row mt-2">
      <Button class="p-button-primary" label="Passwort" icon="pi pi-key" @click="requestSetPassword"></Button>
    </div>
  </div>
</template>

<script>
import AuthView from "@/components/AuthView.vue";
import usersService from "@/users-service";
import PasswordDialog from "@/components/PasswordDialog.vue";
import {singletons} from "../../shared";
import TextInputDialog from "@/components/TextInputDialog.vue";

export default {
  extends: AuthView,
  name: 'UserView',
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
        {label: 'Benutzer',url: '/system/users'},
        {label: ''}
      ],
      mapColumns:{
        username:"Benutzername",
        jsonData:{
          firstName:"Vorname",
          lastName:"Nachname",
        },
        email:"Email",
        level:"Userlevel",
        confirmation:"Freischaltung",
        expired:"Abgelaufen"
      },
      mapEditorColumns:{

      },
      listEnumKeys: [],
      mapEnum: {
        level:[{id:0,name:"Benutzer"},{id:1,name:"Admin"},{id:2,name:"Superuser"}],
        no_yes:[{id:0,name:"nein"},{id:1,name:"ja"}],
        clusterNodes:[]
      },
      mapColumnEnumKey: {
        level:"level",
        confirmation:"no_yes",
        expired:"no_yes"
      },
      savedState:{},
      listFiles:[],
      uploadIcon:"pi pi-upload",
      mergeIcon:"pi pi-database",
      hasContainers:false,
      listGroups:[{name:"default"}],
      jsonData:{test:"bla"}
    }
  },
  async created() {
    await this.deferred;
    if (singletons.cluster?.root)
      this.mapEnum.clusterNodes = [{name:"default",value:""},...(singletons.cluster?.nodes || []).map(name=>({name, value:name}))];
    await this.loadData();
    this.listCrumbs[this.listCrumbs.length-1].label = this.data ? `#${this.data.id}` : "";
    this.loading = false;
  },
  methods: {
    async loadData() {
      let {data} = await usersService.get(this.id);
      let jsonData = data.jsonData || {};
      try {
        jsonData = JSON.parse(data.jsonData);
      } catch (err) {
        //
      }
      this.data = {
        ...data,
        jsonData
      };
      this.listGroups = (this.data.groups||"").split(/,/).filter(name=>name).map(name=>({name}));
    },
    async onChangeData() {
      try {
        await usersService.update(this.id,{...this.data,jsonData:JSON.stringify(this.data.jsonData)});
      }
      catch (err) {
        this.$toast.add({severity:'error', summary: 'Fehler', detail:err, life: 3000})
        this.loadData();
      }
    },
    async setPassword(pass) {
      try {
        await usersService.update(this.id, {pass});
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
          header: 'Passwort setzen',
          modal: true,
          style: {
            width: '50vw',
          },
          breakpoints:{
            '960px': '50vw',
            '640px': '80vw',
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
    },
    onChangeEditor() {
      usersService.update(this.id,this.data)
    },
    async onChangeGroups() {
      await usersService.update(this.id,{groups:this.listGroups.map(({name})=>name).join(",")});
    },
    async deleteGroupRelation(groupName) {
      let ix = this.listGroups.findIndex(({name})=>name===groupName);
      if (ix>-1) {
        this.listGroups.splice(ix,1);
        await this.onChangeGroups();
      }
    },
    requestDeleteGroupRelation(name) {
      this.$confirm.require({
        acceptClass:"p-button",
        acceptIcon:"pi pi-exclamation-triangle text-xl",
        rejectClass:"p-button-text p-button-plain",
        acceptLabel:"Ja",
        rejectLabel:"Nein",
        message: `Eintrag '${name}' entfernen?`,
        header: 'Gruppen-Bezug löschen',
        icon: 'pi pi-question-circle',
        accept: async () => {
          try {
            await this.deleteGroupRelation(name);
          } catch (err) {
            this.$toast.add({severity:'error', summary: 'Fehler', detail:err, life: 3000})
          }
          this.loadData();
        }
      });
    },
    requestDeleteAttribute(key) {
      this.$confirm.require({
        acceptClass:"p-button",
        acceptIcon:"pi pi-exclamation-triangle text-xl",
        rejectClass:"p-button-text p-button-plain",
        acceptLabel:"Ja",
        rejectLabel:"Nein",
        message: `Attribut '${key}' entfernen?`,
        header: 'Attribut löschen',
        icon: 'pi pi-question-circle',
        accept: async () => {
          delete this.data.jsonData[key];
          await this.onChangeData();
          this.loadData();
        }
      });
    },
    async addGroupRelation(name) {
      if (!this.listGroups.find(({name:groupName})=>groupName===name)) {
        this.listGroups.push({name});
        await this.onChangeGroups();
      }
    },
    async addAttribute(name,val="") {
      this.data.jsonData[name] = val;
      this.onChangeData();
    },
    requestAddGroupRelation() {
      this.$dialog.open(TextInputDialog, {
        props: {
          header: 'Gruppe',
          modal: true,
          style: {
            width: '50vw',
          },
          breakpoints:{
            '960px': '50vw',
            '640px': '80vw',
            '460px': '100vw'
          },
        },
        onClose: (options) => {
          const data = options.data;
          if (data?.val)
            this.addGroupRelation(data.val);
        }
      });
    },
    requestAddAttribute() {
      this.$dialog.open(TextInputDialog, {
        props: {
          header: 'Attribut',
          modal: true,
          style: {
            width: '50vw',
          },
          breakpoints:{
            '960px': '50vw',
            '640px': '80vw',
            '460px': '100vw'
          },
        },
        data: {
          text: 'Schlüssel:Wert',
        },
        onClose: (options) => {
          const data = options.data;
          if (data?.val) {
            let key = data.val, val = "";
            try {
              ([key,val] = key.split(/:/).map(item=>item.trim()));
            } catch (err) {}
            this.addAttribute(key,val);
          }
        }
      });
    },
  }
}
</script>
