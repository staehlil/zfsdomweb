<template>
  <TocComponent :list-entries="listEntries"></TocComponent>
</template>

<script>
import AuthView from "@/components/AuthView.vue";
import usersService from "@/users-service";
import TocComponent from "@/components/TocComponent.vue";

export default {
  extends: AuthView,
  name: 'SystemView',
  components: {
    TocComponent,
  },
  data() {
    return {
      requiredUserLevel:1,
      listEntries:[{
        title:"Benutzer",
        icon:"pi pi-users",
        url:"/system/users"
      },{
        title:"Konfiguration",
        icon:"pi pi-server",
        url:"/system/config"
      }]
    }
  },
  async created() {
    await this.deferred;
    this.loadUsers();
  },
  methods: {
    async loadUsers() {
      this.listUsers = await usersService.index();
    }
  }
}
</script>