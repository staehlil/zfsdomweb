<template>
  <div class="mb-2"><b>Empfänger</b></div>
  <div class="flex flex-column">
    <div v-for="(r,ix) of recipients" :key="r.email" class="mb-1 p-0 cursor-pointer flex flex-row bg-primary-50 justify-content-between align-items-center">
      <div class="ml-2">{{r.username}} &lt;{{r.email}}&gt;</div>
      <Button icon="pi pi-times" class="p-button-rounded p-button-secondary p-button-text p-0" @click="removeRecipient(ix)"/>
    </div>
  </div>
  <div class="p-fluid grid formgrid">
    <div class="field col-12">
      <InputText v-model="data['subject']" placeholder="Betreff" class="my-1" @change="onChange('subject')"></InputText>
      <Editor ref="editor" v-model="data['content']" editorStyle="height: 320px" @text-change="onChange('content')">
        <template #toolbar>
        <span class="ql-formats">
          <button class="ql-bold"></button>
          <button class="ql-italic"></button>
          <button class="ql-underline"></button>
          <button class=""></button>
        </span>
        </template>
      </Editor>
    </div>
  </div>
  <div class="flex flex-row mt-4 justify-content-end w-full">
    <Button label="Abbrechen" icon="pi pi-times" @click="closeDialog(false)" class="p-button-text mr-2"/>
    <Button label="Senden" icon="pi pi-send" @click="closeDialog(true)" />
  </div>
</template>

<script>
import settingsService from "@/settings-service";
export default {
  inject: ['dialogRef'],
  name: "EditorDialog",
  data() {
    return {
      data:{
        subject:'',
        content:'',
      },
      template:"",
      recipients:[]
    }
  },
  async created() {
    let params = this.dialogRef.data;
    if (params) {
      this.template = params.template;
      this.recipients = params.recipients||[];
    }
    this.loadData();
  },
  methods: {
    async loadData() {
      this.data = {
        subject:(await settingsService.get(`${this.template}-subject`)).data||"",
        content:(await settingsService.get(`${this.template}-content`)).data||"",
        recipients:this.recipients
      }
    },
    async onChange(key) {
      await settingsService.update(`${this.template}-${key}`,{val:this.data[key]});
    },
    closeDialog(ok) {
      if (ok) {
        this.$confirm.require({
          acceptClass:"p-button-danger",
          acceptIcon:"pi pi-exclamation-triangle text-xl",
          rejectClass:"p-button-text p-button-plain",
          acceptLabel:"Ja",
          rejectLabel:"Nein",
          message: `E-Mail wird an ${this.data.recipients.length} Empfänger versandt. Fortfahren?`,
          header: 'Versenden',
          icon: 'pi pi-question-circle',
          accept: async () => {
            this.dialogRef.close(this.data);
          }
        });
      }
      else
        this.dialogRef.close(null);
    },
    removeRecipient(ix) {
      this.recipients.splice(ix,1);
    }
  }
}
</script>

<style scoped>

</style>