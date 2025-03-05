<template>
  <div class="flex flex-column justify-content-end align-items-center flex-grow-1" id="main-container">
    <div class="shadow-0 lg:shadow-2 border-black-alpha-30 mx-0 mt-2 md:m-3 w-12 sm:w-10 md:w-9 xl:w-7 bg-white-alpha-90 sm:relative" id="main-box">
      <div class="mb-2">
        <div class="text-900 text-xl font-thin flex align-items-start line-height-1 p-1 sm:p-2 absolute top-0 right-0 text-gray-900">

        </div>
        <div v-if="!userId">
          <div class="flex flex-row justify-content-start align-items-start p-2">
            <h2 class="cursor-pointer max-w-full m-0 flex justify-content-center align-items-center" @click="goto()">
              <img src="../assets/codefury-flash-sm.png" class="cursor-pointer mr-2" style="width:3rem" @click="goto()">
              <div class="flex flex-row">
                <div>zfsdomweb</div>
                <sup class="text-xs">libvirt+zfs</sup>
              </div>
            </h2>
          </div>
          <div class="mt-5 px-2 font-medium text-sm md:text-base line-height-2 md:line-height-3">
            Bitte <span class="text-primary font-bold cursor-pointer" @click="goto('/login')">anmelden</span>.
          </div>
        </div>
        <div v-else class="font-medium text-sm md:text-base line-height-2 md:line-height-3 px-2 pt-2 md:pb-2">
          <div v-if="loadingFull">
            <i class="pi pi-spinner pi-spin"></i>
          </div>
          <div v-else class="flex flex-column md:flex-row align-items-start justify-content-between">
            <table v-for="host of listHosts" class="mr-2 mb-2 md:mb-0">
              <th class="text-left flex flex-column"><div><i class="pi pi-server"></i>&nbsp;{{host.name}}</div><small class="text-gray-500">{{host.external}}</small></th>
              <tr v-if="mapLoading[host.name]">
                <td><i class="pi pi-spinner pi-spin"></i></td>
              </tr>
              <tr v-else-if="mapHostErrors[host.name]">
                <td class="bg-red-100 text-danger p-2"><i class="pi pi-exclamation-triangle"></i>&nbsp;{{mapHostErrors[host.name]}}</td>
              </tr>
              <tr v-else v-for="domain of mapDomains[host.name]||[]">
                <td @click="showZfsdomDialog(host,[domain.name])" :title="domain.state" :class="(domain.state==='transfer' || domain.state==='migrate' ? 'text-yellow-500' : (domain.state!=='running' ? 'text-gray-500' : ''))+' cursor-pointer flex flex-row align-items-center'">
                  <i :class="domain.state==='migrate' || domain.state==='transfer' ? 'pi pi-spinner pi-spin' : 'pi pi-chevron-right'"></i>
                  <div class="ml-1">{{domain.name}}{{domain.state!=='running' ? ' ('+domain.state+')' : ''}}</div>
                </td>
              </tr>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>

import AuthOptionalView from "@/components/AuthOptionalView.vue";
import hostsService from "@/hosts-service";
import zfsdomService from "@/zfsdom-service";
import ZfsdomDialog from "@/components/ZfsdomDialog.vue";
import {singletons} from "../../shared";

