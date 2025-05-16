<template>
  <div>
    <div class="p-fluid grid formgrid m-0" style="max-width:1000px">
      <div class="field col-12 px-0">
        <TabMenu v-model:activeIndex="activeCommandIndex" :model="listCommands" class="flex flex-row flex-grow-1 w-full">
          <template #item="{item}">
            <a role="menuitem" class="p-menuitem-link flex-grow-1 p-3 flex justify-content-center" aria-label="Container" tabindex="0"><span class="p-menuitem-text">{{item.name}}</span></a>
          </template>
        </TabMenu>
      </div>
      <div class="field col-12" v-if="activeCommandIndex<2">
        <label v-if="activeCommandIndex===0" class="mb-1"><i v-if="transferInProgress" class="pi pi-spinner pi-spin"/> Send{{transferInProgress ? 'ing' : ''}} <b>{{domains?.[0]}}</b> storage to:</label>
        <label v-else-if="activeCommandIndex===1" class="mb-1"><i v-if="transferInProgress" class="pi pi-spinner pi-spin"/> Migrat{{transferInProgress ? 'ing' : 'e'}} <b>{{domains?.[0]}}</b> vm to:</label>
        <div class="flex flex-row">
          <div class="flex-grow-1">
            <Dropdown v-model="destHost" :options="listHosts" optionLabel="name" optionValue="name" placeholder="Host" class="flex-grow-1"/>
          </div>
          <div class="flex-grow-1">
            <InputText v-model="destPath" placeholder="optional/zfs/dataset" class="focus:z-5" style="border-left:none;border-right:none"></InputText>
          </div>
          <Button label="Transfer" :disabled="!destHost" :icon="'pi '+(transferInProgress ? 'pi-times' : 'pi-arrow-up-right')" @click="!transferInProgress ? requestTransfer() : requestAbort()" :severity="transferInProgress ? 'danger' : ''" class="flex-shrink-1 w-auto p-button-icon-only px-2" />
        </div>
      </div>
      <div class="field col-12" v-if="activeCommandIndex===1 && useMap">
        <label class="mb-1">Apply device mapping:</label>
        <InputText v-model="map" placeholder="dev:enp1s0:eno1,dev:enp1s1:eno2" class="focus:z-5"></InputText>
      </div>
      <div class="field col-12 flex flex-row align-items-center" v-if="activeCommandIndex<2">
        <Checkbox v-model="dryRun" :binary="true" :disabled="transferInProgress" inputId="dryRun" /><label for="dryRun" class="ml-1 my-0 cursor-pointer select-none">Dry Run</label>
        <Checkbox class="ml-2" v-model="force" :binary="true" :disabled="transferInProgress" inputId="force" /><label for="force" class="ml-1 my-0 cursor-pointer select-none">Force</label>
        <div class="flex flex-row flex-nowrap align-items-center"><Checkbox v-if="activeCommandIndex===1" class="ml-2" v-model="useMap" :binary="true" :disabled="transferInProgress" inputId="useMap" /><label v-if="activeCommandIndex===1"  for="useMap" class="ml-1 my-0 cursor-pointer select-none">Device Mapping</label></div>
      </div>
      <div class="field col-12" v-else>
        <label><i v-if="transferInProgress" class="pi pi-spinner pi-spin"/> Execut{{transferInProgress ? 'ing' : 'e'}} domain operation on <b>{{domains?.[0]}}</b>:</label>
        <div class="flex flex-row">
          <div class="flex-grow-1">
            <InputText v-model="domainOperation" placeholder="start, stop, destroy" class="focus:z-5" style="border-right:none"></InputText>
          </div>
          <Button label="Transfer" :disabled="!domainOperation" :icon="'pi '+(transferInProgress ? 'pi-times' : 'pi-arrow-up-right')" @click="!transferInProgress ? requestOperation() : requestAbort()" :severity="transferInProgress ? 'danger' : ''" class="flex-shrink-1 w-auto p-button-icon-only px-2" />
        </div>
      </div>
      <div class="field col-12" v-show="transferStarted">
        <div id="terminal" ref="terminal" class="overflow-x-hidden"></div>
      </div>
    </div>
  </div>
</template>

<script>

import hostsService from "@/hosts-service";
import zfsdomService from "@/zfsdom-service";
import {singletons} from "../../shared";
import {Terminal} from "xterm";

