<script>

import RegistrationView from "@/components/RegistrationView.vue";

export default {
  name: 'RegistrationDialog',
  extends: RegistrationView,
    inject: ['dialogRef'],
  components: {
  },
  data() {
    return {
      ...RegistrationView.data.call(this),
      contentClasses:"p-4 border-black-alpha-50 w-full bg-white-alpha-90 shadow-2",
      externalLinks:false
    }
  },
  methods: {
    ...RegistrationView.methods,
    closeDialog({profile}) {
      this.dialogRef.close(profile);
    },
    onSuccess(data) {
      console.log("close");
      this.closeDialog(data);
    }
  }
}
</script>