import { createApp } from 'vue'
import App from './App.vue'
import router from './router';
import PrimeVue from "primevue/config";
import "./assets/_theme.scss"; //import "primevue/resources/themes/saga-blue/theme.css"
import "primevue/resources/primevue.min.css"
import "primeicons/primeicons.css"
import "primeflex/primeflex.css"
import "./override.css"
import "./main.css"
import 'xterm/css/xterm.css';
import ConfirmationService from "primevue/confirmationservice";
import ToastService from "primevue/toastservice";
import DialogService from "primevue/dialogservice";
import ConfirmDialog from "primevue/confirmdialog";
import Toast from "primevue/toast";
import Sidebar from "primevue/sidebar";
import TabMenu from "primevue/tabmenu";
import InputText from "primevue/inputtext";
import Checkbox from "primevue/checkbox";
import Button from "primevue/button";
import axios from 'axios'
import VueAxios from "vue-axios";
import AuthService from "@/auth-service";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import Card from "primevue/card";
import Breadcrumb from "primevue/breadcrumb";
import Dropdown from "primevue/dropdown";
import FileUpload from "primevue/fileupload";
import DynamicDialog from "primevue/dynamicdialog";
import Editor from "primevue/editor";
import Tooltip from "primevue/tooltip";
import InputNumber from "primevue/inputnumber";
import Password from "primevue/password";
import Dialog from "primevue/dialog";
import Listbox from "primevue/listbox";
import TabPanel from "primevue/tabpanel";
import TabView from "primevue/tabview";
import Menu from "primevue/menu";
import ProgressSpinner from "primevue/progressspinner";
import SelectButton from "primevue/selectbutton";
import Calendar from "primevue/calendar";
import SplitButton from "primevue/splitbutton";
import Textarea from "primevue/textarea";

const app = createApp(App);
app.use(router).use(PrimeVue).use(ConfirmationService).use(ToastService).use(DialogService)
app.use(VueAxios,axios)
app.component("ConfirmDialog",ConfirmDialog).component("Toast",Toast).component("Sidebar",Sidebar).component("TabMenu",TabMenu)
.component("InputText",InputText).component("Password",Password).component("InputNumber",InputNumber).component("Checkbox",Checkbox).component("Button",Button)
.component("DataTable",DataTable).component("Column",Column).component("Card",Card).component("Breadcrumb",Breadcrumb)
.component("Dropdown",Dropdown).component("FileUpload",FileUpload).component("DynamicDialog",DynamicDialog).component("Editor",Editor)
.component("Dialog",Dialog).component("Listbox",Listbox)
.component("TabView",TabView).component("Calendar",Calendar).component("TabPanel",TabPanel).component("Menu",Menu).component("ProgressSpinner",ProgressSpinner).component("SelectButton",SelectButton)
.component("Textarea",Textarea)
.component("SplitButton",SplitButton).directive('tooltip', Tooltip);
app.config.globalProperties.authService = new AuthService();
router.isReady().then(()=>{
  app.mount('#app')
});