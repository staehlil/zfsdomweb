<template>
  <div class="p-fluid grid formgrid">
    <div class="field col-12">
      <label v-if="text">{{text}}</label>
      <InputText type="text" v-model="str" class="mt-1 flex-grow-1" autofocus/>
    </div>
  </div>
  <div class="flex flex-row mt-4 justify-content-end w-full">
    <Button label="Abbrechen" icon="pi pi-times" @click="closeDialog(false)" class="p-button-text mr-2"/>
    <Button :disabled="!str.length" label="Ok" icon="pi pi-check" @click="requestCloseDialog" autofocus />
  </div>
</template>

<script>

export default {
  inject: ['dialogRef'],
  name: "PasswordDialog",
  data() {
    return {
      str:"",
      val:"",
      text:"",
    }
  },
  async created() {
    let params = this.dialogRef.data;
    if (params) {
      this.val = params.val;
      this.text = params.text;
    }
  },
  methods: {
    closeDialog(ok=true) {
      this.dialogRef.close(ok ? {
        val:this.str,
      } : null);
    },
    requestCloseDialog() {
      this.closeDialog();
    }
  }
}
</script>

<style scoped>

</style>