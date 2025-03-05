<template>
  <!-- display sidebar if current route is a descendant of a tab root -->
  <cf-container v-if="tabs.filter(tab=>$route.path.match(new RegExp('^'+tab.root))).length" :class="!$route.path.match(/^\/((account)|(system))/) ? 'bg-home' : ''" ref="container">
    <div class="flex flex-row" id="sidebar-outer">
      <cf-sidebar class="active flex flex-col" v-if="!$route.path.match(/^\/(login)|(register)|(reset)/)">
			 <div class="flex flex-column">
        <TabMenu :model="filteredTabs" @tab-change="onTabChange" :active-index="activeIndex" :class="'main-menu flex-grow-1'">
          <template #item="{item}">
            <a role="menuitem" class="p-menuitem-link" aria-label="Container" tabindex="0"><span :class="'p-menuitem-icon '+item.icon"></span><span class="p-menuitem-text" v-html="item.label"></span></a>
          </template>
        </TabMenu>
        <div class="p-tabmenu p-component main-menu">
          <ul class="p-tabmenu-nav p-reset" role="tablist">
            <li class="p-tabmenuitem" role="tab">
              <a class="p-menuitem-link" role="presentation" @click.prevent="logout" v-if="localProfile">
                <span class="p-menuitem-icon pi pi-sign-out"></span><span class="p-menuitem-text"><small style="display:inline-block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:75px">{{localProfile.username}}</small><br>Abmelden</span>
              </a>
              <a class="p-menuitem-link" role="presentation" @click.prevent="login" v-else>
                <span class="p-menuitem-icon pi pi-sign-in"></span><span class="p-menuitem-text">Anmelden</span>
              </a>
            </li>
          </ul>
        </div>
			 </div>
      </cf-sidebar>
		 <div id="sidebar-handle-container" class="flex flex-column justify-content-center flex-grow-1" v-if="!$route.path.match(/^\/(login)|(register)|(reset)/)">
			<div id="sidebar-handle" class="flex h-6 w-6 flex-column items-center" @click="toggleSidebar">
			 <div class="h-3 flex-grow rounded-full bar-top"></div>
			 <div class="h-3 rounded-full bar-bottom"></div>
			</div>
		 </div>
    </div>
    <cf-content :class="$route.path.match(/^\/data/) ? '' : ''">
      <router-view></router-view>
    </cf-content>
  </cf-container>
  <cf-container v-else-if="$route.path.match(/^\/guests/)" :class="'bg-home'">
    <router-view></router-view>
  </cf-container>
  <router-view v-else></router-view>
  <ConfirmDialog></ConfirmDialog>
  <DynamicDialog></DynamicDialog>
  <Toast></Toast>
</template>
<script>
import {singletons} from "../shared";

export default {
  name: 'App',
  components: {
  },
  data() {
    return {
      tabs: [
        {label: 'Start', root:"/", icon:"pi pi-home"},
        {label: 'Account', root:"/account", icon:"pi pi-user", userlevel: 0},
        {label: 'System', root: '/system', icon:"pi pi-bolt", userlevel: 1},
      ],
      activeIndex:0,
      sidebarVisible:true,
      localProfile:null
    }
  },
  watch:{
    $route (){
      this.onRouteChange(this.$route.path);
    }
  },
  mounted() {
    this.onRouteChange(this.$route.path);
    window.addEventListener('resize', () => {
      this.refreshVars()
    });
    // needed for reactivity (filteredTabs)
    window.addEventListener('auth-change',()=>{
      this.localProfile = this.authService.getLocalProfile();
    });
    this.refreshVars()
  },
  async created() {
    this.localProfile = this.authService.getLocalProfile();
  },
  methods: {
    onTabChange(e) {
      let tabs = this.getFilteredTabs();
      this.$router.push(this.activeIndex===e.index ? tabs[e.index].root  : tabs[e.index].path || tabs[e.index].root)
    },
    onRouteChange(currentPath) {
      let i=0;
      while (i<this.tabs.length && !currentPath.match(new RegExp(`^${this.tabs[i].root}([/]|$)`))) {
        i++;
      }
      if (i<this.tabs.length) {
        this.tabs[i].path = currentPath;
        this.activeIndex = i;
      }
    },
    async logout() {
      await this.authService.logout();
      if (import.meta.env.VITE_EXTAUTH_LOGOUT)
        window.location.href = `${import.meta.env.VITE_EXTAUTH_LOGOUT}/?r=${window.location.origin}/auth`;
      else {
        singletons.sockets = {};
        this.login();
      }
    },
    login() {
      this.$router.push("/login");
    },
    getFilteredTabs(tabs=this.tabs) {
      return tabs.filter(tab=>(typeof tab.userlevel!=="undefined" ? tab.userlevel : -1)<=(this.localProfile ? (typeof this.localProfile.level!=="undefined" ? this.localProfile.level : -1) : -1))
    },
    toggleSidebar() {
      this.$refs.container.classList.toggle("sidebar-closed");
      this.refreshVars();
    },
    refreshVars() {
      let sidebar = document.querySelector("cf-sidebar");
      if (sidebar) {
        document.documentElement.style.setProperty('--sidebar-width',`${sidebar.clientWidth}px`);
        document.documentElement.style.setProperty('--sidebar-width-half-neg',`-${sidebar.clientWidth/2.0}px`);
      }
      let mainBox = document.querySelector("#main-box");
      if (mainBox) {
        document.documentElement.style.setProperty('--mainbox-height',`${mainBox.clientHeight}px`);
      }
      singletons.terminalFontSize = 14;
      if (window.innerWidth<400)
        singletons.terminalFontSize = 9;
      else if (window.innerWidth<600)
        singletons.terminalFontSize = 10;
      dispatchEvent(new CustomEvent('terminal-resize', {}));
    },
    generateSimpleFingerprint() {
      const userAgent = navigator.userAgent;
      const screenResolution = `${screen.width}x${screen.height}`;
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const languages = navigator.languages.join(', ');
      return btoa(`${userAgent}|${screenResolution}|${timeZone}|${languages}`);
    }
  },
  computed: {
    filteredTabs() {
      return this.getFilteredTabs(this.tabs);
    }
  }
}
</script>
