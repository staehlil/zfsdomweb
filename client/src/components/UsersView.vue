<template>
  <div class="p-datatable">
    <div class="p-datatable-header border-top-none flex flex-row justify-content-between">
      <Breadcrumb :home="home" :model="listCrumbs" class="p-0 flex">
        <template #item="{item}">
          <span @click="$router.push(item.url||'')"><i :class="item.icon"></i>{{item.label}}</span>
        </template>
      </Breadcrumb>
      <div class="flex flex-column justify-content-center flex-grow-1 align-items-end max-w-full">
        <span class="p-input-icon-left">
          <i class="pi pi-search" />
          <InputText v-model="searchValue" placeholder="Suche" @keyup.enter="trigger++" class="search"/>
          <i class="pi pi-times right-0 mr-2 cursor-pointer" v-if="searchValue" @click="searchValue=''; trigger++"/>
        </span>
      </div>
      <FileUpload class="ml-3 my-0" name="dates[]" :customUpload="true" @uploader="handleUpload" @select="updateUploadIcon(true)" :auto="true" :showUploadButton="false" :showCancelButton="false" chooseLabel="Import" :chooseIcon="uploadIcon">
        <template #empty></template>
      </FileUpload>
      <Button label="Neuer&nbsp;Benutzer" icon="pi pi-plus" class="p-button-primary ml-1" @click="createUser"></Button>
    </div>
  </div>
  <div :class="`deferred-content${loading ? ' loading' : ''}`">
    <TableComponent :rows="listUsers" :columns="mapColumns" :map-enums="mapEnums" v-model:selected="selectedUsers" :key="trigger"
        @selectionChange="onSelectionChange" selection-mode="multiple" :buttons="buttons" :display-all-columns="false" :loading="loading" :fullscreen-table="false" :search="searchValue"
        ></TableComponent>
  </div>
  <Dialog v-model:visible="displaySelectSheets" :modal="true" :close-on-escape="true" :draggable="false" :breakpoints="{'960px': '75vw', '640px': '95vw'}" :style="{width: '50vw', 'max-width':'1000px'}">
    <template #header>
      <div>
        <h3>Benutzer aus Datei importieren</h3>
        <p><i class="pi pi-info-circle"></i> Unterstützte Spaltenbezeichnungen: username, email, password, confirmation, level, expired, jsonData.firstName, jsonData.lastName</p>
      </div>
    </template>
    <Listbox v-model="selectedSheets" :options="listSheets" optionLabel="name" :multiple="true"/>
    <template #footer>
      <div class="flex flex-row mt-4 justify-content-end">
        <Button label="Abbrechen" icon="pi pi-times" @click="hideSelectSheets" class="p-button-text"/>
        <Button label="Import" icon="pi pi-check" @click="importSelectedSheets" autofocus />
      </div>
    </template>
  </Dialog>
  <Sidebar v-model:visible="sidebarVisible" position="bottom" :modal="false" :showCloseIcon="false" :class="'toolbar'" :dismissable="false">
    <div class="flex flex-row justify-content-start my-3 mr-3">
      <Button label="Löschen" icon="pi pi-trash" :class="'p-button-rounded p-button-danger ml-3'" @click="requestRemoveUsers($event,selectedUsers)"/>
    </div>
  </Sidebar>
</template>

<script>
import AuthView from "@/components/AuthView.vue";
import usersService from "@/users-service";
import TableComponent from "@/components/TableComponent.vue";
import * as xlsx from "xlsx";
import {singletons} from "../../shared";

