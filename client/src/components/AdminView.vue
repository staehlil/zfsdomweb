<template>
  <TocComponent :list-entries="listEntries"></TocComponent>
</template>

<script>
import AuthView from "@/components/AuthView.vue";
import usersService from "@/users-service";
import TocComponent from "@/components/TocComponent.vue";

export default {
  extends: AuthView,
  name: 'AdminView',
  components: {
    TocComponent,
  },
  data() {
    return {
      requiredUserLevel:1,
      listEntries:[{
        title:"Kandidaten",
        icon:"pi pi-users",
        url:"/admin/kandidaten"
      },{
        title:"Stand",
        icon:"pi pi-clock",
        url:"/admin/stand"
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