export default {
  inject: ['dialogRef'],
  name: "CollectionDialog",
  components:{
  },
  data() {
    return {
      listHosts:[],
      userlevel:0,
      srcHost:null,
      domains:[],
      destHost:null,
      destPath:"",
      transferInProgress:false,
      transferStarted:false,
      terminal:null,
      uuid:null,
      dryRun:true,
      force:false,
      onTerminalResize:()=>{},
      onZfsdomDone:()=>{},
      activeCommandIndex:0,
      listCommands:[{name:"transfer"},{name:"migrate"},{name:"virsh"}],
      domainOperation:null,
      useMap:false,
      map:""
    }
  },
  async created() {
    let data = this.dialogRef.data;
    if (data) {
      for (const key in data) {
        this[key] = data[key]
      }
    }
    this.attachWebsocketHandlers();
    this.mapHosts = await hostsService.getHosts();
    this.listHosts = Object.keys(this.mapHosts).filter(name=>name!==this.srcHost?.name).map(name=>({name,...this.mapHosts[name]}));
    let mapTasks = await zfsdomService.all()
    const host = this.srcHost.external || this.srcHost.name;
    const domains = this.domains.join("_");
    const key = `${host}_${domains}`;
    this.initTerminal();
    if (mapTasks[key])
      this.reloadConfig(mapTasks[key]);
    let handleTerminalResize = null;
    let debounceTerminalResize = 500;
    this.onTerminalResize = ()=>{
      clearTimeout(handleTerminalResize);
      handleTerminalResize = setTimeout(()=> {
        this.terminal.options.fontSize = singletons.terminalFontSize;
      },debounceTerminalResize);
    };
    this.onZfsdomDone = (e)=>{
      if (this.uuid===e.detail?.uuid)
        this.transferInProgress = false;
    };
    window.addEventListener('terminal-resize', this.onTerminalResize);
    window.addEventListener('zfsdom-done',this.onZfsdomDone);
  },
  methods: {
    closeDialog(ok) {
      window.removeEventListener('terminal-resize',this.onTerminalResize);
      window.removeEventListener('zfsdom-done',this.onZfsdomDone);
      this.dialogRef.close(ok ? {
      } : null);
    },
    requestTransfer() {
      let run = async () => {
        try {
          await this.transfer();
        } catch (err) {
          this.$toast.add({severity: 'error', summary: 'Error', detail: err, life: 3000})
        }
      }
      if (!this.dryRun) {
        this.$confirm.require({
          acceptClass: "p-button-danger",
          acceptIcon: "pi pi-exclamation-triangle text-xl",
          rejectClass: "p-button-text p-button-plain",
          acceptLabel: "Ja",
          rejectLabel: "Nein",
          message: `Sicher?`,
          header: 'Transfer',
          icon: 'pi pi-question-circle',
          accept: run
        });
      }
      else
        run();
    },
    requestAbort() {
      let run = async () => {
        try {
          await this.abort();
        } catch (err) {
          this.$toast.add({severity: 'error', summary: 'Error', detail: err, life: 3000})
        }
      }
      this.$confirm.require({
        acceptClass: "p-button-danger",
        acceptIcon: "pi pi-exclamation-triangle text-xl",
        rejectClass: "p-button-text p-button-plain",
        acceptLabel: "Ja",
        rejectLabel: "Nein",
        message: `Sicher?`,
        header: 'Abort',
        icon: 'pi pi-question-circle',
        accept: run
      });
    },
    async transfer() {
      this.transferStarted=true;
      let destHost = this.mapHosts[this.destHost];
      const action = this.listCommands[this.activeCommandIndex];
      ({uuid:this.uuid} = (await zfsdomService.run(action.name, this.srcHost.external, this.domains,`${destHost.external}[${destHost.internal||this.destHost}]${this.destPath ? `:${this.destPath}` : ""}`,this.activeCommandIndex===1 && this.useMap ? this.map : null,this.dryRun,this.force))||{});
      this.transferInProgress=true;
    },
    async abort() {
      await zfsdomService.abort(this.uuid);
    },
    async operation() {
      this.transferStarted=true;
      const action = this.listCommands[this.activeCommandIndex];
      ({uuid:this.uuid} = (await zfsdomService.run(`${action.name} ${this.domainOperation}`, this.srcHost.external, this.domains))||{});
      this.transferInProgress=true;
    },
    requestOperation() {
      let run = async () => {
        try {
          await this.operation();
        } catch (err) {
          this.$toast.add({severity: 'error', summary: 'Error', detail: err, life: 3000})
        }
      }
      if (!this.dryRun) {
        this.$confirm.require({
          acceptClass: "p-button-danger",
          acceptIcon: "pi pi-exclamation-triangle text-xl",
          rejectClass: "p-button-text p-button-plain",
          acceptLabel: "Ja",
          rejectLabel: "Nein",
          message: `Sicher?`,
          header: 'Transfer',
          icon: 'pi pi-question-circle',
          accept: run
        });
      }
      else
        run();
    },
    reloadConfig({config,uuid,terminalData,done}) {
      if (!done)
        this.transferInProgress = true;
      this.uuid = uuid;
      this.transferStarted = true;
      (terminalData||[]).forEach(msg=>{
        this.terminal.write(msg);
      });
      let cmdIndex = this.listCommands.findIndex(cmd=>(config.action||"").match(new RegExp(`^${cmd.name}`)))
      if (cmdIndex>-1)
        this.activeCommandIndex = cmdIndex;
      const destHostName = config.destHost?.replace(/\[[^\]]+\]$/,"");
      const destHost = this.listHosts.find(host=>host.external===destHostName||host.name===destHostName);
      this.destHost=destHost?.name;
      this.dryRun = config.dryRun;
      this.force = config.force;
      this.map = config.map;
      if (this.map)
        this.useMap = true;
      if (cmdIndex>1)
        this.domainOperation = (config.action||"").replace(/^virsh\s+/,"");
    },
    attachWebsocketHandlers() {
      for (let node of Object.keys(singletons.sockets)) {
        singletons.sockets[node].off('zfsdom-stdout').on('zfsdom-stdout', (msg) => {
          this.terminal.write(msg);
        });
      }
    },
    initTerminal() {
      this.terminal = new Terminal({
        fontSize:singletons.terminalFontSize
      });
      this.terminal.open(document.querySelector("#terminal"));
    }
  }
}
</script>

<style>
.p-dialog-content .p-tabmenu>ul {
  width:100%;
}
.p-dialog-content .p-tabmenu>ul>li {
  flex-grow:1
}
.p-dialog-content .p-inputtext:hover, .p-dialog-content .p-inputtext:focus {
  border-color: #ced4da!important;
  box-shadow:none!important;
}
</style>