export default {
  extends: AuthView,
  name: 'UsersView',
  components: {
    TableComponent
  },
  data() {
    return {
      requiredUserLevel:2,
      listUsers:[],
      selectedUsers:[],
      mapColumns:{
        id:"id",
        username:"Benutzername",
        email:"Email",
        level:"Userlevel",
        groups:"Gruppen"
      },
      buttons:[{
        icon:"pi pi-trash",
        onClick:(args)=>{
          this.requestRemoveUser(args);
        }
      },{
        icon:"pi pi-arrow-right",
        onClick:(args)=>{
          this.$router.push(`${this.$route.path.replace(/\/$/,"")}/${args.id}`);
        }
      }],
      loading:true,
      home: {icon: 'pi pi-home', url: '/'},
      listCrumbs: [
        {label: 'System',url: '/system'},
        {label: 'Benutzer',url: '/system/users'}
      ],
      searchValue:"",
      trigger:0,
      mapEnums:{
        level:{
          0:"User",
          1:"Admin",
          2:"Superuser"
        },
        isActiveEditor: {
          0:"nein",
          1:"ja"
        }
      },
      displaySelectSheets:false,
      selectedSheets:null,
      listSheets:[],
      uploadIcon:"",
      sidebarVisible:false
    }
  },
  async created() {
    this.updateUploadIcon();
    await this.deferred;
    if (singletons.cluster?.root)
        this.mapColumns.node = "Cluster Node";
    await this.loadData();
    this.trigger++;
    this.loading = false;
  },
  methods: {
    async loadData() {
      this.listUsers = await this.getUsers();
    },
    async getUsers() {
      let {data} = await usersService.index();
      return data;
    },
    onSelectionChange(selectedUsers) {
      setTimeout(()=>{
        this.sidebarVisible = !!(selectedUsers && selectedUsers.length)
      });
    },
    async createUser() {
      let {data} = await usersService.create({username:"default"});
      this.$router.push(`${this.$route.path.replace(/\/$/,"")}/${data.insertId}/`);
    },
    requestRemoveUser(args) {
      this.$confirm.require({
        acceptClass:"p-button-danger",
        acceptIcon:"pi pi-exclamation-triangle text-xl",
        rejectClass:"p-button-text p-button-plain",
        acceptLabel:"Ja",
        rejectLabel:"Nein",
        message: `Sicher?`,
        header: 'Benutzer löschen',
        icon: 'pi pi-question-circle',
        accept: async () => {
          try {
            await usersService.delete(args.id);
          } catch (err) {
            this.$toast.add({severity:'error', summary: 'Fehler', detail:err, life: 3000})
          }
          this.loadData();
        }
      });
    },
    async onRowReordered({value:inAscendingOrder}) {
      await usersService.sort({order:inAscendingOrder.map(item=>item.id)});
      this.loadData();
    },
    async createUsers(list) {
      let {data} = await usersService.create({list});
      if (data.errors) {
        this.$toast.add({severity:'error', summary: 'Fehler', detail:data.errors.join("\n"), life: 5000})
      }
    },
    async importSelectedSheets() {
      this.hideSelectSheets();
      let all = [];
      this.selectedSheets.forEach(sheet=>{
        let worksheet = this.datesWorkbook.Sheets[sheet.name]
        let data = xlsx.utils.sheet_to_json(worksheet);
        all = all.concat(data)
      });

      if (all.length) {
        let jsonDataKeys = Object.keys(all[0]).filter(key=>key.match(/^jsonData\./g));
        all = all.map(item=>{
          let jsonData = {};
          for (let key of jsonDataKeys) {
            jsonData[key.replace(/^jsonData\./g,"")] = item[key]
            delete item[key];
          }
          return {
            ...item,
            ...{jsonData:JSON.stringify(jsonData)}
          }
        })
        await this.createUsers(all);
        this.loadData();
      }
    },
    hideSelectSheets() {
      this.displaySelectSheets = false;
    },
    updateUploadIcon(uploading=false) {
      this.uploadIcon = uploading ? "pi pi-sync pi-spin" : "pi pi-upload";
    },
    async handleUpload(e) {
      this.selectedSheets = [];
      const file = e.files[0];
      const buffer = await file.arrayBuffer();
      const workbook = xlsx.read(buffer);
      this.datesWorkbook = workbook;
      this.listSheets = workbook.SheetNames.map(name=>({name}));
      this.displaySelectSheets = true;
      this.updateUploadIcon(false);
    },
    requestRemoveUsers(event,listUsers) {
      this.$confirm.require({
        target:event.currentTarget,
        position: "center",
        acceptClass:"p-button-danger",
        acceptIcon:"pi pi-exclamation-triangle text-xl",
        rejectClass:"p-button-text p-button-plain",
        acceptLabel:"Ja",
        rejectLabel:"Nein",
        message: `Sicher?`,
        header: 'Benutzer löschen',
        icon: 'pi pi-question-circle',
        accept: async () => {
          try {
            await usersService.delete(listUsers.map(({id})=>id).join(","));
            this.unselectUsers();
          } catch (err) {
            this.$toast.add({severity:'error', summary: 'Fehler', detail:err, life: 3000})
          }
          this.loadData();
        }
      });
    },
    unselectUsers() {
      this.selectedUsers = [];
      this.onSelectionChange();
    },
  }
}
</script>