export default {
  extends: AuthOptionalView,
  name: 'HomeView',
  props: {
    msg: String,
    label: {
      type:String,
      default:""
    }
  },
  data() {
    return {
      userId:0,
      loadingFull:true,
      loading:{},
      mapHosts:{},
      listHosts:[],
      mapDomains:{},
      mapLoading:{},
      mapHostErrors:{},
      mapTasks:{}
    }
  },
  async created() {
    await this.deferred;
    this.userId = (this.authService.getLocalProfile()||{}).id;
    await this.loadHosts();
    this.loadingFull = false;
    await this.loadDomains();
    this.attachWebsocketHandlers();
  },
  methods:{
    goto(path="/") {
      this.$router.push(path);
    },
    async loadHosts() {
      this.mapHosts = await hostsService.getHosts();
      this.listHosts = Object.keys(this.mapHosts).map(name=>({name,...this.mapHosts[name]}));
    },
    updateHostDomainsState(host) {
      const domains = this.mapDomains[host.name];
      const hostName = host.external || host.name;
      for (const domain of domains) {
        const key = `${hostName}_${domain.name}`;
        if (this.mapTasks[key] && !this.mapTasks[key].done) {
          domain.state = this.mapTasks[key].config?.action;
        }
      }
    },
    async loadHostDomains(host) {
      this.mapHostErrors[host.name] = null;
      try {
        this.mapDomains[host.name] = await zfsdomService.getDomains(host.external);
        this.updateHostDomainsState(host);
      } catch (error) {
        this.mapHostErrors[host.name] = error.response?.data?.message;
      }
    },
    async loadDomains() {
      this.mapDomains = {};
      this.mapTasks = await zfsdomService.all();
      await Promise.all(this.listHosts.map(async (host)=>{
        this.mapLoading[host.name] = true;
        await this.loadHostDomains(host);
        this.mapLoading[host.name] = false;
      }));
      this.mapTasks = await zfsdomService.all();
      for (const host of this.listHosts) {
        this.updateHostDomainsState(host);
      }
    },
    async showZfsdomDialog(srcHost,domains) {
      this.$dialog.open(ZfsdomDialog, {
        props: {
          header: `Transfer ${srcHost}:${domains.join(",")}`,
          showHeader:false,
          draggable:false,
          dismissableMask:true,
          modal: true,
          contentClass:"p-0",
          style: {
            width: '80vw',
            "max-width": ' 800px'
          },
          breakpoints:{
            '460px': '100vw'
          },
        },
        data: {
          srcHost,
          domains
        },
        onClose: (options) => {
          const data = options.data;
        }
      });
    },
    attachWebsocketHandlers() {
      for (let node of Object.keys(singletons.sockets)) {
        singletons.sockets[node].off('zfsdom-done').on('zfsdom-done', async (uuid) => {
          dispatchEvent(new CustomEvent('zfsdom-done', {detail:{uuid}}));
          const listTasks = Object.keys(this.mapTasks).map(key=>({...this.mapTasks[key],key}));
          let task = listTasks.find(task=>task.uuid===uuid);
          if (task) {
            const [,hostName] = task.key.match(/^([^_]+)_(.+)$/)||[];
            const srcHost = this.listHosts.find(host=>host.external===hostName||host.name===hostName);
            if (srcHost) {
              this.mapTasks = await zfsdomService.all();
              this.loadHostDomains(srcHost);
            }
            const [destHost] = (task.config?.destHost||"").match(/^[^\[]+/)||[];
            if (destHost)
              this.loadHostDomains(this.listHosts.find(host=>host.external===destHost||host.name===destHost));
          }
        });
        singletons.sockets[node].off('zfsdom-started').on('zfsdom-started', async ({uuid,config}) => {
          dispatchEvent(new CustomEvent('zfsdom-started', {detail:{uuid,config}}));
          const hostName = config.srcHost;
          const host = this.listHosts.find(host=>host.external===hostName||host.name===hostName);
          if (host) {
            this.mapTasks = await zfsdomService.all();
            this.loadHostDomains(host);
          }
        });
      }
    },
  },
}
</script>

<style scoped>
h3 {
  margin: 40px 0 0;
}
ul {
  list-style-type: none;
  padding: 0;
}
ul>li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #111111;
}
a i.pi-file-pdf {
  color: #fa0f00;
}
ol { counter-reset: item; padding:0; line-height: 1.75;
  display: flex; flex-direction: column }
ol>li { display: flex; flex-direction: row }
ol>li:before {
  content: counter(item) ".\00a0\00a0";
  counter-increment: item;
  display: inline-block;
}
</style>
