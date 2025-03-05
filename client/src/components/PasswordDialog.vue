<template>
  <div class="p-fluid grid formgrid">
    <div class="field col-12">
      <label>Passwort:</label>
      <InputText type="password" v-model="p0" class="flex-grow-1" autofocus/>
    </div>
    <div class="field col-12">
      <label>Wiederholen:</label>
      <InputText type="password" v-model="p1" class="flex-grow-1" />
    </div>
  </div>
  <div class="flex flex-row mt-4 justify-content-end w-full">
    <Button label="Abbrechen" icon="pi pi-times" @click="closeDialog(false)" class="p-button-text mr-2"/>
    <Button :disabled="!p0.length && !p1.length" label="Ok" icon="pi pi-check" @click="requestCloseDialog" autofocus />
  </div>
</template>

<script>

export default {
  inject: ['dialogRef'],
  name: "PasswordDialog",
  data() {
    return {
      p0:"",
      p1:"",
      val:"",
    }
  },
  async created() {
    let params = this.dialogRef.data;
    if (params) {
      this.val = params.val;
    }
  },
  methods: {
    closeDialog(ok=true) {
      this.dialogRef.close(ok ? {
        val:this.p0,
      } : null);
    },
    requestCloseDialog() {
      if (this.p0===this.p1)
        this.closeDialog();
      else {
        this.p0 = this.p1 = "";
        this.$toast.add({severity:'error', summary: 'Fehler', detail:"Passwörter stimmen nicht überein.", life: 3000})
      }
    }
  }
}
</script>

<style scoped>

</style>